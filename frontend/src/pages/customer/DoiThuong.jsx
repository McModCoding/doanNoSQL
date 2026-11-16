import { GiftOutlined } from '@ant-design/icons'
import { App, Button, Empty, Modal, QRCode, Result, Segmented, Skeleton, Tag, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doiQua } from '../../api/doiThuong.js'
import { layDsPhanThuong } from '../../api/phanThuong.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { useKhachHang } from '../../context/khachHangContext.js'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatNgay } from '../../utils/format.js'
import { NHAN_LOAI_PHAN_THUONG } from '../../utils/nhan.js'

const BO_LOC = [
  { label: 'Tất cả', value: '' },
  { label: 'Vé', value: 'VOUCHER_VE' },
  { label: 'Bắp nước', value: 'VOUCHER_BAP_NUOC' },
  { label: 'Quà tặng', value: 'QUA_HIEN_VAT' },
]

export default function DoiThuong() {
  const { khachHang, taiLai } = useKhachHang()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [loai, setLoai] = useState('')
  const ds = useApi(() => layDsPhanThuong({ trangThai: 'ACTIVE' }), [])
  const [dangChon, setDangChon] = useState(null)
  const [dangDoi, setDangDoi] = useState(false)
  const [vuaDoi, setVuaDoi] = useState(null)

  const danhSach = (ds.data ?? []).filter((p) => !loai || p.LoaiPhanThuong === loai)

  const xacNhanDoi = async () => {
    setDangDoi(true)
    try {
      const kq = await doiQua({ MaKH: khachHang.MaKH, MaPhanThuong: dangChon.MaPhanThuong })
      setDangChon(null)
      setVuaDoi(kq.doiThuong)
      taiLai()
      ds.reload()
    } catch (e) {
      message.error(e.message)
    } finally {
      setDangDoi(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header__title">Đổi quà</h1>
        <span className="points-chip" data-testid="reward-points">
          <GiftOutlined /> {formatDiem(khachHang.DiemHienTai)} điểm
        </span>
      </header>

      <Segmented block value={loai} onChange={setLoai} options={BO_LOC} />

      {ds.error && !ds.data ? (
        <ErrorState error={ds.error} onRetry={ds.reload} />
      ) : ds.loading && !ds.data ? (
        <Skeleton active />
      ) : danhSach.length === 0 ? (
        <Empty description="Chưa có phần thưởng" />
      ) : (
        <div className="reward-grid">
          {danhSach.map((p) => {
            const hetHang = p.SoLuongTon <= 0
            const thieu = p.DiemCanDoi - khachHang.DiemHienTai
            return (
              <article key={p.MaPhanThuong} className={`reward${hetHang ? ' is-out' : ''}`} data-testid={`reward-${p.MaPhanThuong}`}>
                <div className="reward__img" aria-hidden>
                  {p.HinhAnh}
                </div>
                <div className="reward__body">
                  <Tag variant="filled">{NHAN_LOAI_PHAN_THUONG[p.LoaiPhanThuong]}</Tag>
                  <h3>{p.TenPhanThuong}</h3>
                  <div className="reward__foot">
                    <b>{formatDiem(p.DiemCanDoi)} điểm</b>
                    <small>{hetHang ? 'Hết quà' : `Còn ${p.SoLuongTon}`}</small>
                  </div>
                  <Button type="primary" block size="small" disabled={hetHang || thieu > 0} onClick={() => setDangChon(p)}>
                    {hetHang ? 'Hết quà' : thieu > 0 ? `Thiếu ${formatDiem(thieu)} điểm` : 'Đổi ngay'}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={Boolean(dangChon)}
        title="Xác nhận đổi quà"
        okText="Đổi quà"
        cancelText="Để sau"
        confirmLoading={dangDoi}
        onOk={xacNhanDoi}
        onCancel={() => !dangDoi && setDangChon(null)}
        centered
        width={360}
      >
        {dangChon && (
          <div className="confirm-reward">
            <div className="confirm-reward__img">{dangChon.HinhAnh}</div>
            <b>{dangChon.TenPhanThuong}</b>
            <p>{dangChon.MoTa}</p>
            <dl>
              <div>
                <dt>Điểm hiện có</dt>
                <dd>{formatDiem(khachHang.DiemHienTai)}</dd>
              </div>
              <div>
                <dt>Điểm dùng để đổi</dt>
                <dd>−{formatDiem(dangChon.DiemCanDoi)}</dd>
              </div>
              <div>
                <dt>Còn lại sau khi đổi</dt>
                <dd>
                  <b>{formatDiem(khachHang.DiemHienTai - dangChon.DiemCanDoi)}</b>
                </dd>
              </div>
            </dl>
            <small>Đổi quà không làm giảm hạng thành viên (hạng xét theo tổng chi tiêu).</small>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(vuaDoi)} footer={null} centered width={360} onCancel={() => setVuaDoi(null)}>
        {vuaDoi && (
          <Result
            status="success"
            title="Đổi quà thành công!"
            subTitle={vuaDoi.TenPhanThuong}
            extra={
              <div className="voucher" data-testid="voucher">
                <QRCode value={vuaDoi.MaVoucher} size={140} bordered={false} />
                <Typography.Text copyable strong className="voucher__code">
                  {vuaDoi.MaVoucher}
                </Typography.Text>
                <small>
                  {vuaDoi.LoaiPhanThuong === 'QUA_HIEN_VAT'
                    ? 'Mang mã này đến quầy vé để nhận quà'
                    : 'Đưa mã này cho nhân viên khi thanh toán'}{' '}
                  · Hạn dùng đến {formatNgay(vuaDoi.HanSuDung)}
                </small>
                <Button block onClick={() => navigate('/app/lich-su?tab=qua')}>
                  Xem quà của tôi
                </Button>
              </div>
            }
          />
        )}
      </Modal>
    </div>
  )
}
