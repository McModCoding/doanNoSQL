import { RightOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { MockControls } from '../components/MockControls.jsx'
import { APP_NAME } from '../config.js'
import { ANH_PHONG_CHIEU } from '../data/anh.js'

/** Trang đầu: ảnh phòng chiếu và tên LoyalCine bên trái, hai lựa chọn bên phải. */
export default function Landing() {
  return (
    <main className="trang-dau">
      <div className="cap">
        <img
          className="trang-dau__anh"
          src={ANH_PHONG_CHIEU}
          alt="Phòng chiếu với các hàng ghế đỏ"
          width="1200"
          height="800"
          decoding="async"
        />
        <h1>{APP_NAME}</h1>
        <p>App thành viên rạp phim, đồ án môn NoSQL (MongoDB, Node.js/Express, React).</p>
        <div style={{ marginTop: 24 }}>
          <MockControls />
        </div>
        <small className="trang-dau__nguon">
          Ảnh minh họa lấy từ Wikimedia Commons. <Link to="/nguon-anh">Xem nguồn và giấy phép ảnh</Link>
        </small>
      </div>
      <nav className="trang-dau__lua-chon" aria-label="Chọn ứng dụng">
        <Link to="/app" className="hang-viec">
          <span className="hang-viec__chu">
            <b>App khách hàng</b>
            <small>Thẻ thành viên, mua vé, thanh toán MoMo, đổi quà</small>
          </span>
          <RightOutlined />
        </Link>
        <Link to="/admin" className="hang-viec">
          <span className="hang-viec__chu">
            <b>Trang quản trị</b>
            <small>Thống kê, tra cứu khách hàng, xử lý giao dịch</small>
          </span>
          <RightOutlined />
        </Link>
      </nav>
    </main>
  )
}
