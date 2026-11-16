import { Input, Segmented, Table } from 'antd'
import { useMemo, useState } from 'react'
import { layDsDoiThuong } from '../../api/doiThuong.js'
import { timKhachHang } from '../../api/khachHang.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatGio, formatNgay } from '../../utils/format.js'
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
    <div className="qt-trang" style={{ gap: 24 }}>
      <div className="cap">
        <h1>Đổi thưởng</h1>
        <p>
          Mỗi lượt đổi trừ điểm của khách, giảm tồn kho phần thưởng và ghi một dòng REDEEM vào bien_dong_diem.
        </p>
      </div>

      <div className="hang-loc">
        <div className="cuon-ngang">
          <Segmented
            value={loai}
            onChange={setLoai}
            options={[{ label: 'Tất cả', value: '' }, ...Object.entries(NHAN_LOAI_PHAN_THUONG).map(([value, label]) => ({ value, label }))]}
            aria-label="Lọc theo loại phần thưởng"
          />
        </div>
        <Input.Search
          allowClear
          placeholder="Tìm mã, mã KH, voucher, tên"
          style={{ width: 320 }}
          onSearch={setTuKhoa}
          onChange={(e) => !e.target.value && setTuKhoa('')}
          aria-label="Tìm lượt đổi thưởng"
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
          scroll={{ x: 1160 }}
          columns={[
            { title: 'Mã', dataIndex: 'MaDoiThuong', width: 128 },
            {
              title: 'Thời gian',
              dataIndex: 'NgayDoi',
              width: 128,
              render: (t) => (
                <span>
                  {formatGio(t)}
                  <span className="o-chu-phu">{formatNgay(t)}</span>
                </span>
              ),
            },
            {
              title: 'Khách hàng',
              dataIndex: 'MaKH',
              width: 192,
              render: (m) => (
                <span>
                  {tenKhach.get(m) ?? m}
                  <span className="o-chu-phu">{m}</span>
                </span>
              ),
            },
            {
              title: 'Phần thưởng',
              dataIndex: 'TenPhanThuong',
              render: (t, r) => (
                <span>
                  {t}
                  <span className="o-chu-phu">{NHAN_LOAI_PHAN_THUONG[r.LoaiPhanThuong] ?? r.LoaiPhanThuong}</span>
                </span>
              ),
            },
            { title: 'Điểm', dataIndex: 'DiemDaDoi', width: 88, align: 'right', render: formatDiem },
            { title: 'Mã voucher', dataIndex: 'MaVoucher', width: 144, className: 'o-ma' },
            { title: 'Hạn dùng', dataIndex: 'HanSuDung', width: 120, render: formatNgay },
            { title: 'Trạng thái', key: 'tt', width: 160, render: (_, r) => nhanTrangThaiDoiThuong(r) },
          ]}
        />
      )}
    </div>
  )
}
