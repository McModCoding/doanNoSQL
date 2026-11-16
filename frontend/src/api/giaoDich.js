import { get, patch, post } from './client.js'
import { mapDsGiaoDich, mapGiaoDich, mapKetQuaCapNhatGiaoDich } from './mappers.js'

/** POST /giao-dich – tạo giao dịch vé/combo ở trạng thái PENDING */
export const taoGiaoDich = async ({ MaKH, ChiTiet, PhuongThucThanhToan = 'MOMO' }) =>
  mapGiaoDich(await post('/giao-dich', { MaKH, ChiTiet, PhuongThucThanhToan }))

/** GET /giao-dich/:maGD */
export const layGiaoDich = async (maGD) => mapGiaoDich(await get(`/giao-dich/${encodeURIComponent(maGD)}`))

/**
 * PATCH /giao-dich/:maGD/trang-thai
 * TrangThai = COMPLETED -> backend cộng điểm (EARN) và xét thăng hạng.
 */
export const capNhatTrangThaiGiaoDich = async (maGD, TrangThai) =>
  mapKetQuaCapNhatGiaoDich(await patch(`/giao-dich/${encodeURIComponent(maGD)}/trang-thai`, { TrangThai }))

/** GET /giao-dich?trangThai=&maKH= */
export const layDsGiaoDich = async (boLoc = {}) => mapDsGiaoDich(await get('/giao-dich', boLoc))
