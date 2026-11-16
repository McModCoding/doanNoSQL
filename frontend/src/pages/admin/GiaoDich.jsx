import { CheckOutlined, StopOutlined } from '@ant-design/icons'
import { App, Button, Input, Popconfirm, Segmented, Space, Table, Tooltip } from 'antd'
import { useMemo, useState } from 'react'
import { capNhatTrangThaiGiaoDich, layDsGiaoDich } from '../../api/giaoDich.js'
import { timKhachHang } from '../../api/khachHang.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { StatusTag } from '../../components/StatusTag.jsx'
import { useApi } from '../../hooks/useApi.js'
import { boDauTimKiem } from '../../utils/timKiem.js'
import { formatDiem, formatNgayGio, formatVND } from '../../utils/format.js'
import { NHAN_LOAI_GIAO_DICH, NHAN_PTTT, tomTatChiTiet } from '../../utils/nhan.js'

const BO_LOC_TRANG_THAI = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ thanh toán', value: 'PENDING' },
  { label: 'Thành công', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
  { label: 'Thất bại', value: 'FAILED' },
]

export default function GiaoDichAdmin() {
  const { message, notification } = App.useApp()
  const [trangThai, setTrangThai] = useState('')
  const [tuKhoa, setTuKhoa] = useState('')
  const ds = useApi(() => layDsGiaoDich({ trangThai }), [trangThai])
  const khach = useApi(() => timKhachHang({}), [])

  const tenKhach = useMemo(() => new Map((khach.data ?? []).map((k) => [k.MaKH, k.HoTen])), [khach.data])
  const loc = boDauTimKiem(tuKhoa)
  const duLieu = (ds.data ?? []).filter(
    (g) => !loc || boDauTimKiem(`${g.MaGiaoDich} ${g.MaKH} ${tenKhach.get(g.MaKH) ?? ''}`).includes(loc),
  )

  const capNhat = async (g, moi) => {
    try {
      const kq = await capNhatTrangThaiGiaoDich(g.MaGiaoDich, moi)
      if (moi === 'COMPLETED') {
        notification.success({
          title: `Giao dịch ${g.MaGiaoDich} đã hoàn tất`,
          description: `Đã cộng ${formatDiem(kq.diemCong)} điểm cho ${tenKhach.get(g.MaKH) ?? g.MaKH} (${g.MaKH}). Số dư mới: ${formatDiem(kq.khachHang?.DiemHienTai)} điểm.`,
        })
        if (kq.thangHang) {
          notification.info({
            title: 'Khách hàng được thăng hạng',
            description: `${g.MaKH}: ${kq.thangHang.HangCu} → ${kq.thangHang.HangMoi}`,
          })
        }
      } else {
        message.info(`Đã chuyển ${g.MaGiaoDich} sang ${moi}`)
      }
      ds.reload()
    } catch (e) {
      message.error(e.message)
      ds.reload()
    }
  }

  return (
    <div className="admin-page">
      <div className="filter-row">
        <Segmented value={trangThai} onChange={setTrangThai} options={BO_LOC_TRANG_THAI} />
        <Input.Search
          allowClear
          placeholder="Mã giao dịch, mã KH hoặc tên"
          style={{ width: 280 }}
          onSearch={setTuKhoa}
          onChange={(e) => !e.target.value && setTuKhoa('')}
          aria-label="Tìm giao dịch"
        />
      </div>
      <p className="hint">
        Khi một giao dịch chuyển sang <b>COMPLETED</b>, hệ thống tự động ghi một dòng <code>EARN</code> vào{' '}
        <code>bien_dong_diem</code>, cộng <code>DiemHienTai</code>, <code>TongChiTieu</code> và xét thăng hạng.
      </p>
      {ds.error && !ds.data ? (
        <ErrorState error={ds.error} onRetry={ds.reload} />
      ) : (
        <Table
          rowKey="MaGiaoDich"
          loading={ds.loading}
          dataSource={duLieu}
          pagination={{ pageSize: 12, showTotal: (t) => `${formatDiem(t)} giao dịch` }}
          scroll={{ x: 1150 }}
          columns={[
            { title: 'Mã GD', dataIndex: 'MaGiaoDich', width: 110 },
            { title: 'Thời gian', dataIndex: 'NgayTao', width: 120, render: formatNgayGio },
            {
              title: 'Khách hàng',
              dataIndex: 'MaKH',
              width: 190,
              render: (m) => (
                <span>
                  {tenKhach.get(m) ?? '—'} <small className="muted">{m}</small>
                </span>
              ),
            },
            {
              title: 'Nội dung',
              dataIndex: 'ChiTiet',
              render: (ct, r) => (
                <Tooltip title={ct.map((d) => `${d.SoLuong} × ${d.TenSanPham}`).join(' · ')}>
                  <span className="cell-2line">
                    <span>{tomTatChiTiet(ct)}</span>
                    <small>
                      {NHAN_LOAI_GIAO_DICH[r.LoaiGiaoDich] ?? r.LoaiGiaoDich} · {NHAN_PTTT[r.PhuongThucThanhToan] ?? r.PhuongThucThanhToan}
                    </small>
                  </span>
                </Tooltip>
              ),
            },
            { title: 'Tổng tiền', dataIndex: 'TongTien', align: 'right', width: 110, render: formatVND },
            { title: 'Trạng thái', dataIndex: 'TrangThai', width: 150, render: (t) => <StatusTag trangThai={t} /> },
            {
              title: 'Điểm cộng',
              dataIndex: 'DiemCong',
              align: 'right',
              width: 100,
              render: (d, r) => (r.TrangThai === 'COMPLETED' ? `+${formatDiem(d)}` : '—'),
            },
            {
              title: 'Thao tác',
              key: 'tt',
              width: 100,
              fixed: 'right',
              render: (_, r) =>
                r.TrangThai === 'PENDING' ? (
                  <Space size={4}>
                    <Popconfirm
                      title="Xác nhận thanh toán thành công?"
                      description="Hệ thống sẽ cộng điểm và xét thăng hạng cho khách."
                      okText="Xác nhận"
                      cancelText="Không"
                      onConfirm={() => capNhat(r, 'COMPLETED')}
                    >
                      <Button size="small" type="primary" icon={<CheckOutlined />} aria-label={`Hoàn tất ${r.MaGiaoDich}`} />
                    </Popconfirm>
                    <Popconfirm title="Hủy giao dịch này?" okText="Hủy GD" cancelText="Không" onConfirm={() => capNhat(r, 'CANCELLED')}>
                      <Button size="small" icon={<StopOutlined />} aria-label={`Hủy ${r.MaGiaoDich}`} />
                    </Popconfirm>
                  </Space>
                ) : null,
            },
          ]}
        />
      )}
    </div>
  )
}
