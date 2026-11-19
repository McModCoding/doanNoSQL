import { GiftOutlined, HistoryOutlined, HomeOutlined, ShoppingOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Spin } from 'antd'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState.jsx'
import { APP_NAME } from '../config.js'
import { useKhachHang } from '../context/khachHangContext.js'
import { formatDiem } from '../utils/format.js'
import { PhoneFrame } from './PhoneFrame.jsx'

const TAB = [
  { to: '/app', end: true, icon: <HomeOutlined />, nhan: 'Trang chủ' },
  { to: '/app/mua-ve', icon: <ShoppingOutlined />, nhan: 'Mua vé' },
  { to: '/app/doi-thuong', icon: <GiftOutlined />, nhan: 'Đổi quà' },
  { to: '/app/lich-su', icon: <HistoryOutlined />, nhan: 'Lịch sử' },
]

/** Máy tính (từ 768px): thanh trên nền giấy giống trang quản trị, mục đang mở được gạch chân. */
function ThanhTren({ khachHang, dangXuat }) {
  return (
    <header className="qt-dau chi-may-tinh">
      <div className="qt-dau__trong">
        <span className="qt-ten">
          <Link to="/app" className="qt-ten__link">
            {APP_NAME}
          </Link>
        </span>
        <nav className="qt-dieu-huong" aria-label="Điều hướng chính">
          {TAB.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'is-dang-mo' : '')}>
              {t.nhan}
            </NavLink>
          ))}
        </nav>
        <div className="qt-dau__phai">
          {khachHang && (
            <span>
              <b className="so-cot">{formatDiem(khachHang.DiemHienTai)}</b> điểm
            </span>
          )}
          <Popconfirm title="Đăng xuất khỏi app?" okText="Đăng xuất" cancelText="Ở lại" onConfirm={dangXuat}>
            <button type="button" className="nut-link">
              Đăng xuất
            </button>
          </Popconfirm>
        </div>
      </div>
    </header>
  )
}

export function CustomerLayout() {
  const { khachHang, dsHang, loi, taiLai, dangXuat } = useKhachHang()

  let noiDung
  if (loi && !khachHang) {
    noiDung = (
      <div className="khung__noi-dung">
        <ErrorState error={loi} onRetry={taiLai} />
        <Button block onClick={dangXuat}>
          Đăng xuất
        </Button>
      </div>
    )
  } else if (!khachHang || dsHang.length === 0) {
    noiDung = (
      <div className="khung__noi-dung khung__noi-dung--giua">
        <Spin size="large" />
      </div>
    )
  } else {
    noiDung = (
      <main className="khung__noi-dung">
        <Outlet />
      </main>
    )
  }

  return (
    <PhoneFrame>
      <ThanhTren khachHang={khachHang} dangXuat={dangXuat} />
      {noiDung}
      {/* Điện thoại (dưới 768px): thanh tab dính đáy */}
      <nav className="thanh-tab chi-dien-thoai" aria-label="Điều hướng chính">
        {TAB.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `thanh-tab__muc${isActive ? ' is-dang-mo' : ''}`}>
            {t.icon}
            <span>{t.nhan}</span>
          </NavLink>
        ))}
      </nav>
    </PhoneFrame>
  )
}
