import { GiftOutlined, HistoryOutlined, HomeOutlined, ShoppingOutlined } from '@ant-design/icons'
import { Button, Spin } from 'antd'
import { NavLink, Outlet } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState.jsx'
import { useKhachHang } from '../context/khachHangContext.js'
import { PhoneFrame } from './PhoneFrame.jsx'

const TAB = [
  { to: '/app', end: true, icon: <HomeOutlined />, nhan: 'Trang chủ' },
  { to: '/app/mua-ve', icon: <ShoppingOutlined />, nhan: 'Mua vé' },
  { to: '/app/doi-thuong', icon: <GiftOutlined />, nhan: 'Đổi quà' },
  { to: '/app/lich-su', icon: <HistoryOutlined />, nhan: 'Lịch sử' },
]

export function CustomerLayout() {
  const { khachHang, dsHang, loi, taiLai, dangXuat } = useKhachHang()

  let noiDung
  if (loi && !khachHang) {
    noiDung = (
      <div className="phone-content">
        <ErrorState error={loi} onRetry={taiLai} />
        <Button block type="link" onClick={dangXuat}>
          Đăng xuất
        </Button>
      </div>
    )
  } else if (!khachHang || dsHang.length === 0) {
    noiDung = (
      <div className="phone-content phone-content--center">
        <Spin size="large" />
      </div>
    )
  } else {
    noiDung = (
      <main className="phone-content">
        <Outlet />
      </main>
    )
  }

  return (
    <PhoneFrame>
      {noiDung}
      <nav className="tabbar" aria-label="Điều hướng chính">
        {TAB.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tabbar__item${isActive ? ' is-active' : ''}`}>
            <span className="tabbar__icon">{t.icon}</span>
            <span>{t.nhan}</span>
          </NavLink>
        ))}
      </nav>
    </PhoneFrame>
  )
}
