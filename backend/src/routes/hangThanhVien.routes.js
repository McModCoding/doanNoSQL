import { Router } from 'express'
import { getDB } from '../config/db.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = Router()

// GET /api/hang-thanh-vien: Danh sách hạng và ngưỡng chi tiêu
router.get('/', async (req, res) => {
  try {
    const db = getDB()
    const ds = await db.collection('hang_thanh_vien').find().sort({ ThuTu: 1, MucChiTieuToiThieu: 1 }).toArray()

    // Chuẩn hóa trường theo hợp đồng API: MaHang, TenHang, NguongChiTieu, MauSac, QuyenLoi
    const chuanHoa = ds.map((h) => ({
      ...h,
      NguongChiTieu: Number(h.NguongChiTieu ?? h.MucChiTieuToiThieu ?? 0),
      QuyenLoi: h.QuyenLoi || [],
    }))

    return successResponse(res, chuanHoa)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
})

export default router
