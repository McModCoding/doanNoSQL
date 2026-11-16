import { get } from './client.js'
import { mapDsHang } from './mappers.js'

/** GET /hang-thanh-vien – danh sách hạng và ngưỡng chi tiêu */
export const layDsHang = async () => mapDsHang(await get('/hang-thanh-vien'))
