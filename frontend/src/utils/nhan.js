// Nhãn tiếng Việt cho các giá trị mã trong CSDL.
export const NHAN_LOAI_PHAN_THUONG = {
  VOUCHER_VE: 'Voucher vé',
  VOUCHER_BAP_NUOC: 'Voucher bắp nước',
  QUA_HIEN_VAT: 'Quà tặng hiện vật',
}

export const NHAN_LOAI_GIAO_DICH = {
  VE_XEM_PHIM: 'Vé xem phim',
  COMBO_BAP_NUOC: 'Bắp nước',
  VE_VA_COMBO: 'Vé + bắp nước',
}

export const NHAN_PTTT = { MOMO: 'Ví MoMo', TAI_QUAY: 'Tại quầy' }

export const NHAN_TRANG_THAI_KH = { ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động' }

export function nhanTrangThaiDoiThuong(dt) {
  if (dt.TrangThai === 'DA_SU_DUNG') return dt.LoaiPhanThuong === 'QUA_HIEN_VAT' ? 'Đã nhận quà' : 'Đã sử dụng'
  if (dt.HanSuDung && new Date(dt.HanSuDung) < new Date()) return 'Hết hạn'
  return dt.LoaiPhanThuong === 'QUA_HIEN_VAT' ? 'Chờ nhận quà' : 'Chưa sử dụng'
}

/** "Vé 2D – Hành Tinh... (suất 19:30)" + 2 dòng khác -> "Vé 2D – Hành Tinh... và 2 sản phẩm khác" */
export function tomTatChiTiet(chiTiet = []) {
  if (!chiTiet.length) return '—'
  const dau = `${chiTiet[0].SoLuong} × ${chiTiet[0].TenSanPham}`
  return chiTiet.length > 1 ? `${dau} và ${chiTiet.length - 1} sản phẩm khác` : dau
}
