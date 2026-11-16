/**
 * Thanh tiến trình (meter): phần đã đạt màu nhấn, phần còn lại cùng tông nhạt hơn.
 * Có role="progressbar" để trình đọc màn hình đọc được.
 */
export function Meter({ phanTram = 0, nhan, height = 10 }) {
  const p = Math.max(0, Math.min(100, phanTram))
  return (
    <div
      className="meter"
      role="progressbar"
      aria-label={nhan}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
      style={{ height }}
    >
      <div className="meter__fill" style={{ width: `${p}%` }} />
    </div>
  )
}
