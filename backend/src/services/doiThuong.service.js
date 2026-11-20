import { getDB } from '../config/db.js'
import { sinhMaTiepTheo, taoMaVoucher } from '../utils/helpers.js'
import { LoiNghiepVu, layKhachHangTheoMa } from './khachHang.service.js'

export async function layDanhSachPhanThuong({ loai, trangThai } = {}) {
  const db = getDB()
  const filter = {}
  if (loai) {
    filter.$or = [{ LoaiPhanThuong: loai }, { LoaiQua: loai }]
  }
  if (trangThai) filter.TrangThai = trangThai

  const ds = await db.collection('phan_thuong').find(filter).sort({ DiemCanDoi: 1, DiemCan: 1 }).toArray()
  return ds.map((p) => ({
    ...p,
    MaPhanThuong: p.MaPhanThuong || p.MaQua,
    TenPhanThuong: p.TenPhanThuong || p.TenQua,
    LoaiPhanThuong: p.LoaiPhanThuong || p.LoaiQua,
    DiemCanDoi: Number(p.DiemCanDoi ?? p.DiemCan ?? 0),
    SoLuongTon: Number(p.SoLuongTon ?? 0),
  }))
}

export async function layPhanThuongTheoMa(maPT) {
  const db = getDB()
  const pt = await db.collection('phan_thuong').findOne({
    $or: [{ MaPhanThuong: maPT }, { MaQua: maPT }],
  })
  if (!pt) throw new LoiNghiepVu(404, `Không tìm thấy phần thưởng ${maPT}.`)
  return {
    ...pt,
    MaPhanThuong: pt.MaPhanThuong || pt.MaQua,
    TenPhanThuong: pt.TenPhanThuong || pt.TenQua,
    LoaiPhanThuong: pt.LoaiPhanThuong || pt.LoaiQua,
    DiemCanDoi: Number(pt.DiemCanDoi ?? pt.DiemCan ?? 0),
    SoLuongTon: Number(pt.SoLuongTon ?? 0),
  }
}

/**
 * Xử lý đổi quà bằng điểm thưởng:
 * 1. Kiểm tra tài khoản khách hàng ACTIVE
 * 2. Kiểm tra phần thưởng ACTIVE và còn tồn kho (> 0)
 * 3. Kiểm tra số dư điểm của khách hàng có đủ để đổi hay không
 * 4. Cập nhật trừ tồn kho và trừ điểm (nguyên tử)
 * 5. Lưu ý: Đổi quà trừ điểm nhưng KHÔNG thay đổi TongChiTieu -> Khách hàng KHÔNG BAO GIỜ bị tụt hạng
 * 6. Sinh mã voucher ngẫu nhiên và ghi nhận doi_thuong + bien_dong_diem (REDEEM)
 */
