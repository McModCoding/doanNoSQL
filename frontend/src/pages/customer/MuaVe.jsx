import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Segmented } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { taoGiaoDich } from '../../api/giaoDich.js'
import { SO_TIEN_MOI_DIEM } from '../../config.js'
import { useKhachHang } from '../../context/khachHangContext.js'
import { COMBO, PHIM, taoDongCombo, taoDongVe } from '../../data/catalog.js'
import { formatDiem, formatVND } from '../../utils/format.js'

const SO_LUONG_TOI_DA = 10
const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

/** Ba ngày chiếu: hôm nay và hai ngày tới. */
function taoDsNgay() {
  const homNay = dayjs()
  return [0, 1, 2].map((i) => {
    const d = homNay.add(i, 'day')
    return { khoa: d.format('DD/MM'), nhan: i === 0 ? 'Hôm nay' : THU[d.day()], ngay: d.format('DD/MM') }
  })
}

function BoDem({ value, onChange, nhan }) {
  return (
    <div className="bo-dem" role="group" aria-label={nhan}>
      <Button icon={<MinusOutlined />} disabled={value <= 0} onClick={() => onChange(value - 1)} aria-label={`Bớt ${nhan}`} />
      <span className="bo-dem__so" aria-live="polite">
        {value}
      </span>
      <Button
        icon={<PlusOutlined />}
        disabled={value >= SO_LUONG_TOI_DA}
        onClick={() => onChange(value + 1)}
        aria-label={`Thêm ${nhan}`}
      />
    </div>
  )
}

