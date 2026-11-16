// Tính hạng thành viên & tiến độ lên hạng.
// Dùng chung cho giao diện (thanh tiến trình) và API giả (mock).
// Quy tắc: hạng xét theo TỔNG CHI TIÊU (TongChiTieu), không xét theo điểm hiện có,
// vì đổi quà làm giảm điểm nhưng không được làm khách bị tụt hạng.

/** Sắp xếp danh sách hạng tăng dần theo ngưỡng chi tiêu. */
export function sapXepHang(dsHang = []) {
  return [...dsHang].sort((a, b) => a.NguongChiTieu - b.NguongChiTieu)
}

/** Hạng cao nhất có NguongChiTieu <= tongChiTieu. */
export function xacDinhHang(tongChiTieu, dsHang = []) {
  const ds = sapXepHang(dsHang)
  let hang = ds[0] ?? null
  for (const h of ds) {
    if (tongChiTieu >= h.NguongChiTieu) hang = h
  }
  return hang
}

/**
 * Tiến độ lên hạng kế tiếp.
 * @returns {{
 *   hangHienTai: object|null, hangKeTiep: object|null,
 *   soTienCanThem: number, phanTram: number, laHangCaoNhat: boolean
 * }}
 * phanTram tính trong khoảng từ ngưỡng hạng hiện tại tới ngưỡng hạng kế tiếp.
 */
export function tinhTienDoHang(tongChiTieu = 0, dsHang = []) {
  const ds = sapXepHang(dsHang)
  const hangHienTai = xacDinhHang(tongChiTieu, ds)
  if (!hangHienTai) {
    return { hangHienTai: null, hangKeTiep: null, soTienCanThem: 0, phanTram: 0, laHangCaoNhat: false }
  }
  const viTri = ds.findIndex((h) => h.MaHang === hangHienTai.MaHang)
  const hangKeTiep = ds[viTri + 1] ?? null
  if (!hangKeTiep) {
    return { hangHienTai, hangKeTiep: null, soTienCanThem: 0, phanTram: 100, laHangCaoNhat: true }
  }
  const tu = hangHienTai.NguongChiTieu
  const den = hangKeTiep.NguongChiTieu
  const soTienCanThem = Math.max(0, den - tongChiTieu)
  const phanTram = Math.min(100, Math.max(0, ((tongChiTieu - tu) / (den - tu)) * 100))
  return { hangHienTai, hangKeTiep, soTienCanThem, phanTram: Math.floor(phanTram * 10) / 10, laHangCaoNhat: false }
}
