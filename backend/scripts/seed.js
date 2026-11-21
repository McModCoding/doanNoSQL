import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import { formatVND } from '../src/utils/helpers.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = process.env.DB_NAME || 'CinemaLoyaltyDB'

export const HANG_THANH_VIEN = [
  {
    MaHang: 'DONG',
    TenHang: 'Đồng',
    NguongChiTieu: 0,
    MucChiTieuToiThieu: 0,
    MucChiTieuToiDa: 9999999,
    ThuTu: 1,
    MauSac: '#a0522d',
    QuyenLoi: ['Tích 1 điểm cho mỗi 1.000đ chi tiêu', 'Đổi điểm lấy voucher vé, bắp nước, quà tặng'],
    TrangThai: 'ACTIVE',
  },
  {
    MaHang: 'BAC',
    TenHang: 'Bạc',
    NguongChiTieu: 10000000,
    MucChiTieuToiThieu: 10000000,
    MucChiTieuToiDa: 29999999,
    ThuTu: 2,
    MauSac: '#6b7785',
    QuyenLoi: ['Toàn bộ quyền lợi hạng Đồng', 'Tặng 1 combo bắp nước trong tháng sinh nhật', 'Ưu tiên đổi quà sự kiện'],
    TrangThai: 'ACTIVE',
  },
  {
    MaHang: 'VANG',
    TenHang: 'Vàng',
    NguongChiTieu: 30000000,
    MucChiTieuToiThieu: 30000000,
    MucChiTieuToiDa: null,
    ThuTu: 3,
    MauSac: '#b8860b',
    QuyenLoi: ['Toàn bộ quyền lợi hạng Bạc', 'Tặng 2 vé 2D trong tháng sinh nhật', 'Quầy thanh toán ưu tiên'],
    TrangThai: 'ACTIVE',
  },
]

export const PHAN_THUONG = [
  { MaPhanThuong: 'PT001', MaQua: 'PT001', TenPhanThuong: 'Voucher giảm 20.000đ vé 2D', TenQua: 'Voucher giảm 20.000đ vé 2D', LoaiPhanThuong: 'VOUCHER_VE', LoaiQua: 'VOUCHER_VE', DiemCanDoi: 200, DiemCan: 200, SoLuongTon: 500, GiaTri: 20000, HanSuDungNgay: 30, MoTa: 'Áp dụng cho 1 vé 2D bất kỳ suất chiếu.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT002', MaQua: 'PT002', TenPhanThuong: 'Voucher giảm 50.000đ vé 2D/3D', TenQua: 'Voucher giảm 50.000đ vé 2D/3D', LoaiPhanThuong: 'VOUCHER_VE', LoaiQua: 'VOUCHER_VE', DiemCanDoi: 450, DiemCan: 450, SoLuongTon: 400, GiaTri: 50000, HanSuDungNgay: 30, MoTa: 'Áp dụng cho 1 vé 2D hoặc 3D.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT003', MaQua: 'PT003', TenPhanThuong: 'Voucher 1 vé 2D miễn phí', TenQua: 'Voucher 1 vé 2D miễn phí', LoaiPhanThuong: 'VOUCHER_VE', LoaiQua: 'VOUCHER_VE', DiemCanDoi: 900, DiemCan: 900, SoLuongTon: 250, GiaTri: 95000, HanSuDungNgay: 45, MoTa: 'Đổi 1 vé 2D miễn phí, trừ suất chiếu đặc biệt.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT004', MaQua: 'PT004', TenPhanThuong: 'Voucher nước ngọt size L', TenQua: 'Voucher nước ngọt size L', LoaiPhanThuong: 'VOUCHER_BAP_NUOC', LoaiQua: 'VOUCHER_COMBO', DiemCanDoi: 350, DiemCan: 350, SoLuongTon: 600, GiaTri: 35000, HanSuDungNgay: 30, MoTa: '1 ly nước ngọt size L tại quầy bắp nước.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT005', MaQua: 'PT005', TenPhanThuong: 'Voucher bắp ngọt size L', TenQua: 'Voucher bắp ngọt size L', LoaiPhanThuong: 'VOUCHER_BAP_NUOC', LoaiQua: 'VOUCHER_COMBO', DiemCanDoi: 500, DiemCan: 500, SoLuongTon: 500, GiaTri: 55000, HanSuDungNgay: 30, MoTa: '1 hộp bắp ngọt size L.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT006', MaQua: 'PT006', TenPhanThuong: 'Voucher Combo Couple', TenQua: 'Voucher Combo Couple', LoaiPhanThuong: 'VOUCHER_BAP_NUOC', LoaiQua: 'VOUCHER_COMBO', DiemCanDoi: 950, DiemCan: 950, SoLuongTon: 300, GiaTri: 109000, HanSuDungNgay: 30, MoTa: '1 bắp lớn + 2 nước ngọt size L.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT007', MaQua: 'PT007', TenPhanThuong: 'Móc khóa linh vật LoyalCine', TenQua: 'Móc khóa linh vật LoyalCine', LoaiPhanThuong: 'QUA_HIEN_VAT', LoaiQua: 'QUA_TANG', DiemCanDoi: 800, DiemCan: 800, SoLuongTon: 150, GiaTri: 60000, HanSuDungNgay: 60, MoTa: 'Nhận tại quầy vé, mang theo mã đổi quà.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT008', MaQua: 'PT008', TenPhanThuong: 'Ly giữ nhiệt LoyalCine', TenQua: 'Ly giữ nhiệt LoyalCine', LoaiPhanThuong: 'QUA_HIEN_VAT', LoaiQua: 'QUA_TANG', DiemCanDoi: 1500, DiemCan: 1500, SoLuongTon: 120, GiaTri: 150000, HanSuDungNgay: 60, MoTa: 'Ly giữ nhiệt 500ml phiên bản giới hạn.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT009', MaQua: 'PT009', TenPhanThuong: 'Gấu bông linh vật', TenQua: 'Gấu bông linh vật', LoaiPhanThuong: 'QUA_HIEN_VAT', LoaiQua: 'QUA_TANG', DiemCanDoi: 2500, DiemCan: 2500, SoLuongTon: 80, GiaTri: 250000, HanSuDungNgay: 60, MoTa: 'Gấu bông cao 30cm.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT010', MaQua: 'PT010', TenPhanThuong: 'Áo thun LoyalCine', TenQua: 'Áo thun LoyalCine', LoaiPhanThuong: 'QUA_HIEN_VAT', LoaiQua: 'QUA_TANG', DiemCanDoi: 3000, DiemCan: 3000, SoLuongTon: 60, GiaTri: 300000, HanSuDungNgay: 60, MoTa: 'Áo thun cotton, nhiều size.', TrangThai: 'ACTIVE' },
]

