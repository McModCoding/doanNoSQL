import { Router } from 'express'
import { getDB } from '../config/db.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = Router()

// GET /api/khuyen-mai: Danh sách chương trình khuyến mãi
router.get('/', async (req, res) => {
  try {
    const db = getDB()
    const { conHieuLuc } = req.query
    const now = new Date()
    const filter = {}

    if (String(conHieuLuc) === 'true') {
      filter.TrangThai = 'ACTIVE'
      filter.NgayBatDau = { $lte: now }
      filter.NgayKetThuc = { $gte: now }
    }

    const ds = await db.collection('khuyen_mai').find(filter).sort({ NgayBatDau: -1 }).toArray()
    return successResponse(res, ds)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
})

export default router
