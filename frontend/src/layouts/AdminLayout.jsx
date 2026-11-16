import { Link, NavLink, Outlet } from 'react-router-dom'
import { MockControls } from '../components/MockControls.jsx'
import { APP_NAME } from '../config.js'

const MENU = [
  { to: '/admin', end: true, nhan: 'Tổng quan' },
  { to: '/admin/khach-hang', nhan: 'Khách hàng' },
  { to: '/admin/giao-dich', nhan: 'Giao dịch' },
  { to: '/admin/doi-thuong', nhan: 'Đổi thưởng' },
  { to: '/admin/phan-thuong', nhan: 'Phần thưởng' },
]

/** Trang quản trị: thanh điều hướng trên nền giấy, mục đang mở được gạch chân. */
export function AdminLayout() {
  return (
    <div className="qt">
      <a href="#noi-dung" className="bo-qua">
        Bỏ qua thanh điều hướng
      </a>
      <header className="qt-dau">
        <div className="qt-dau__trong">
          <span className="qt-ten">
            <Link to="/" className="qt-ten__link">
              {APP_NAME}
            </Link>
            <small>quản trị</small>
          </span>
          <nav className="qt-dieu-huong" aria-label="Các trang quản trị">
            {MENU.map((m) => (
              <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => (isActive ? 'is-dang-mo' : '')}>
                {m.nhan}
              </NavLink>
            ))}
          </nav>
          <div className="qt-dau__phai">
            <MockControls />
            <a href="/app" target="_blank" rel="noreferrer">
              Mở app khách hàng
            </a>
          </div>
        </div>
      </header>
      <main className="qt-noi-dung" id="noi-dung">
        <Outlet />
      </main>
    </div>
  )
}
