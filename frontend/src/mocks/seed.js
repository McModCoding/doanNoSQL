// SINH DỮ LIỆU MẪU cho API giả – đủ 8 collection của nhóm.
// Dữ liệu cố định (cùng "seed" ngẫu nhiên) nhưng ngày tháng tính lùi từ thời điểm hiện tại,
// để biểu đồ luôn có số liệu cho 12–15 tháng gần nhất.
// Dữ liệu nhất quán: TongChiTieu = tổng giao dịch COMPLETED, DiemHienTai = EARN − REDEEM,
// hạng = theo TongChiTieu, lich_su_hang ghi đúng thời điểm vượt ngưỡng.

import { COMBO, PHIM, taoDongCombo, taoDongVe } from '../data/catalog.js'
import { formatVND } from '../utils/format.js'
import { xacDinhHang } from '../utils/tier.js'
import { boDau, taoMaVoucher, taoObjectId, tinhDiemCong } from './logic.js'

/** Bộ sinh số ngẫu nhiên có seed (cùng seed => cùng dữ liệu). */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const HANG_THANH_VIEN = [
  {
    MaHang: 'DONG',
    TenHang: 'Đồng',
    NguongChiTieu: 0,
    ThuTu: 1,
    MauSac: '#a0522d',
    QuyenLoi: ['Tích 1 điểm cho mỗi 1.000đ chi tiêu', 'Đổi điểm lấy voucher vé, bắp nước, quà tặng'],
  },
  {
    MaHang: 'BAC',
    TenHang: 'Bạc',
    NguongChiTieu: 10_000_000,
    ThuTu: 2,
    MauSac: '#6b7785',
    QuyenLoi: ['Toàn bộ quyền lợi hạng Đồng', 'Tặng 1 combo bắp nước trong tháng sinh nhật', 'Ưu tiên đổi quà sự kiện'],
  },
  {
    MaHang: 'VANG',
    TenHang: 'Vàng',
    NguongChiTieu: 30_000_000,
    ThuTu: 3,
    MauSac: '#b8860b',
    QuyenLoi: ['Toàn bộ quyền lợi hạng Bạc', 'Tặng 2 vé 2D trong tháng sinh nhật', 'Quầy thanh toán ưu tiên'],
  },
]