export const KHUYEN_MAI = [
  { MaKM: 'KM001', MaKhuyenMai: 'KM001', TenKM: 'Sinh nhật vui vẻ', TenKhuyenMai: 'Sinh nhật vui vẻ', MoTa: 'Thành viên hạng Bạc trở lên được tặng combo bắp nước trong tháng sinh nhật.', ApDungChoHang: ['BAC', 'VANG'], HangApDung: ['BAC', 'VANG'], NgayBatDau: new Date('2026-01-01T00:00:00Z'), NgayKetThuc: new Date('2027-12-31T23:59:59Z'), TrangThai: 'ACTIVE' },
  { MaKM: 'KM002', MaKhuyenMai: 'KM002', TenKM: 'Chào thành viên mới', TenKhuyenMai: 'Chào thành viên mới', MoTa: 'Đăng ký thành viên trong tháng này được tặng 1 voucher nước ngọt size L.', ApDungChoHang: ['DONG', 'BAC', 'VANG'], HangApDung: ['DONG', 'BAC', 'VANG'], NgayBatDau: new Date('2026-10-01T00:00:00Z'), NgayKetThuc: new Date('2026-12-31T23:59:59Z'), TrangThai: 'ACTIVE' },
  { MaKM: 'KM003', MaKhuyenMai: 'KM003', TenKM: 'Mùa quà cuối năm', TenKhuyenMai: 'Mùa quà cuối năm', MoTa: 'Thêm nhiều quà tặng hiện vật mới, số lượng có hạn, đổi điểm tại app hoặc quầy vé.', ApDungChoHang: ['DONG', 'BAC', 'VANG'], HangApDung: ['DONG', 'BAC', 'VANG'], NgayBatDau: new Date('2026-11-01T00:00:00Z'), NgayKetThuc: new Date('2026-12-31T23:59:59Z'), TrangThai: 'ACTIVE' },
]

// ---------------------------------------------------------------------------
// Thời gian và bộ sinh số cố định
// ---------------------------------------------------------------------------

// Mọi mốc thời gian tính theo giờ Việt Nam (UTC+7), không phụ thuộc múi giờ của máy chạy seed.
const vn = (nam, thang, ngay, gio = 0, phut = 0) => new Date(Date.UTC(nam, thang - 1, ngay, gio - 7, phut))
const PHUT = 60 * 1000
const GIO = 60 * PHUT
const NGAY = 24 * GIO

// Dữ liệu mẫu dừng ở mốc này: không có giao dịch, biến động điểm hay lượt đổi quà nào sau đó.
// Nhờ vậy giao dịch tạo lúc demo luôn đứng đầu danh sách "mới nhất", trên app lẫn trong IntelliShell.
const NGAY_CHOT = vn(2026, 11, 20, 21, 0).getTime()
const NGAY_BAT_DAU = vn(2026, 1, 3, 9, 0).getTime()
// Khách ngừng hoạt động (KH004) không phát sinh giao dịch sau tháng 7
const NGAY_NGUNG_HOAT_DONG = vn(2026, 7, 31, 20, 0).getTime()

/** [năm, tháng, ngày] theo giờ Việt Nam của một mốc thời gian (ms) */
const ngayVN = (t) => {
  const d = new Date(t + 7 * GIO)
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]
}
const thangVN = (t) => ngayVN(t)[1]
/** Cùng ngày (giờ Việt Nam) với t, nhưng vào lúc gio:phut */
const lucTrongNgay = (t, gio, phut) => {
  const [nam, thang, ngay] = ngayVN(t)
  return vn(nam, thang, ngay, gio, phut).getTime()
}

