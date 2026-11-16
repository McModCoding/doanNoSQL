import { get } from './client.js'
import { mapDsKhuyenMai } from './mappers.js'

/** GET /khuyen-mai?conHieuLuc=true */
export const layKhuyenMai = async (boLoc = { conHieuLuc: true }) => mapDsKhuyenMai(await get('/khuyen-mai', boLoc))
