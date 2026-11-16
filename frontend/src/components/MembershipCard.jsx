import { QRCode, Segmented } from 'antd'
import { useState } from 'react'
import Barcode from 'react-barcode'
import { MAU } from '../design/tokens.js'
import { formatDiem, formatMaThe } from '../utils/format.js'
import { TierProgress } from './TierProgress.jsx'
import { TierTag } from './TierTag.jsx'

/**
 * Tấm vé thành viên: phần thân (tên, hạng, điểm) và phần cuống ngăn bằng đường răng cưa
 * (mã QR hoặc mã vạch để quét tại quầy, tiến độ lên hạng).
 */
export function MembershipCard({ khachHang, dsHang = [] }) {
  const [kieuMa, setKieuMa] = useState('QR')
  const laMaVach = kieuMa === 'BARCODE'
  return (
    <section className="ve" aria-label="Thẻ thành viên" data-testid="member-card">
      <div className="ve__than">
        <div className="ve__hang-tren">
          <small>Thẻ thành viên LoyalCine</small>
          <TierTag maHang={khachHang.MaHangHienTai} dsHang={dsHang} data-testid="member-card-tier" />
        </div>
        <p className="ve__ten">{khachHang.HoTen}</p>
        <p className="ve__diem">
          <span className="so-lon" data-testid="member-card-points">
            {formatDiem(khachHang.DiemHienTai)}
          </span>
          <span>điểm</span>
        </p>
        <small className="ve__so-the">Số thẻ {formatMaThe(khachHang.MaThe)}</small>
      </div>

      <div className={`ve__cuong${laMaVach ? ' ve__cuong--ma-vach' : ''}`}>
        <div className="ve__ma">
          {laMaVach ? (
            <Barcode
              value={khachHang.MaThe}
              format="CODE128"
              height={64}
              width={1.6}
              displayValue={false}
              margin={0}
              background="transparent"
              lineColor={MAU.chu}
            />
          ) : (
            <div aria-hidden="true">
              <QRCode type="svg" value={khachHang.MaThe} size={120} bordered={false} color={MAU.chu} bgColor={MAU.nenPhu} />
            </div>
          )}
          <Segmented
            size="small"
            value={kieuMa}
            onChange={setKieuMa}
            options={[
              { label: 'Mã QR', value: 'QR' },
              { label: 'Mã vạch', value: 'BARCODE' },
            ]}
          />
        </div>
        <div className="ve__tien-do">
          <TierProgress tongChiTieu={khachHang.TongChiTieu} dsHang={dsHang} tren="nen-phu" />
        </div>
        <small className="ve__goi-y">Đưa mã này cho nhân viên quầy để tích điểm.</small>
      </div>
    </section>
  )
}