/** Bộ sinh số giả ngẫu nhiên có hạt giống (mulberry32): chạy seed lần nào cũng ra đúng một bộ dữ liệu */
function taoRng(hatGiong) {
  let a = hatGiong >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 1 điểm cho mỗi 1.000đ, giống tinhDiemCong() trong src/services/giaoDich.service.js
const tinhDiem = (tongTien) => Math.floor(tongTien / 1000)

// ---------------------------------------------------------------------------
// Kế hoạch dữ liệu nghiệp vụ
// ---------------------------------------------------------------------------

// Số giao dịch COMPLETED trong năm 2026 của từng khách (tổng 183), gần tỷ lệ với tổng chi tiêu.
// Tổng tiền các giao dịch của một khách bằng đúng TongChiTieu của khách đó.
const SO_GIAO_DICH = {
  KH001: 9, KH002: 15, KH003: 18, KH004: 3, KH005: 3, KH006: 3, KH007: 3, KH008: 4, KH009: 5, KH010: 6,
  KH011: 7, KH012: 8, KH013: 9, KH014: 10, KH015: 11, KH016: 12, KH017: 13, KH018: 14, KH019: 14, KH020: 16,
}

// Số lượt đổi quà của từng khách (tổng 141). 10 khách đầu tạo bảng Top 10 đổi quà nhiều nhất.
const SO_LUOT_DOI = {
  KH003: 28, KH002: 22, KH020: 19, KH019: 16, KH018: 14, KH017: 12, KH016: 10, KH015: 8, KH014: 6, KH013: 5,
  KH001: 1,
}

// Khách demo có số điểm cố định theo kịch bản demo (docs/04-kich-ban-demo.md).
// Tổng điểm đã đổi = tổng điểm tích lũy − điểm hiện tại.
// KH001: 9.850 − 9.500 = 350 điểm, đúng 1 voucher nước ngọt size L (PT004).
const DIEM_HIEN_TAI_DEMO = { KH001: 9500, KH002: 12400 }

// Điểm phát hành tháng 9/2026, số liệu ghi trong docs/05-bao-cao-phan-cong-yen-linh.md
const DIEM_THANG_9 = 34485

// Phim và combo giống danh mục của frontend (frontend/src/data/catalog.js)
const PHIM = [
  { MaPhim: 'P01', TenPhim: 'Hành Tinh Cuối Cùng', Gia: { '2D': 95000, '3D': 120000 }, SuatChieu: ['10:00', '13:30', '19:30', '22:00'] },
  { MaPhim: 'P02', TenPhim: 'Mùa Hè Ở Hội An', Gia: { '2D': 95000 }, SuatChieu: ['09:30', '15:00', '18:45', '21:15'] },
  { MaPhim: 'P03', TenPhim: 'Thám Tử Mèo Mun', Gia: { '2D': 95000, '3D': 120000 }, SuatChieu: ['08:45', '11:00', '14:20', '17:00'] },
  { MaPhim: 'P04', TenPhim: 'Đêm Trăng Sài Gòn', Gia: { '2D': 95000 }, SuatChieu: ['20:00', '22:30', '23:45'] },
]
const COMBO = [
  { MaSanPham: 'CB-SOLO', TenSanPham: 'Combo Solo (1 bắp ngọt (M) + 1 nước ngọt (L))', DonGia: 79000 },
  { MaSanPham: 'CB-COUPLE', TenSanPham: 'Combo Couple (1 bắp lớn + 2 nước ngọt (L))', DonGia: 109000 },
  { MaSanPham: 'CB-FAMILY', TenSanPham: 'Combo Family (2 bắp lớn + 4 nước ngọt + 1 snack)', DonGia: 189000 },
]

// Tỷ trọng khi chọn quà: voucher rẻ được đổi nhiều hơn quà hiện vật
const TRONG_SO_QUA = { PT001: 4, PT002: 4, PT003: 3, PT004: 4, PT005: 3, PT006: 2, PT007: 2, PT008: 1, PT009: 0.5, PT010: 0.5 }
const KY_TU_VOUCHER = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Sinh giao dịch, sổ điểm, lượt đổi quà và lịch sử hạng khớp nhau cho danh sách khách hàng.
 * Điền DiemHienTai và TongDiemTichLuy của từng khách từ sổ điểm.
 * Bất biến được kiểm tra ngay trong hàm (sai thì báo lỗi, không nạp dữ liệu):
 *   - tổng tiền giao dịch của khách = TongChiTieu; hạng hiện tại khớp tổng chi tiêu
 *   - cộng mọi dòng SoDiem trong sổ điểm của khách = DiemHienTai; số dư không bao giờ âm
 *   - mỗi lượt đổi quà có đúng một dòng REDEEM; không có mốc thời gian nào sau NGAY_CHOT
 */
export function sinhDuLieuNghiepVu(dsKhachHang) {
  const rng = taoRng(20261120)
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1))
  const chon = (arr) => arr[Math.floor(rng() * arr.length)]
  const chonTheoTrongSo = (ds) => {
    let r = rng() * ds.reduce((s, pt) => s + TRONG_SO_QUA[pt.MaPhanThuong], 0)
    for (const pt of ds) if ((r -= TRONG_SO_QUA[pt.MaPhanThuong]) < 0) return pt
    return ds[ds.length - 1]
  }
  const maVoucherDaDung = new Set()
  const taoMaVoucher = () => {
    let ma
    do ma = 'VC-' + Array.from({ length: 6 }, () => chon(KY_TU_VOUCHER)).join('')
    while (maVoucherDaDung.has(ma))
    maVoucherDaDung.add(ma)
    return ma
  }

  // 1. Chia tổng chi tiêu của từng khách thành các giao dịch, rải đều từ đầu năm tới ngày chốt
  const giaoDichTheoKhach = new Map()
  for (const kh of dsKhachHang) {
    const n = SO_GIAO_DICH[kh.MaKH]
    const batDau = Math.max(NGAY_BAT_DAU, kh.NgayDangKy.getTime() + NGAY)
    const ketThuc = kh.TrangThai === 'ACTIVE' ? NGAY_CHOT - NGAY : NGAY_NGUNG_HOAT_DONG
    const khoang = (ketThuc - batDau) / n
    const trongSo = Array.from({ length: n }, () => 0.6 + 0.8 * rng())
    const tongTrongSo = trongSo.reduce((s, w) => s + w, 0)
    const soTien = trongSo.map((w) => Math.round((kh.TongChiTieu * w) / tongTrongSo / 1000) * 1000)
    soTien[soTien.indexOf(Math.max(...soTien))] += kh.TongChiTieu - soTien.reduce((s, x) => s + x, 0)
    giaoDichTheoKhach.set(
      kh.MaKH,
      soTien.map((tien, i) => ({
        MaKH: kh.MaKH,
        tien,
        t: lucTrongNgay(batDau + khoang * (i + 0.15 + 0.7 * rng()), ri(9, 20), ri(0, 59)),
      })),
    )
  }

  // 2. Cân điểm phát hành tháng 9 về đúng DIEM_THANG_9: chuyển tiền giữa một giao dịch tháng 9 và một
  //    giao dịch tháng khác của cùng một khách, nên tổng chi tiêu của từng khách giữ nguyên.
  //    Không đụng giao dịch của 2 khách demo KH001, KH002.
  const tatCa = [...giaoDichTheoKhach.values()].flat()
  let chenhLech = DIEM_THANG_9 * 1000 - tatCa.filter((g) => thangVN(g.t) === 9).reduce((s, g) => s + g.tien, 0)
  const khachCan = dsKhachHang
    .filter((k) => !(k.MaKH in DIEM_HIEN_TAI_DEMO))
    .sort((a, b) => b.TongChiTieu - a.TongChiTieu)
  for (const kh of khachCan) {
    const ds = giaoDichTheoKhach.get(kh.MaKH)
    for (const g9 of ds.filter((g) => thangVN(g.t) === 9)) {
      for (const gKhac of ds.filter((g) => thangVN(g.t) !== 9)) {
        if (chenhLech === 0) break
        const [nguon, dich] = chenhLech > 0 ? [gKhac, g9] : [g9, gKhac]
        const chuyen = Math.min(Math.abs(chenhLech), Math.floor((nguon.tien * 0.3) / 1000) * 1000)
        nguon.tien -= chuyen
        dich.tien += chuyen
        chenhLech -= Math.sign(chenhLech) * chuyen
      }
    }
  }
  if (chenhLech !== 0) throw new Error('Không cân được điểm phát hành tháng 9')

  // 3. Giao dịch: chi tiết vé và combo khớp tổng tiền; đánh mã GD theo thứ tự thời gian
  const taoChiTiet = (tien) => {
    const phim = chon(PHIM)
    const dinhDang = phim.Gia['3D'] && rng() < 0.3 ? '3D' : '2D'
    const giaVe = phim.Gia[dinhDang]
    const dong = []
    let conLai = tien
    if (tien >= giaVe) {
      const soVe = Math.max(1, Math.min(Math.floor(tien / giaVe), Math.round((tien * (0.55 + 0.2 * rng())) / giaVe)))
      dong.push({ MaSanPham: `${phim.MaPhim}-${dinhDang}`, TenSanPham: `Vé ${dinhDang} ${phim.TenPhim}, suất ${chon(phim.SuatChieu)}`, Loai: 'VE', SoLuong: soVe, DonGia: giaVe, ThanhTien: soVe * giaVe })
      conLai -= soVe * giaVe
    }
    const combo = chon(COMBO)
    const soCombo = Math.floor(conLai / combo.DonGia)
    if (soCombo > 0) {
      dong.push({ MaSanPham: combo.MaSanPham, TenSanPham: combo.TenSanPham, Loai: 'COMBO', SoLuong: soCombo, DonGia: combo.DonGia, ThanhTien: soCombo * combo.DonGia })
      conLai -= soCombo * combo.DonGia
    }
    if (conLai > 0) {
      dong.push({ MaSanPham: 'BN-THEM', TenSanPham: 'Bắp nước, snack mua thêm tại quầy', Loai: 'COMBO', SoLuong: 1, DonGia: conLai, ThanhTien: conLai })
    }
    return dong
  }

  const dsGiaoDich = tatCa
    .sort((a, b) => a.t - b.t)
    .map((g, i) => {
      const maGD = `GD${String(i + 1).padStart(6, '0')}`
      const chiTiet = taoChiTiet(g.tien)
      const coVe = chiTiet.some((d) => d.Loai === 'VE')
      const coCombo = chiTiet.some((d) => d.Loai === 'COMBO')
      return {
        MaGiaoDich: maGD,
        MaGD: maGD,
        MaKH: g.MaKH,
        LoaiGiaoDich: coVe && coCombo ? 'VE_VA_COMBO' : coVe ? 'VE_XEM_PHIM' : 'COMBO_BAP_NUOC',
        ChiTiet: chiTiet,
        TongTien: g.tien,
        PhuongThucThanhToan: rng() < 0.8 ? 'MOMO' : 'TAI_QUAY',
        TrangThai: 'COMPLETED',
        DiemCong: tinhDiem(g.tien),
        NgayTao: new Date(g.t),
        // Thời điểm thanh toán xong, cũng là lúc ghi dòng EARN (giống backend khi chạy thật)
        NgayCapNhat: new Date(g.t + ri(2, 6) * PHUT),
      }
    })

  // 4. Đổi quà: chọn quà cho từng khách rồi xếp lịch đổi vào lúc khách đã đủ điểm
  //    Chọn đúng n món quà có tổng điểm bằng `tong` (dùng cho khách demo có số điểm cố định)
  const chonQuaTheoTong = (n, tong) => {
    const datDuoc = [new Set([0])] // datDuoc[k]: các tổng điểm tạo được từ đúng k món quà
    for (let k = 1; k <= n; k++) {
      const s = new Set()
      for (const x of datDuoc[k - 1]) for (const pt of PHAN_THUONG) if (x + pt.DiemCanDoi <= tong) s.add(x + pt.DiemCanDoi)
      datDuoc.push(s)
    }
    if (!datDuoc[n].has(tong)) throw new Error(`Không chọn được ${n} món quà có tổng ${tong} điểm`)
    const ketQua = []
    let conLai = tong
    for (let k = n; k > 0; k--) {
      const pt = chonTheoTrongSo(PHAN_THUONG.filter((p) => datDuoc[k - 1].has(conLai - p.DiemCanDoi)))
      ketQua.push(pt)
      conLai -= pt.DiemCanDoi
    }
    return ketQua
  }
  //    Chọn ngẫu nhiên n món quà, tổng không quá `tranTren` điểm
  const chonQuaNgauNhien = (n, tranTren) => {
    for (let lan = 0; lan < 1000; lan++) {
      const ds = Array.from({ length: n }, () => chonTheoTrongSo(PHAN_THUONG))
      if (ds.reduce((s, pt) => s + pt.DiemCanDoi, 0) <= tranTren) return ds
    }
    throw new Error(`Không chọn được ${n} món quà trong ${tranTren} điểm`)
  }
  //    Rải các lượt đổi đều trong năm; lượt nào chưa đủ điểm thì dời tới sau lần tích điểm kế tiếp
  const lenLichDoi = (tichDiem, dsQua) => {
    const tDau = tichDiem[0].t
    const tCuoi = NGAY_CHOT - 12 * GIO
    const diemDenLuc = (t) => tichDiem.filter((e) => e.t <= t).reduce((s, e) => s + e.diem, 0)
    const lich = []
    let daDoi = 0
    let tTruoc = tDau
    dsQua.forEach((pt, j) => {
      const mucTieu = tDau + ((j + 0.5) / dsQua.length) * (tCuoi - tDau)
      let t = lucTrongNgay(Math.max(mucTieu, tTruoc) + NGAY, ri(10, 20), ri(0, 59))
      while (diemDenLuc(t) - daDoi < pt.DiemCanDoi) {
        const keTiep = tichDiem.find((e) => e.t > t)
        if (!keTiep) throw new Error(`Không đủ điểm để đổi ${pt.MaPhanThuong}`)
        t = lucTrongNgay(keTiep.t + NGAY, ri(10, 20), ri(0, 59))
      }
      if (t > NGAY_CHOT) throw new Error('Lượt đổi quà rơi sau ngày chốt dữ liệu')
      lich.push({ pt, t })
      daDoi += pt.DiemCanDoi
      tTruoc = t
    })
    return lich
  }

  const luotDoi = []
  for (const [maKH, soLuot] of Object.entries(SO_LUOT_DOI)) {
    const tichDiem = dsGiaoDich
      .filter((g) => g.MaKH === maKH)
      .map((g) => ({ t: g.NgayCapNhat.getTime(), diem: g.DiemCong }))
    const tongTich = tichDiem.reduce((s, e) => s + e.diem, 0)
    const dsQua =
      maKH in DIEM_HIEN_TAI_DEMO
        ? chonQuaTheoTong(soLuot, tongTich - DIEM_HIEN_TAI_DEMO[maKH])
        : chonQuaNgauNhien(soLuot, Math.floor(tongTich * 0.7))
    for (const { pt, t } of lenLichDoi(tichDiem, dsQua)) luotDoi.push({ MaKH: maKH, pt, t })
  }

  const dsDoiThuong = luotDoi
    .sort((a, b) => a.t - b.t)
    .map((d, i) => {
      const maDT = `DT${String(i + 1).padStart(6, '0')}`
      const hanSuDung = d.t + d.pt.HanSuDungNgay * NGAY
      // Voucher hết hạn từ trước ngày chốt phần lớn đã dùng; còn hạn thì khoảng một nửa đã dùng
      const daDung = rng() < (hanSuDung < NGAY_CHOT - 7 * NGAY ? 0.85 : 0.5)
      return {
        MaDoiThuong: maDT,
        MaDoi: maDT,
        MaKH: d.MaKH,
        MaPhanThuong: d.pt.MaPhanThuong,
        MaQua: d.pt.MaPhanThuong,
        TenPhanThuong: d.pt.TenPhanThuong,
        LoaiPhanThuong: d.pt.LoaiPhanThuong,
        DiemDaDoi: d.pt.DiemCanDoi,
        DiemSuDung: d.pt.DiemCanDoi,
        SoLuong: 1,
        MaVoucher: taoMaVoucher(),
        TrangThai: daDung ? 'DA_SU_DUNG' : 'CHUA_SU_DUNG',
        NgayDoi: new Date(d.t),
        HanSuDung: new Date(hanSuDung),
      }
    })

  // 5. Sổ điểm: một dòng EARN cho mỗi giao dịch, một dòng REDEEM cho mỗi lượt đổi quà,
  //    xếp theo thời gian; SoDuSau là số dư dồn của từng khách sau dòng đó (giống backend khi chạy thật)
  const suKien = [
    ...dsGiaoDich.map((g) => ({ t: g.NgayCapNhat.getTime(), loai: 'EARN', MaKH: g.MaKH, diem: g.DiemCong, ma: g.MaGiaoDich })),
    ...dsDoiThuong.map((d) => ({ t: d.NgayDoi.getTime(), loai: 'REDEEM', MaKH: d.MaKH, diem: -d.DiemDaDoi, ma: d.MaDoiThuong, ten: d.TenPhanThuong })),
  ].sort((a, b) => a.t - b.t)
  const soDu = {}
  const dsBienDong = suKien.map((e, i) => {
    const maBD = `BD${String(i + 1).padStart(6, '0')}`
    soDu[e.MaKH] = (soDu[e.MaKH] || 0) + e.diem
    if (soDu[e.MaKH] < 0) throw new Error(`Số dư điểm của ${e.MaKH} bị âm`)
    const ngay = new Date(e.t)
    const chung = { MaBienDong: maBD, MaLedger: maBD, MaKH: e.MaKH, LoaiBienDong: e.loai, Loai: e.loai, SoDiem: e.diem, SoDuSau: soDu[e.MaKH], MaThamChieu: e.ma }
    return e.loai === 'EARN'
      ? { ...chung, MaGD: e.ma, MoTa: `Tích điểm giao dịch ${e.ma}`, TrangThai: 'POSTED', IdempotencyKey: `EARN_${e.ma}`, NgayTao: ngay, NgayPhatSinh: ngay }
      : { ...chung, MaDoi: e.ma, MoTa: `Đổi quà: ${e.ten}`, TrangThai: 'POSTED', IdempotencyKey: `REDEEM_${e.ma}`, NgayTao: ngay, NgayPhatSinh: ngay }
  })

  // 6. Khách hàng: điểm hiện tại là số dư cuối sổ điểm, tổng điểm tích lũy là tổng các dòng EARN
  for (const kh of dsKhachHang) {
    const cuaKhach = dsGiaoDich.filter((g) => g.MaKH === kh.MaKH)
    const tongTien = cuaKhach.reduce((s, g) => s + g.TongTien, 0)
    if (tongTien !== kh.TongChiTieu) throw new Error(`Tổng giao dịch của ${kh.MaKH} khác TongChiTieu`)
    kh.TongDiemTichLuy = cuaKhach.reduce((s, g) => s + g.DiemCong, 0)
    kh.DiemHienTai = soDu[kh.MaKH] || 0
    if (kh.MaKH in DIEM_HIEN_TAI_DEMO && kh.DiemHienTai !== DIEM_HIEN_TAI_DEMO[kh.MaKH]) {
      throw new Error(`${kh.MaKH} phải có ${DIEM_HIEN_TAI_DEMO[kh.MaKH]} điểm, đang ra ${kh.DiemHienTai}`)
    }
  }

  // 7. Lịch sử hạng: dòng đăng ký thành viên, rồi một dòng mỗi lần tổng chi tiêu trong năm vượt ngưỡng
  //    Bạc (10 triệu) hoặc Vàng (30 triệu), ghi đúng lúc giao dịch làm vượt ngưỡng (giống backend khi chạy thật)
  const hangTheoChiTieu = (chi) => (chi >= 30000000 ? 'VANG' : chi >= 10000000 ? 'BAC' : 'DONG')
  const lichSu = dsKhachHang.map((kh) => ({
    t: kh.NgayDangKy.getTime(),
    doc: {
      MaKH: kh.MaKH,
      HangCu: null,
      MaHangCu: null,
      HangMoi: 'DONG',
      MaHangMoi: 'DONG',
      TongChiTieuKhiDoi: 0,
      NamXetHang: ngayVN(kh.NgayDangKy.getTime())[0],
      LyDo: 'Đăng ký thành viên',
      NgayThayDoi: kh.NgayDangKy,
    },
  }))
  for (const kh of dsKhachHang) {
    let chiTieu = 0
    let hang = 'DONG'
    for (const g of dsGiaoDich.filter((x) => x.MaKH === kh.MaKH)) {
      chiTieu += g.TongTien
      const hangMoi = hangTheoChiTieu(chiTieu)
      if (hangMoi === hang) continue
      lichSu.push({
        t: g.NgayCapNhat.getTime(),
        doc: {
          MaKH: kh.MaKH,
          HangCu: hang,
          MaHangCu: hang,
          HangMoi: hangMoi,
          MaHangMoi: hangMoi,
          TongChiTieuKhiDoi: chiTieu,
          NamXetHang: 2026,
          LyDo: `Tổng chi tiêu đạt ${formatVND(hangMoi === 'VANG' ? 30000000 : 10000000)}`,
          NgayThayDoi: g.NgayCapNhat,
        },
      })
      hang = hangMoi
    }
    if (hang !== kh.MaHangHienTai) throw new Error(`Hạng của ${kh.MaKH} không khớp tổng chi tiêu`)
  }
  const dsLichSuHang = lichSu
    .sort((a, b) => a.t - b.t)
    .map((x, i) => ({ MaLichSu: `LS${String(i + 1).padStart(3, '0')}`, ...x.doc }))

  // Không mốc thời gian nào được sau ngày chốt
  const muonNhat = Math.max(...suKien.map((e) => e.t), ...dsLichSuHang.map((x) => x.NgayThayDoi.getTime()))
  if (muonNhat > NGAY_CHOT) throw new Error('Có dữ liệu sau ngày chốt')

  return { dsGiaoDich, dsBienDong, dsDoiThuong, dsLichSuHang }
}

