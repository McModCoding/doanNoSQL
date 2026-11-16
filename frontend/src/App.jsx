import { App as AntApp, ConfigProvider, Spin } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { CustomerProvider } from './context/CustomerProvider.jsx'
import { AdminLayout } from './layouts/AdminLayout.jsx'
import { CustomerLayout } from './layouts/CustomerLayout.jsx'
import { RequireLogin } from './layouts/RequireLogin.jsx'
import { ANTD_THEME } from './design/antdTheme.js'
import Landing from './pages/Landing.jsx'

// Tải từng trang khi cần (giảm dung lượng tải lần đầu)
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'))
const DoiThuongAdmin = lazy(() => import('./pages/admin/DoiThuong.jsx'))
const GiaoDichAdmin = lazy(() => import('./pages/admin/GiaoDich.jsx'))
const KhachHangAdmin = lazy(() => import('./pages/admin/KhachHang.jsx'))
const PhanThuongAdmin = lazy(() => import('./pages/admin/PhanThuong.jsx'))
const DangNhap = lazy(() => import('./pages/customer/DangNhap.jsx'))
const DoiThuong = lazy(() => import('./pages/customer/DoiThuong.jsx'))
const LichSu = lazy(() => import('./pages/customer/LichSu.jsx'))
const MuaVe = lazy(() => import('./pages/customer/MuaVe.jsx'))
const ThanhToanMoMo = lazy(() => import('./pages/customer/ThanhToanMoMo.jsx'))
const TrangChu = lazy(() => import('./pages/customer/TrangChu.jsx'))

const DangTai = (
  <div style={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
    <Spin size="large" />
  </div>
)


export default function App() {
  return (
    <ConfigProvider locale={viVN} theme={ANTD_THEME} wave={{ disabled: true }}>
      <AntApp>
        <BrowserRouter>
          <Suspense fallback={DangTai}>
            <Routes>
            <Route path="/" element={<Landing />} />

            {/* Customer App (giao diện điện thoại) */}
            <Route
              path="/app"
              element={
                <CustomerProvider>
                  <Outlet />
                </CustomerProvider>
              }
            >
              <Route path="dang-nhap" element={<DangNhap />} />
              <Route
                element={
                  <RequireLogin>
                    <CustomerLayout />
                  </RequireLogin>
                }
              >
                <Route index element={<TrangChu />} />
                <Route path="mua-ve" element={<MuaVe />} />
                <Route path="doi-thuong" element={<DoiThuong />} />
                <Route path="lich-su" element={<LichSu />} />
              </Route>
              <Route
                path="thanh-toan/:maGD"
                element={
                  <RequireLogin>
                    <ThanhToanMoMo />
                  </RequireLogin>
                }
              />
            </Route>

            {/* Admin Dashboard (giao diện máy tính) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="khach-hang" element={<KhachHangAdmin />} />
              <Route path="giao-dich" element={<GiaoDichAdmin />} />
              <Route path="doi-thuong" element={<DoiThuongAdmin />} />
              <Route path="phan-thuong" element={<PhanThuongAdmin />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}
