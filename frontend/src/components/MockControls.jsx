import { DatabaseOutlined, ReloadOutlined } from '@ant-design/icons'
import { App, Button, Popconfirm, Space, Tag, Tooltip } from 'antd'
import { USE_MOCK } from '../config.js'

/** Cho biết đang dùng API giả hay thật; ở chế độ mock có nút khôi phục dữ liệu mẫu. */
export function MockControls({ size = 'small' }) {
  const { message } = App.useApp()
  if (!USE_MOCK) {
    return (
      <Tooltip title="Đang gọi backend thật qua /api (cấu hình VITE_API_TARGET)">
        <Tag color="green" icon={<DatabaseOutlined />}>
          API thật
        </Tag>
      </Tooltip>
    )
  }
  const khoiPhuc = async () => {
    const { khoiPhucDuLieuMau } = await import('../mocks/db.js')
    khoiPhucDuLieuMau()
    localStorage.removeItem('loyalcine-ma-kh')
    message.success('Đã khôi phục dữ liệu mẫu')
    setTimeout(() => window.location.reload(), 400)
  }
  return (
    <Space size={8} wrap>
      <Tooltip title="Dữ liệu giả (MSW) lưu trong trình duyệt – dùng khi backend chưa xong">
        <Tag color="gold" icon={<DatabaseOutlined />}>
          Dữ liệu giả (mock)
        </Tag>
      </Tooltip>
      <Popconfirm
        title="Khôi phục dữ liệu mẫu?"
        description="Mọi thay đổi (giao dịch, đổi quà...) sẽ bị xóa, giống chạy mongorestore."
        okText="Khôi phục"
        cancelText="Không"
        onConfirm={khoiPhuc}
      >
        <Button size={size} icon={<ReloadOutlined />}>
          Khôi phục dữ liệu mẫu
        </Button>
      </Popconfirm>
    </Space>
  )
}
