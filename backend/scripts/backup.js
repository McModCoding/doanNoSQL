import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = process.env.DB_NAME || 'CinemaLoyaltyDB'
const BACKUP_DIR = path.resolve('backup', 'chuan')

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

const MONGODUMP_PATH = 'C:\\Program Files\\MongoDB\\mongodb-database-tools-windows-x86_64-100.19.1\\bin\\mongodump.exe'

async function backupDatabase() {
  console.log('='.repeat(65))
  console.log(`[QUẢN TRỊ & AN TOÀN DỮ LIỆU - YẾN LINH] SAO LƯU CSDL (mongodump)`)
  console.log(`Database: ${DB_NAME}`)
  console.log(`Thư mục lưu trữ: ${BACKUP_DIR}`)
  console.log('='.repeat(65))

  return new Promise((resolve, reject) => {
    const args = [
      `--uri=${MONGODB_URI}`,
      `--db=${DB_NAME}`,
      `--out=${BACKUP_DIR}`,
    ]

    console.log(`[mongodump] Đang thực thi lệnh sao lưu...`)
    execFile(MONGODUMP_PATH, args, (error, stdout, stderr) => {
      if (error) {
        console.error('[mongodump] Lỗi khi sao lưu:', error.message)
        return reject(error)
      }
      console.log(stderr || stdout)
      console.log(`\n[Thành công] Đã sao lưu toàn bộ cấu trúc CSDL và index ra thư mục: ${BACKUP_DIR}\\${DB_NAME}`)
      resolve(true)
    })
  })
}

backupDatabase().catch(console.error)
