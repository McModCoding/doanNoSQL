import { RightOutlined } from '@ant-design/icons'
import { Alert, Button, Input } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { MockControls } from '../../components/MockControls.jsx'
import { APP_NAME, APP_SLOGAN, DEMO_ACCOUNTS } from '../../config.js'
import { useKhachHang } from '../../context/khachHangContext.js'
import { PhoneFrame } from '../../layouts/PhoneFrame.jsx'

/**
 * Đăng nhập kiểu quầy soát vé: số điện thoại trước, tài khoản thử bên dưới.
 * Màn lớn (từ 1024px): ô số điện thoại bên trái, tài khoản thử bên phải.
 */
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
    <PhoneFrame>
      <main className="khung__noi-dung trang dang-nhap">
        <div className="cap">
          <Link to="/" className="ten-thuong-hieu">
            {APP_NAME}
          </Link>
          <p>{APP_SLOGAN}</p>
        </div>

        <section className="nhom">
          <h1>Đăng nhập bằng số điện thoại</h1>
          <form
            className="form-dang-nhap"
            onSubmit={(e) => {
              e.preventDefault()
              xuLyDangNhap(sdt)
            }}
          >
            <label htmlFor="so-dien-thoai" className="chu-nho">
              Số điện thoại thành viên
            </label>
            <Input
              id="so-dien-thoai"
              placeholder="Ví dụ 0901000001"
              inputMode="numeric"
              maxLength={10}
              value={sdt}
              onChange={(e) => setSdt(e.target.value.replace(/\D/g, ''))}
            />
            {loi && <Alert type="error" showIcon title={loi} />}
            <Button type="primary" htmlType="submit" block loading={dangGui}>
              Đăng nhập
            </Button>
            <small>Bản mô phỏng cho đồ án, không cần mật khẩu.</small>
          </form>
        </section>

        <section className="nhom">
          <h2>Tài khoản thử</h2>
          <div>
            {DEMO_ACCOUNTS.map((tk) => (
              <button
                type="button"
                key={tk.soDienThoai}
                className="hang-viec hang-viec--nut"
                onClick={() => {
                  setSdt(tk.soDienThoai)
                  xuLyDangNhap(tk.soDienThoai)
                }}
                disabled={dangGui}
              >
                <span className="hang-viec__chu">
                  <span className="so-cot">{tk.soDienThoai}</span>
                  <small>{tk.nhan}</small>
                </span>
                <RightOutlined />
              </button>
            ))}
          </div>
          <MockControls nutLon />
        </section>
      </main>
    </PhoneFrame>
  )
}
