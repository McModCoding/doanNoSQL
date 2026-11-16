import { TableOutlined, BarChartOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Segmented, Select, Skeleton, Table } from 'antd'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { layDsHang } from '../../api/hangThanhVien.js'
import { layDiemPhatHanhTheoThang, layKhachHangTheoHang, layTongQuan, layTopDoiQua } from '../../api/thongKe.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { TierTag } from '../../components/TierTag.jsx'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatVND } from '../../utils/format.js'

// Màu biểu đồ (đã kiểm tra bằng bộ validate bảng màu: độ tương phản, mù màu)
const MAU = {
  series: '#2a78d6', // 1 chuỗi số liệu -> 1 màu
  hangOrdinal: ['#86b6ef', '#2a78d6', '#104281'], // hạng có thứ tự: nhạt -> đậm
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  ink: '#0b0b0b',
  ink2: '#52514e',
}

/** Số gọn cho ô thống kê: 14.132.000 -> "14,1 triệu" */
function soGon(n) {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`
  return v.toLocaleString('vi-VN')
}

/** Trục: 0 / 5K / 10K / 20K */
const tickGon = (v) => (v >= 1000 ? `${(v / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}K` : String(v))

/** Mốc trục tròn (bước 1/2/2,5/5 × 10^n), khoảng 4 vạch: 0 / 10K / 20K / 30K */
function mocTruc(max) {
  if (!(max > 0)) return { dinh: 1, moc: [0, 1] }
  const tho = max / 4
  const p = 10 ** Math.floor(Math.log10(tho))
  const buoc = [1, 2, 2.5, 5, 10].map((m) => m * p).find((b) => b >= tho)
  const dinh = Math.ceil(max / buoc) * buoc
  return { dinh, moc: Array.from({ length: Math.round(dinh / buoc) + 1 }, (_, i) => i * buoc) }
}

function StatTile({ nhan, giaTri, phu, title }) {
  return (
    <div className="stat-tile" title={title}>
      <span className="stat-tile__label">{nhan}</span>
      <span className="stat-tile__value">{giaTri}</span>
      {phu && <span className="stat-tile__sub">{phu}</span>}
    </div>
  )
}

/** Thanh phân đoạn cao: 1 tổng (tất cả khách hàng) chia theo hạng. */
function PhanBoHang({ data }) {
  const tong = data.reduce((s, d) => s + d.soKhachHang, 0)
  if (!tong) return <Empty description="Chưa có khách hàng" />
  return (
    <div>
      <div className="seg-bar" role="img" aria-label={data.map((d) => `${d.TenHang}: ${d.soKhachHang} khách`).join(', ')}>
        {data.map((d, i) => {
          if (!d.soKhachHang) return null
          const ty = (d.soKhachHang / tong) * 100
          const mau = MAU.hangOrdinal[i] ?? MAU.series
          return (
            <div
              key={d.MaHang}
              className="seg-bar__part"
              style={{ flexGrow: d.soKhachHang, background: mau, color: i === 0 ? MAU.ink : '#fff' }}
              title={`${d.TenHang}: ${d.soKhachHang} khách (${ty.toFixed(0)}%)`}
            >
              {ty >= 12 ? `${ty.toFixed(0)}%` : ''}
            </div>
          )
        })}
      </div>
      <ul className="seg-legend">
        {data.map((d, i) => (
          <li key={d.MaHang}>
            <span className="seg-legend__swatch" style={{ background: MAU.hangOrdinal[i] ?? MAU.series }} />
            {d.TenHang}
            <b>{d.soKhachHang} khách</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TooltipThang({ active, payload, nam }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip__key" style={{ background: MAU.series }} />
      <div>
        <b>{formatDiem(d.tongDiem)} điểm</b>
        <small>
          Tháng {d.thang}/{nam} · {formatDiem(d.soGiaoDich)} giao dịch
        </small>
      </div>
    </div>
  )
}

function BieuDoDiemTheoThang({ data, nam }) {
  const [kieu, setKieu] = useState('chart')
  const max = Math.max(...data.map((d) => d.tongDiem))
  const tong = data.reduce((s, d) => s + d.tongDiem, 0)
  const truc = mocTruc(max)
  // Chỉ ghi số trên cột cao nhất (nhãn chọn lọc); các tháng khác xem bằng tooltip hoặc dạng bảng
  const nhanDinh = ({ x, y, width, value }) =>
    value === max && value > 0 ? (
      <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={12} fill={MAU.ink2}>
        {formatDiem(value)}
      </text>
    ) : null

  return (
    <Card
      title={`Điểm thưởng phát hành theo tháng – năm ${nam}`}
      extra={
        <Segmented
          size="small"
          value={kieu}
          onChange={setKieu}
          options={[
            { value: 'chart', icon: <BarChartOutlined />, title: 'Biểu đồ' },
            { value: 'table', icon: <TableOutlined />, title: 'Bảng số liệu' },
          ]}
        />
      }
    >
      <p className="card-sub">
        Tổng cả năm: <b>{formatDiem(tong)} điểm</b> (tổng các biến động EARN trong bien_dong_diem)
      </p>
      {kieu === 'chart' ? (
        <div className="chart-box" data-testid="chart-monthly">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={MAU.grid} />
              <XAxis
                dataKey="thang"
                tickFormatter={(t) => `T${t}`}
                tickLine={false}
                axisLine={{ stroke: MAU.axis }}
                tick={{ fill: MAU.muted, fontSize: 12 }}
              />
              <YAxis
                domain={[0, truc.dinh]}
                ticks={truc.moc}
                tickFormatter={tickGon}
                tickLine={false}
                axisLine={false}
                tick={{ fill: MAU.muted, fontSize: 12 }}
                width={44}
              />
              <Tooltip cursor={{ fill: 'rgba(11,11,11,0.04)' }} content={<TooltipThang nam={nam} />} />
              <Bar
                dataKey="tongDiem"
                name="Điểm phát hành"
                fill={MAU.series}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                activeBar={{ fill: '#3987e5' }}
                isAnimationActive={false}
              >
                <LabelList dataKey="tongDiem" content={nhanDinh} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Table
          size="small"
          rowKey="thang"
          pagination={false}
          dataSource={data}
          columns={[
            { title: 'Tháng', dataIndex: 'thang', render: (t) => `Tháng ${t}/${nam}` },
            { title: 'Điểm phát hành', dataIndex: 'tongDiem', align: 'right', render: formatDiem },
            { title: 'Số giao dịch', dataIndex: 'soGiaoDich', align: 'right', render: formatDiem },
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <b>Tổng</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <b>{formatDiem(tong)}</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <b>{formatDiem(data.reduce((s, d) => s + d.soGiaoDich, 0))}</b>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      )}
    </Card>
  )
}

/** Danh sách xếp hạng: tên + thanh + số liệu trên mỗi dòng (vừa là biểu đồ vừa là bảng). */
function TopDoiQua({ data, dsHang }) {
  if (!data.length) return <Empty description="Chưa có lượt đổi quà trong năm này" />
  const max = Math.max(...data.map((d) => d.soLuotDoi))
  return (
    <ol className="rank-list" data-testid="top-redeemers">
      {data.map((d, i) => (
        <li key={d.MaKH} title={`${d.HoTen}: ${d.soLuotDoi} lượt đổi, ${formatDiem(d.tongDiemDaDoi)} điểm`}>
          <span className="rank-list__no">{i + 1}</span>
          <span className="rank-list__name">
            {d.HoTen}
            <small>
              {d.MaKH} · <TierTag maHang={d.MaHangHienTai} dsHang={dsHang} />
            </small>
          </span>
          <span className="rank-list__bar">
            <span style={{ width: `${(d.soLuotDoi / max) * 100}%`, background: MAU.series }} />
          </span>
          <span className="rank-list__value">
            <b>{d.soLuotDoi} lượt</b>
            <small>{formatDiem(d.tongDiemDaDoi)} điểm</small>
          </span>
        </li>
      ))}
    </ol>
  )
}

export default function Dashboard() {
  const [namHienTai] = useState(() => new Date().getFullYear())
  const [nam, setNam] = useState(namHienTai)
  const tongQuan = useApi(layTongQuan, [])
  const theoHang = useApi(layKhachHangTheoHang, [])
  const dsHang = useApi(layDsHang, [])
  const theoThang = useApi(() => layDiemPhatHanhTheoThang(nam), [nam])
  const top = useApi(() => layTopDoiQua({ limit: 10, nam }), [nam])
  const dsNam = useMemo(() => [namHienTai, namHienTai - 1, namHienTai - 2], [namHienTai])
  const tq = tongQuan.data

  return (
    <div className="dashboard">
      <section>
        <h2 className="admin-section-title">Hiện tại</h2>
        {tongQuan.error ? (
          <ErrorState error={tongQuan.error} onRetry={tongQuan.reload} />
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
              <div className="stat-row" data-testid="kpi-row">
                {!tq ? (
                  <Skeleton active />
                ) : (
                  <>
                    <StatTile nhan="Khách hàng đang hoạt động" giaTri={formatDiem(tq.khachHangActive)} phu={`trên tổng ${formatDiem(tq.tongKhachHang)} khách`} />
                    <StatTile nhan="Điểm phát hành tháng này" giaTri={formatDiem(tq.diemPhatHanhThangNay)} phu={`${formatDiem(tq.diemDaDoiThangNay)} điểm đã được đổi`} />
                    <StatTile nhan="Lượt đổi quà tháng này" giaTri={formatDiem(tq.luotDoiThangNay)} phu={`${formatDiem(tq.giaoDichChoXuLy)} giao dịch đang chờ thanh toán`} />
                    <StatTile nhan="Doanh thu tháng này" giaTri={`${soGon(tq.doanhThuThangNay)} đ`} phu="giao dịch COMPLETED" title={formatVND(tq.doanhThuThangNay)} />
                  </>
                )}
              </div>
            </Col>
            <Col xs={24} xl={10}>
              <Card title="Khách hàng theo hạng" className="card-fill">
                {theoHang.data ? <PhanBoHang data={theoHang.data} /> : <Skeleton active />}
              </Card>
            </Col>
          </Row>
        )}
      </section>

      <div className="filter-row">
        <span>Năm thống kê</span>
        <Select
          value={nam}
          onChange={setNam}
          style={{ width: 120 }}
          options={dsNam.map((n) => ({ value: n, label: `Năm ${n}` }))}
          aria-label="Chọn năm thống kê"
        />
        <small>Áp dụng cho các biểu đồ bên dưới</small>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          {theoThang.error ? (
            <ErrorState error={theoThang.error} onRetry={theoThang.reload} />
          ) : theoThang.data ? (
            <div style={{ opacity: theoThang.loading ? 0.5 : 1, transition: 'opacity .2s' }}>
              <BieuDoDiemTheoThang data={theoThang.data} nam={nam} />
            </div>
          ) : (
            <Card>
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          )}
        </Col>
        <Col xs={24} xl={10}>
          <Card title={`Top 10 khách hàng đổi quà nhiều nhất – năm ${nam}`}>
            {top.error ? (
              <ErrorState error={top.error} onRetry={top.reload} compact />
            ) : top.data ? (
              <div style={{ opacity: top.loading ? 0.5 : 1, transition: 'opacity .2s' }}>
                <TopDoiQua data={top.data} dsHang={dsHang.data ?? []} />
              </div>
            ) : (
              <Skeleton active paragraph={{ rows: 8 }} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
