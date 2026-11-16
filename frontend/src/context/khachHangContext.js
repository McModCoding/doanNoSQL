import { createContext, useContext } from 'react'

export const KhachHangContext = createContext(null)

/** Thông tin khách đang đăng nhập ở Customer App. */
export function useKhachHang() {
  const ctx = useContext(KhachHangContext)
  if (!ctx) throw new Error('useKhachHang phải nằm trong <CustomerProvider>')
  return ctx
}