/** 20 khách hàng mẫu. DiemHienTai, TongDiemTichLuy để trống, sinhDuLieuNghiepVu() điền từ sổ điểm. */
export function taoDanhSachKhachHang() {
  // Tài khoản demo theo docs/04-kich-ban-demo.md
  const dsKhachHang = [
    {
      MaKH: 'KH001',
      HoTen: 'Trần Minh Anh',
      SoDienThoai: '0901000001',
      SDT: '0901000001',
      Email: 'tran.minh.anh01@example.com',
      NgaySinh: new Date('2003-11-20'),
      GioiTinh: 'Nữ',
      NgayDangKy: new Date('2025-09-21T03:15:00Z'),
      MaThe: 'LC00000001',
      MaTheThanhVien: 'LC00000001',
      MaQR: 'QR_MEMBER_001',
      MaHangHienTai: 'DONG',
      DiemHienTai: null,
      TongDiemTichLuy: null,
      TongChiTieu: 9850000,
      TongChiTieuNam: 9850000,
      NamXetHang: 2026,
      TrangThai: 'ACTIVE',
    },
    {
      MaKH: 'KH002',
      HoTen: 'Lê Hoàng Nam',
      SoDienThoai: '0901000002',
      SDT: '0901000002',
      Email: 'le.hoang.nam02@example.com',
      NgaySinh: new Date('1999-04-02'),
      GioiTinh: 'Nam',
      NgayDangKy: new Date('2025-05-10T08:30:00Z'),
      MaThe: 'LC00000002',
      MaTheThanhVien: 'LC00000002',
      MaQR: 'QR_MEMBER_002',
      MaHangHienTai: 'BAC',
      DiemHienTai: null,
      TongDiemTichLuy: null,
      TongChiTieu: 29850000,
      TongChiTieuNam: 29850000,
      NamXetHang: 2026,
      TrangThai: 'ACTIVE',
    },
    {
      MaKH: 'KH003',
      HoTen: 'Phạm Thu Hà',
      SoDienThoai: '0901000003',
      SDT: '0901000003',
      Email: 'pham.thu.ha03@example.com',
      NgaySinh: new Date('1995-08-15'),
      GioiTinh: 'Nữ',
      NgayDangKy: new Date('2024-12-01T10:00:00Z'),
      MaThe: 'LC00000003',
      MaTheThanhVien: 'LC00000003',
      MaQR: 'QR_MEMBER_003',
      MaHangHienTai: 'VANG',
      DiemHienTai: null,
      TongDiemTichLuy: null,
      TongChiTieu: 36420000,
      TongChiTieuNam: 36420000,
      NamXetHang: 2026,
      TrangThai: 'ACTIVE',
    },
    {
      MaKH: 'KH004',
      HoTen: 'Võ Đức Long',
      SoDienThoai: '0901000004',
      SDT: '0901000004',
      Email: 'vo.duc.long04@example.com',
      NgaySinh: new Date('2001-01-27'),
      GioiTinh: 'Nam',
      NgayDangKy: new Date('2026-02-14T09:00:00Z'),
      MaThe: 'LC00000004',
      MaTheThanhVien: 'LC00000004',
      MaQR: 'QR_MEMBER_004',
      MaHangHienTai: 'DONG',
      DiemHienTai: null,
      TongDiemTichLuy: null,
      TongChiTieu: 2150000,
      TongChiTieuNam: 2150000,
      NamXetHang: 2026,
      TrangThai: 'INACTIVE',
    },
  ]

  // Thêm 16 khách hàng mẫu phụ để có đủ top 10 đổi quà và dữ liệu phong phú
  const tenMau = [
    ['Nguyễn Văn An', 'Nam'], ['Trần Thị Bích', 'Nữ'], ['Lê Văn Cường', 'Nam'], ['Phạm Thị Dung', 'Nữ'],
    ['Hoàng Văn Em', 'Nam'], ['Vũ Thị Phương', 'Nữ'], ['Đặng Văn Giang', 'Nam'], ['Bùi Thị Hoa', 'Nữ'],
    ['Đỗ Văn Ích', 'Nam'], ['Hồ Thị Kim', 'Nữ'], ['Ngô Văn Long', 'Nam'], ['Dương Thị Mai', 'Nữ'],
    ['Lý Văn Nam', 'Nam'], ['Trịnh Thị Oanh', 'Nữ'], ['Mai Văn Phát', 'Nam'], ['Lâm Thị Quỳnh', 'Nữ'],
  ]

  for (let i = 0; i < tenMau.length; i++) {
    const idx = i + 5
    const maKH = `KH${String(idx).padStart(3, '0')}`
    const sdt = `09010000${String(idx).padStart(2, '0')}`
    const chiTieu = 1000000 + i * 2200000
    const hang = chiTieu >= 30000000 ? 'VANG' : chiTieu >= 10000000 ? 'BAC' : 'DONG'

    dsKhachHang.push({
      MaKH: maKH,
      HoTen: tenMau[i][0],
      SoDienThoai: sdt,
      SDT: sdt,
      Email: `user${idx}@example.com`,
      NgaySinh: vn(1998 + (i % 8), (i % 12) + 1, 10 + i),
      GioiTinh: tenMau[i][1],
      NgayDangKy: vn(2025, (i % 12) + 1, 1 + i),
      MaThe: `LC${String(idx).padStart(8, '0')}`,
      MaTheThanhVien: `LC${String(idx).padStart(8, '0')}`,
      MaQR: `QR_MEMBER_${String(idx).padStart(3, '0')}`,
      MaHangHienTai: hang,
      DiemHienTai: null,
      TongDiemTichLuy: null,
      TongChiTieu: chiTieu,
      TongChiTieuNam: chiTieu,
      NamXetHang: 2026,
      TrangThai: 'ACTIVE',
    })
  }
  return dsKhachHang
}

