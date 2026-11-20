import { Router } from 'express'
import {
  timKiemKhachHang,
  layKhachHangTheoMa,
  themKhachHang,
  suaKhachHang,
  xoaKhachHang,
  layBienDongDiemCuaKhach,
  layGiaoDichCuaKhach,
  layDoiThuongCuaKhach,
  layLichSuHangCuaKhach,
  LoiNghiepVu,
} from '../services/khachHang.service.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = Router()

// GET /api/khach-hang: Tìm kiếm, lọc khách; đăng nhập bằng SĐT
router.get('/', async (req, res) => {
  try {
    const { q, soDienThoai, sdt, maHang, trangThai } = req.query
    const ds = await timKiemKhachHang({
      q,
      soDienThoai: soDienThoai || sdt,
      maHang,
      trangThai,
    })
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// GET /api/khach-hang/:maKH: Chi tiết 1 khách
router.get('/:maKH', async (req, res) => {
  try {
    const kh = await layKhachHangTheoMa(req.params.maKH)
    return successResponse(res, kh)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// POST /api/khach-hang: Thêm khách hàng mới
router.post('/', async (req, res) => {
  try {
    const kh = await themKhachHang(req.body)
    return successResponse(res, kh, 'Thêm khách hàng thành công', 201)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// PUT /api/khach-hang/:maKH: Cập nhật thông tin khách hàng
router.put('/:maKH', async (req, res) => {
  try {
    const kh = await suaKhachHang(req.params.maKH, req.body)
    return successResponse(res, kh, 'Cập nhật thông tin thành công')
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// DELETE /api/khach-hang/:maKH: Xóa khách hàng an toàn (chưa phát sinh giao dịch/đổi quà)
router.delete('/:maKH', async (req, res) => {
  try {
    const kq = await xoaKhachHang(req.params.maKH)
    return successResponse(res, kq, 'Xóa khách hàng thành công')
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// GET /api/khach-hang/:maKH/bien-dong-diem: Lịch sử điểm của khách
router.get('/:maKH/bien-dong-diem', async (req, res) => {
  try {
    const ds = await layBienDongDiemCuaKhach(req.params.maKH)
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// GET /api/khach-hang/:maKH/giao-dich: Lịch sử giao dịch của khách
router.get('/:maKH/giao-dich', async (req, res) => {
  try {
    const ds = await layGiaoDichCuaKhach(req.params.maKH)
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// GET /api/khach-hang/:maKH/doi-thuong: Lịch sử đổi quà của khách
router.get('/:maKH/doi-thuong', async (req, res) => {
  try {
    const ds = await layDoiThuongCuaKhach(req.params.maKH)
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// GET /api/khach-hang/:maKH/lich-su-hang: Lịch sử thay đổi hạng của khách
router.get('/:maKH/lich-su-hang', async (req, res) => {
  try {
    const ds = await layLichSuHangCuaKhach(req.params.maKH)
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

export default router
