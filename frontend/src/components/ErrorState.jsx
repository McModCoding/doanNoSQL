import { WarningOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { USE_MOCK } from '../config.js'

/** Lỗi tải dữ liệu: biểu tượng và chữ màu lỗi, lời nhắn cụ thể, nút thử lại. */
export function ErrorState({ error, onRetry, compact = false }) {
  const goiY = USE_MOCK
    ? ''
    : ' Hãy kiểm tra server backend đã chạy chưa (biến VITE_API_TARGET), hoặc bật lại dữ liệu giả bằng VITE_USE_MOCK=true.'
  return (
    <div className="cap" role="alert" style={{ alignItems: 'flex-start' }}>
      {!compact && (
        <span className="trang-thai-lon trang-thai-lon--loi">
          <WarningOutlined /> Không tải được dữ liệu
        </span>
      )}
      <p>{`${error?.message ?? 'Đã có lỗi xảy ra.'}${goiY}`}</p>
      {onRetry && <Button onClick={onRetry}>Thử tải lại</Button>}
    </div>
  )
}
