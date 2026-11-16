import { del, get, post, put } from './client.js'
import {
  mapDsBienDongDiem,
  mapDsDoiThuong,
  mapDsGiaoDich,
  mapDsKhachHang,
  mapDsLichSuHang,
  mapKhachHang,
} from './mappers.js'

const ma = (maKH) => encodeURIComponent(maKH)

/** GET /khach-hang?q=&soDienThoai=&maHang=&trangThai= */
export const timKhachHang = async (boLoc = {}) => mapDsKhachHang(await get('/khach-hang', boLoc))
/** GET /khach-hang/:maKH */
export const layKhachHang = async (maKH) => mapKhachHang(await get(`/khach-hang/${ma(maKH)}`))
/** POST /khach-hang */
export const themKhachHang = async (duLieu) => mapKhachHang(await post('/khach-hang', duLieu))
/** PUT /khach-hang/:maKH */
export const suaKhachHang = async (maKH, duLieu) => mapKhachHang(await put(`/khach-hang/${ma(maKH)}`, duLieu))
/** DELETE /khach-hang/:maKH */
export const xoaKhachHang = (maKH) => del(`/khach-hang/${ma(maKH)}`)

/** GET /khach-hang/:maKH/bien-dong-diem */
export const layBienDongDiem = async (maKH) => mapDsBienDongDiem(await get(`/khach-hang/${ma(maKH)}/bien-dong-diem`))
/** GET /khach-hang/:maKH/giao-dich */
export const layGiaoDichCuaKhach = async (maKH) => mapDsGiaoDich(await get(`/khach-hang/${ma(maKH)}/giao-dich`))
/** GET /khach-hang/:maKH/doi-thuong */
export const layDoiThuongCuaKhach = async (maKH) => mapDsDoiThuong(await get(`/khach-hang/${ma(maKH)}/doi-thuong`))
/** GET /khach-hang/:maKH/lich-su-hang */
export const layLichSuHang = async (maKH) => mapDsLichSuHang(await get(`/khach-hang/${ma(maKH)}/lich-su-hang`))
