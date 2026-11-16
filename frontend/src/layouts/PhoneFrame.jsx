/** Khung giao diện điện thoại: trên máy tính hiển thị ở giữa màn hình, trên điện thoại chiếm toàn bộ. */
export function PhoneFrame({ children, className = '' }) {
  return (
    <div className="phone-bg">
      <div className={`phone ${className}`}>{children}</div>
    </div>
  )
}
