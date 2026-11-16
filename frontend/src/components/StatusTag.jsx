import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, StopOutlined } from '@ant-design/icons'
import { Tag } from 'antd'

const TRANG_THAI = {
  PENDING: { nhan: 'Chờ thanh toán', color: 'warning', icon: <ClockCircleOutlined /> },
  COMPLETED: { nhan: 'Thành công', color: 'success', icon: <CheckCircleOutlined /> },
  CANCELLED: { nhan: 'Đã hủy', color: 'default', icon: <StopOutlined /> },
  FAILED: { nhan: 'Thất bại', color: 'error', icon: <CloseCircleOutlined /> },
}

/** Trạng thái giao dịch: luôn có biểu tượng + chữ, không chỉ dựa vào màu. */
export function StatusTag({ trangThai }) {
  const t = TRANG_THAI[trangThai] ?? { nhan: trangThai, color: 'default' }
  return (
    <Tag color={t.color} icon={t.icon} variant="filled">
      {t.nhan}
    </Tag>
  )
}
