import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = process.env.DB_NAME || 'CinemaLoyaltyDB'
const BACKUP_PATH = path.resolve('backup', 'chuan', DB_NAME)

const MONGORESTORE_PATH = 'C:\\Program Files\\MongoDB\\mongodb-database-tools-windows-x86_64-100.19.1\\bin\\mongorestore.exe'

async function restoreDatabase() {
  console.log('='.repeat(65))
  console.log(`[QUẢN TRỊ & AN TOÀN DỮ LIỆU - YẾN LINH] KHÔI PHỤC CSDL (mongorestore --drop)`)
  console.log(`Database mục tiêu: ${DB_NAME}`)
  console.log(`Thư mục nguồn backup: ${BACKUP_PATH}`)
  console.log('='.repeat(65))

  if (!fs.existsSync(BACKUP_PATH)) {
    console.error(`[Lỗi] Không tìm thấy thư mục backup tại: ${BACKUP_PATH}`)
    console.log(`Vui lòng chạy script backup trước (npm run backup) hoặc nạp dữ liệu mẫu (npm run seed).`)
    process.exit(1)
  }

  return new Promise((resolve, reject) => {
    const args = [
      `--uri=${MONGODB_URI}`,
      `--db=${DB_NAME}`,
      '--drop',
      BACKUP_PATH,
    ]

    console.log(`[mongorestore] Đang khôi phục CSDL về trạng thái chuẩn...`)
    execFile(MONGORESTORE_PATH, args, (error, stdout, stderr) => {
      if (error) {
        console.error('[mongorestore] Lỗi khi khôi phục:', error.message)
        return reject(error)
      }
      console.log(stderr || stdout)
      console.log(`\n[Thành công] CSDL "${DB_NAME}" đã được khôi phục nguyên vẹn về trạng thái chuẩn phục vụ demo!`)
      resolve(true)
    })
  })
}

restoreDatabase().catch(console.error)