export async function thucHienDoiThuong({ MaKH, MaPhanThuong } = {}) {
  const db = getDB()

  if (!MaKH) throw new LoiNghiepVu(400, 'Thiếu thông tin MaKH.')
  if (!MaPhanThuong) throw new LoiNghiepVu(400, 'Thiếu thông tin MaPhanThuong.')

  const kh = await layKhachHangTheoMa(MaKH)
  if (kh.TrangThai !== 'ACTIVE') {
    throw new LoiNghiepVu(403, `Tài khoản ${kh.MaKH} đã ngừng hoạt động (INACTIVE).`)
  }

  const pt = await layPhanThuongTheoMa(MaPhanThuong)
  if (pt.TrangThai !== 'ACTIVE') {
    throw new LoiNghiepVu(409, 'Phần thưởng này đã ngừng áp dụng.')
  }
  if (pt.SoLuongTon <= 0) {
    throw new LoiNghiepVu(409, 'Phần thưởng đã hết, vui lòng chọn quà khác.')
  }

  if (kh.DiemHienTai < pt.DiemCanDoi) {
    throw new LoiNghiepVu(
      400,
      `Không đủ điểm: cần ${pt.DiemCanDoi.toLocaleString('vi-VN')} điểm, bạn đang có ${kh.DiemHienTai.toLocaleString('vi-VN')} điểm.`,
    )
  }

  // 1. Giảm tồn kho phần thưởng nguyên tử
  const updateKhoResult = await db.collection('phan_thuong').findOneAndUpdate(
    {
      $or: [{ MaPhanThuong: pt.MaPhanThuong }, { MaQua: pt.MaPhanThuong }],
      SoLuongTon: { $gt: 0 },
    },
    { $inc: { SoLuongTon: -1 } },
    { returnDocument: 'after' },
  )

  if (!updateKhoResult) {
    throw new LoiNghiepVu(409, 'Phần thưởng vừa hết số lượng tồn kho.')
  }

  // 2. Trừ điểm của khách hàng nguyên tử
  const updateKhachResult = await db.collection('khach_hang').findOneAndUpdate(
    {
      MaKH: kh.MaKH,
      DiemHienTai: { $gte: pt.DiemCanDoi },
    },
    { $inc: { DiemHienTai: -pt.DiemCanDoi } },
    { returnDocument: 'after' },
  )

  if (!updateKhachResult) {
    // Hoàn lại kho nếu trừ điểm không thành công
    await db.collection('phan_thuong').updateOne(
      { $or: [{ MaPhanThuong: pt.MaPhanThuong }, { MaQua: pt.MaPhanThuong }] },
      { $inc: { SoLuongTon: 1 } },
    )
    throw new LoiNghiepVu(400, 'Số dư điểm không đủ để thực hiện giao dịch này.')
  }

  const now = new Date()
  const hanSuDung = new Date(now)
  hanSuDung.setDate(hanSuDung.getDate() + (pt.HanSuDungNgay || 30))

  const maDoiThuong = await sinhMaTiepTheo(db.collection('doi_thuong'), 'MaDoiThuong', 'DT', 6)
  const maVoucher = taoMaVoucher()

  // 3. Ghi nhận giao dịch đổi thưởng (denormalized thông tin phần thưởng)
  const doiThuongDoc = {
    MaDoiThuong: maDoiThuong,
    MaDoi: maDoiThuong,
    MaKH: kh.MaKH,
    MaPhanThuong: pt.MaPhanThuong,
    MaQua: pt.MaPhanThuong,
    TenPhanThuong: pt.TenPhanThuong,
    LoaiPhanThuong: pt.LoaiPhanThuong,
    DiemDaDoi: pt.DiemCanDoi,
    DiemSuDung: pt.DiemCanDoi,
    SoLuong: 1,
    MaVoucher: maVoucher,
    TrangThai: 'CHUA_SU_DUNG',
    NgayDoi: now,
    HanSuDung: hanSuDung,
  }

  await db.collection('doi_thuong').insertOne(doiThuongDoc)

  // 4. Ghi nhận biến động điểm loại REDEEM
  const maBienDong = await sinhMaTiepTheo(db.collection('bien_dong_diem'), 'MaBienDong', 'BD', 6)
  await db.collection('bien_dong_diem').insertOne({
    MaBienDong: maBienDong,
    MaLedger: maBienDong,
    MaKH: kh.MaKH,
    LoaiBienDong: 'REDEEM',
    Loai: 'REDEEM',
    SoDiem: -pt.DiemCanDoi,
    SoDuSau: updateKhachResult.DiemHienTai,
    MaThamChieu: maDoiThuong,
    MaDoi: maDoiThuong,
    MoTa: `Đổi quà: ${pt.TenPhanThuong}`,
    TrangThai: 'POSTED',
    IdempotencyKey: `REDEEM_${maDoiThuong}`,
    NgayTao: now,
    NgayPhatSinh: now,
  })

  const khSau = await layKhachHangTheoMa(kh.MaKH)

  return {
    doiThuong: doiThuongDoc,
    khachHang: khSau,
  }
}

export async function layDanhSachDoiThuong({ maKH } = {}) {
  const db = getDB()
  const filter = {}
  if (maKH) filter.MaKH = maKH

  return await db.collection('doi_thuong').find(filter).sort({ NgayDoi: -1 }).toArray()
}
