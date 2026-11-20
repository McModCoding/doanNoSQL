import { Router } from 'express'
import {
  thongKeDiemTheoThang,
  topDoiQua,
  khachHangTheoHang,
  tongQuan,
} from '../services/thongKe.service.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = Router()

// GET /api/thong-ke/diem-phat-hanh-theo-thang?nam=2026: Điểm EARN theo từng tháng
router.get('/diem-phat-hanh-theo-thang', async (req, res) => {
  try {
    const { nam } = req.query
    const ds = await thongKeDiemTheoThang(nam)
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
})

// GET /api/thong-ke/top-doi-qua?limit=10&nam=2026: Top khách hàng đổi quà tích cực nhất
router.get('/top-doi-qua', async (req, res) => {
  try {
    const { limit, nam } = req.query
    const ds = await topDoiQua({ limit, nam })
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
})

// GET /api/thong-ke/khach-hang-theo-hang: Thống kê số lượng khách hàng theo từng thứ hạng
router.get('/khach-hang-theo-hang', async (req, res) => {
  try {
    const ds = await khachHangTheoHang()
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
})

// GET /api/thong-ke/tong-quan: Các chỉ số KPI tổng quan vận hành tháng hiện tại
router.get('/tong-quan', async (req, res) => {
  try {
    const kq = await tongQuan()
    return successResponse(res, kq)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
})

export default router
