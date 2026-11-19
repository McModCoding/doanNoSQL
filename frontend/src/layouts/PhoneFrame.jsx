/**
 * Khung app khách hàng: trên điện thoại là một cột vừa màn hình,
 * trên máy tính tràn hết bề ngang (lề hai bên 32px).
 */
export function PhoneFrame({ children }) {
  return (
    <div className="khung-ngoai">
      <div className="khung">{children}</div>
    </div>
  )
}
