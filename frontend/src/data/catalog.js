// Danh mục phim & combo bắp nước TĨNH (mô phỏng quầy bán hàng / POS).
// 8 collection của nhóm không quản lý lịch chiếu, nên frontend tự giữ danh mục này;
// thông tin sản phẩm được lưu kèm vào giao_dich.ChiTiet khi tạo giao dịch.
// Tên phim là tên hư cấu.

export const PHIM = [
  {
    MaPhim: 'P01',
    TenPhim: 'Hành Tinh Cuối Cùng',
    TheLoai: 'Khoa học viễn tưởng',
    ThoiLuong: 128,
    PhanLoai: 'T13',
    Poster: '🪐',
    MauNen: 'linear-gradient(135deg, #1d2b64, #3a6073)',
    DinhDang: { '2D': 95000, '3D': 120000 },
    SuatChieu: ['10:00', '13:30', '19:30', '22:00'],
  },
  {
    MaPhim: 'P02',
    TenPhim: 'Mùa Hè Ở Hội An',
    TheLoai: 'Tình cảm',
    ThoiLuong: 112,
    PhanLoai: 'T13',
    Poster: '🏮',
    MauNen: 'linear-gradient(135deg, #c0392b, #f39c12)',
    DinhDang: { '2D': 95000 },
    SuatChieu: ['09:30', '15:00', '18:45', '21:15'],
  },
  {
    MaPhim: 'P03',
    TenPhim: 'Thám Tử Mèo Mun',
    TheLoai: 'Hoạt hình · Gia đình',
    ThoiLuong: 98,
    PhanLoai: 'P',
    Poster: '🐈‍⬛',
    MauNen: 'linear-gradient(135deg, #11998e, #38ef7d)',
    DinhDang: { '2D': 95000, '3D': 120000 },
    SuatChieu: ['08:45', '11:00', '14:20', '17:00'],
  },
  {
    MaPhim: 'P04',
    TenPhim: 'Đêm Trăng Sài Gòn',
    TheLoai: 'Kinh dị',
    ThoiLuong: 105,
    PhanLoai: 'T18',
    Poster: '🌕',
    MauNen: 'linear-gradient(135deg, #232526, #414345)',
    DinhDang: { '2D': 95000 },
    SuatChieu: ['20:00', '22:30', '23:45'],
  },
]

export const COMBO = [
  { MaSanPham: 'CB-SOLO', TenSanPham: 'Combo Solo', MoTa: '1 bắp ngọt (M) + 1 nước ngọt (L)', DonGia: 79000, Hinh: '🍿' },
  { MaSanPham: 'CB-COUPLE', TenSanPham: 'Combo Couple', MoTa: '1 bắp lớn + 2 nước ngọt (L)', DonGia: 109000, Hinh: '🍿🥤' },
  { MaSanPham: 'CB-FAMILY', TenSanPham: 'Combo Family', MoTa: '2 bắp lớn + 4 nước ngọt + 1 snack', DonGia: 189000, Hinh: '👨‍👩‍👧‍👦' },
]

/** Tạo dòng chi tiết giao dịch cho vé xem phim. */
export function taoDongVe(phim, dinhDang, suatChieu, soLuong) {
  return {
    MaSanPham: `${phim.MaPhim}-${dinhDang}`,
    TenSanPham: `Vé ${dinhDang} – ${phim.TenPhim} (suất ${suatChieu})`,
    Loai: 'VE',
    SoLuong: soLuong,
    DonGia: phim.DinhDang[dinhDang],
  }
}

/** Tạo dòng chi tiết giao dịch cho combo bắp nước. */
export function taoDongCombo(combo, soLuong) {
  return {
    MaSanPham: combo.MaSanPham,
    TenSanPham: `${combo.TenSanPham} (${combo.MoTa})`,
    Loai: 'COMBO',
    SoLuong: soLuong,
    DonGia: combo.DonGia,
  }
}
