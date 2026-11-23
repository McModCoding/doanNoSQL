import { App, Button, Popconfirm, Segmented, Select, Skeleton, Table } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { capNhatTrangThaiGiaoDich, layDsGiaoDich } from '../../api/giaoDich.js'
import { layDsHang } from '../../api/hangThanhVien.js'
import { timKhachHang } from '../../api/khachHang.js'
import { layDiemPhatHanhTheoThang, layKhachHangTheoHang, layTongQuan, layTopDoiQua } from '../../api/thongKe.js'
import { ErrorState } from '../../components/ErrorState.jsx'
import { TierTag } from '../../components/TierTag.jsx'
import { SO_TIEN_MOI_DIEM } from '../../config.js'
import { MAU, MAU_HANG } from '../../design/tokens.js'
import { useApi } from '../../hooks/useApi.js'
import { formatDiem, formatNgayGio, formatVND } from '../../utils/format.js'
import { tomTatChiTiet } from '../../utils/nhan.js'

/** Số gọn cho câu tóm tắt: 14.132.000 -> "14,1 triệu" */
function soGon(n) {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`
  return v.toLocaleString('vi-VN')
}

/** Trục: 0, 5K, 10K, 20K */
const tickGon = (v) => (v >= 1000 ? `${(v / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}K` : String(v))

/** Mốc trục tròn (bước 1, 2, 2,5, 5 nhân 10^n), khoảng 4 vạch */
function mocTruc(max) {
  if (!(max > 0)) return { dinh: 1, moc: [0, 1] }
  const tho = max / 4
  const p = 10 ** Math.floor(Math.log10(tho))
  const buoc = [1, 2, 2.5, 5, 10].map((m) => m * p).find((b) => b >= tho)
  const dinh = Math.ceil(max / buoc) * buoc
  return { dinh, moc: Array.from({ length: Math.round(dinh / buoc) + 1 }, (_, i) => i * buoc) }
}

const phanTram = (a, tong) => (tong ? Math.round((a / tong) * 100) : 0)

/** Giao dịch đang chờ thanh toán: xác nhận hoặc hủy ngay tại trang tổng quan. */
function ViecCanXuLy({ api, tenKhach, dsHang, onXong }) {
  const { message } = App.useApp()
  const [dangXuLy, setDangXuLy] = useState(null)
  const ds = api.data ?? []

  const capNhat = async (g, moi) => {
    setDangXuLy(g.MaGiaoDich)
    try {
      const kq = await capNhatTrangThaiGiaoDich(g.MaGiaoDich, moi)
      if (moi === 'COMPLETED') {
        const hangMoi = dsHang.find((h) => h.MaHang === kq.thangHang?.HangMoi)?.TenHang
        message.success(
          `Đã xác nhận ${g.MaGiaoDich}: cộng ${formatDiem(kq.diemCong)} điểm cho ${tenKhach(g.MaKH)}${hangMoi ? `, khách lên hạng ${hangMoi}` : ''}.`,
        )
      } else {
        message.info(`Đã hủy ${g.MaGiaoDich}, không cộng điểm.`)
      }
    } catch (e) {
      message.error(e.message)
    } finally {
      setDangXuLy(null)
      onXong()
    }
  }

  return (
    <section className="khoi" aria-labelledby="can-xu-ly">
      <div className="khoi__dau">
        <h2 id="can-xu-ly">
          {ds.length ? `Cần xử lý: ${ds.length} giao dịch chờ thanh toán` : 'Không có giao dịch nào chờ thanh toán'}
        </h2>
        <Link to="/admin/giao-dich?trangThai=PENDING">Mở danh sách giao dịch</Link>
      </div>
      {api.error && !api.data ? (
        <ErrorState error={api.error} onRetry={api.reload} compact />
      ) : api.loading && !api.data ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        ds.length > 0 && (
          <ul className="ds-hang" data-testid="pending-list">
            {ds.map((g) => (
              <li key={g.MaGiaoDich} className="cho-xu-ly">
                <span className="cap" style={{ gap: 0 }}>
                  <b>{g.MaGiaoDich}</b>
                  <small>{formatNgayGio(g.NgayTao)}</small>
                </span>
                <span className="cap" style={{ gap: 0, minWidth: 0 }}>
                  <span>
                    {tenKhach(g.MaKH)} <small>{g.MaKH}</small>
                  </span>
                  <small>{tomTatChiTiet(g.ChiTiet)}</small>
                </span>
                <b className="so-cot">{formatVND(g.TongTien)}</b>
                <span className="cap-nut">
                  <Popconfirm
                    title={`Xác nhận ${g.MaGiaoDich} đã thanh toán?`}
                    description={`Cộng ${formatDiem(Math.floor(g.TongTien / SO_TIEN_MOI_DIEM))} điểm cho ${tenKhach(g.MaKH)} và xét lên hạng.`}
                    okText="Xác nhận đã thanh toán"
                    cancelText="Không"
                    onConfirm={() => capNhat(g, 'COMPLETED')}
                  >
                    <Button
                      size="small"
                      type="primary"
                      loading={dangXuLy === g.MaGiaoDich}
                      disabled={Boolean(dangXuLy)}
                      aria-label={`Xác nhận thanh toán ${g.MaGiaoDich}`}
                    >
                      Xác nhận
                    </Button>
                  </Popconfirm>
                  <Popconfirm
                    title={`Hủy giao dịch ${g.MaGiaoDich}?`}
                    okText="Hủy giao dịch"
                    cancelText="Không"
                    onConfirm={() => capNhat(g, 'CANCELLED')}
                  >
                    <Button size="small" disabled={Boolean(dangXuLy)} aria-label={`Hủy ${g.MaGiaoDich}`}>
                      Hủy
                    </Button>
                  </Popconfirm>
                </span>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  )
}

function GoiYThang({ active, payload, nam }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bieu-do__goi-y">
      <b>{formatDiem(d.tongDiem)} điểm</b>
      <small>
        Tháng {d.thang}/{nam}, {formatDiem(d.soGiaoDich)} giao dịch
      </small>
    </div>
  )
}

/** Cột mực cho mọi tháng; cột cần làm nổi (tháng hiện tại, hoặc tháng cao nhất của năm cũ) màu nhấn. */
function BieuDoTheoThang({ data, nam, laNamNay, thangHienTai }) {
  const [kieu, setKieu] = useState('bieu-do')
  const max = Math.max(...data.map((d) => d.tongDiem))
  const tong = data.reduce((s, d) => s + d.tongDiem, 0)
  const truc = mocTruc(max)
  const thangNoiBat = laNamNay ? thangHienTai : (data.find((d) => d.tongDiem === max && max > 0)?.thang ?? null)

  const nhanNoiBat = ({ x, y, width, index }) =>
    data[index]?.thang === thangNoiBat ? (
      <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={13} fontWeight={600} fill={MAU.chu}>
        {formatDiem(data[index].tongDiem)}
      </text>
    ) : null

  return (
    <section className="khoi" aria-labelledby="bd-thang">
      <div className="khoi__dau">
        <h2 id="bd-thang">Điểm phát hành theo tháng</h2>
        <Segmented
          size="small"
          value={kieu}
          onChange={setKieu}
          options={[
            { label: 'Biểu đồ', value: 'bieu-do' },
            { label: 'Bảng số', value: 'bang' },
          ]}
          aria-label="Cách xem số liệu"
        />
      </div>
      {kieu === 'bieu-do' ? (
        <div data-testid="chart-monthly" className="bieu-do-cot">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={MAU.vien} />
              <XAxis
                dataKey="thang"
                tickFormatter={(t) => `T${t}`}
                tickLine={false}
                axisLine={{ stroke: MAU.chu }}
                tick={{ fill: MAU.chuPhu, fontSize: 13 }}
                interval={0}
              />
              <YAxis
                domain={[0, truc.dinh]}
                ticks={truc.moc}
                tickFormatter={tickGon}
                tickLine={false}
                axisLine={false}
                tick={{ fill: MAU.chuPhu, fontSize: 13 }}
                width={48}
              />
              <Tooltip cursor={{ fill: MAU.nenPhu }} content={<GoiYThang nam={nam} />} />
              <Bar dataKey="tongDiem" name="Điểm phát hành" maxBarSize={32} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.thang} fill={d.thang === thangNoiBat ? MAU.nhan : MAU.chu} />
                ))}
                <LabelList dataKey="tongDiem" content={nhanNoiBat} />
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
                <b>Cả năm</b>
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
    </section>
  )
}

/** Xếp hạng: tên, thanh mực, số lượt trên cùng một hàng (vừa là biểu đồ vừa là bảng). */
function TopDoiQua({ api, dsHang, nam }) {
  const data = api.data ?? []
  const max = Math.max(1, ...data.map((d) => d.soLuotDoi))
  return (
    <section className="khoi" aria-labelledby="top-doi-qua">
      <h2 id="top-doi-qua">Top 10 khách đổi quà nhiều nhất</h2>
      {api.error && !api.data ? (
        <ErrorState error={api.error} onRetry={api.reload} compact />
      ) : !api.data ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : data.length === 0 ? (
        <p>Chưa có lượt đổi quà nào trong năm {nam}.</p>
      ) : (
        <ol className="xep-hang" data-testid="top-redeemers">
          {data.map((d, i) => (
            <li key={d.MaKH}>
              <span className="xep-hang__so">{i + 1}</span>
              <span className="xep-hang__ten">
                {d.HoTen}
                <small>
                  <span className="xep-hang__ma">{d.MaKH}</span>
                  <TierTag maHang={d.MaHangHienTai} dsHang={dsHang} />
                </small>
              </span>
              <span className="xep-hang__thanh" aria-hidden>
                <span style={{ width: `${(d.soLuotDoi / max) * 100}%` }} />
              </span>
              <span className="xep-hang__gia-tri">
                <b>{d.soLuotDoi} lượt</b>
                <small>{formatDiem(d.tongDiemDaDoi)} điểm</small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/** Một thanh chia theo hạng (màu hạng, có chữ), kèm chú giải số khách. */
function KhachTheoHang({ api }) {
  const data = api.data ?? []
  const tong = data.reduce((s, d) => s + d.soKhachHang, 0)
  return (
    <section className="khoi" aria-labelledby="theo-hang">
      <h2 id="theo-hang">Khách hàng theo hạng</h2>
      {api.error && !api.data ? (
        <ErrorState error={api.error} onRetry={api.reload} compact />
      ) : !api.data ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
          <div
            className="thanh-phan-doan"
            role="img"
            aria-label={data.map((d) => `Hạng ${d.TenHang}: ${d.soKhachHang} khách`).join(', ')}
          >
            {data.map((d) =>
              d.soKhachHang ? (
                <div
                  key={d.MaHang}
                  className="thanh-phan-doan__khuc"
                  style={{ flexGrow: d.soKhachHang, background: MAU_HANG[d.MaHang] ?? MAU.chuPhu }}
                >
                  {phanTram(d.soKhachHang, tong) >= 12 ? `${d.TenHang} ${phanTram(d.soKhachHang, tong)}%` : ''}
                </div>
              ) : null,
            )}
          </div>
          <ul className="chu-giai">
            {data.map((d) => (
              <li key={d.MaHang}>
                <TierTag maHang={d.MaHang} tenHang={d.TenHang} />
                <b>{d.soKhachHang} khách</b>
                <small>{phanTram(d.soKhachHang, tong)}%</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default function Dashboard() {
  const [namHienTai] = useState(() => new Date().getFullYear())
  const [thangHienTai] = useState(() => new Date().getMonth() + 1)
  const [nam, setNam] = useState(namHienTai)
  const tongQuan = useApi(layTongQuan, [])
  const choXuLy = useApi(() => layDsGiaoDich({ trangThai: 'PENDING' }), [])
  const khach = useApi(() => timKhachHang({}), [])
  const theoHang = useApi(layKhachHangTheoHang, [])
  const dsHang = useApi(layDsHang, [])
  const theoThang = useApi(() => layDiemPhatHanhTheoThang(nam), [nam])
  const top = useApi(() => layTopDoiQua({ limit: 10, nam }), [nam])
  const dsNam = useMemo(() => [namHienTai, namHienTai - 1, namHienTai - 2], [namHienTai])
  const tenTheoMa = useMemo(() => new Map((khach.data ?? []).map((k) => [k.MaKH, k.HoTen])), [khach.data])
  const tenKhach = (ma) => tenTheoMa.get(ma) ?? ma
  const tq = tongQuan.data

  const taiLaiSauXuLy = () => {
    choXuLy.reload()
    tongQuan.reload()
    theoThang.reload()
    theoHang.reload()
  }

  return (
    <div className="qt-trang">
      <section className="cap" aria-labelledby="tieu-de">
        <h1 id="tieu-de">
          Tổng quan tháng {thangHienTai}/{namHienTai}
        </h1>
        {tongQuan.error ? (
          <ErrorState error={tongQuan.error} onRetry={tongQuan.reload} />
        ) : !tq ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <p className="tom-tat" data-testid="month-summary">
            <b>{formatDiem(tq.diemPhatHanhThangNay)} điểm</b> phát hành, <b>{formatDiem(tq.luotDoiThangNay)}</b> lượt
            đổi quà, doanh thu <b>{soGon(tq.doanhThuThangNay)} đồng</b>. {formatDiem(tq.khachHangActive)} trên{' '}
            {formatDiem(tq.tongKhachHang)} khách hàng đang hoạt động.
          </p>
        )}
      </section>

      <ViecCanXuLy api={choXuLy} tenKhach={tenKhach} dsHang={dsHang.data ?? []} onXong={taiLaiSauXuLy} />

      <div className="nhom">
        <div className="hang-loc">
          <label htmlFor="chon-nam">Số liệu năm</label>
          <Select
            id="chon-nam"
            size="small"
            value={nam}
            onChange={setNam}
            style={{ width: 112 }}
            options={dsNam.map((n) => ({ value: n, label: String(n) }))}
          />
        </div>
        <div className="qt-luoi-2">
          {theoThang.error ? (
            <ErrorState error={theoThang.error} onRetry={theoThang.reload} />
          ) : theoThang.data ? (
            <BieuDoTheoThang data={theoThang.data} nam={nam} laNamNay={nam === namHienTai} thangHienTai={thangHienTai} />
          ) : (
            <Skeleton active paragraph={{ rows: 8 }} />
          )}
          <TopDoiQua api={top} dsHang={dsHang.data ?? []} nam={nam} />
        </div>
      </div>

      <KhachTheoHang api={theoHang} />
    </div>
  )
}
