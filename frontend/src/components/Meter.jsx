/** Thanh tiến độ: mực trên rãnh giấy. tren="nen-phu" khi đặt trên nền phụ (trong tấm vé). */
export function Meter({ phanTram = 0, nhan, tren = 'nen' }) {
  const p = Math.max(0, Math.min(100, phanTram))
  return (
    <div
      className={`thanh-tien-do${tren === 'nen-phu' ? ' thanh-tien-do--tren-nen-phu' : ''}`}
      role="progressbar"
      aria-label={nhan}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
    >
      <div className="thanh-tien-do__muc" style={{ width: `${p}%` }} />
    </div>
  )
}
