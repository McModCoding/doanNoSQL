import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, StopOutlined } from '@ant-design/icons'
import { MAU } from '../design/tokens.js'

const TRANG_THAI = {
  PENDING: { nhan: 'Chờ thanh toán', mau: MAU.dangCho, icon: <ClockCircleOutlined /> },
  COMPLETED: { nhan: 'Thành công', mau: MAU.thanhCong, icon: <CheckCircleOutlined /> },
  CANCELLED: { nhan: 'Đã hủy', mau: MAU.chuPhu, icon: <StopOutlined /> },
  FAILED: { nhan: 'Thất bại', mau: MAU.loi, icon: <CloseCircleOutlined /> },
}

/** Trạng thái giao dịch: biểu tượng + chữ cùng màu chức năng. */
export function StatusTag({ trangThai }) {
  const t = TRANG_THAI[trangThai] ?? { nhan: trangThai, mau: MAU.chuPhu }
  return (
    <span className="nhan-trang-thai" style={{ color: t.mau }}>
      {t.icon}
      {t.nhan}
    </span>
  )
}
