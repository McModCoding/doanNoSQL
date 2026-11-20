import { Router } from 'express'
import { layDanhSachPhanThuong } from '../services/doiThuong.service.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = Router()

// GET /api/phan-thuong: Danh mục phần thưởng
router.get('/', async (req, res) => {
  try {
    const { loai, trangThai } = req.query
    const ds = await layDanhSachPhanThuong({ loai, trangThai })
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
})

export default router
