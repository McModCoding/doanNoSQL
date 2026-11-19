import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { App, Button, Modal, Popconfirm, QRCode, Spin, Statistic } from 'antd'
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { capNhatTrangThaiGiaoDich, layGiaoDich } from '../../api/giaoDich.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { TierTag } from '../../components/TierTag.jsx'
import { APP_NAME, SO_TIEN_MOI_DIEM } from '../../config.js'
import { useKhachHang } from '../../context/khachHangContext.js'
import { MAU } from '../../design/tokens.js'
import { useApi } from '../../hooks/useApi.js'
import { PhoneFrame } from '../../layouts/PhoneFrame.jsx'
import { formatDiem, formatVND } from '../../utils/format.js'

const THOI_HAN_THANH_TOAN_MS = 15 * 60 * 1000 // 15 phút

function KetQuaThanhCong({ gd, ketQua }) {
  const navigate = useNavigate()
  const { khachHang, dsHang } = useKhachHang()
  const [moThangHang, setMoThangHang] = useState(Boolean(ketQua?.thangHang))
  const kh = ketQua?.khachHang ?? khachHang
  const diemCong = ketQua?.diemCong ?? gd.DiemCong
  const hangMoi = dsHang.find((h) => h.MaHang === ketQua?.thangHang?.HangMoi)
  const hangCu = dsHang.find((h) => h.MaHang === ketQua?.thangHang?.HangCu)

  return (
    <main className="khung__noi-dung trang ket-qua ket-qua--hai-cot">
      <div className="ket-qua__chinh">
        <span className="trang-thai-lon">
          <CheckCircleOutlined /> Đã thanh toán
        </span>
        <div className="cap" style={{ alignItems: 'center' }} data-testid="earn-box">
          <span className="so-lon" data-testid="earn-points">
            +{formatDiem(diemCong)} điểm
          </span>
          <p>
            Giao dịch {gd.MaGiaoDich}, {formatVND(gd.TongTien)}
          </p>
        </div>
      </div>
      <div className="ket-qua__phu nhom">
        <dl className="bang-so">
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
        <div className="cot-nut">
          <Button type="primary" block onClick={() => navigate('/app')}>
            Về trang chủ
          </Button>
          <Button block onClick={() => navigate('/app/lich-su')}>
            Xem lịch sử điểm
          </Button>
        </div>
      </div>

      <Modal open={moThangHang} footer={null} centered onCancel={() => setMoThangHang(false)} width={380}>
        <div className="nhom" data-testid="tier-up-modal">
          <TierTag maHang={ketQua?.thangHang?.HangMoi} dsHang={dsHang} />
          <h2>Bạn vừa lên hạng {hangMoi?.TenHang}</h2>
          <p>
            Tổng chi tiêu của bạn đã đạt {formatVND(hangMoi?.NguongChiTieu)}, nên thẻ chuyển từ hạng {hangCu?.TenHang}{' '}
            sang hạng {hangMoi?.TenHang}.
          </p>
          {hangMoi?.QuyenLoi?.length > 0 && (
            <ul className="cap" style={{ margin: 0, paddingLeft: 24 }}>
              {hangMoi.QuyenLoi.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          )}
          <Button type="primary" block onClick={() => setMoThangHang(false)}>
            Xem thẻ hạng {hangMoi?.TenHang}
          </Button>
        </div>
      </Modal>
    </main>
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
      taiLai() // lấy lại điểm và hạng mới nhất từ server
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
      <div className="khung__noi-dung">
        <ErrorState error={gdApi.error} onRetry={gdApi.reload} />
      </div>
    )
  } else if (!gd || !khachHang) {
    noiDung = (
      <div className="khung__noi-dung khung__noi-dung--giua">
        <Spin size="large" />
      </div>
    )
  } else if (gd.TrangThai === 'COMPLETED') {
    noiDung = <KetQuaThanhCong gd={gd} ketQua={ketQua} />
  } else if (gd.TrangThai !== 'PENDING' || hetHan) {
    noiDung = (
      <main className="khung__noi-dung trang ket-qua">
        <span className="trang-thai-lon trang-thai-lon--loi">
          <CloseCircleOutlined />
          {hetHan || gd.TrangThai === 'FAILED' ? 'Giao dịch đã hết hạn thanh toán' : 'Giao dịch đã bị hủy'}
        </span>
        <p>
          Giao dịch {gd.MaGiaoDich} ({formatVND(gd.TongTien)}) không được cộng điểm. Bạn có thể đặt lại vé và thanh
          toán trong 15 phút.
        </p>
        <div className="cot-nut">
          <Button type="primary" block onClick={() => navigate('/app/mua-ve')}>
            Đặt vé lại
          </Button>
        </div>
      </main>
    )
  } else {
    const hanThanhToan = new Date(gd.NgayTao).getTime() + THOI_HAN_THANH_TOAN_MS
    noiDung = (
      <main className="khung__noi-dung trang" style={{ gap: 24 }}>
        <button type="button" className="nut-link" onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>
          <ArrowLeftOutlined /> Quay lại
        </button>
        <div className="cap">
          <h1>Thanh toán qua MoMo</h1>
          <small>Màn hình mô phỏng ví MoMo cho đồ án, không phát sinh giao dịch thật.</small>
        </div>

        {/* Tờ hóa đơn như một tấm vé: thân vé (các dòng tiền) và cuống (QR, đồng hồ) ngăn bằng đường răng cưa.
            Điện thoại: cuống nằm dưới thân vé. Màn lớn: cuống nằm bên phải, nút đặt dưới cuống. */}
        <div className="thanh-toan">
          <section className="hoa-don" aria-label="Hóa đơn">
            <div className="hoa-don__dong">
              <span className="chu-phu">{APP_NAME}, đơn hàng</span>
              <b>{gd.MaGiaoDich}</b>
            </div>
            <span className="so-lon" data-testid="momo-amount">
              {formatVND(gd.TongTien)}
            </span>
            <div className="duong-rang-cua" />
            {gd.ChiTiet.map((d, i) => (
              <div className="hoa-don__dong" key={`${d.MaSanPham}-${i}`}>
                <span>
                  {d.SoLuong} × {d.TenSanPham}
                </span>
                <b>{formatVND(d.ThanhTien ?? d.SoLuong * d.DonGia)}</b>
              </div>
            ))}
            <div className="hoa-don__dong">
              <span>Điểm sẽ nhận</span>
              <b>+{formatDiem(Math.floor(gd.TongTien / SO_TIEN_MOI_DIEM))}</b>
            </div>
            <div className="hoa-don__dong">
              <span>Thành viên</span>
              <b>
                {khachHang.HoTen} ({khachHang.MaKH})
              </b>
            </div>
          </section>

          <div className="hoa-don__cuong">
            <div aria-hidden="true">
              <QRCode type="svg" value={`MOMO-SIM|${gd.MaGiaoDich}|${gd.TongTien}`} size={112} bordered={false} color={MAU.chu} bgColor={MAU.nen} />
            </div>
            <div className="cap">
              <small>Quét bằng ứng dụng MoMo (mô phỏng) hoặc bấm xác nhận bên dưới.</small>
              <div className="dong-ho cap">
                <small>Hết hạn sau</small>
                <Statistic.Timer type="countdown" value={hanThanhToan} format="mm:ss" onFinish={khiHetHan} />
              </div>
            </div>
          </div>

          <div className="cot-nut thanh-toan__nut">
            <Button type="primary" block loading={dangXuLy === 'COMPLETED'} disabled={Boolean(dangXuLy)} onClick={() => capNhat('COMPLETED')}>
              Xác nhận thanh toán {formatVND(gd.TongTien)}
            </Button>
            <Popconfirm title="Hủy giao dịch này?" okText="Hủy giao dịch" cancelText="Không" onConfirm={() => capNhat('CANCELLED')}>
              <Button block disabled={Boolean(dangXuLy)}>
                Hủy giao dịch
              </Button>
            </Popconfirm>
          </div>
        </div>
      </main>
    )
  }

  return <PhoneFrame>{noiDung}</PhoneFrame>
}