export const PHAN_THUONG = [
  { MaPhanThuong: 'PT001', TenPhanThuong: 'Voucher giảm 20.000đ vé 2D', LoaiPhanThuong: 'VOUCHER_VE', DiemCanDoi: 200, SoLuongTon: 500, GiaTri: 20000, HanSuDungNgay: 30, HinhAnh: '🎟️', MoTa: 'Áp dụng cho 1 vé 2D bất kỳ suất chiếu.' },
  { MaPhanThuong: 'PT002', TenPhanThuong: 'Voucher giảm 50.000đ vé 2D/3D', LoaiPhanThuong: 'VOUCHER_VE', DiemCanDoi: 450, SoLuongTon: 400, GiaTri: 50000, HanSuDungNgay: 30, HinhAnh: '🎫', MoTa: 'Áp dụng cho 1 vé 2D hoặc 3D.' },
  { MaPhanThuong: 'PT003', TenPhanThuong: 'Voucher 1 vé 2D miễn phí', LoaiPhanThuong: 'VOUCHER_VE', DiemCanDoi: 900, SoLuongTon: 250, GiaTri: 95000, HanSuDungNgay: 45, HinhAnh: '🎬', MoTa: 'Đổi 1 vé 2D miễn phí, trừ suất chiếu đặc biệt.' },
  { MaPhanThuong: 'PT004', TenPhanThuong: 'Voucher nước ngọt size L', LoaiPhanThuong: 'VOUCHER_BAP_NUOC', DiemCanDoi: 350, SoLuongTon: 600, GiaTri: 35000, HanSuDungNgay: 30, HinhAnh: '🥤', MoTa: '1 ly nước ngọt size L tại quầy bắp nước.' },
  { MaPhanThuong: 'PT005', TenPhanThuong: 'Voucher bắp ngọt size L', LoaiPhanThuong: 'VOUCHER_BAP_NUOC', DiemCanDoi: 500, SoLuongTon: 500, GiaTri: 55000, HanSuDungNgay: 30, HinhAnh: '🍿', MoTa: '1 hộp bắp ngọt size L.' },
  { MaPhanThuong: 'PT006', TenPhanThuong: 'Voucher Combo Couple', LoaiPhanThuong: 'VOUCHER_BAP_NUOC', DiemCanDoi: 950, SoLuongTon: 300, GiaTri: 109000, HanSuDungNgay: 30, HinhAnh: '🍿', MoTa: '1 bắp lớn + 2 nước ngọt size L.' },
  { MaPhanThuong: 'PT007', TenPhanThuong: 'Móc khóa linh vật LoyalCine', LoaiPhanThuong: 'QUA_HIEN_VAT', DiemCanDoi: 800, SoLuongTon: 150, GiaTri: 60000, HanSuDungNgay: 60, HinhAnh: '🔑', MoTa: 'Nhận tại quầy vé, mang theo mã đổi quà.' },
  { MaPhanThuong: 'PT008', TenPhanThuong: 'Ly giữ nhiệt LoyalCine', LoaiPhanThuong: 'QUA_HIEN_VAT', DiemCanDoi: 1500, SoLuongTon: 120, GiaTri: 150000, HanSuDungNgay: 60, HinhAnh: '☕', MoTa: 'Ly giữ nhiệt 500ml phiên bản giới hạn.' },
  { MaPhanThuong: 'PT009', TenPhanThuong: 'Gấu bông linh vật', LoaiPhanThuong: 'QUA_HIEN_VAT', DiemCanDoi: 2500, SoLuongTon: 80, GiaTri: 250000, HanSuDungNgay: 60, HinhAnh: '🧸', MoTa: 'Gấu bông cao 30cm.' },
  { MaPhanThuong: 'PT010', TenPhanThuong: 'Áo thun LoyalCine', LoaiPhanThuong: 'QUA_HIEN_VAT', DiemCanDoi: 3000, SoLuongTon: 60, GiaTri: 300000, HanSuDungNgay: 60, HinhAnh: '👕', MoTa: 'Áo thun cotton, nhiều size. (Đang hết hàng)' },
]

const KHACH_DEMO = [
  { HoTen: 'Trần Minh Anh', GioiTinh: 'Nữ', NgaySinh: '2003-11-20', SoDienThoai: '0901000001', mucTieu: 9_850_000, kieuDoi: 'codinh', doiCoDinh: 'PT004', soNgayDangKy: 420, TrangThai: 'ACTIVE' },
  { HoTen: 'Lê Hoàng Nam', GioiTinh: 'Nam', NgaySinh: '1999-04-02', SoDienThoai: '0901000002', mucTieu: 29_850_000, kieuDoi: 'vua', soNgayDangKy: 540, TrangThai: 'ACTIVE' },
  { HoTen: 'Phạm Thu Hà', GioiTinh: 'Nữ', NgaySinh: '1995-08-15', SoDienThoai: '0901000003', mucTieu: 36_420_000, kieuDoi: 'nhieu', soNgayDangKy: 700, TrangThai: 'ACTIVE' },
  { HoTen: 'Võ Đức Long', GioiTinh: 'Nam', NgaySinh: '2001-01-27', SoDienThoai: '0901000004', mucTieu: 2_150_000, kieuDoi: 'it', soNgayDangKy: 300, TrangThai: 'INACTIVE' },
]

// Tên khách hàng mẫu (hư cấu), xen kẽ nam/nữ
const TEN_KHACH_MAU = [
  ['Trịnh Ngọc Mai', 'Nữ'], ['Lê Đức Nam', 'Nam'], ['Đặng Thu Trang', 'Nữ'], ['Đặng Quốc Kiên', 'Nam'],
  ['Bùi Phương Thảo', 'Nữ'], ['Nguyễn Hải Dũng', 'Nam'], ['Hồ Mỹ Uyên', 'Nữ'], ['Ngô Quốc Bình', 'Nam'],
  ['Dương Diệu Hân', 'Nữ'], ['Đỗ Gia Huy', 'Nam'], ['Ngô Bảo Vy', 'Nữ'], ['Vũ Minh Khoa', 'Nam'],
  ['Phan Thanh Giang', 'Nữ'], ['Hoàng Tuấn Phúc', 'Nam'], ['Lý Thị Lan', 'Nữ'], ['Huỳnh Thành Sơn', 'Nam'],
]

