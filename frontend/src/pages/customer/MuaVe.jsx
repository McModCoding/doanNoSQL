import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, ConfigProvider, Empty, Segmented, Tag } from 'antd'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { taoGiaoDich } from '../../api/giaoDich.js'
import { MAU_MOMO, SO_TIEN_MOI_DIEM } from '../../config.js'
import { useKhachHang } from '../../context/khachHangContext.js'
import { COMBO, PHIM, taoDongCombo, taoDongVe } from '../../data/catalog.js'
import { formatDiem, formatVND } from '../../utils/format.js'

const SO_LUONG_TOI_DA = 10

function Stepper({ value, onChange, nhan }) {
  return (
    <div className="stepper" role="group" aria-label={nhan}>
      <Button
        size="small"
        shape="circle"
        icon={<MinusOutlined />}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
        aria-label={`Bớt ${nhan}`}
      />
      <span className="stepper__value" aria-live="polite">
        {value}
      </span>
      <Button
        size="small"
        shape="circle"
        type="primary"
        icon={<PlusOutlined />}
        disabled={value >= SO_LUONG_TOI_DA}
        onClick={() => onChange(value + 1)}
        aria-label={`Thêm ${nhan}`}
      />
    </div>
  )
}

function ThePhim({ phim, gioHang, datDong }) {
  const dsDinhDang = Object.keys(phim.DinhDang)
  const [dinhDang, setDinhDang] = useState(dsDinhDang[0])
  const [suat, setSuat] = useState(phim.SuatChieu[0])
  const khoa = `${phim.MaPhim}|${dinhDang}|${suat}`
  const soLuong = gioHang[khoa]?.SoLuong ?? 0

  return (
    <article className="movie" data-testid={`movie-${phim.MaPhim}`}>
      <div className="movie__poster" style={{ background: phim.MauNen }} aria-hidden>
        {phim.Poster}
      </div>
      <div className="movie__body">
        <h3>{phim.TenPhim}</h3>
        <p className="movie__meta">
          {phim.TheLoai} · {phim.ThoiLuong} phút <Tag>{phim.PhanLoai}</Tag>
        </p>
        <div className="movie__label">Suất chiếu hôm nay</div>
        <Segmented size="small" value={suat} onChange={setSuat} options={phim.SuatChieu} />
        {dsDinhDang.length > 1 && (
          <>
            <div className="movie__label">Định dạng</div>
            <Segmented
              size="small"
              value={dinhDang}
              onChange={setDinhDang}
              options={dsDinhDang.map((d) => ({ label: `${d} · ${formatVND(phim.DinhDang[d])}`, value: d }))}
            />
          </>
        )}
        <div className="movie__buy">
          <span className="movie__price">
            {formatVND(phim.DinhDang[dinhDang])}
            <small>/vé</small>
          </span>
          <Stepper
            value={soLuong}
            nhan={`vé ${phim.TenPhim}`}
            onChange={(n) => datDong(khoa, taoDongVe(phim, dinhDang, suat, n))}
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

  const thanhToan = async () => {
    setDangGui(true)
    try {
      const gd = await taoGiaoDich({
        MaKH: khachHang.MaKH,
        ChiTiet: dsDong.map(([, d]) => d),
        PhuongThucThanhToan: 'MOMO',
      })
      navigate(`/app/thanh-toan/${gd.MaGiaoDich}`)
    } catch (e) {
      message.error(e.message)
      setDangGui(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header__title">Đặt vé & bắp nước</h1>
      </header>

      <Segmented
        block
        value={tab}
        onChange={(v) => setParams(v === 'combo' ? { tab: 'combo' } : {}, { replace: true })}
        options={[
          { label: '🎬 Vé xem phim', value: 've' },
          { label: '🍿 Bắp nước', value: 'combo' },
        ]}
      />

      {tab === 've' ? (
        <div className="movie-list">
          {PHIM.map((p) => (
            <ThePhim key={p.MaPhim} phim={p} gioHang={gioHang} datDong={datDong} />
          ))}
        </div>
      ) : (
        <div className="combo-list">
          {COMBO.map((c) => (
            <article key={c.MaSanPham} className="combo" data-testid={`combo-${c.MaSanPham}`}>
              <div className="combo__img" aria-hidden>
                {c.Hinh}
              </div>
              <div className="combo__body">
                <h3>{c.TenSanPham}</h3>
                <p>{c.MoTa}</p>
                <b>{formatVND(c.DonGia)}</b>
              </div>
              <Stepper
                value={gioHang[c.MaSanPham]?.SoLuong ?? 0}
                nhan={c.TenSanPham}
                onChange={(n) => datDong(c.MaSanPham, taoDongCombo(c, n))}
              />
            </article>
          ))}
        </div>
      )}

      <section className="card">
        <h2 className="section-title">Giỏ hàng</h2>
        {dsDong.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa chọn vé hoặc combo nào" />
        ) : (
          <ul className="cart">
            {dsDong.map(([khoa, d]) => (
              <li key={khoa}>
                <span>
                  {d.TenSanPham}
                  <small>
                    {d.SoLuong} × {formatVND(d.DonGia)}
                  </small>
                </span>
                <b>{formatVND(d.SoLuong * d.DonGia)}</b>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  aria-label={`Xóa ${d.TenSanPham}`}
                  onClick={() => datDong(khoa, { ...d, SoLuong: 0 })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="checkout-bar">
        <div>
          <span className="checkout-bar__total" data-testid="cart-total">
            {formatVND(tong)}
          </span>
          <span className="checkout-bar__points">Dự kiến +{formatDiem(diemDuKien)} điểm</span>
        </div>
        <ConfigProvider theme={{ token: { colorPrimary: MAU_MOMO } }}>
          <Button type="primary" size="large" disabled={dsDong.length === 0} loading={dangGui} onClick={thanhToan}>
            Thanh toán MoMo
          </Button>
        </ConfigProvider>
      </div>
    </div>
  )
}
