import { getDB } from '../config/db.js'
import { sinhMaTiepTheo, formatVND } from '../utils/helpers.js'
import { LoiNghiepVu, chuanHoaKhachHang, layKhachHangTheoMa } from './khachHang.service.js'

export const SO_TIEN_MOI_DIEM = 1000 // 1 điểm cho mỗi 1.000đ

export function tinhDiemCong(tongTien) {
  return Math.floor((Number(tongTien) || 0) / SO_TIEN_MOI_DIEM)
}

export async function taoGiaoDich({ MaKH, ChiTiet, PhuongThucThanhToan = 'MOMO' } = {}) {
  const db = getDB()
  const kh = await layKhachHangTheoMa(MaKH)

  if (kh.TrangThai !== 'ACTIVE') {
    throw new LoiNghiepVu(403, `Tài khoản ${kh.MaKH} đã ngừng hoạt động (INACTIVE).`)
  }

  if (!Array.isArray(ChiTiet) || ChiTiet.length === 0) {
    throw new LoiNghiepVu(400, 'Giao dịch phải có ít nhất 1 sản phẩm.')
  }

  const chiTiet = ChiTiet.map((item) => {
    const SoLuong = Number(item.SoLuong)
    const DonGia = Number(item.DonGia)
    if (!Number.isInteger(SoLuong) || SoLuong < 1) {
      throw new LoiNghiepVu(400, 'Số lượng sản phẩm không hợp lệ.')
    }
    if (!(DonGia >= 0)) {
      throw new LoiNghiepVu(400, 'Đơn giá không hợp lệ.')
    }
    return {
      MaSanPham: item.MaSanPham,
      TenSanPham: item.TenSanPham,
      Loai: item.Loai,
      SoLuong,
      DonGia,
      ThanhTien: SoLuong * DonGia,
    }
  })

  const coVe = chiTiet.some((d) => d.Loai === 'VE')
  const coCombo = chiTiet.some((d) => d.Loai === 'COMBO')
  const loaiGiaoDich = coVe && coCombo ? 'VE_VA_COMBO' : coVe ? 'VE_XEM_PHIM' : 'COMBO_BAP_NUOC'
  const tongTien = chiTiet.reduce((sum, d) => sum + d.ThanhTien, 0)

  const MaGiaoDich = await sinhMaTiepTheo(db.collection('giao_dich'), 'MaGiaoDich', 'GD', 6)
  const now = new Date()

  const gd = {
    MaGiaoDich,
    MaGD: MaGiaoDich,
    MaKH,
    LoaiGiaoDich: loaiGiaoDich,
    ChiTiet: chiTiet,
    TongTien: tongTien,
    PhuongThucThanhToan,
    TrangThai: 'PENDING',
    DiemCong: 0,
    NgayTao: now,
    NgayCapNhat: now,
  }

  await db.collection('giao_dich').insertOne(gd)
  return gd
}

export async function layGiaoDichTheoMa(maGD) {
  const db = getDB()
  const gd = await db.collection('giao_dich').findOne({
    $or: [{ MaGiaoDich: maGD }, { MaGD: maGD }],
  })
  if (!gd) throw new LoiNghiepVu(404, `Không tìm thấy giao dịch ${maGD}.`)
  return gd
}

export async function layDanhSachGiaoDich({ trangThai, maKH } = {}) {
  const db = getDB()
  const filter = {}
  if (trangThai) filter.TrangThai = trangThai
  if (maKH) filter.MaKH = maKH

  return await db.collection('giao_dich').find(filter).sort({ NgayTao: -1 }).toArray()
}

/**
 * Cập nhật trạng thái giao dịch:
 * - Nguyên tử: Chỉ cập nhật khi TrangThai đang là PENDING -> Ngăn chặn tuyệt đối việc cộng điểm 2 lần!
 * - Khi TrangThai = COMPLETED:
 *   1. Tính điểm cộng = TongTien / 1000
 *   2. Tạo bản ghi loại EARN trong bien_dong_diem
 *   3. Cộng DiemHienTai và TongChiTieu cho khách hàng
 *   4. Chạy pipeline với toán tử $switch để tự động thăng hạng (>= 10tr: Bạc, >= 30tr: Vàng)
 *   5. Nếu thăng hạng, ghi nhật ký vào lich_su_hang và trả về thangHang
 */
