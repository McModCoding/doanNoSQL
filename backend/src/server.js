import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB, closeDB } from './config/db.js'

// Import Routes
import khachHangRoutes from './routes/khachHang.routes.js'
import giaoDichRoutes from './routes/giaoDich.routes.js'
import doiThuongRoutes from './routes/doiThuong.routes.js'
import hangThanhVienRoutes from './routes/hangThanhVien.routes.js'
import phanThuongRoutes from './routes/phanThuong.routes.js'
import khuyenMaiRoutes from './routes/khuyenMai.routes.js'
import thongKeRoutes from './routes/thongKe.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json())

// Request Logger để giảng viên và nhóm theo dõi trong buổi demo
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    const statusColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m'
    const resetColor = '\x1b[0m'
    console.log(
      `[API] ${req.method.padEnd(6)} ${req.originalUrl} -> ${statusColor}${status}${resetColor} (${duration}ms)`,
    )
  })
  next()
})

// Root & Healthcheck
app.get('/', (req, res) => {
  res.json({
    name: 'LoyalCine Loyalty Backend API',
    version: '1.0.0',
    developer: 'Yến Linh (Tích hợp Logic Nghiệp vụ & API Truy vấn)',
    status: 'ONLINE',
    docs: '/api/health',
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'Connected',
    },
  })
})

// Mount API Routes theo Hợp đồng API (docs/01-hop-dong-api.md)
app.use('/api/khach-hang', khachHangRoutes)
app.use('/api/giao-dich', giaoDichRoutes)
app.use('/api/doi-thuong', doiThuongRoutes)
app.use('/api/hang-thanh-vien', hangThanhVienRoutes)
app.use('/api/phan-thuong', phanThuongRoutes)
app.use('/api/khuyen-mai', khuyenMaiRoutes)
app.use('/api/thong-ke', thongKeRoutes)

// 404 Handler cho đường dẫn không tồn tại
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy endpoint ${req.method} ${req.originalUrl}`,
  })
})

// Error Handler toàn cục
app.use((err, req, res, next) => {
  console.error('[Error]', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống máy chủ nội bộ.',
  })
})

// Khởi động server
async function startServer() {
  try {
    await connectDB()
    const server = app.listen(PORT, () => {
      console.log('='.repeat(65))
      console.log(`[LoyalCine Backend] Server đang chạy tại: http://localhost:${PORT}`)
      console.log(`[API Base] http://localhost:${PORT}/api`)
      console.log(`[Database] MongoDB: ${process.env.DB_NAME || 'CinemaLoyaltyDB'}`)
      console.log('='.repeat(65))
    })

    // Xử lý đóng ứng dụng an toàn
    const shutdown = async () => {
      console.log('\n[Server] Đang đóng kết nối an toàn...')
      server.close(async () => {
        await closeDB()
        console.log('[Server] Đã đóng server và kết nối MongoDB thành công.')
        process.exit(0)
      })
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (error) {
    console.error('[Server] Không thể khởi động server:', error.message)
    process.exit(1)
  }
}

startServer()