const XAC_SUAT_DOI = { it: 0.04, vua: 0.12, nhieu: 0.3, codinh: 0 }
const NGAY = 24 * 60 * 60 * 1000
const GIO = 60 * 60 * 1000

export function taoDuLieuMau(now = new Date(), seed = 20261115) {
  const rng = mulberry32(seed)
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1))
  const chon = (arr) => arr[Math.floor(rng() * arr.length)]
  const chonTrongSo = (cap) => {
    let r = rng() * cap.reduce((s, [, w]) => s + w, 0)
    for (const [v, w] of cap) if ((r -= w) < 0) return v
    return cap[cap.length - 1][0]
  }
  const T = new Date(now).getTime()
  const oid = (t) => taoObjectId(new Date(t), rng)
  const isoT = (t) => new Date(t).toISOString()

  const hang_thanh_vien = HANG_THANH_VIEN.map((h) => ({ _id: oid(T - 800 * NGAY), ...h }))
  const phan_thuong = PHAN_THUONG.map((p) => ({ _id: oid(T - 500 * NGAY), ...p, TrangThai: 'ACTIVE' }))
  const khuyen_mai = [
    { MaKhuyenMai: 'KM001', TenKhuyenMai: 'Sinh nhật vui vẻ', MoTa: 'Thành viên hạng Bạc trở lên được tặng combo bắp nước trong tháng sinh nhật.', ApDungChoHang: ['BAC', 'VANG'], NgayBatDau: isoT(T - 300 * NGAY), NgayKetThuc: isoT(T + 400 * NGAY), TrangThai: 'ACTIVE' },
    { MaKhuyenMai: 'KM002', TenKhuyenMai: 'Chào thành viên mới', MoTa: 'Đăng ký thành viên trong tháng này được tặng 1 voucher nước ngọt size L.', ApDungChoHang: ['DONG', 'BAC', 'VANG'], NgayBatDau: isoT(T - 20 * NGAY), NgayKetThuc: isoT(T + 40 * NGAY), TrangThai: 'ACTIVE' },
    { MaKhuyenMai: 'KM003', TenKhuyenMai: 'Mùa quà cuối năm', MoTa: 'Thêm nhiều quà tặng hiện vật mới, số lượng có hạn – đổi điểm ngay kẻo lỡ!', ApDungChoHang: ['DONG', 'BAC', 'VANG'], NgayBatDau: isoT(T - 5 * NGAY), NgayKetThuc: isoT(T + 45 * NGAY), TrangThai: 'ACTIVE' },
    { MaKhuyenMai: 'KM004', TenKhuyenMai: 'Hè rực rỡ', MoTa: 'Tặng bắp ngọt cho hóa đơn từ 2 vé (đã kết thúc).', ApDungChoHang: ['DONG', 'BAC', 'VANG'], NgayBatDau: isoT(T - 150 * NGAY), NgayKetThuc: isoT(T - 60 * NGAY), TrangThai: 'ACTIVE' },
  ].map((k) => ({ _id: oid(new Date(k.NgayBatDau).getTime()), ...k }))

  // ---- danh sách khách hàng (4 demo + 16 sinh ngẫu nhiên)
  const dsMoTa = [...KHACH_DEMO]
  const phanBoHang = ['DONG', 'DONG', 'BAC', 'DONG', 'VANG', 'DONG', 'BAC', 'DONG', 'DONG', 'BAC', 'DONG', 'BAC', 'VANG', 'DONG', 'BAC', 'DONG']
  const sdtDaDung = new Set(dsMoTa.map((k) => k.SoDienThoai))
  phanBoHang.forEach((h, i) => {
    const [HoTen, GioiTinh] = TEN_KHACH_MAU[i]
    let sdt
    do sdt = `09${ri(10000000, 99999999)}`
    while (sdtDaDung.has(sdt))
    sdtDaDung.add(sdt)
    const mucTieu =
      h === 'DONG' ? ri(400, 9200) * 1000 : h === 'BAC' ? ri(10500, 27500) * 1000 : ri(31000, 42000) * 1000
    dsMoTa.push({
      HoTen,
      GioiTinh,
      NgaySinh: `${ri(1980, 2006)}-${String(ri(1, 12)).padStart(2, '0')}-${String(ri(1, 28)).padStart(2, '0')}`,
      SoDienThoai: sdt,
      mucTieu,
      kieuDoi: chon(['it', 'vua', 'vua', 'nhieu']),
      soNgayDangKy: ri(200, 720),
      TrangThai: 'ACTIVE',
    })
  })

  const gioHangNgauNhien = () => {
    const dong = []
    if (rng() < 0.9) {
      const phim = chon(PHIM)
      const dinhDang = phim.DinhDang['3D'] && rng() < 0.3 ? '3D' : '2D'
      dong.push(taoDongVe(phim, dinhDang, chon(phim.SuatChieu), chonTrongSo([[1, 30], [2, 45], [3, 10], [4, 15]])))
      const soCombo = chonTrongSo([[0, 40], [1, 45], [2, 15]])
      for (let i = 0; i < soCombo; i++) dong.push(taoDongCombo(chon(COMBO), 1))
    } else {
      for (let i = 0, n = ri(1, 2); i < n; i++) dong.push(taoDongCombo(chon(COMBO), 1))
    }
    // gộp dòng trùng sản phẩm
    const gop = new Map()
    for (const d of dong) {
      const cu = gop.get(d.MaSanPham)
      if (cu) cu.SoLuong += d.SoLuong
      else gop.set(d.MaSanPham, { ...d })
    }
    return [...gop.values()].map((d) => ({ ...d, ThanhTien: d.SoLuong * d.DonGia }))
  }
  const tongTien = (chiTiet) => chiTiet.reduce((s, d) => s + d.ThanhTien, 0)
  const loaiGiaoDich = (chiTiet) => {
    const coVe = chiTiet.some((d) => d.Loai === 'VE')
    const coCombo = chiTiet.some((d) => d.Loai === 'COMBO')
    return coVe && coCombo ? 'VE_VA_COMBO' : coVe ? 'VE_XEM_PHIM' : 'COMBO_BAP_NUOC'
  }
  const thoiDiemTrongNgay = (t) => {
    const d = new Date(t)
    d.setHours(ri(9, 22), ri(0, 59), ri(0, 59), 0)
    return d.getTime()
  }

  const khach_hang = []
  const giao_dich = []
  const bien_dong_diem = []
  const doi_thuong = []
  const lich_su_hang = []

  dsMoTa.forEach((mt, viTri) => {
    const MaKH = `KH${String(viTri + 1).padStart(3, '0')}`
    const ngayDangKy = thoiDiemTrongNgay(T - mt.soNgayDangKy * NGAY)
    const batDau = Math.max(ngayDangKy + NGAY, T - 450 * NGAY)
    const ketThuc = T - 2 * NGAY

    // 1) giỏ hàng COMPLETED có tổng đúng bằng mục tiêu chi tiêu
    const gioHang = []
    let tong = 0
    for (let thu = 0; thu < 5000; thu++) {
      const conLai = mt.mucTieu - tong
      if (conLai <= 700_000) break
      const g = gioHangNgauNhien()
      if (tongTien(g) > conLai - 50_000) continue
      gioHang.push(g)
      tong += tongTien(g)
    }
    const conLai = mt.mucTieu - tong
    if (conLai > 0) {
      gioHang.push([
        conLai >= 95_000
          ? { MaSanPham: 'VE-NHOM', TenSanPham: 'Gói vé xem phim nhóm (suất đặc biệt)', Loai: 'VE', SoLuong: 1, DonGia: conLai, ThanhTien: conLai }
          : { MaSanPham: 'BN-THEM', TenSanPham: 'Bắp nước bổ sung tại quầy', Loai: 'COMBO', SoLuong: 1, DonGia: conLai, ThanhTien: conLai },
      ])
    }
    const thoiDiem = gioHang.map(() => thoiDiemTrongNgay(batDau + rng() * (ketThuc - batDau))).sort((a, b) => a - b)

    // 2) đi theo thời gian: tích điểm, thăng hạng, thỉnh thoảng đổi quà
    let diem = 0
    let chiTieu = 0
    let maHang = xacDinhHang(0, hang_thanh_vien).MaHang
    lich_su_hang.push({ _id: oid(ngayDangKy), MaKH, HangCu: null, HangMoi: maHang, TongChiTieuKhiDoi: 0, LyDo: 'Đăng ký thành viên', NgayThayDoi: isoT(ngayDangKy) })
    const viTriDoiCoDinh = Math.floor(gioHang.length / 2)

    gioHang.forEach((chiTiet, i) => {
      const t = thoiDiem[i]
      const tCapNhat = t + ri(1, 4) * 60 * 1000
      const tien = tongTien(chiTiet)
      const diemCong = tinhDiemCong(tien)
      const gd = {
        _id: oid(t),
        MaGiaoDich: null,
        MaKH,
        LoaiGiaoDich: loaiGiaoDich(chiTiet),
        ChiTiet: chiTiet,
        TongTien: tien,
        PhuongThucThanhToan: rng() < 0.75 ? 'MOMO' : 'TAI_QUAY',
        TrangThai: 'COMPLETED',
        DiemCong: diemCong,
        NgayTao: isoT(t),
        NgayCapNhat: isoT(tCapNhat),
      }
      giao_dich.push(gd)
      diem += diemCong
      chiTieu += tien
      bien_dong_diem.push({ _id: oid(tCapNhat), MaBienDong: null, MaKH, LoaiBienDong: 'EARN', SoDiem: diemCong, SoDuSau: diem, MaThamChieu: gd, MoTa: null, NgayTao: isoT(tCapNhat) })

      const hangMoi = xacDinhHang(chiTieu, hang_thanh_vien)
      if (hangMoi.MaHang !== maHang) {
        lich_su_hang.push({ _id: oid(tCapNhat), MaKH, HangCu: maHang, HangMoi: hangMoi.MaHang, TongChiTieuKhiDoi: chiTieu, LyDo: `Tổng chi tiêu đạt ${formatVND(hangMoi.NguongChiTieu)}`, NgayThayDoi: isoT(tCapNhat) })
        maHang = hangMoi.MaHang
      }

      // giao dịch bị hủy (không tính điểm) – xen kẽ cho thật
      if (rng() < 0.06) {
        const tHuy = t + ri(2, 30) * GIO
        if (tHuy < ketThuc) {
          const g2 = gioHangNgauNhien()
          giao_dich.push({ _id: oid(tHuy), MaGiaoDich: null, MaKH, LoaiGiaoDich: loaiGiaoDich(g2), ChiTiet: g2, TongTien: tongTien(g2), PhuongThucThanhToan: 'MOMO', TrangThai: 'CANCELLED', DiemCong: 0, NgayTao: isoT(tHuy), NgayCapNhat: isoT(tHuy + 5 * 60 * 1000) })
        }
      }

      // đổi quà
      const tKeTiep = thoiDiem[i + 1] ?? ketThuc
      let maQua = null
      if (mt.kieuDoi === 'codinh') {
        if (i === viTriDoiCoDinh) maQua = mt.doiCoDinh
      } else if (rng() < XAC_SUAT_DOI[mt.kieuDoi]) {
        const coTheDoi = phan_thuong.filter((p) => p.DiemCanDoi <= diem && p.SoLuongTon > 1 && p.MaPhanThuong !== 'PT010')
        if (coTheDoi.length) maQua = chon(coTheDoi).MaPhanThuong
      }
      if (maQua) {
        const pt = phan_thuong.find((p) => p.MaPhanThuong === maQua)
        const tDoi = tCapNhat + Math.min(ri(1, 48) * GIO, Math.max(60 * 1000, (tKeTiep - tCapNhat) / 2))
        diem -= pt.DiemCanDoi
        pt.SoLuongTon -= 1
        const hsd = new Date(tDoi)
        hsd.setDate(hsd.getDate() + pt.HanSuDungNgay)
        const dt = {
          _id: oid(tDoi),
          MaDoiThuong: null,
          MaKH,
          MaPhanThuong: pt.MaPhanThuong,
          TenPhanThuong: pt.TenPhanThuong,
          LoaiPhanThuong: pt.LoaiPhanThuong,
          DiemDaDoi: pt.DiemCanDoi,
          MaVoucher: taoMaVoucher(rng),
          TrangThai: hsd.getTime() < T - 7 * NGAY || rng() < 0.5 ? 'DA_SU_DUNG' : 'CHUA_SU_DUNG',
          NgayDoi: isoT(tDoi),
          HanSuDung: isoT(hsd.getTime()),
        }
        doi_thuong.push(dt)
        bien_dong_diem.push({ _id: oid(tDoi), MaBienDong: null, MaKH, LoaiBienDong: 'REDEEM', SoDiem: -pt.DiemCanDoi, SoDuSau: diem, MaThamChieu: dt, MoTa: `Đổi quà: ${pt.TenPhanThuong}`, NgayTao: isoT(tDoi) })
      }
    })

    khach_hang.push({
      _id: oid(ngayDangKy),
      MaKH,
      HoTen: mt.HoTen,
      SoDienThoai: mt.SoDienThoai,
      Email: `${boDau(mt.HoTen).replace(/\s+/g, '.')}${String(viTri + 1).padStart(2, '0')}@example.com`,
      NgaySinh: mt.NgaySinh,
      GioiTinh: mt.GioiTinh,
      MaThe: `LC${String(viTri + 1).padStart(8, '0')}`,
      DiemHienTai: diem,
      TongChiTieu: chiTieu,
      MaHangHienTai: maHang,
      TrangThai: mt.TrangThai,
      NgayDangKy: isoT(ngayDangKy),
    })
  })

  // 3) vài giao dịch đang chờ thanh toán (PENDING) để minh họa ở trang Admin
  for (const kh of khach_hang.filter((k) => k.TrangThai === 'ACTIVE' && Number(k.MaKH.slice(2)) > 4).slice(0, 4)) {
    const t = T - ri(1, 30) * GIO
    const g = gioHangNgauNhien()
    giao_dich.push({ _id: oid(t), MaGiaoDich: null, MaKH: kh.MaKH, LoaiGiaoDich: loaiGiaoDich(g), ChiTiet: g, TongTien: tongTien(g), PhuongThucThanhToan: 'MOMO', TrangThai: 'PENDING', DiemCong: 0, NgayTao: isoT(t), NgayCapNhat: isoT(t) })
  }

  // 4) đánh mã theo thứ tự thời gian rồi điền tham chiếu
  const theoThoiGian = (truong) => (a, b) => a[truong].localeCompare(b[truong])
  giao_dich.sort(theoThoiGian('NgayTao')).forEach((g, i) => (g.MaGiaoDich = `GD${String(i + 1).padStart(6, '0')}`))
  doi_thuong.sort(theoThoiGian('NgayDoi')).forEach((d, i) => (d.MaDoiThuong = `DT${String(i + 1).padStart(6, '0')}`))
  bien_dong_diem.sort(theoThoiGian('NgayTao')).forEach((b, i) => {
    b.MaBienDong = `BD${String(i + 1).padStart(6, '0')}`
    const ref = b.MaThamChieu
    if (b.LoaiBienDong === 'EARN') {
      b.MaThamChieu = ref.MaGiaoDich
      b.MoTa = `Tích điểm giao dịch ${ref.MaGiaoDich}`
    } else {
      b.MaThamChieu = ref.MaDoiThuong
    }
  })
  lich_su_hang.sort(theoThoiGian('NgayThayDoi'))

  // Áo thun đang hết hàng – để minh họa nút "Hết quà"
  phan_thuong.find((p) => p.MaPhanThuong === 'PT010').SoLuongTon = 0

  return { khach_hang, hang_thanh_vien, giao_dich, bien_dong_diem, phan_thuong, doi_thuong, khuyen_mai, lich_su_hang }
}
