import { formatVND } from '../utils/format.js'
import { tinhTienDoHang } from '../utils/tier.js'
import { Meter } from './Meter.jsx'

/** Tiến độ lên hạng: "Còn 150.000đ nữa là lên hạng Bạc" + thanh tiến độ + số đã chi. */
export function TierProgress({ tongChiTieu = 0, dsHang = [], tren = 'nen' }) {
  const t = tinhTienDoHang(tongChiTieu, dsHang)
  if (!t.hangHienTai) return null
  return (
    <div className="cap">
      {t.laHangCaoNhat ? (
        <p data-testid="tier-progress-msg">
          Bạn đang ở hạng cao nhất: <b>{t.hangHienTai.TenHang}</b>.
        </p>
      ) : (
        <p data-testid="tier-progress-msg">
          Còn <b>{formatVND(t.soTienCanThem)}</b> nữa là lên hạng <b>{t.hangKeTiep.TenHang}</b>
        </p>
      )}
      <Meter
        phanTram={t.phanTram}
        tren={tren}
        nhan={t.laHangCaoNhat ? 'Đã đạt hạng cao nhất' : `Tiến độ lên hạng ${t.hangKeTiep.TenHang}`}
      />
      <small>
        Đã chi {formatVND(tongChiTieu)}
        {t.hangKeTiep ? ` trên ${formatVND(t.hangKeTiep.NguongChiTieu)}` : ''}
      </small>
    </div>
  )
}
