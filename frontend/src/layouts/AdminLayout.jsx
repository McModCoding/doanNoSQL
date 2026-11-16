import {
  DashboardOutlined,
  GiftOutlined,
  MobileOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { Button, Layout, Menu } from 'antd'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MockControls } from '../components/MockControls.jsx'
import { APP_NAME } from '../config.js'

const MENU = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard', title: 'Tổng quan & thống kê' },
  { key: '/admin/khach-hang', icon: <TeamOutlined />, label: 'Khách hàng', title: 'Quản lý khách hàng' },
  { key: '/admin/giao-dich', icon: <ShoppingCartOutlined />, label: 'Giao dịch', title: 'Giao dịch vé & bắp nước' },
  { key: '/admin/doi-thuong', icon: <GiftOutlined />, label: 'Đổi thưởng', title: 'Lịch sử đổi thưởng' },
  { key: '/admin/phan-thuong', icon: <TrophyOutlined />, label: 'Phần thưởng', title: 'Danh mục phần thưởng' },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const hienTai = MENU.find((m) => m.key === location.pathname) ?? MENU[0]

  return (
    <Layout className="admin">
      <Layout.Sider breakpoint="lg" collapsedWidth={0} width={220} className="admin__sider">
        <Link to="/" className="admin__brand">
          🎬 {APP_NAME}
          <small>Admin</small>
        </Link>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[hienTai.key]}
          items={MENU.map(({ key, icon, label }) => ({ key, icon, label }))}
          onClick={({ key }) => navigate(key)}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="admin__header">
          <h1>{hienTai.title}</h1>
          <div className="admin__header-actions">
            <MockControls />
            <Button icon={<MobileOutlined />} href="/app" target="_blank">
              Mở Customer App
            </Button>
          </div>
        </Layout.Header>
        <Layout.Content className="admin__content">
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
