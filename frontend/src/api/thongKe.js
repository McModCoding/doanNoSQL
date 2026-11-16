import { get } from './client.js'

/** GET /thong-ke/diem-phat-hanh-theo-thang?nam= – luôn trả đủ 12 tháng (tháng không có dữ liệu = 0) */
export async function layDiemPhatHanhTheoThang(nam) {
  const ds = (await get('/thong-ke/diem-phat-hanh-theo-thang', { nam })) ?? []
  return Array.from({ length: 12 }, (_, i) => {
    const d = ds.find((x) => Number(x.thang) === i + 1)
    return { thang: i + 1, tongDiem: Number(d?.tongDiem ?? 0), soGiaoDich: Number(d?.soGiaoDich ?? 0) }
  })
}

/** GET /thong-ke/top-doi-qua?limit=10&nam= (nam không bắt buộc – bỏ trống = toàn thời gian) */
export const layTopDoiQua = async ({ limit = 10, nam } = {}) => (await get('/thong-ke/top-doi-qua', { limit, nam })) ?? []

/** GET /thong-ke/khach-hang-theo-hang */
export const layKhachHangTheoHang = async () => (await get('/thong-ke/khach-hang-theo-hang')) ?? []

/** GET /thong-ke/tong-quan */
export const layTongQuan = async () => (await get('/thong-ke/tong-quan')) ?? {}
