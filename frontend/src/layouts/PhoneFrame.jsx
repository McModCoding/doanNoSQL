/** Khung app khách hàng: một cột tối đa 440px, trên máy tính đặt giữa màn hình. */
export function PhoneFrame({ children }) {
  return (
    <div className="khung-ngoai">
      <div className="khung">{children}</div>
    </div>
  )
}
