import { get, post } from './client.js'
import { mapDsDoiThuong, mapKetQuaDoiThuong } from './mappers.js'

/** POST /doi-thuong – dùng điểm đổi phần thưởng */
export const doiQua = async ({ MaKH, MaPhanThuong }) => mapKetQuaDoiThuong(await post('/doi-thuong', { MaKH, MaPhanThuong }))

/** GET /doi-thuong?maKH= */
export const layDsDoiThuong = async (boLoc = {}) => mapDsDoiThuong(await get('/doi-thuong', boLoc))
