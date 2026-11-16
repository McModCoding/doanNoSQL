import { useCallback, useEffect, useMemo, useState } from 'react'
import { layDsHang } from '../api/hangThanhVien.js'
import { layKhachHang, timKhachHang } from '../api/khachHang.js'
import { KhachHangContext } from './khachHangContext.js'

const KHOA_MA_KH = 'loyalcine-ma-kh'

export function CustomerProvider({ children }) {
  const [maKH, setMaKH] = useState(() => localStorage.getItem(KHOA_MA_KH))
  const [khachHang, setKhachHang] = useState(null)
  const [dsHang, setDsHang] = useState([])
  const [loi, setLoi] = useState(null)

  const dangXuat = useCallback(() => {
    localStorage.removeItem(KHOA_MA_KH)
    setMaKH(null)
    setKhachHang(null)
    setLoi(null)
  }, [])

  /** Tải lại thông tin khách + danh sách hạng (gọi sau khi thanh toán/đổi quà). */
  const taiLai = useCallback(async () => {
    if (!maKH) return
    try {
      const [kh, hang] = await Promise.all([layKhachHang(maKH), layDsHang()])
      setKhachHang(kh)
      setDsHang(hang)
      setLoi(null)
    } catch (e) {
      if (e.status === 404) dangXuat() // khách không còn trong CSDL (vd. vừa khôi phục dữ liệu)
      else setLoi(e)
    }
  }, [maKH, dangXuat])

  // Tải thông tin khách khi đăng nhập / mở lại ứng dụng (bỏ qua kết quả cũ nếu maKH đã đổi)
  useEffect(() => {
    if (!maKH) return undefined
    let daHuy = false
    Promise.all([layKhachHang(maKH), layDsHang()]).then(
      ([kh, hang]) => {
        if (daHuy) return
        setKhachHang(kh)
        setDsHang(hang)
        setLoi(null)
      },
      (e) => {
        if (daHuy) return
        if (e.status === 404) dangXuat()
        else setLoi(e)
      },
    )
    return () => {
      daHuy = true
    }
  }, [maKH, dangXuat])

  /** Đăng nhập mô phỏng: tra cứu khách theo số điện thoại, chỉ cho phép ACTIVE. */
  const dangNhap = useCallback(async (soDienThoai) => {
    const sdt = String(soDienThoai ?? '').trim()
    if (!/^0\d{9}$/.test(sdt)) throw new Error('Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.')
    const ds = await timKhachHang({ soDienThoai: sdt })
    const kh = ds[0]
    if (!kh) throw new Error('Không tìm thấy thành viên với số điện thoại này.')
    if (kh.TrangThai !== 'ACTIVE') throw new Error('Tài khoản đã ngừng hoạt động. Vui lòng liên hệ quầy vé để được hỗ trợ.')
    localStorage.setItem(KHOA_MA_KH, kh.MaKH)
    setKhachHang(kh)
    setMaKH(kh.MaKH)
    return kh
  }, [])

  const giaTri = useMemo(
    () => ({ maKH, khachHang, dsHang, loi, dangNhap, dangXuat, taiLai, datKhachHang: setKhachHang }),
    [maKH, khachHang, dsHang, loi, dangNhap, dangXuat, taiLai],
  )
  return <KhachHangContext.Provider value={giaTri}>{children}</KhachHangContext.Provider>
}
