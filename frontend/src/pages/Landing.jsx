import { RightOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { MockControls } from '../components/MockControls.jsx'
import { APP_NAME } from '../config.js'
import { ANH_TRANG_DAU } from '../data/anh.js'

/**
 * Trang đầu. Từ 1024px: ảnh phòng chiếu phủ kín nửa trái màn hình, nửa phải là tấm vé vào cửa
 * (tên app ở thân vé, hai lựa chọn ở cuống vé). Màn nhỏ hơn: ảnh ở trên, tấm vé đè lên mép dưới của ảnh.
 */
export default function Landing() {
  return (
    <main className="trang-dau">
      <picture className="trang-dau__anh">
        <source media="(min-width: 1024px)" srcSet={ANH_TRANG_DAU.doc} sizes="50vw" width="1500" height="2000" />
        <img
          src={ANH_TRANG_DAU.ngangMacDinh}
          srcSet={ANH_TRANG_DAU.ngang}
          sizes="100vw"
          alt="Phòng chiếu với các hàng ghế đỏ"
          width="1600"
          height="1200"
          decoding="async"
          fetchPriority="high"
        />
      </picture>

      <div className="trang-dau__noi-dung">
        <section className="ve ve--vao-cua" aria-labelledby="ten-app">
          <div className="ve__than">
            <div className="ve__hang-tren">
              <small>Vé vào cửa</small>
              <small>Đồ án môn NoSQL</small>
            </div>
            <h1 id="ten-app" className="trang-dau__ten">
              {APP_NAME}
            </h1>
            <p>
              App thành viên của một rạp phim. Dữ liệu lưu trong MongoDB, máy chủ chạy Node.js/Express, giao diện viết
              bằng React.
            </p>
          </div>
          <nav className="ve__cuong trang-dau__lua-chon" aria-label="Chọn ứng dụng">
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
        </section>

        <MockControls />
      </div>
    </main>
  )
}
