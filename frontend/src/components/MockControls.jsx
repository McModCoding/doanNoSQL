import { ReloadOutlined } from '@ant-design/icons'
import { App, Button, Popconfirm } from 'antd'
import { USE_MOCK } from '../config.js'

/** Nút khôi phục dữ liệu mẫu, chỉ hiện khi chạy với dữ liệu giả. */
export function MockControls({ nutLon = false }) {
  const { message } = App.useApp()
  if (!USE_MOCK) return null
  const khoiPhuc = async () => {
    const { khoiPhucDuLieuMau } = await import('../mocks/db.js')
    khoiPhucDuLieuMau()
    localStorage.removeItem('loyalcine-ma-kh')
    message.success('Đã khôi phục dữ liệu mẫu')
    setTimeout(() => window.location.reload(), 400)
  }
  return (
    <span className="hang-loc">
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
