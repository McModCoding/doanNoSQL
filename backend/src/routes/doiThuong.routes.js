import { Router } from 'express'
import {
  thucHienDoiThuong,
  layDanhSachDoiThuong,
} from '../services/doiThuong.service.js'
import { LoiNghiepVu } from '../services/khachHang.service.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = Router()

// GET /api/doi-thuong: Danh sách lượt đổi quà
router.get('/', async (req, res) => {
  try {
    const { maKH } = req.query
    const ds = await layDanhSachDoiThuong({ maKH })
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// POST /api/doi-thuong: Đổi quà bằng điểm thưởng
router.post('/', async (req, res) => {
  try {
    const { MaKH, MaPhanThuong } = req.body
    const ketQua = await thucHienDoiThuong({ MaKH, MaPhanThuong })
    return successResponse(res, ketQua, 'Đổi thưởng thành công', 201)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

export default router