export async function seedDatabase() {
  // Sinh và kiểm tra toàn bộ dữ liệu trước, lỗi thì dừng ngay khi CSDL chưa bị xóa
  const dsKhachHang = taoDanhSachKhachHang()
  const { dsGiaoDich, dsBienDong, dsDoiThuong, dsLichSuHang } = sinhDuLieuNghiepVu(dsKhachHang)

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(DB_NAME)

  console.log(`[Seed] Bắt đầu nạp dữ liệu chuẩn cho "${DB_NAME}"...`)

  // Xóa sạch các collection cũ để chuẩn hóa về trạng thái ban đầu
  const existingCols = (await db.listCollections().toArray()).map((c) => c.name)
  for (const col of [
    'khach_hang',
    'hang_thanh_vien',
    'lich_su_hang',
    'phan_thuong',
    'doi_thuong',
    'bien_dong_diem',
    'giao_dich',
    'khuyen_mai',
  ]) {
    if (existingCols.includes(col)) {
      await db.collection(col).drop()
    }
  }

  // 1. Tạo indexes
  await db.collection('khach_hang').createIndex({ MaKH: 1 }, { unique: true })
  await db.collection('khach_hang').createIndex({ SoDienThoai: 1 })
  await db.collection('khach_hang').createIndex({ SDT: 1 })
  await db.collection('hang_thanh_vien').createIndex({ MaHang: 1 }, { unique: true })
  await db.collection('phan_thuong').createIndex({ MaPhanThuong: 1 })
  await db.collection('giao_dich').createIndex({ MaGiaoDich: 1 })
  await db.collection('giao_dich').createIndex({ MaKH: 1, NgayTao: -1 })
  await db.collection('bien_dong_diem').createIndex({ MaKH: 1, NgayTao: -1 })
  await db.collection('doi_thuong').createIndex({ MaKH: 1, NgayDoi: -1 })

  // 2. Nạp hang_thanh_vien, phan_thuong, khuyen_mai
  await db.collection('hang_thanh_vien').insertMany(HANG_THANH_VIEN)
  await db.collection('phan_thuong').insertMany(PHAN_THUONG)
  await db.collection('khuyen_mai').insertMany(KHUYEN_MAI)

  // 3. Nạp khách hàng, giao dịch, sổ điểm, lượt đổi quà và lịch sử hạng đã sinh ở trên
  await db.collection('khach_hang').insertMany(dsKhachHang)
  await db.collection('giao_dich').insertMany(dsGiaoDich)
  await db.collection('bien_dong_diem').insertMany(dsBienDong)
  await db.collection('doi_thuong').insertMany(dsDoiThuong)
  await db.collection('lich_su_hang').insertMany(dsLichSuHang)

  const soEarn = dsBienDong.filter((b) => b.LoaiBienDong === 'EARN').length
  const diemThang9 = dsBienDong
    .filter((b) => b.LoaiBienDong === 'EARN' && thangVN(b.NgayTao.getTime()) === 9)
    .reduce((s, b) => s + b.SoDiem, 0)

  console.log(`[Seed] Nạp dữ liệu hoàn tất!`)
  console.log(`  - ${dsKhachHang.length} khách hàng (KH001: 9.500 điểm, 9.850.000đ, còn 150.000đ lên Bạc)`)
  console.log(`  - ${HANG_THANH_VIEN.length} hạng thành viên (Đồng: 0đ, Bạc: 10 triệu, Vàng: 30 triệu)`)
  console.log(`  - ${PHAN_THUONG.length} phần thưởng, ${KHUYEN_MAI.length} chương trình khuyến mãi`)
  console.log(`  - ${dsGiaoDich.length} giao dịch từ 03/01/2026 đến 20/11/2026, không có ngày tương lai`)
  console.log(`  - ${dsBienDong.length} biến động điểm (${soEarn} EARN, ${dsBienDong.length - soEarn} REDEEM), số dư tính dồn theo thời gian`)
  console.log(`  - ${dsDoiThuong.length} lượt đổi quà, ${dsLichSuHang.length} dòng lịch sử hạng`)
  console.log(`  - Điểm phát hành tháng 9/2026: ${diemThang9.toLocaleString('vi-VN')} điểm`)

  await client.close()
}

// Chạy trực tiếp nếu file được gọi bằng node
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err)
      process.exit(1)
    })
}
