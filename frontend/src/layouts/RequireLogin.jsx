import { Navigate, useLocation } from 'react-router-dom'
import { useKhachHang } from '../context/khachHangContext.js'

/** Chưa đăng nhập thì chuyển về trang đăng nhập (nhớ trang đang mở để quay lại). */
export function RequireLogin({ children }) {
  const { maKH } = useKhachHang()
  const location = useLocation()
  if (!maKH) return <Navigate to="/app/dang-nhap" replace state={{ tu: location.pathname }} />
  return children
}