function HangPhim({ phim, ngay, gioHang, datDong }) {
  const dsDinhDang = Object.keys(phim.DinhDang)
  const [dinhDang, setDinhDang] = useState(dsDinhDang[0])
  const [suat, setSuat] = useState(phim.SuatChieu[0])
  const khoa = `${phim.MaPhim}|${dinhDang}|${suat}|${ngay}`
  const soLuong = gioHang[khoa]?.SoLuong ?? 0

  return (
    <article className="phim" data-testid={`movie-${phim.MaPhim}`}>
      <div className="poster-chu" aria-hidden>
        {phim.TenPhim}
      </div>
      <div className="phim__than">
        <h2 className="co-h3">{phim.TenPhim}</h2>
        <small>
          {phim.TheLoai}, {phim.ThoiLuong} phút <span className="nhan-tuoi">{phim.PhanLoai}</span>
        </small>
        <div className="dong-dinh-dang">
          {dsDinhDang.length > 1 ? (
            <Segmented
              size="small"
              value={dinhDang}
              onChange={setDinhDang}
              options={dsDinhDang}
              aria-label={`Định dạng ${phim.TenPhim}`}
            />
          ) : (
            <span>{dinhDang}</span>
          )}
          <span>
            <b>{formatVND(phim.DinhDang[dinhDang])}</b> một vé
          </span>
        </div>
        <div className="gio-chieu" role="group" aria-label={`Suất chiếu ${phim.TenPhim}`}>
          {phim.SuatChieu.map((s) => (
            <button
              type="button"
              key={s}
              className={`chip-chon${s === suat ? ' is-chon' : ''}`}
              aria-pressed={s === suat}
              onClick={() => setSuat(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="dong-so-luong">
          <span>Số vé</span>
          <BoDem
            value={soLuong}
            nhan={`vé ${phim.TenPhim}`}
            onChange={(n) => datDong(khoa, taoDongVe(phim, dinhDang, suat, n, ngay))}
          />
        </div>
      </div>
    </article>
  )
}

export default function MuaVe() {
  const { khachHang } = useKhachHang()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'combo' ? 'combo' : 've'
  const dsNgay = useMemo(() => taoDsNgay(), [])
  const [ngay, setNgay] = useState(dsNgay[0].ngay)
  const [gioHang, setGioHang] = useState({})
  const [dangGui, setDangGui] = useState(false)

  const datDong = (khoa, dong) =>
    setGioHang((g) => {
      const moi = { ...g }
      if (dong.SoLuong <= 0) delete moi[khoa]
      else moi[khoa] = dong
      return moi
    })

  const dsDong = Object.entries(gioHang)
  const tong = dsDong.reduce((s, [, d]) => s + d.SoLuong * d.DonGia, 0)
  const diemDuKien = Math.floor(tong / SO_TIEN_MOI_DIEM)
  const soVe = dsDong.filter(([, d]) => d.Loai === 'VE').reduce((s, [, d]) => s + d.SoLuong, 0)
  const soCombo = dsDong.filter(([, d]) => d.Loai === 'COMBO').reduce((s, [, d]) => s + d.SoLuong, 0)
  const tomTat = [soVe ? `${soVe} vé` : '', soCombo ? `${soCombo} combo` : ''].filter(Boolean).join(', ')

  const thanhToan = async () => {
    setDangGui(true)
    try {
      const gd = await taoGiaoDich({ MaKH: khachHang.MaKH, ChiTiet: dsDong.map(([, d]) => d), PhuongThucThanhToan: 'MOMO' })
      navigate(`/app/thanh-toan/${gd.MaGiaoDich}`)
    } catch (e) {
      message.error(e.message)
      setDangGui(false)
    }
  }

  return (
    <div className="trang" style={{ gap: 24 }}>
      <h1>Đặt vé</h1>
      <Segmented
        block
        value={tab}
        onChange={(v) => setParams(v === 'combo' ? { tab: 'combo' } : {}, { replace: true })}
        options={[
          { label: 'Vé xem phim', value: 've' },
          { label: 'Bắp nước', value: 'combo' },
        ]}
      />

      {tab === 've' ? (
        <>
          <div className="hang-ngay" role="group" aria-label="Chọn ngày chiếu">
            {dsNgay.map((d) => (
              <button
                type="button"
                key={d.khoa}
                className={`chip-chon${d.ngay === ngay ? ' is-chon' : ''}`}
                aria-pressed={d.ngay === ngay}
                onClick={() => setNgay(d.ngay)}
              >
                {d.nhan}
                <small>{d.ngay}</small>
              </button>
            ))}
          </div>
          <div className="nhom">
            {PHIM.map((p) => (
              <HangPhim key={`${p.MaPhim}-${ngay}`} phim={p} ngay={ngay} gioHang={gioHang} datDong={datDong} />
            ))}
          </div>
        </>
      ) : (
        <ul className="ds-hang">
          {COMBO.map((c) => (
            <li key={c.MaSanPham} className="qua" data-testid={`combo-${c.MaSanPham}`} style={{ gridTemplateColumns: '1fr auto' }}>
              <div className="cap">
                <h2 className="co-h3">{c.TenSanPham}</h2>
                <small>{c.MoTa}</small>
                <b>{formatVND(c.DonGia)}</b>
              </div>
              <BoDem
                value={gioHang[c.MaSanPham]?.SoLuong ?? 0}
                nhan={c.TenSanPham}
                onChange={(n) => datDong(c.MaSanPham, taoDongCombo(c, n))}
              />
            </li>
          ))}
        </ul>
      )}

      {dsDong.length > 0 && (
        <section className="nhom" aria-labelledby="gio-hang">
          <h2 id="gio-hang">Giỏ hàng</h2>
          <ol className="so-cai">
            {dsDong.map(([khoa, d]) => (
              <li key={khoa} className="so-cai__hang so-cai__hang--rong">
                <span className="so-cai__noi-dung">
                  {d.TenSanPham}
                  <small>
                    {d.SoLuong} × {formatVND(d.DonGia)}
                  </small>
                </span>
                <span className="cap" style={{ alignItems: 'flex-end' }}>
                  <b className="so-cot">{formatVND(d.SoLuong * d.DonGia)}</b>
                  <button type="button" className="nut-link" onClick={() => datDong(khoa, { ...d, SoLuong: 0 })}>
                    Bỏ khỏi giỏ
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="thanh-day">
        <div className="thanh-day__tong">
          <span className="cap">
            <small>{tomTat || 'Chưa chọn vé hoặc combo'}</small>
            <small>Dự kiến +{formatDiem(diemDuKien)} điểm</small>
          </span>
          <span className="so-vua" data-testid="cart-total">
            {formatVND(tong)}
          </span>
        </div>
        <Button type="primary" block disabled={dsDong.length === 0} loading={dangGui} onClick={thanhToan}>
          {dsDong.length ? `Thanh toán ${formatVND(tong)} bằng MoMo` : 'Chọn vé để thanh toán'}
        </Button>
      </div>
    </div>
  )
}
