import { DashboardOutlined, MobileOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { MockControls } from '../components/MockControls.jsx'
import { APP_NAME, APP_SLOGAN } from '../config.js'

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing__box">
        <div className="landing__logo" aria-hidden>
          🎬
        </div>
        <h1>{APP_NAME}</h1>
        <p className="landing__slogan">{APP_SLOGAN}</p>
        <p className="landing__sub">Đồ án NoSQL · Ứng dụng khách hàng thân thiết rạp chiếu phim (MongoDB · Node.js/Express · React)</p>
        <div className="landing__choices">
          <Link to="/app" className="landing__choice">
            <MobileOutlined />
            <b>Customer App</b>
            <span>Thẻ thành viên QR/Barcode, hạng & tiến độ, mua vé – thanh toán MoMo, đổi quà</span>
          </Link>
          <Link to="/admin" className="landing__choice">
            <DashboardOutlined />
            <b>Admin Dashboard</b>
            <span>Biểu đồ thống kê, tra cứu khách hàng, xử lý giao dịch, đổi thưởng</span>
          </Link>
        </div>
        <div className="landing__mock">
          <MockControls />
        </div>
      </div>
    </div>
  )
}
