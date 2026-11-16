import { ArrowLeftOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Divider, Input } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { MockControls } from '../../components/MockControls.jsx'
import { APP_NAME, APP_SLOGAN, DEMO_ACCOUNTS } from '../../config.js'
import { useKhachHang } from '../../context/khachHangContext.js'
import { PhoneFrame } from '../../layouts/PhoneFrame.jsx'

export default function DangNhap() {
  const { maKH, dangNhap } = useKhachHang()
  const navigate = useNavigate()
  const location = useLocation()
  const [sdt, setSdt] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState(null)
  const trangTiepTheo = location.state?.tu || '/app'

  if (maKH) return <Navigate to={trangTiepTheo} replace />

  const xuLyDangNhap = async (soDienThoai) => {
    setLoi(null)
    setDangGui(true)
    try {
      await dangNhap(soDienThoai)
      navigate(trangTiepTheo, { replace: true })
    } catch (e) {
      setLoi(e.message)
    } finally {
      setDangGui(false)
    }
  }

  return (
    <PhoneFrame className="phone--login">
      <div className="login-hero">
        <Link to="/" className="login-hero__back" aria-label="Về trang chọn ứng dụng">
          <ArrowLeftOutlined />
        </Link>
        <div className="login-hero__logo">🎬</div>
        <h1>{APP_NAME}</h1>
        <p>{APP_SLOGAN}</p>
      </div>

      <div className="login-card">
        <h2>Đăng nhập thành viên</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            xuLyDangNhap(sdt)
          }}
        >
          <Input
            size="large"
            prefix={<PhoneOutlined />}
            placeholder="Số điện thoại (10 số)"
            inputMode="numeric"
            maxLength={10}
            value={sdt}
            onChange={(e) => setSdt(e.target.value.replace(/\D/g, ''))}
            aria-label="Số điện thoại"
          />
          {loi && <Alert type="error" showIcon title={loi} style={{ marginTop: 12 }} />}
          <Button type="primary" size="large" block htmlType="submit" loading={dangGui} style={{ marginTop: 12 }}>
            Đăng nhập
          </Button>
        </form>
        <p className="login-card__note">Đăng nhập mô phỏng bằng số điện thoại, không cần mật khẩu.</p>

        <Divider plain>Tài khoản demo</Divider>
        <div className="demo-accounts">
          {DEMO_ACCOUNTS.map((tk) => (
            <button
              type="button"
              key={tk.soDienThoai}
              className="demo-account"
              onClick={() => {
                setSdt(tk.soDienThoai)
                xuLyDangNhap(tk.soDienThoai)
              }}
              disabled={dangGui}
            >
              <UserOutlined />
              <span>
                <b>{tk.soDienThoai}</b>
                <small>{tk.nhan}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="login-card__mock">
          <MockControls />
        </div>
      </div>
    </PhoneFrame>
  )
}
