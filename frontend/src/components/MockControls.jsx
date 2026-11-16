import { DatabaseOutlined, ReloadOutlined } from '@ant-design/icons'
import { App, Button, Popconfirm } from 'antd'
import { USE_MOCK } from '../config.js'

/** Cho biết đang dùng dữ liệu giả hay API thật; với dữ liệu giả có nút khôi phục dữ liệu mẫu. */
export function MockControls({ nutLon = false }) {
  const { message } = App.useApp()
  if (!USE_MOCK) {
    return (
      <span className="nhan-trang-thai" title="Đang gọi backend thật qua /api (cấu hình VITE_API_TARGET)">
        <DatabaseOutlined /> API thật
      </span>
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
    <span className="hang-loc">
      <span className="nhan-trang-thai chu-phu" title="Dữ liệu giả (MSW) lưu trong trình duyệt, dùng khi backend chưa xong">
        <DatabaseOutlined /> Dữ liệu giả
      </span>
      <Popconfirm
        title="Khôi phục dữ liệu mẫu?"
        description="Mọi giao dịch và lượt đổi quà vừa tạo sẽ bị xóa, giống chạy mongorestore."
        okText="Khôi phục"
        cancelText="Không"
        onConfirm={khoiPhuc}
      >
        <Button size={nutLon ? undefined : 'small'} icon={<ReloadOutlined />}>
          Khôi phục dữ liệu mẫu
        </Button>
      </Popconfirm>
    </span>
  )
}
