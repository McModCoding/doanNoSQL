import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import { timCongCu } from './congCuMongo.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = process.env.DB_NAME || 'CinemaLoyaltyDB'
const OUTPUT_DIR = path.resolve('exports')
const CSV_FILE = path.join(OUTPUT_DIR, `khach_hang_${new Date().toISOString().slice(0, 10)}.csv`)

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const MONGOEXPORT_PATH = timCongCu('mongoexport')

async function exportUsingMongoTools() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(MONGOEXPORT_PATH)) {
      return reject(new Error(`Không tìm thấy mongoexport tại ${MONGOEXPORT_PATH}`))
    }

    const args = [
      `--uri=${MONGODB_URI}/${DB_NAME}`,
      '--collection=khach_hang',
      '--type=csv',
      '--fields=MaKH,HoTen,SoDienThoai,Email,MaThe,MaHangHienTai,DiemHienTai,TongChiTieu,TrangThai,NgayDangKy',
      `--out=${CSV_FILE}`,
    ]

    console.log(`[mongoexport] Đang chạy lệnh: mongoexport ${args.join(' ')}`)
    execFile(MONGOEXPORT_PATH, args, (error, stdout, stderr) => {
      if (error) {
        return reject(error)
      }
      console.log(stderr || stdout)
      resolve(true)
    })
  })
}

async function exportUsingNodeDriver() {
  console.log('[Export] Sử dụng Node.js MongoDB driver để trích xuất CSV...')
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(DB_NAME)

  const docs = await db.collection('khach_hang').find().sort({ MaKH: 1 }).toArray()
  const headers = ['MaKH', 'HoTen', 'SoDienThoai', 'Email', 'MaThe', 'MaHangHienTai', 'DiemHienTai', 'TongChiTieu', 'TrangThai', 'NgayDangKy']

  const lines = [headers.join(',')]
  for (const d of docs) {
    const sdt = d.SoDienThoai || d.SDT || ''
    const row = [
      `"${d.MaKH || ''}"`,
      `"${d.HoTen || ''}"`,
      `"${sdt}"`,
      `"${d.Email || ''}"`,
      `"${d.MaThe || d.MaTheThanhVien || ''}"`,
      `"${d.MaHangHienTai || ''}"`,
      d.DiemHienTai ?? 0,
      d.TongChiTieu ?? d.TongChiTieuNam ?? 0,
      `"${d.TrangThai || ''}"`,
      `"${d.NgayDangKy ? new Date(d.NgayDangKy).toISOString() : ''}"`,
    ]
    lines.push(row.join(','))
  }

  // Ghi file với BOM UTF-8 để mở bằng Excel hiển thị đúng dấu tiếng Việt
  fs.writeFileSync(CSV_FILE, '\ufeff' + lines.join('\r\n'), 'utf-8')
  await client.close()
  console.log(`[Export] Đã xuất thành công ${docs.length} khách hàng ra file: ${CSV_FILE}`)
}

async function main() {
  console.log('='.repeat(65))
  console.log('[QUẢN TRỊ DỮ LIỆU - YẾN LINH] XUẤT DANH SÁCH KHÁCH HÀNG RA CSV')
  console.log('='.repeat(65))

  try {
    await exportUsingMongoTools()
    console.log(`[Thành công] Đã xuất CSV bằng mongoexport: ${CSV_FILE}`)
  } catch (err) {
    console.warn(`[Cảnh báo] mongoexport gặp vấn đề (${err.message}), chuyển sang exporter dự phòng...`)
    await exportUsingNodeDriver()
  }
}

main().catch(console.error)
