import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Đọc biến môi trường từ .env, .env.development, .env.local...
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Mọi request bắt đầu bằng /api sẽ được chuyển tiếp tới backend Express của Tính.
      // Nhờ vậy frontend không cần cấu hình CORS khi chạy dev.
      // (Khi VITE_USE_MOCK=true thì MSW trả lời trước, request không tới backend.)
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  }
})
