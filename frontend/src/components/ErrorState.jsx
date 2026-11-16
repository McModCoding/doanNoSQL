import { Button, Result } from 'antd'
import { USE_MOCK } from '../config.js'

/** Hiển thị lỗi tải dữ liệu kèm nút thử lại. */
export function ErrorState({ error, onRetry, compact = false }) {
  const goiY = USE_MOCK
    ? ''
    : ' Hãy kiểm tra server backend đã chạy chưa (biến VITE_API_TARGET), hoặc bật lại dữ liệu giả bằng VITE_USE_MOCK=true.'
  return (
    <Result
      status="warning"
      title={compact ? undefined : 'Không tải được dữ liệu'}
      subTitle={`${error?.message ?? 'Đã có lỗi xảy ra.'}${goiY}`}
      extra={onRetry ? <Button onClick={onRetry}>Thử lại</Button> : null}
    />
  )
}
