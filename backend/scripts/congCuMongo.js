// Tìm công cụ MongoDB Database Tools (mongodump, mongorestore, mongoexport) trên máy đang chạy.
// Thứ tự tìm:
//   1. Thư mục trong biến môi trường MONGO_TOOLS_DIR (nếu có)
//   2. Trên Windows: các thư mục cài mặc định
//      - C:\Program Files\MongoDB\Tools\100\bin  (cài bằng file .msi)
//      - C:\Program Files\MongoDB\mongodb-database-tools-windows-x86_64-<phiên bản>\bin  (giải nén file .zip)
//   3. Không thấy thì trả về tên lệnh để hệ điều hành tự tìm trong PATH
import fs from 'fs'
import path from 'path'

const THU_MUC_GOC_WINDOWS = ['C:\\Program Files\\MongoDB\\Tools', 'C:\\Program Files\\MongoDB']

export function timCongCu(ten) {
  const tenFile = process.platform === 'win32' ? `${ten}.exe` : ten
  const ungVien = []

  if (process.env.MONGO_TOOLS_DIR) ungVien.push(path.join(process.env.MONGO_TOOLS_DIR, tenFile))

  if (process.platform === 'win32') {
    for (const goc of THU_MUC_GOC_WINDOWS) {
      if (!fs.existsSync(goc)) continue
      // phiên bản mới nhất trước: 100.19.1 đứng trước 100.9.0
      const con = fs.readdirSync(goc).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      for (const c of con) ungVien.push(path.join(goc, c, 'bin', tenFile))
    }
  }

  return ungVien.find((p) => fs.existsSync(p)) || tenFile
}

export const HUONG_DAN_CAI =
  'Cài MongoDB Database Tools (https://www.mongodb.com/try/download/database-tools), ' +
  'hoặc đặt biến MONGO_TOOLS_DIR trỏ tới thư mục bin chứa công cụ.'
