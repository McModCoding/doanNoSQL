// Tầng gọi API – nơi DUY NHẤT trong frontend biết URL backend.
// Hợp đồng: mọi response có dạng { success, data, message } (xem docs/01-hop-dong-api.md).
import axios from 'axios'

export class ApiError extends Error {
  constructor(message, status = 0, body = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const http = axios.create({
  baseURL: '/api', // Vite proxy chuyển /api -> VITE_API_TARGET (backend Express)
  timeout: 15000,
})

http.interceptors.response.use(
  (res) => {
    const body = res.data
    const loaiNoiDung = String(res.headers?.['content-type'] ?? '')
    if (typeof body === 'string' && loaiNoiDung.includes('text/html')) {
      throw new ApiError('API trả về trang HTML thay vì JSON – kiểm tra lại đường dẫn /api và cấu hình proxy.', res.status)
    }
    // Đúng hợp đồng: bóc lớp { success, data, message }
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) throw new ApiError(body.message || 'Yêu cầu thất bại.', res.status, body)
      return body.data
    }
    // Backend trả thẳng dữ liệu (không bọc) – vẫn chấp nhận để dễ tích hợp.
    return body
  },
  (err) => {
    if (err instanceof ApiError) throw err
    if (err.response) {
      const { status, data } = err.response
      const message =
        (data && typeof data === 'object' && data.message) ||
        (status >= 500
          ? `Máy chủ API gặp lỗi hoặc chưa chạy (mã ${status}).`
          : status === 404
            ? 'Không tìm thấy dữ liệu hoặc API chưa có đường dẫn này (404).'
            : `Yêu cầu không hợp lệ (mã ${status}).`)
      throw new ApiError(message, status, data)
    }
    if (err.code === 'ECONNABORTED') throw new ApiError('Máy chủ phản hồi quá lâu, vui lòng thử lại.')
    throw new ApiError('Không kết nối được máy chủ API. Hãy kiểm tra backend đã chạy chưa.')
  },
)

/** Bỏ các tham số rỗng để URL gọn: { q: '', maHang: 'BAC' } -> { maHang: 'BAC' } */
function locThamSo(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
}

export const get = (url, params) => http.get(url, { params: locThamSo(params) })
export const post = (url, body) => http.post(url, body)
export const put = (url, body) => http.put(url, body)
export const patch = (url, body) => http.patch(url, body)
export const del = (url) => http.delete(url)
