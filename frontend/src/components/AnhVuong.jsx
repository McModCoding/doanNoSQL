/**
 * Ảnh vuông nhỏ cho combo bắp nước và quà đổi điểm.
 * Chưa có ảnh thì để một ô trống cùng cỡ, để các hàng vẫn thẳng cột.
 * Ảnh chỉ minh họa (tên món đã ghi ngay bên cạnh) nên alt để trống.
 */
export function AnhVuong({ src }) {
  if (!src) return <span className="anh-vuong" aria-hidden />
  return <img className="anh-vuong" src={src} alt="" loading="lazy" decoding="async" />
}
