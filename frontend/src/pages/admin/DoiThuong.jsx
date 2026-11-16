import { Input, Segmented, Table, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { layDsDoiThuong } from '../../api/doiThuong.js'
import { timKhachHang } from '../../api/khachHang.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatNgay, formatNgayGio } from '../../utils/format.js'
import { NHAN_LOAI_PHAN_THUONG, nhanTrangThaiDoiThuong } from '../../utils/nhan.js'
import { boDauTimKiem } from '../../utils/timKiem.js'

export default function DoiThuongAdmin() {
  const ds = useApi(() => layDsDoiThuong({}), [])
  const khach = useApi(() => timKhachHang({}), [])
  const [loai, setLoai] = useState('')
  const [tuKhoa, setTuKhoa] = useState('')
  const tenKhach = useMemo(() => new Map((khach.data ?? []).map((k) => [k.MaKH, k.HoTen])), [khach.data])
  const loc = boDauTimKiem(tuKhoa)
  const duLieu = (ds.data ?? []).filter(
    (d) =>
      (!loai || d.LoaiPhanThuong === loai) &&
      (!loc || boDauTimKiem(`${d.MaDoiThuong} ${d.MaKH} ${d.MaVoucher} ${tenKhach.get(d.MaKH) ?? ''}`).includes(loc)),
  )

  return (
    <div className="admin-page">
      <div className="filter-row">
        <Segmented
          value={loai}
          onChange={setLoai}
          options={[{ label: 'Tất cả', value: '' }, ...Object.entries(NHAN_LOAI_PHAN_THUONG).map(([value, label]) => ({ value, label }))]}
        />
        <Input.Search
          allowClear
          placeholder="Mã đổi thưởng, mã KH, mã voucher, tên"
          style={{ width: 300 }}
          onSearch={setTuKhoa}
          onChange={(e) => !e.target.value && setTuKhoa('')}
        />
      </div>
      {ds.error && !ds.data ? (
        <ErrorState error={ds.error} onRetry={ds.reload} />
      ) : (
        <Table
          rowKey="MaDoiThuong"
          loading={ds.loading}
          dataSource={duLieu}
          pagination={{ pageSize: 12, showTotal: (t) => `${formatDiem(t)} lượt đổi` }}
          scroll={{ x: 1100 }}
          columns={[
            { title: 'Mã', dataIndex: 'MaDoiThuong', width: 110 },
            { title: 'Thời gian', dataIndex: 'NgayDoi', width: 120, render: formatNgayGio },
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
              title: 'Phần thưởng',
              dataIndex: 'TenPhanThuong',
              render: (t, r) => (
                <span className="cell-2line">
                  <span>{t}</span>
                  <small>{NHAN_LOAI_PHAN_THUONG[r.LoaiPhanThuong] ?? r.LoaiPhanThuong}</small>
                </span>
              ),
            },
            { title: 'Điểm', dataIndex: 'DiemDaDoi', width: 80, align: 'right', render: formatDiem },
            { title: 'Mã voucher', dataIndex: 'MaVoucher', width: 130, render: (v) => <Typography.Text code>{v}</Typography.Text> },
            { title: 'Hạn dùng', dataIndex: 'HanSuDung', width: 110, render: formatNgay },
            { title: 'Trạng thái', key: 'tt', width: 130, render: (_, r) => nhanTrangThaiDoiThuong(r) },
          ]}
        />
      )}
    </div>
  )
}
