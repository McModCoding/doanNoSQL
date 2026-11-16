import { RiseOutlined, TrophyOutlined } from '@ant-design/icons'
import { formatVND } from '../utils/format.js'
import { tinhTienDoHang } from '../utils/tier.js'
import { Meter } from './Meter.jsx'
import { TierTag } from './TierTag.jsx'

/** Thẻ tiến độ lên hạng: "Bạn cần chi tiêu thêm 150.000đ để lên hạng Bạc". */
export function TierProgress({ tongChiTieu = 0, dsHang = [], hienQuyenLoi = true }) {
  const t = tinhTienDoHang(tongChiTieu, dsHang)
  if (!t.hangHienTai) return null
  return (
    <div className="tier-progress">
      <div className="tier-progress__head">
        <span className="tier-progress__label">Hạng thành viên</span>
        <span className="tier-progress__ladder">
          <TierTag maHang={t.hangHienTai.MaHang} dsHang={dsHang} />
          {t.hangKeTiep && (
            <>
              <span className="tier-progress__arrow">→</span>
              <TierTag maHang={t.hangKeTiep.MaHang} dsHang={dsHang} />
            </>
          )}
        </span>
      </div>

      <Meter
        phanTram={t.phanTram}
        nhan={t.laHangCaoNhat ? 'Đã đạt hạng cao nhất' : `Tiến độ lên hạng ${t.hangKeTiep.TenHang}`}
      />

      {t.laHangCaoNhat ? (
        <p className="tier-progress__msg">
          <TrophyOutlined /> Bạn đang ở hạng cao nhất – <b>{t.hangHienTai.TenHang}</b>. Cảm ơn bạn đã đồng hành!
        </p>
      ) : (
        <p className="tier-progress__msg" data-testid="tier-progress-msg">
          <RiseOutlined /> Bạn cần chi tiêu thêm <b>{formatVND(t.soTienCanThem)}</b> để lên hạng{' '}
          <b>{t.hangKeTiep.TenHang}</b>
        </p>
      )}
      <div className="tier-progress__meta">
        <span>Tổng chi tiêu: {formatVND(tongChiTieu)}</span>
        {t.hangKeTiep && (
          <span>
            Mốc {t.hangKeTiep.TenHang}: {formatVND(t.hangKeTiep.NguongChiTieu)}
          </span>
        )}
      </div>

      {hienQuyenLoi && t.hangKeTiep?.QuyenLoi?.length > 0 && (
        <div className="tier-progress__perks">
          <span>Lên hạng {t.hangKeTiep.TenHang} để nhận:</span>
          <ul>
            {t.hangKeTiep.QuyenLoi.filter((q) => !q.startsWith('Toàn bộ')).map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
