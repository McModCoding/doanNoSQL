import { RightOutlined } from '@ant-design/icons'
import { Popconfirm, Skeleton } from 'antd'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { layBienDongDiem } from '../../api/khachHang.js'
import { layKhuyenMai } from '../../api/khuyenMai.js'
import { layDsPhanThuong } from '../../api/phanThuong.js'
import { MembershipCard } from '../../components/MembershipCard.jsx'
import { APP_NAME } from '../../config.js'
import { useKhachHang } from '../../context/khachHangContext.js'
import { useApi } from '../../hooks/useApi.js'
import { formatDiemCoDau, formatNgayNgan } from '../../utils/format.js'

/** Trang chủ: tấm vé thành viên, các việc khách hay làm, ưu đãi, điểm gần đây. */
export default function TrangChu() {
  const { khachHang, dsHang, taiLai, dangXuat } = useKhachHang()
  const khuyenMai = useApi(() => layKhuyenMai({ conHieuLuc: true }), [])
  const quaApi = useApi(() => layDsPhanThuong({ trangThai: 'ACTIVE' }), [])
  const bienDong = useApi(() => layBienDongDiem(khachHang.MaKH), [khachHang.MaKH, khachHang.DiemHienTai])

  // Luôn lấy số điểm và hạng mới nhất khi mở trang chủ
  useEffect(() => {
    taiLai()
  }, [taiLai])

  const soQuaDuDiem = (quaApi.data ?? []).filter((p) => p.SoLuongTon > 0 && p.DiemCanDoi <= khachHang.DiemHienTai).length
  const tenHang = (ma) => dsHang.find((h) => h.MaHang === ma)?.TenHang ?? ma

  return (
    <div className="trang">
      <h1 className="an-di">Thẻ thành viên của {khachHang.HoTen}</h1>
      <header className="dau-trang">
        <span className="ten-thuong-hieu">{APP_NAME}</span>
        <Popconfirm title="Đăng xuất khỏi app?" okText="Đăng xuất" cancelText="Ở lại" onConfirm={dangXuat}>
          <button type="button" className="nut-link">
            Đăng xuất
          </button>
        </Popconfirm>
      </header>

      <MembershipCard khachHang={khachHang} dsHang={dsHang} />

      <nav aria-label="Việc bạn có thể làm">
        <Link to="/app/mua-ve" className="hang-viec">
          <span className="hang-viec__chu">Mua vé xem phim</span>
          <RightOutlined />
        </Link>
        <Link to="/app/mua-ve?tab=combo" className="hang-viec">
          <span className="hang-viec__chu">Mua bắp nước</span>
          <RightOutlined />
        </Link>
        <Link to="/app/doi-thuong" className="hang-viec">
          <span className="hang-viec__chu">
            Đổi quà
            <small>{quaApi.data ? `${soQuaDuDiem} quà đủ điểm đổi ngay` : 'Đang tải danh sách quà'}</small>
          </span>
          <RightOutlined />
        </Link>
      </nav>

      <section className="nhom" aria-labelledby="uu-dai">
        <h2 id="uu-dai">Ưu đãi đang chạy</h2>
        {khuyenMai.loading && !khuyenMai.data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : khuyenMai.data?.length ? (
          <ul className="ds-hang">
            {khuyenMai.data.map((km) => (
              <li key={km.MaKhuyenMai} className="cap" style={{ paddingBottom: 16 }}>
                <b>{km.TenKhuyenMai}</b>
                <p>{km.MoTa}</p>
                {km.ApDungChoHang?.length > 0 && km.ApDungChoHang.length < dsHang.length && (
                  <small>Dành cho hạng {km.ApDungChoHang.map(tenHang).join(', ')}</small>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Hiện chưa có ưu đãi nào.</p>
        )}
      </section>

      <section className="nhom" aria-labelledby="diem-gan-day">
        <div className="dau-trang">
          <h2 id="diem-gan-day">Điểm gần đây</h2>
          <Link to="/app/lich-su">Xem toàn bộ lịch sử</Link>
        </div>
        {bienDong.loading && !bienDong.data ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : bienDong.data?.length ? (
          <ol className="so-cai">
            {bienDong.data.slice(0, 3).map((b) => (
              <li key={b.MaBienDong ?? b._id} className="so-cai__hang">
                <span className="so-cai__ngay">{formatNgayNgan(b.NgayTao)}</span>
                <span className="so-cai__noi-dung">{b.MoTa}</span>
                <span className="so-cai__so">{formatDiemCoDau(b.SoDiem)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p>Chưa có biến động điểm.</p>
        )}
      </section>
    </div>
  )
}
