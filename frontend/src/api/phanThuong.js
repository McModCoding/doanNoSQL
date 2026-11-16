import { get } from './client.js'
import { mapDsPhanThuong } from './mappers.js'

/** GET /phan-thuong?loai=&trangThai= */
export const layDsPhanThuong = async (boLoc = {}) => mapDsPhanThuong(await get('/phan-thuong', boLoc))
