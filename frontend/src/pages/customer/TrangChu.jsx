import {
  CoffeeOutlined,
  GiftOutlined,
  HistoryOutlined,
  LogoutOutlined,
  NotificationOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Button, Empty, Popconfirm, Skeleton } from 'antd'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { layBienDongDiem } from '../../api/khachHang.js'
import { layKhuyenMai } from '../../api/khuyenMai.js'
import { MembershipCard } from '../../components/MembershipCard.jsx'
import { TierProgress } from '../../components/TierProgress.jsx'
import { useKhachHang } from '../../context/khachHangContext.js'
import { useApi } from '../../hooks/useApi.js'
import { formatDiemCoDau, formatNgayGio } from '../../utils/format.js'

const LOI_TAT = [
  { to: '/app/mua-ve', icon: <VideoCameraOutlined />, nhan: 'Mua vé' },
  { to: '/app/mua-ve?tab=combo', icon: <CoffeeOutlined />, nhan: 'Bắp nước' },
  { to: '/app/doi-thuong', icon: <GiftOutlined />, nhan: 'Đổi quà' },
  { to: '/app/lich-su', icon: <HistoryOutlined />, nhan: 'Lịch sử' },
]

export default function TrangChu() {
  const { khachHang, dsHang, taiLai, dangXuat } = useKhachHang()
  const khuyenMai = useApi(() => layKhuyenMai({ conHieuLuc: true }), [])
  const bienDong = useApi(() => layBienDongDiem(khachHang.MaKH), [khachHang.MaKH, khachHang.DiemHienTai])

  // Luôn lấy số điểm/hạng mới nhất khi mở trang chủ
  useEffect(() => {
    taiLai()
  }, [taiLai])

  const hang = dsHang.find((h) => h.MaHang === khachHang.MaHangHienTai)
  const ten = khachHang.HoTen.split(' ').slice(-2).join(' ')

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="page-header__sub">Xin chào,</span>
          <h1 className="page-header__title">{ten} 👋</h1>
        </div>
        <Popconfirm title="Đăng xuất khỏi ứng dụng?" okText="Đăng xuất" cancelText="Không" onConfirm={dangXuat}>
          <Button shape="circle" icon={<LogoutOutlined />} aria-label="Đăng xuất" />
        </Popconfirm>
      </header>

      <MembershipCard khachHang={khachHang} hang={hang} />

      <section className="card">
        <TierProgress tongChiTieu={khachHang.TongChiTieu} dsHang={dsHang} />
      </section>

      <nav className="quick-actions" aria-label="Lối tắt">
        {LOI_TAT.map((l) => (
          <Link key={l.to} to={l.to} className="quick-action">
            <span className="quick-action__icon">{l.icon}</span>
            {l.nhan}
          </Link>
        ))}
      </nav>

      <section>
        <h2 className="section-title">
          <NotificationOutlined /> Ưu đãi đang diễn ra
        </h2>
        {khuyenMai.loading && !khuyenMai.data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <div className="promo-list">
            {(khuyenMai.data ?? []).map((km) => (
              <article key={km.MaKhuyenMai} className="promo">
                <b>{km.TenKhuyenMai}</b>
                <p>{km.MoTa}</p>
              </article>
            ))}
            {khuyenMai.data?.length === 0 && <Empty description="Chưa có ưu đãi" />}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-row">
          <h2 className="section-title">Biến động điểm gần đây</h2>
          <Link to="/app/lich-su">Xem tất cả</Link>
        </div>
        {bienDong.loading && !bienDong.data ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : (
          <ul className="activity-list">
            {(bienDong.data ?? []).slice(0, 3).map((b) => (
              <li key={b.MaBienDong ?? b._id}>
                <span>
                  {b.MoTa}
                  <small>{formatNgayGio(b.NgayTao)}</small>
                </span>
                <b className={b.SoDiem > 0 ? 'points-up' : 'points-down'}>{formatDiemCoDau(b.SoDiem)}</b>
              </li>
            ))}
            {bienDong.data?.length === 0 && <Empty description="Chưa có biến động điểm" />}
          </ul>
        )}
      </section>
    </div>
  )
}