export async function capNhatTrangThaiGiaoDich(maGD, trangThaiMoi) {
  const db = getDB()

  if (!['COMPLETED', 'CANCELLED', 'FAILED'].includes(trangThaiMoi)) {
    throw new LoiNghiepVu(400, 'TrangThai chỉ nhận COMPLETED, CANCELLED hoặc FAILED.')
  }

  const gdHienTai = await layGiaoDichTheoMa(maGD)
  if (gdHienTai.TrangThai !== 'PENDING') {
    throw new LoiNghiepVu(
      409,
      `Giao dịch ${maGD} đã ở trạng thái ${gdHienTai.TrangThai}, không thể cập nhật lại (không cộng điểm 2 lần).`,
    )
  }

  const now = new Date()

  // Cập nhật nguyên tử trạng thái giao dịch từ PENDING sang trạng thái mới
  const updateResult = await db.collection('giao_dich').findOneAndUpdate(
    {
      $or: [{ MaGiaoDich: maGD }, { MaGD: maGD }],
      TrangThai: 'PENDING',
    },
    {
      $set: {
        TrangThai: trangThaiMoi,
        NgayCapNhat: now,
      },
    },
    { returnDocument: 'after' },
  )

  if (!updateResult) {
    throw new LoiNghiepVu(
      409,
      `Giao dịch ${maGD} đã được xử lý bởi một tiến trình khác.`,
    )
  }

  const gd = updateResult
  const khTruoc = await layKhachHangTheoMa(gd.MaKH)

  if (trangThaiMoi !== 'COMPLETED') {
    return {
      giaoDich: gd,
      diemCong: 0,
      khachHang: khTruoc,
      thangHang: null,
    }
  }

  // --- LUỒNG TÍCH ĐIỂM (EARN) ---
  const diemCong = tinhDiemCong(gd.TongTien)
  const maBienDong = await sinhMaTiepTheo(db.collection('bien_dong_diem'), 'MaBienDong', 'BD', 6)
  const soDuSau = (khTruoc.DiemHienTai || 0) + diemCong

  // Ghi sổ cái bien_dong_diem
  await db.collection('bien_dong_diem').insertOne({
    MaBienDong: maBienDong,
    MaLedger: maBienDong,
    MaKH: khTruoc.MaKH,
    LoaiBienDong: 'EARN',
    Loai: 'EARN',
    SoDiem: diemCong,
    SoDuSau: soDuSau,
    MaThamChieu: gd.MaGiaoDich || gd.MaGD,
    MaGD: gd.MaGiaoDich || gd.MaGD,
    MoTa: `Tích điểm giao dịch ${gd.MaGiaoDich || gd.MaGD}`,
    TrangThai: 'POSTED',
    IdempotencyKey: `EARN_${gd.MaGiaoDich || gd.MaGD}`,
    NgayTao: now,
    NgayPhatSinh: now,
  })

  // Cập nhật lại DiemCong trong giao dịch
  await db.collection('giao_dich').updateOne(
    { _id: gd._id },
    { $set: { DiemCong: diemCong } },
  )
  gd.DiemCong = diemCong

  // Cộng điểm và tổng chi tiêu cho khách hàng
  await db.collection('khach_hang').updateOne(
    { MaKH: khTruoc.MaKH },
    {
      $inc: {
        DiemHienTai: diemCong,
        TongChiTieu: gd.TongTien,
        TongChiTieuNam: gd.TongTien,
        TongDiemTichLuy: diemCong,
      },
    },
  )

  // --- LUỒNG TỰ ĐỘNG THĂNG HẠNG BẰNG TOÁN TỬ $switch ---
  // Chạy pipeline cập nhật hạng dựa trên TongChiTieu
  await db.collection('khach_hang').updateOne(
    { MaKH: khTruoc.MaKH },
    [
      {
        $set: {
          MaHangHienTai: {
            $switch: {
              branches: [
                {
                  case: { $gte: ['$TongChiTieu', 30000000] },
                  then: 'VANG',
                },
                {
                  case: { $gte: ['$TongChiTieu', 10000000] },
                  then: 'BAC',
                },
              ],
              default: 'DONG',
            },
          },
        },
      },
    ],
  )

  const khSau = await layKhachHangTheoMa(khTruoc.MaKH)
  let thangHang = null

  // Kiểm tra nếu có sự thay đổi thứ hạng
  if (khSau.MaHangHienTai !== khTruoc.MaHangHienTai) {
    thangHang = {
      HangCu: khTruoc.MaHangHienTai,
      HangMoi: khSau.MaHangHienTai,
    }

    const maLichSu = await sinhMaTiepTheo(db.collection('lich_su_hang'), 'MaLichSu', 'LS', 3)
    const nguongChiTieu = khSau.MaHangHienTai === 'VANG' ? 30000000 : 10000000

    await db.collection('lich_su_hang').insertOne({
      MaLichSu: maLichSu,
      MaKH: khSau.MaKH,
      HangCu: thangHang.HangCu,
      MaHangCu: thangHang.HangCu,
      HangMoi: thangHang.HangMoi,
      MaHangMoi: thangHang.HangMoi,
      TongChiTieuKhiDoi: khSau.TongChiTieu,
      NamXetHang: now.getFullYear(),
      LyDo: `Tổng chi tiêu đạt ${formatVND(nguongChiTieu)}`,
      NgayThayDoi: now,
    })
  }

  return {
    giaoDich: gd,
    diemCong,
    khachHang: khSau,
    thangHang,
  }
}
