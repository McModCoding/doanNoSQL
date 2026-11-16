// "Cơ sở dữ liệu" của API giả: lưu 8 collection trong localStorage của trình duyệt.
// - Dùng chung giữa các tab (mở Customer App và Admin cùng lúc vẫn thấy dữ liệu khớp nhau)
// - F5 không mất dữ liệu
// - Nút "Khôi phục dữ liệu mẫu" = tạo lại dữ liệu ban đầu (giống chạy mongorestore)
import { taoDuLieuMau } from './seed.js'

const KHOA = 'loyalcine-mock-db-v1'

export function docDb() {
  try {
    const s = localStorage.getItem(KHOA)
    if (s) return JSON.parse(s)
  } catch {
    // dữ liệu hỏng -> tạo lại
  }
  return khoiPhucDuLieuMau()
}

export function ghiDb(db) {
  localStorage.setItem(KHOA, JSON.stringify(db))
}

export function khoiPhucDuLieuMau() {
  const db = taoDuLieuMau(new Date())
  ghiDb(db)
  return db
}
