// LOGIC NGHIỆP VỤ MÔ PHỎNG (chạy trong trình duyệt, dữ liệu giả).
// ---------------------------------------------------------------
// Đây KHÔNG phải backend thật. Logic thật (MongoDB, pipeline $switch, aggregation...)
// do Linh viết trong Node.js/Express. File này mô phỏng đúng các quy tắc trong
// docs/01-hop-dong-api.md để frontend phát triển song song, đồng thời là
// "đặc tả chạy được" để Linh đối chiếu kết quả.
//
// Mọi hàm nhận `db` = { khach_hang, hang_thanh_vien, giao_dich, bien_dong_diem,
// phan_thuong, doi_thuong, khuyen_mai, lich_su_hang } (8 collection) và sửa trực tiếp trên đó.

import { formatVND } from '../utils/format.js'
import { sapXepHang, xacDinhHang } from '../utils/tier.js'

export const SO_TIEN_MOI_DIEM = 1000 // 1 điểm / 1.000đ
export const TRANG_THAI_GIAO_DICH = ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED']

export class LoiNghiepVu extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'LoiNghiepVu'
    this.status = status
  }
}

export const tinhDiemCong = (tongTien) => Math.floor((Number(tongTien) || 0) / SO_TIEN_MOI_DIEM)

const iso = (d) => new Date(d).toISOString()
const moiNhatTruoc = (truong) => (a, b) => String(b[truong]).localeCompare(String(a[truong]))

