import { QRCode, Segmented } from 'antd'
import { useState } from 'react'
import Barcode from 'react-barcode'
import { APP_NAME, TIER_STYLE, TIER_STYLE_MAC_DINH } from '../config.js'
import { formatDiem, formatMaThe } from '../utils/format.js'

/** Thẻ thành viên điện tử: tên, hạng, điểm và mã QR / mã vạch để quét tại quầy. */
export function MembershipCard({ khachHang, hang }) {
  const [kieuMa, setKieuMa] = useState('QR')
  const style = TIER_STYLE[khachHang.MaHangHienTai] ?? TIER_STYLE_MAC_DINH
  return (
    <div className="member-card" style={{ background: style.gradient }} data-testid="member-card">
      <div className="member-card__top">
        <span className="member-card__brand">{APP_NAME}</span>
        <span className="member-card__tier" data-testid="member-card-tier">
          Thành viên {hang?.TenHang ?? khachHang.MaHangHienTai}
        </span>
      </div>
      <div className="member-card__name">{khachHang.HoTen}</div>
      <div className="member-card__number">{formatMaThe(khachHang.MaThe)}</div>
      <div className="member-card__points">
        <span>Điểm hiện có</span>
        <strong data-testid="member-card-points">{formatDiem(khachHang.DiemHienTai)}</strong>
      </div>

      <div className="member-card__code">
        {kieuMa === 'QR' ? (
          <QRCode value={khachHang.MaThe} size={136} bordered={false} errorLevel="M" />
        ) : (
          <Barcode value={khachHang.MaThe} format="CODE128" height={64} width={1.8} displayValue={false} margin={0} background="transparent" />
        )}
        <span className="member-card__hint">Đưa mã cho nhân viên quầy để tích điểm</span>
      </div>
      <Segmented
        block
        size="small"
        className="member-card__switch"
        value={kieuMa}
        onChange={setKieuMa}
        options={[
          { label: 'Mã QR', value: 'QR' },
          { label: 'Mã vạch', value: 'BARCODE' },
        ]}
      />
    </div>
  )
}
