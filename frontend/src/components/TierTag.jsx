import { TIER_STYLE, TIER_STYLE_MAC_DINH } from '../config.js'

/** Nhãn hạng: chấm màu + tên hạng (nhận diện bằng chữ, không chỉ bằng màu). */
export function TierTag({ maHang, dsHang = [], tenHang }) {
  const hang = dsHang.find((h) => h.MaHang === maHang)
  const mau = hang?.MauSac ?? (TIER_STYLE[maHang] ?? TIER_STYLE_MAC_DINH).color
  return (
    <span className="tier-tag">
      <span className="tier-tag__dot" style={{ background: mau }} />
      {tenHang ?? hang?.TenHang ?? maHang ?? '—'}
    </span>
  )
}