/** Bỏ dấu tiếng Việt để tìm kiếm: "Trần" -> "tran" */
export function boDau(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/** Sinh ObjectId giả (24 ký tự hex) – để document trông giống MongoDB. */
export function taoObjectId(ngay = new Date(), rng = Math.random) {
  const giay = Math.floor(new Date(ngay).getTime() / 1000).toString(16).padStart(8, '0')
  let duoi = ''
  for (let i = 0; i < 16; i++) duoi += Math.floor(rng() * 16).toString(16)
  return giay + duoi
}

/** Mã kế tiếp theo tiền tố: GD000041 -> GD000042 */
export function maTiepTheo(ds, truong, tienTo, doDai) {
  let max = 0
  for (const d of ds) {
    const n = parseInt(String(d[truong] ?? '').slice(tienTo.length), 10)
    if (!Number.isNaN(n) && n > max) max = n
  }
  return tienTo + String(max + 1).padStart(doDai, '0')
}

function timKhach(db, maKH) {
  const kh = db.khach_hang.find((k) => k.MaKH === maKH)
  if (!kh) throw new LoiNghiepVu(404, `Không tìm thấy khách hàng ${maKH}.`)
  return kh
}

function kiemTraHoatDong(kh) {
  if (kh.TrangThai !== 'ACTIVE') {
    throw new LoiNghiepVu(403, `Tài khoản ${kh.MaKH} đã ngừng hoạt động (INACTIVE).`)
  }
}

// ---------------------------------------------------------------- khach_hang

export function timKiemKhachHang(db, { q, soDienThoai, maHang, trangThai } = {}) {
  let ds = db.khach_hang
  if (soDienThoai) ds = ds.filter((k) => k.SoDienThoai === String(soDienThoai).trim())
  if (maHang) ds = ds.filter((k) => k.MaHangHienTai === maHang)
  if (trangThai) ds = ds.filter((k) => k.TrangThai === trangThai)
  if (q) {
    const t = boDau(String(q).trim())
    ds = ds.filter((k) => [k.MaKH, k.HoTen, k.SoDienThoai, k.Email].some((v) => boDau(v ?? '').includes(t)))
  }
  return [...ds].sort((a, b) => a.MaKH.localeCompare(b.MaKH))
}

export const layKhachHang = (db, maKH) => timKhach(db, maKH)

const SDT_HOP_LE = /^0\d{9}$/

function kiemTraThongTinKhach(db, duLieu, maKHBoQua) {
  const hoTen = String(duLieu.HoTen ?? '').trim()
  const sdt = String(duLieu.SoDienThoai ?? '').trim()
  if (!hoTen) throw new LoiNghiepVu(400, 'Họ tên không được để trống.')
  if (!SDT_HOP_LE.test(sdt)) throw new LoiNghiepVu(400, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.')
  if (db.khach_hang.some((k) => k.SoDienThoai === sdt && k.MaKH !== maKHBoQua)) {
    throw new LoiNghiepVu(409, `Số điện thoại ${sdt} đã được đăng ký.`)
  }
  return { hoTen, sdt }
}

export function themKhachHang(db, duLieu, now = new Date()) {
  const { hoTen, sdt } = kiemTraThongTinKhach(db, duLieu)
  const MaKH = maTiepTheo(db.khach_hang, 'MaKH', 'KH', 3)
  const hangThapNhat = sapXepHang(db.hang_thanh_vien)[0]
  const kh = {
    _id: taoObjectId(now),
    MaKH,
    HoTen: hoTen,
    SoDienThoai: sdt,
    Email: duLieu.Email || null,
    NgaySinh: duLieu.NgaySinh || null,
    GioiTinh: duLieu.GioiTinh || null,
    MaThe: 'LC' + MaKH.slice(2).padStart(8, '0'),
    DiemHienTai: 0,
    TongChiTieu: 0,
    MaHangHienTai: hangThapNhat?.MaHang ?? 'DONG',
    TrangThai: 'ACTIVE',
    NgayDangKy: iso(now),
  }
  db.khach_hang.push(kh)
  db.lich_su_hang.push({
    _id: taoObjectId(now),
    MaKH,
    HangCu: null,
    HangMoi: kh.MaHangHienTai,
    TongChiTieuKhiDoi: 0,
    LyDo: 'Đăng ký thành viên',
    NgayThayDoi: iso(now),
  })
  return kh
}

export function suaKhachHang(db, maKH, duLieu) {
  const kh = timKhach(db, maKH)
  const { hoTen, sdt } = kiemTraThongTinKhach(db, { ...kh, ...duLieu }, maKH)
  kh.HoTen = hoTen
  kh.SoDienThoai = sdt
  for (const truong of ['Email', 'NgaySinh', 'GioiTinh']) {
    if (truong in duLieu) kh[truong] = duLieu[truong] || null
  }
  if ('TrangThai' in duLieu) {
    if (!['ACTIVE', 'INACTIVE'].includes(duLieu.TrangThai)) throw new LoiNghiepVu(400, 'TrangThai chỉ nhận ACTIVE hoặc INACTIVE.')
    kh.TrangThai = duLieu.TrangThai
  }
  // Không cho sửa DiemHienTai / TongChiTieu / MaHangHienTai qua API này – chỉ thay đổi qua giao dịch & đổi thưởng.
  return kh
}

export function xoaKhachHang(db, maKH) {
  timKhach(db, maKH)
  const coLichSu = db.giao_dich.some((g) => g.MaKH === maKH) || db.doi_thuong.some((d) => d.MaKH === maKH)
  if (coLichSu) {
    throw new LoiNghiepVu(
      409,
      'Khách hàng đã có giao dịch/đổi quà nên không thể xóa (để giữ lịch sử). Hãy chuyển trạng thái sang INACTIVE.',
    )
  }
  db.khach_hang = db.khach_hang.filter((k) => k.MaKH !== maKH)
  db.lich_su_hang = db.lich_su_hang.filter((l) => l.MaKH !== maKH)
  db.bien_dong_diem = db.bien_dong_diem.filter((b) => b.MaKH !== maKH)
  return { MaKH: maKH }
}

export const bienDongDiemCuaKhach = (db, maKH) =>
  (timKhach(db, maKH), db.bien_dong_diem.filter((b) => b.MaKH === maKH).sort(moiNhatTruoc('NgayTao')))
export const giaoDichCuaKhach = (db, maKH) =>
  (timKhach(db, maKH), db.giao_dich.filter((g) => g.MaKH === maKH).sort(moiNhatTruoc('NgayTao')))
export const doiThuongCuaKhach = (db, maKH) =>
  (timKhach(db, maKH), db.doi_thuong.filter((d) => d.MaKH === maKH).sort(moiNhatTruoc('NgayDoi')))
export const lichSuHangCuaKhach = (db, maKH) =>
  (timKhach(db, maKH), db.lich_su_hang.filter((l) => l.MaKH === maKH).sort(moiNhatTruoc('NgayThayDoi')))

// ---------------------------------------------------------------- hang, khuyen_mai, phan_thuong

export const dsHangThanhVien = (db) => sapXepHang(db.hang_thanh_vien)

export function dsKhuyenMai(db, { conHieuLuc } = {}, now = new Date()) {
  let ds = db.khuyen_mai
  if (String(conHieuLuc) === 'true') {
    const t = new Date(now).getTime()
    ds = ds.filter(
      (k) => k.TrangThai === 'ACTIVE' && new Date(k.NgayBatDau).getTime() <= t && t <= new Date(k.NgayKetThuc).getTime(),
    )
  }
  return [...ds].sort(moiNhatTruoc('NgayBatDau'))
}

export function dsPhanThuong(db, { loai, trangThai } = {}) {
  let ds = db.phan_thuong
  if (loai) ds = ds.filter((p) => p.LoaiPhanThuong === loai)
  if (trangThai) ds = ds.filter((p) => p.TrangThai === trangThai)
  return [...ds].sort((a, b) => a.DiemCanDoi - b.DiemCanDoi)
}

// ---------------------------------------------------------------- giao_dich

export function taoGiaoDich(db, { MaKH, ChiTiet, PhuongThucThanhToan = 'MOMO' } = {}, now = new Date()) {
  const kh = timKhach(db, MaKH)
  kiemTraHoatDong(kh)
  if (!Array.isArray(ChiTiet) || ChiTiet.length === 0) throw new LoiNghiepVu(400, 'Giao dịch phải có ít nhất 1 sản phẩm.')
  const chiTiet = ChiTiet.map((d) => {
    const SoLuong = Number(d.SoLuong)
    const DonGia = Number(d.DonGia)
    if (!Number.isInteger(SoLuong) || SoLuong < 1) throw new LoiNghiepVu(400, 'Số lượng sản phẩm không hợp lệ.')
    if (!(DonGia >= 0)) throw new LoiNghiepVu(400, 'Đơn giá không hợp lệ.')
    return { MaSanPham: d.MaSanPham, TenSanPham: d.TenSanPham, Loai: d.Loai, SoLuong, DonGia, ThanhTien: SoLuong * DonGia }
  })
  const coVe = chiTiet.some((d) => d.Loai === 'VE')
  const coCombo = chiTiet.some((d) => d.Loai === 'COMBO')
  const gd = {
    _id: taoObjectId(now),
    MaGiaoDich: maTiepTheo(db.giao_dich, 'MaGiaoDich', 'GD', 6),
    MaKH,
    LoaiGiaoDich: coVe && coCombo ? 'VE_VA_COMBO' : coVe ? 'VE_XEM_PHIM' : 'COMBO_BAP_NUOC',
    ChiTiet: chiTiet,
    TongTien: chiTiet.reduce((s, d) => s + d.ThanhTien, 0),
    PhuongThucThanhToan,
    TrangThai: 'PENDING',
    DiemCong: 0,
    NgayTao: iso(now),
    NgayCapNhat: iso(now),
  }
  db.giao_dich.push(gd)
  return gd
}

export function layGiaoDich(db, maGD) {
  const gd = db.giao_dich.find((g) => g.MaGiaoDich === maGD)
  if (!gd) throw new LoiNghiepVu(404, `Không tìm thấy giao dịch ${maGD}.`)
  return gd
}

export function dsGiaoDich(db, { trangThai, maKH } = {}) {
  let ds = db.giao_dich
  if (trangThai) ds = ds.filter((g) => g.TrangThai === trangThai)
  if (maKH) ds = ds.filter((g) => g.MaKH === maKH)
  return [...ds].sort(moiNhatTruoc('NgayTao'))
}

/**
 * Cập nhật trạng thái giao dịch. Khi chuyển PENDING -> COMPLETED:
 *  1. Ghi bien_dong_diem loại EARN (1 điểm / 1.000đ)
 *  2. Cộng DiemHienTai và TongChiTieu của khách
 *  3. Xét thăng hạng theo TongChiTieu (giống $switch: >= 30tr Vàng, >= 10tr Bạc, còn lại Đồng)
 *     – nếu đổi hạng thì ghi lich_su_hang.
 * Chỉ cập nhật được khi giao dịch đang PENDING ⇒ gọi 2 lần không bị cộng điểm 2 lần.
 */
export function capNhatTrangThaiGiaoDich(db, maGD, trangThaiMoi, now = new Date()) {
  if (!['COMPLETED', 'CANCELLED', 'FAILED'].includes(trangThaiMoi)) {
    throw new LoiNghiepVu(400, 'TrangThai chỉ nhận COMPLETED, CANCELLED hoặc FAILED.')
  }
  const gd = layGiaoDich(db, maGD)
  if (gd.TrangThai !== 'PENDING') {
    throw new LoiNghiepVu(409, `Giao dịch ${maGD} đã ở trạng thái ${gd.TrangThai}, không thể cập nhật lại.`)
  }
  gd.TrangThai = trangThaiMoi
  gd.NgayCapNhat = iso(now)

  const kh = timKhach(db, gd.MaKH)
  if (trangThaiMoi !== 'COMPLETED') {
    return { giaoDich: gd, diemCong: 0, khachHang: kh, thangHang: null }
  }

  const diemCong = tinhDiemCong(gd.TongTien)
  gd.DiemCong = diemCong
  kh.DiemHienTai += diemCong
  kh.TongChiTieu += gd.TongTien
  db.bien_dong_diem.push({
    _id: taoObjectId(now),
    MaBienDong: maTiepTheo(db.bien_dong_diem, 'MaBienDong', 'BD', 6),
    MaKH: kh.MaKH,
    LoaiBienDong: 'EARN',
    SoDiem: diemCong,
    SoDuSau: kh.DiemHienTai,
    MaThamChieu: gd.MaGiaoDich,
    MoTa: `Tích điểm giao dịch ${gd.MaGiaoDich}`,
    NgayTao: iso(now),
  })

  let thangHang = null
  const hangMoi = xacDinhHang(kh.TongChiTieu, db.hang_thanh_vien)
  if (hangMoi && hangMoi.MaHang !== kh.MaHangHienTai) {
    thangHang = { HangCu: kh.MaHangHienTai, HangMoi: hangMoi.MaHang }
    kh.MaHangHienTai = hangMoi.MaHang
    db.lich_su_hang.push({
      _id: taoObjectId(now),
      MaKH: kh.MaKH,
      HangCu: thangHang.HangCu,
      HangMoi: thangHang.HangMoi,
      TongChiTieuKhiDoi: kh.TongChiTieu,
      LyDo: `Tổng chi tiêu đạt ${formatVND(hangMoi.NguongChiTieu)}`,
      NgayThayDoi: iso(now),
    })
  }
  return { giaoDich: gd, diemCong, khachHang: kh, thangHang }
}

// ---------------------------------------------------------------- doi_thuong

const KY_TU_VOUCHER = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // bỏ O/0/I/1 dễ nhầm

export function taoMaVoucher(rng = Math.random) {
  let ma = ''
  for (let i = 0; i < 6; i++) ma += KY_TU_VOUCHER[Math.floor(rng() * KY_TU_VOUCHER.length)]
  return `VC-${ma}`
}

/**
 * Đổi quà: kiểm tra khách ACTIVE, quà còn áp dụng & còn hàng, đủ điểm.
 * Sau đó ghi doi_thuong + bien_dong_diem (REDEEM, số âm), trừ DiemHienTai và SoLuongTon.
 * Không thay đổi TongChiTieu ⇒ không làm tụt hạng.
 */
export function doiThuong(db, { MaKH, MaPhanThuong } = {}, now = new Date(), rng = Math.random) {
  const kh = timKhach(db, MaKH)
  kiemTraHoatDong(kh)
  const pt = db.phan_thuong.find((p) => p.MaPhanThuong === MaPhanThuong)
  if (!pt) throw new LoiNghiepVu(404, `Không tìm thấy phần thưởng ${MaPhanThuong}.`)
  if (pt.TrangThai !== 'ACTIVE') throw new LoiNghiepVu(409, 'Phần thưởng này đã ngừng áp dụng.')
  if (pt.SoLuongTon <= 0) throw new LoiNghiepVu(409, 'Phần thưởng đã hết, vui lòng chọn quà khác.')
  if (kh.DiemHienTai < pt.DiemCanDoi) {
    throw new LoiNghiepVu(
      400,
      `Không đủ điểm: cần ${pt.DiemCanDoi.toLocaleString('vi-VN')} điểm, bạn đang có ${kh.DiemHienTai.toLocaleString('vi-VN')} điểm.`,
    )
  }

  kh.DiemHienTai -= pt.DiemCanDoi
  pt.SoLuongTon -= 1
  const hanSuDung = new Date(now)
  hanSuDung.setDate(hanSuDung.getDate() + (pt.HanSuDungNgay ?? 30))
  const dt = {
    _id: taoObjectId(now, rng),
    MaDoiThuong: maTiepTheo(db.doi_thuong, 'MaDoiThuong', 'DT', 6),
    MaKH,
    MaPhanThuong,
    TenPhanThuong: pt.TenPhanThuong, // lưu kèm (denormalize) để xem lịch sử không cần $lookup
    LoaiPhanThuong: pt.LoaiPhanThuong,
    DiemDaDoi: pt.DiemCanDoi,
    MaVoucher: taoMaVoucher(rng),
    TrangThai: 'CHUA_SU_DUNG',
    NgayDoi: iso(now),
    HanSuDung: iso(hanSuDung),
  }
  db.doi_thuong.push(dt)
  db.bien_dong_diem.push({
    _id: taoObjectId(now, rng),
    MaBienDong: maTiepTheo(db.bien_dong_diem, 'MaBienDong', 'BD', 6),
    MaKH,
    LoaiBienDong: 'REDEEM',
    SoDiem: -pt.DiemCanDoi,
    SoDuSau: kh.DiemHienTai,
    MaThamChieu: dt.MaDoiThuong,
    MoTa: `Đổi quà: ${pt.TenPhanThuong}`,
    NgayTao: iso(now),
  })
  return { doiThuong: dt, khachHang: kh }
}

export function dsDoiThuong(db, { maKH } = {}) {
  let ds = db.doi_thuong
  if (maKH) ds = ds.filter((d) => d.MaKH === maKH)
  return [...ds].sort(moiNhatTruoc('NgayDoi'))
}

// ---------------------------------------------------------------- thong_ke (mô phỏng các pipeline aggregation)

/** Tương đương: $match EARN trong năm -> $group theo $month -> $sort. Trả đủ 12 tháng. */
export function thongKeDiemTheoThang(db, nam) {
  const kq = Array.from({ length: 12 }, (_, i) => ({ thang: i + 1, tongDiem: 0, soGiaoDich: 0 }))
  for (const b of db.bien_dong_diem) {
    if (b.LoaiBienDong !== 'EARN') continue
    const d = new Date(b.NgayTao)
    if (d.getFullYear() !== Number(nam)) continue
    kq[d.getMonth()].tongDiem += b.SoDiem
    kq[d.getMonth()].soGiaoDich += 1
  }
  return kq
}

/**
 * Tương đương: ($match theo năm nếu có) -> $group theo MaKH trên doi_thuong -> $sort -> $limit -> $lookup khach_hang.
 * nam: không truyền = tính toàn bộ thời gian.
 */
export function topDoiQua(db, limit = 10, nam) {
  const nhom = new Map()
  for (const d of db.doi_thuong) {
    if (nam && new Date(d.NgayDoi).getFullYear() !== Number(nam)) continue
    const g = nhom.get(d.MaKH) ?? { MaKH: d.MaKH, soLuotDoi: 0, tongDiemDaDoi: 0 }
    g.soLuotDoi += 1
    g.tongDiemDaDoi += d.DiemDaDoi
    nhom.set(d.MaKH, g)
  }
  return [...nhom.values()]
    .sort((a, b) => b.soLuotDoi - a.soLuotDoi || b.tongDiemDaDoi - a.tongDiemDaDoi)
    .slice(0, Number(limit) || 10)
    .map((g) => {
      const kh = db.khach_hang.find((k) => k.MaKH === g.MaKH)
      return { MaKH: g.MaKH, HoTen: kh?.HoTen ?? '(đã xóa)', MaHangHienTai: kh?.MaHangHienTai ?? null, ...g }
    })
}

export function khachHangTheoHang(db) {
  return dsHangThanhVien(db).map((h) => ({
    MaHang: h.MaHang,
    TenHang: h.TenHang,
    soKhachHang: db.khach_hang.filter((k) => k.MaHangHienTai === h.MaHang).length,
  }))
}

export function tongQuan(db, now = new Date()) {
  const n = new Date(now)
  const cungThang = (s) => {
    const d = new Date(s)
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
  }
  const bdThang = db.bien_dong_diem.filter((b) => cungThang(b.NgayTao))
  return {
    tongKhachHang: db.khach_hang.length,
    khachHangActive: db.khach_hang.filter((k) => k.TrangThai === 'ACTIVE').length,
    diemPhatHanhThangNay: bdThang.filter((b) => b.LoaiBienDong === 'EARN').reduce((s, b) => s + b.SoDiem, 0),
    diemDaDoiThangNay: -bdThang.filter((b) => b.LoaiBienDong === 'REDEEM').reduce((s, b) => s + b.SoDiem, 0),
    luotDoiThangNay: db.doi_thuong.filter((d) => cungThang(d.NgayDoi)).length,
    doanhThuThangNay: db.giao_dich
      .filter((g) => g.TrangThai === 'COMPLETED' && cungThang(g.NgayCapNhat))
      .reduce((s, g) => s + g.TongTien, 0),
    giaoDichChoXuLy: db.giao_dich.filter((g) => g.TrangThai === 'PENDING').length,
  }
}
