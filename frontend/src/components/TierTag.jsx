import { MAU, MAU_HANG } from '../design/tokens.js'

/** Nhãn hạng: ô vuông màu hạng + chữ (nhận diện bằng chữ, không chỉ bằng màu). */
export function TierTag({ maHang, dsHang = [], tenHang, coChuHang = true, ...rest }) {
  const hang = dsHang.find((h) => h.MaHang === maHang)
  const ten = tenHang ?? hang?.TenHang ?? maHang ?? 'Chưa có'
  return (
    <span className="nhan-hang" {...rest}>
      <span className="nhan-hang__o" style={{ background: MAU_HANG[maHang] ?? MAU.chuPhu }} aria-hidden />
      {coChuHang ? `Hạng ${ten}` : ten}
    </span>
  )
}
