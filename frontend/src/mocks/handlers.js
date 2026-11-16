// API GIẢ (Mock Service Worker) – trả lời đúng theo docs/01-hop-dong-api.md.
// Khi backend thật của Tính & Linh chạy được, đặt VITE_USE_MOCK=false là xong,
// không cần sửa giao diện.
import { delay, http, HttpResponse } from 'msw'
import { docDb, ghiDb } from './db.js'
import * as L from './logic.js'

const DO_TRE_MS = 250 // giả lập độ trễ mạng để thấy trạng thái "đang tải"

const thanhCong = (data, status = 200) => HttpResponse.json({ success: true, data }, { status })
const thatBai = (status, message) => HttpResponse.json({ success: false, message }, { status })

/**
 * Bọc 1 xử lý: đọc DB -> chạy logic -> (ghi DB nếu là thao tác thay đổi) -> trả envelope.
 * Lỗi nghiệp vụ (LoiNghiepVu) -> { success:false, message } với mã 4xx tương ứng.
 */
function xuLy(fn, { ghi = false, status = 200 } = {}) {
  return async ({ request, params }) => {
    await delay(DO_TRE_MS)
    const db = docDb()
    const query = Object.fromEntries(new URL(request.url).searchParams)
    const body = ['POST', 'PUT', 'PATCH'].includes(request.method) ? await request.json().catch(() => ({})) : undefined
    try {
      const data = fn(db, { query, params, body })
      if (ghi) ghiDb(db)
      return thanhCong(data, status)
    } catch (e) {
      if (e instanceof L.LoiNghiepVu) return thatBai(e.status, e.message)
      console.error('[mock] lỗi không mong đợi', e)
      return thatBai(500, `Lỗi máy chủ (mock): ${e.message}`)
    }
  }
}

export const handlers = [
  // ---- khach_hang
  http.get('/api/khach-hang', xuLy((db, { query }) => L.timKiemKhachHang(db, query))),
  http.post('/api/khach-hang', xuLy((db, { body }) => L.themKhachHang(db, body), { ghi: true, status: 201 })),
  http.get('/api/khach-hang/:maKH', xuLy((db, { params }) => L.layKhachHang(db, params.maKH))),
  http.put('/api/khach-hang/:maKH', xuLy((db, { params, body }) => L.suaKhachHang(db, params.maKH, body), { ghi: true })),
  http.delete('/api/khach-hang/:maKH', xuLy((db, { params }) => L.xoaKhachHang(db, params.maKH), { ghi: true })),
  http.get('/api/khach-hang/:maKH/bien-dong-diem', xuLy((db, { params }) => L.bienDongDiemCuaKhach(db, params.maKH))),
  http.get('/api/khach-hang/:maKH/giao-dich', xuLy((db, { params }) => L.giaoDichCuaKhach(db, params.maKH))),
  http.get('/api/khach-hang/:maKH/doi-thuong', xuLy((db, { params }) => L.doiThuongCuaKhach(db, params.maKH))),
  http.get('/api/khach-hang/:maKH/lich-su-hang', xuLy((db, { params }) => L.lichSuHangCuaKhach(db, params.maKH))),

  // ---- hang_thanh_vien, khuyen_mai
  http.get('/api/hang-thanh-vien', xuLy((db) => L.dsHangThanhVien(db))),
  http.get('/api/khuyen-mai', xuLy((db, { query }) => L.dsKhuyenMai(db, query))),

  // ---- giao_dich
  http.get('/api/giao-dich', xuLy((db, { query }) => L.dsGiaoDich(db, query))),
  http.post('/api/giao-dich', xuLy((db, { body }) => L.taoGiaoDich(db, body), { ghi: true, status: 201 })),
  http.get('/api/giao-dich/:maGD', xuLy((db, { params }) => L.layGiaoDich(db, params.maGD))),
  http.patch(
    '/api/giao-dich/:maGD/trang-thai',
    xuLy((db, { params, body }) => L.capNhatTrangThaiGiaoDich(db, params.maGD, body?.TrangThai), { ghi: true }),
  ),

  // ---- phan_thuong, doi_thuong
  http.get('/api/phan-thuong', xuLy((db, { query }) => L.dsPhanThuong(db, query))),
  http.get('/api/doi-thuong', xuLy((db, { query }) => L.dsDoiThuong(db, query))),
  http.post('/api/doi-thuong', xuLy((db, { body }) => L.doiThuong(db, body), { ghi: true, status: 201 })),

  // ---- thong_ke (mô phỏng các pipeline aggregation của Linh)
  http.get(
    '/api/thong-ke/diem-phat-hanh-theo-thang',
    xuLy((db, { query }) => L.thongKeDiemTheoThang(db, query.nam ?? new Date().getFullYear())),
  ),
  http.get('/api/thong-ke/top-doi-qua', xuLy((db, { query }) => L.topDoiQua(db, query.limit ?? 10, query.nam))),
  http.get('/api/thong-ke/khach-hang-theo-hang', xuLy((db) => L.khachHangTheoHang(db))),
  http.get('/api/thong-ke/tong-quan', xuLy((db) => L.tongQuan(db))),
]
