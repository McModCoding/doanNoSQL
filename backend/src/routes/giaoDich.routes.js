import { Router } from 'express'
import {
  taoGiaoDich,
  layGiaoDichTheoMa,
  layDanhSachGiaoDich,
  capNhatTrangThaiGiaoDich,
} from '../services/giaoDich.service.js'
import { LoiNghiepVu } from '../services/khachHang.service.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = Router()

// GET /api/giao-dich: Danh sách giao dịch
router.get('/', async (req, res) => {
  try {
    const { trangThai, maKH } = req.query
    const ds = await layDanhSachGiaoDich({ trangThai, maKH })
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// GET /api/giao-dich/:maGD: Chi tiết 1 giao dịch
router.get('/:maGD', async (req, res) => {
  try {
    const gd = await layGiaoDichTheoMa(req.params.maGD)
    return successResponse(res, gd)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// POST /api/giao-dich: Tạo giao dịch mua vé / combo mới (ở trạng thái PENDING)
router.post('/', async (req, res) => {
  try {
    const gd = await taoGiaoDich(req.body)
    return successResponse(res, gd, 'Tạo giao dịch thành công', 201)
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

// PATCH /api/giao-dich/:maGD/trang-thai: Cập nhật trạng thái giao dịch
// Khi COMPLETED -> Tự động tích điểm + Tự động thăng hạng bằng $switch
router.patch('/:maGD/trang-thai', async (req, res) => {
  try {
    const { TrangThai } = req.body
    if (!TrangThai) {
      return errorResponse(res, 'Thiếu trường TrangThai trong request body.', 400)
    }
    const ketQua = await capNhatTrangThaiGiaoDich(req.params.maGD, TrangThai)
    return successResponse(res, ketQua, 'Cập nhật trạng thái giao dịch thành công')
  } catch (err) {
    return errorResponse(res, err.message, err instanceof LoiNghiepVu ? err.status : 500)
  }
})

export default router
