import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { USE_MOCK } from './config.js'
import './index.css'

dayjs.locale('vi')

/** Bật API giả (MSW) khi VITE_USE_MOCK=true – xem file .env.development */
async function batMockNeuCan() {
  if (!USE_MOCK) return
  const { worker } = await import('./mocks/browser.js')
  await worker.start({
    quiet: true,
    // Chỉ cảnh báo khi frontend gọi một API /api/... chưa có trong mock (dễ phát hiện thiếu endpoint)
    onUnhandledFrame({ frame, defaults }) {
      const url = frame.data?.request?.url
      if (url && new URL(url).pathname.startsWith('/api/')) defaults.warn()
    },
  })
}

batMockNeuCan().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
