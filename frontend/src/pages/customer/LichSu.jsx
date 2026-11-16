import { ArrowDownOutlined, ArrowUpOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Empty, Modal, QRCode, Skeleton, Tabs, Tag, Timeline, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { layBienDongDiem, layDoiThuongCuaKhach, layGiaoDichCuaKhach, layLichSuHang } from '../../api/khachHang.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { StatusTag } from '../../components/StatusTag.jsx'
import { TierTag } from '../../components/TierTag.jsx'
import { useKhachHang } from '../../context/khachHangContext.js'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatDiemCoDau, formatNgay, formatNgayGio, formatVND } from '../../utils/format.js'
import { nhanTrangThaiDoiThuong, tomTatChiTiet } from '../../utils/nhan.js'

function KhungDuLieu({ api, children, rong }) {
  if (api.error && !api.data) return <ErrorState error={api.error} onRetry={api.reload} compact />
  if (api.loading && !api.data) return <Skeleton active paragraph={{ rows: 5 }} />
  if (!api.data?.length) return <Empty description={rong} />
  return children(api.data)
}

function TabDiem({ maKH }) {
  const api = useApi(() => layBienDongDiem(maKH), [maKH])
  return (
    <KhungDuLieu api={api} rong="Chưa có biến động điểm">
      {(ds) => (
        <ul className="history-list" data-testid="points-history">
          {ds.map((b) => (
            <li key={b.MaBienDong ?? b._id}>
              <span className={`history-list__icon ${b.SoDiem > 0 ? 'is-up' : 'is-down'}`}>
                {b.SoDiem > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              </span>
              <span className="history-list__main">
                {b.MoTa}
                <small>{formatNgayGio(b.NgayTao)}</small>
              </span>
              <span className="history-list__value">
                <b className={b.SoDiem > 0 ? 'points-up' : 'points-down'}>{formatDiemCoDau(b.SoDiem)}</b>
                {b.SoDuSau !== undefined && <small>Số dư {formatDiem(b.SoDuSau)}</small>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </KhungDuLieu>
  )
}

function TabGiaoDich({ maKH }) {
  const navigate = useNavigate()
  const api = useApi(() => layGiaoDichCuaKhach(maKH), [maKH])
  return (
    <KhungDuLieu api={api} rong="Chưa có giao dịch">
      {(ds) => (
        <ul className="history-list">
          {ds.map((g) => (
            <li key={g.MaGiaoDich}>
              <span className="history-list__main">
                <span>
                  <b>{g.MaGiaoDich}</b> <StatusTag trangThai={g.TrangThai} />
                </span>
                {tomTatChiTiet(g.ChiTiet)}
                <small>{formatNgayGio(g.NgayTao)}</small>
                {g.TrangThai === 'PENDING' && (
                  <Button size="small" type="link" onClick={() => navigate(`/app/thanh-toan/${g.MaGiaoDich}`)}>
                    Tiếp tục thanh toán <RightOutlined />
                  </Button>
                )}
              </span>
              <span className="history-list__value">
                <b>{formatVND(g.TongTien)}</b>
                {g.TrangThai === 'COMPLETED' && <small className="points-up">+{formatDiem(g.DiemCong)} điểm</small>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </KhungDuLieu>
  )
}

function TabQua({ maKH }) {
  const api = useApi(() => layDoiThuongCuaKhach(maKH), [maKH])
  const [dangXem, setDangXem] = useState(null)
  return (
    <>
      <KhungDuLieu api={api} rong="Bạn chưa đổi quà nào">
        {(ds) => (
          <ul className="history-list">
            {ds.map((d) => (
              <li key={d.MaDoiThuong} className="is-clickable" onClick={() => setDangXem(d)}>
                <span className="history-list__main">
                  <b>{d.TenPhanThuong}</b>
                  <span>
                    Mã: <Typography.Text code>{d.MaVoucher}</Typography.Text>
                  </span>
                  <small>
                    Đổi ngày {formatNgay(d.NgayDoi)} · HSD {formatNgay(d.HanSuDung)}
                  </small>
                </span>
                <span className="history-list__value">
                  <b>−{formatDiem(d.DiemDaDoi)}</b>
                  <Tag variant="filled">{nhanTrangThaiDoiThuong(d)}</Tag>
                </span>
              </li>
            ))}
          </ul>
        )}
      </KhungDuLieu>
      <Modal open={Boolean(dangXem)} footer={null} centered width={340} onCancel={() => setDangXem(null)} title={dangXem?.TenPhanThuong}>
        {dangXem && (
          <div className="voucher">
            <QRCode value={dangXem.MaVoucher} size={160} bordered={false} />
            <Typography.Text copyable strong className="voucher__code">
              {dangXem.MaVoucher}
            </Typography.Text>
            <small>
              {nhanTrangThaiDoiThuong(dangXem)} · Hạn dùng đến {formatNgay(dangXem.HanSuDung)}
            </small>
          </div>
        )}
      </Modal>
    </>
  )
}

function TabHang({ maKH, dsHang }) {
  const api = useApi(() => layLichSuHang(maKH), [maKH])
  return (
    <KhungDuLieu api={api} rong="Chưa có lịch sử hạng">
      {(ds) => (
        <Timeline
          className="tier-timeline"
          items={ds.map((l) => ({
            key: l._id ?? `${l.NgayThayDoi}-${l.HangMoi}`,
            title: formatNgay(l.NgayThayDoi),
            content: (
              <div>
                <div>
                  {l.HangCu ? (
                    <>
                      <TierTag maHang={l.HangCu} dsHang={dsHang} /> → <TierTag maHang={l.HangMoi} dsHang={dsHang} />
                    </>
                  ) : (
                    <>
                      Bắt đầu ở hạng <TierTag maHang={l.HangMoi} dsHang={dsHang} />
                    </>
                  )}
                </div>
                <small>{l.LyDo}</small>
              </div>
            ),
          }))}
        />
      )}
    </KhungDuLieu>
  )
}

export default function LichSu() {
  const { khachHang, dsHang } = useKhachHang()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'diem'
  const maKH = khachHang.MaKH

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header__title">Lịch sử</h1>
        <span className="points-chip">{formatDiem(khachHang.DiemHienTai)} điểm</span>
      </header>
      <Tabs
        activeKey={tab}
        onChange={(k) => setParams(k === 'diem' ? {} : { tab: k }, { replace: true })}
        items={[
          { key: 'diem', label: 'Điểm', children: <TabDiem maKH={maKH} /> },
          { key: 'giao-dich', label: 'Giao dịch', children: <TabGiaoDich maKH={maKH} /> },
          { key: 'qua', label: 'Quà của tôi', children: <TabQua maKH={maKH} /> },
          { key: 'hang', label: 'Hạng', children: <TabHang maKH={maKH} dsHang={dsHang} /> },
        ]}
      />
    </div>
  )
}
