import { App, Button, Grid, Input, Popconfirm, Segmented, Table } from 'antd'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { capNhatTrangThaiGiaoDich, layDsGiaoDich } from '../../api/giaoDich.js'
import { layDsHang } from '../../api/hangThanhVien.js'
import { timKhachHang } from '../../api/khachHang.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { StatusTag } from '../../components/StatusTag.jsx'
import { SO_TIEN_MOI_DIEM } from '../../config.js'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatGio, formatNgay, formatVND } from '../../utils/format.js'
import { NHAN_LOAI_GIAO_DICH, NHAN_PTTT, tomTatChiTiet } from '../../utils/nhan.js'
import { boDauTimKiem } from '../../utils/timKiem.js'

const BO_LOC_TRANG_THAI = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ thanh toán', value: 'PENDING' },
  { label: 'Thành công', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
  { label: 'Thất bại', value: 'FAILED' },
]

export default function GiaoDichAdmin() {
  const { message } = App.useApp()
  const [params, setParams] = useSearchParams()
  const trangThai = BO_LOC_TRANG_THAI.some((b) => b.value === params.get('trangThai')) ? params.get('trangThai') : ''
  const [tuKhoa, setTuKhoa] = useState('')
  const [dangXuLy, setDangXuLy] = useState(null)
  const manHinh = Grid.useBreakpoint()
  const ds = useApi(() => layDsGiaoDich({ trangThai }), [trangThai])
  const khach = useApi(() => timKhachHang({}), [])
  const dsHang = useApi(layDsHang, [])

  const tenKhach = useMemo(() => new Map((khach.data ?? []).map((k) => [k.MaKH, k.HoTen])), [khach.data])
  const loc = boDauTimKiem(tuKhoa)
  const duLieu = (ds.data ?? []).filter(
    (g) => !loc || boDauTimKiem(`${g.MaGiaoDich} ${g.MaKH} ${tenKhach.get(g.MaKH) ?? ''}`).includes(loc),
  )

  const capNhat = async (g, moi) => {
    setDangXuLy(g.MaGiaoDich)
    try {
      const kq = await capNhatTrangThaiGiaoDich(g.MaGiaoDich, moi)
      if (moi === 'COMPLETED') {
        const hangMoi = (dsHang.data ?? []).find((h) => h.MaHang === kq.thangHang?.HangMoi)?.TenHang
        message.success(
          `Đã xác nhận ${g.MaGiaoDich}: cộng ${formatDiem(kq.diemCong)} điểm cho ${tenKhach.get(g.MaKH) ?? g.MaKH}, số dư mới ${formatDiem(kq.khachHang?.DiemHienTai)} điểm${hangMoi ? `, khách lên hạng ${hangMoi}` : ''}.`,
        )
      } else {
        message.info(`Đã hủy ${g.MaGiaoDich}, không cộng điểm.`)
      }
    } catch (e) {
      message.error(e.message)
    } finally {
      setDangXuLy(null)
      ds.reload()
    }
  }

  return (
    <div className="qt-trang" style={{ gap: 24 }}>
      <h1>Giao dịch</h1>

      <div className="hang-loc">
        <div className="cuon-ngang">
          <Segmented
            value={trangThai}
            onChange={(v) => setParams(v ? { trangThai: v } : {}, { replace: true })}
            options={BO_LOC_TRANG_THAI}
            aria-label="Lọc theo trạng thái"
          />
        </div>
        <Input.Search
          allowClear
          placeholder="Tìm mã GD, mã KH, tên"
          style={{ width: 288 }}
          onSearch={setTuKhoa}
          onChange={(e) => !e.target.value && setTuKhoa('')}
          aria-label="Tìm giao dịch"
        />
      </div>

      {ds.error && !ds.data ? (
        <ErrorState error={ds.error} onRetry={ds.reload} />
      ) : (
        <Table
          rowKey="MaGiaoDich"
          loading={ds.loading}
          dataSource={duLieu}
          pagination={{ pageSize: 12, showTotal: (t) => `${formatDiem(t)} giao dịch` }}
          scroll={{ x: 1180 }}
          columns={[
            { title: 'Mã GD', dataIndex: 'MaGiaoDich', width: 128 },
            {
              title: 'Thời gian',
              dataIndex: 'NgayTao',
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
              title: 'Nội dung',
              dataIndex: 'ChiTiet',
              render: (ct, r) => (
                <span>
                  {tomTatChiTiet(ct)}
                  <span className="o-chu-phu">
                    {NHAN_LOAI_GIAO_DICH[r.LoaiGiaoDich] ?? r.LoaiGiaoDich}, {NHAN_PTTT[r.PhuongThucThanhToan] ?? r.PhuongThucThanhToan}
                  </span>
                </span>
              ),
            },
            { title: 'Tổng tiền', dataIndex: 'TongTien', align: 'right', width: 120, render: formatVND },
            { title: 'Trạng thái', dataIndex: 'TrangThai', width: 160, render: (t) => <StatusTag trangThai={t} /> },
            {
              title: 'Điểm',
              dataIndex: 'DiemCong',
              align: 'right',
              width: 104,
              render: (d, r) => (r.TrangThai === 'COMPLETED' ? `+${formatDiem(d)}` : <span className="chu-phu">0</span>),
            },
            {
              title: 'Thao tác',
              key: 'tt',
              width: 176,
              fixed: manHinh.md ? 'right' : undefined,
              render: (_, r) =>
                r.TrangThai === 'PENDING' ? (
                  <span className="cap-nut">
                    <Popconfirm
                      title={`Xác nhận ${r.MaGiaoDich} đã thanh toán?`}
                      description={`Cộng ${formatDiem(Math.floor(r.TongTien / SO_TIEN_MOI_DIEM))} điểm và xét lên hạng cho khách.`}
                      okText="Xác nhận đã thanh toán"
                      cancelText="Không"
                      onConfirm={() => capNhat(r, 'COMPLETED')}
                    >
                      <Button
                        size="small"
                        type="primary"
                        loading={dangXuLy === r.MaGiaoDich}
                        disabled={Boolean(dangXuLy)}
                        aria-label={`Xác nhận thanh toán ${r.MaGiaoDich}`}
                      >
                        Xác nhận
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title={`Hủy giao dịch ${r.MaGiaoDich}?`}
                      okText="Hủy giao dịch"
                      cancelText="Không"
                      onConfirm={() => capNhat(r, 'CANCELLED')}
                    >
                      <Button size="small" disabled={Boolean(dangXuLy)} aria-label={`Hủy ${r.MaGiaoDich}`}>
                        Hủy
                      </Button>
                    </Popconfirm>
                  </span>
                ) : null,
            },
          ]}
        />
      )}
    </div>
  )
}
