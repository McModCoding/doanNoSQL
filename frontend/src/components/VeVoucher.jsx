import { App, QRCode } from 'antd'
import { MAU } from '../design/tokens.js'
import { formatNgay } from '../utils/format.js'
import { NHAN_LOAI_PHAN_THUONG, nhanTrangThaiDoiThuong } from '../utils/nhan.js'

/**
 * Voucher sau khi đổi quà, in như một tấm vé: thân vé ghi tên quà,
 * đường răng cưa, cuống vé có mã QR và mã đổi quà để đưa nhân viên quầy.
 */
export function VeVoucher({ doiThuong, hienTrangThai = false }) {
  const { message } = App.useApp()
  const laQuaHienVat = doiThuong.LoaiPhanThuong === 'QUA_HIEN_VAT'

  const saoChep = async () => {
    try {
      await navigator.clipboard.writeText(doiThuong.MaVoucher)
      message.success('Đã sao chép mã')
    } catch {
      message.error('Không sao chép được, hãy ghi lại mã bằng tay')
    }
  }

  return (
    <div className="ve-voucher" data-testid="voucher">
      <div className="ve-voucher__than">
        <small>{NHAN_LOAI_PHAN_THUONG[doiThuong.LoaiPhanThuong] ?? 'Phần thưởng'}</small>
        <h3>{doiThuong.TenPhanThuong}</h3>
        {hienTrangThai && <small>{nhanTrangThaiDoiThuong(doiThuong)}</small>}
      </div>
      <div className="ve-voucher__cuong">
        <div aria-hidden="true">
          <QRCode type="svg" value={doiThuong.MaVoucher} size={144} bordered={false} color={MAU.chu} bgColor={MAU.nen} />
        </div>
        <span className="ma-voucher">{doiThuong.MaVoucher}</span>
        <button type="button" className="nut-link" onClick={saoChep}>
          Sao chép mã
        </button>
        <small>
          {laQuaHienVat ? 'Mang mã này đến quầy vé để nhận quà.' : 'Đưa mã này cho nhân viên khi thanh toán.'} Hạn dùng
          đến {formatNgay(doiThuong.HanSuDung)}.
        </small>
      </div>
    </div>
  )
}
