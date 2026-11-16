import { ArrowLeftOutlined, SafetyCertificateOutlined, WalletOutlined } from '@ant-design/icons'
import { App, Button, ConfigProvider, Modal, Popconfirm, QRCode, Result, Spin, Statistic } from 'antd'
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { capNhatTrangThaiGiaoDich, layGiaoDich } from '../../api/giaoDich.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { TierTag } from '../../components/TierTag.jsx'
import { APP_NAME, MAU_MOMO, SO_TIEN_MOI_DIEM } from '../../config.js'
import { useKhachHang } from '../../context/khachHangContext.js'
import { useApi } from '../../hooks/useApi.js'
import { PhoneFrame } from '../../layouts/PhoneFrame.jsx'
import { formatDiem, formatVND } from '../../utils/format.js'

const THOI_HAN_THANH_TOAN_MS = 15 * 60 * 1000 // 15 phút

function KetQuaThanhCong({ gd, ketQua }) {
  const navigate = useNavigate()
  const { khachHang, dsHang } = useKhachHang()
  const [moChucMung, setMoChucMung] = useState(Boolean(ketQua?.thangHang))
  const kh = ketQua?.khachHang ?? khachHang
  const diemCong = ketQua?.diemCong ?? gd.DiemCong
  const hangMoi = dsHang.find((h) => h.MaHang === ketQua?.thangHang?.HangMoi)

  return (
    <div className="phone-content">
      <Result
        status="success"
        title="Thanh toán thành công"
        subTitle={`Mã giao dịch ${gd.MaGiaoDich} · ${formatVND(gd.TongTien)}`}
      />
      <div className="earn-box" data-testid="earn-box">
        <span>Điểm thưởng nhận được</span>
        <strong data-testid="earn-points">+{formatDiem(diemCong)} điểm</strong>
        <dl>
          <div>
            <dt>Số dư điểm</dt>
            <dd data-testid="earn-balance">{formatDiem(kh?.DiemHienTai)} điểm</dd>
          </div>
          <div>
            <dt>Tổng chi tiêu</dt>
            <dd>{formatVND(kh?.TongChiTieu)}</dd>
          </div>
          <div>
            <dt>Hạng hiện tại</dt>
            <dd>
              <TierTag maHang={kh?.MaHangHienTai} dsHang={dsHang} />
            </dd>
          </div>
        </dl>
      </div>
      <div className="stack">
        <Button type="primary" size="large" block onClick={() => navigate('/app')}>
          Về trang chủ
        </Button>
        <Button block onClick={() => navigate('/app/lich-su')}>
          Xem lịch sử điểm
        </Button>
      </div>

      <Modal open={moChucMung} footer={null} centered onCancel={() => setMoChucMung(false)} width={360}>
        <div className="celebrate" data-testid="tier-up-modal">
          <div className="celebrate__icon" aria-hidden>
            🎉
          </div>
          <h2>Chúc mừng thăng hạng!</h2>
          <p>
            Bạn vừa được nâng từ <TierTag maHang={ketQua?.thangHang?.HangCu} dsHang={dsHang} /> lên{' '}
            <TierTag maHang={ketQua?.thangHang?.HangMoi} dsHang={dsHang} />
          </p>
          {hangMoi?.QuyenLoi?.length > 0 && (
            <ul>
              {hangMoi.QuyenLoi.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          )}
          <Button type="primary" block size="large" onClick={() => setMoChucMung(false)}>
            Tuyệt vời!
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default function ThanhToanMoMo() {
  const { maGD } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { khachHang, taiLai } = useKhachHang()
  const gdApi = useApi(() => layGiaoDich(maGD), [maGD])
  const [ketQua, setKetQua] = useState(null)
  const [dangXuLy, setDangXuLy] = useState(null)
  const [hetHan, setHetHan] = useState(false)
  const daBaoHetHan = useRef(false)

  const gd = ketQua?.giaoDich ?? gdApi.data

  const capNhat = async (trangThai) => {
    setDangXuLy(trangThai)
    try {
      const kq = await capNhatTrangThaiGiaoDich(maGD, trangThai)
      setKetQua(kq)
      taiLai() // lấy lại điểm/hạng mới nhất từ server
      if (trangThai === 'CANCELLED') {
        message.info('Đã hủy giao dịch')
        navigate('/app/mua-ve')
      }
    } catch (e) {
      message.error(e.message)
      gdApi.reload()
    } finally {
      setDangXuLy(null)
    }
  }

  const khiHetHan = () => {
    setHetHan(true)
    if (!daBaoHetHan.current) {
      daBaoHetHan.current = true
      capNhatTrangThaiGiaoDich(maGD, 'FAILED').catch(() => {})
    }
  }

  let noiDung
  if (!gd && gdApi.error) {
    noiDung = (
      <div className="phone-content">
        <ErrorState error={gdApi.error} onRetry={gdApi.reload} />
      </div>
    )
  } else if (!gd || !khachHang) {
    noiDung = (
      <div className="phone-content phone-content--center">
        <Spin size="large" />
      </div>
    )
  } else if (gd.TrangThai === 'COMPLETED') {
    noiDung = <KetQuaThanhCong gd={gd} ketQua={ketQua} />
  } else if (gd.TrangThai !== 'PENDING' || hetHan) {
    noiDung = (
      <div className="phone-content">
        <Result
          status="warning"
          title={hetHan || gd.TrangThai === 'FAILED' ? 'Giao dịch đã hết hạn thanh toán' : 'Giao dịch đã bị hủy'}
          subTitle={`Mã giao dịch ${gd.MaGiaoDich} – không có điểm nào được cộng.`}
          extra={
            <Button type="primary" onClick={() => navigate('/app/mua-ve')}>
              Đặt lại
            </Button>
          }
        />
      </div>
    )
  } else {
    const hanThanhToan = new Date(gd.NgayTao).getTime() + THOI_HAN_THANH_TOAN_MS
    noiDung = (
      <>
        <header className="momo-header">
          <button type="button" className="momo-header__back" onClick={() => navigate(-1)} aria-label="Quay lại">
            <ArrowLeftOutlined />
          </button>
          <div className="momo-header__title">
            <WalletOutlined /> Thanh toán qua Ví MoMo
          </div>
          <span className="momo-header__badge">MÔ PHỎNG</span>
        </header>
        <div className="momo-body">
          <section className="momo-card">
            <div className="momo-card__merchant">{APP_NAME} · Rạp chiếu phim</div>
            <div className="momo-card__amount" data-testid="momo-amount">
              {formatVND(gd.TongTien)}
            </div>
            <dl className="momo-card__info">
              <div>
                <dt>Mã đơn hàng</dt>
                <dd>{gd.MaGiaoDich}</dd>
              </div>
              <div>
                <dt>Nội dung</dt>
                <dd>Thanh toán {gd.LoaiGiaoDich === 'COMBO_BAP_NUOC' ? 'bắp nước' : 'vé xem phim'}</dd>
              </div>
              <div>
                <dt>Thành viên</dt>
                <dd>
                  {khachHang.HoTen} ({khachHang.MaKH})
                </dd>
              </div>
              <div>
                <dt>Điểm dự kiến</dt>
                <dd>+{formatDiem(Math.floor(gd.TongTien / SO_TIEN_MOI_DIEM))} điểm</dd>
              </div>
            </dl>
          </section>

          <section className="momo-card momo-card--qr">
            <QRCode value={`MOMO-SIM|${gd.MaGiaoDich}|${gd.TongTien}`} color={MAU_MOMO} size={168} bordered={false} />
            <p>Quét mã bằng ứng dụng MoMo (mô phỏng) hoặc bấm xác nhận bên dưới</p>
            <div className="momo-timer">
              Giao dịch hết hạn sau{' '}
              <Statistic.Timer type="countdown" value={hanThanhToan} format="mm:ss" onFinish={khiHetHan} />
            </div>
          </section>

          <section className="momo-card">
            <h3>Chi tiết đơn hàng</h3>
            <ul className="cart cart--plain">
              {gd.ChiTiet.map((d, i) => (
                <li key={`${d.MaSanPham}-${i}`}>
                  <span>
                    {d.TenSanPham}
                    <small>
                      {d.SoLuong} × {formatVND(d.DonGia)}
                    </small>
                  </span>
                  <b>{formatVND(d.ThanhTien ?? d.SoLuong * d.DonGia)}</b>
                </li>
              ))}
            </ul>
          </section>

          <Button
            block
            type="primary"
            size="large"
            loading={dangXuLy === 'COMPLETED'}
            disabled={Boolean(dangXuLy)}
            onClick={() => capNhat('COMPLETED')}
          >
            Xác nhận thanh toán {formatVND(gd.TongTien)}
          </Button>
          <Popconfirm title="Hủy giao dịch này?" okText="Hủy giao dịch" cancelText="Không" onConfirm={() => capNhat('CANCELLED')}>
            <Button block type="text" disabled={Boolean(dangXuLy)}>
              Hủy giao dịch
            </Button>
          </Popconfirm>
          <p className="momo-note">
            <SafetyCertificateOutlined /> Màn hình mô phỏng ví điện tử cho đồ án – không phát sinh giao dịch thật.
          </p>
        </div>
      </>
    )
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: MAU_MOMO } }}>
      <PhoneFrame className="phone--momo">{noiDung}</PhoneFrame>
    </ConfigProvider>
  )
}
