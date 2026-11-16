import dayjs from 'dayjs'

const so = new Intl.NumberFormat('vi-VN')

/** 150000 -> "150.000đ" */
export function formatVND(soTien) {
  return `${so.format(Math.round(Number(soTien) || 0))}đ`
}

/** 9500 -> "9.500" */
export function formatDiem(diem) {
  return so.format(Math.round(Number(diem) || 0))
}

/** Số điểm có dấu: 190 -> "+190", -500 -> "−500" */
export function formatDiemCoDau(diem) {
  const n = Math.round(Number(diem) || 0)
  return n > 0 ? `+${so.format(n)}` : n < 0 ? `−${so.format(Math.abs(n))}` : '0'
}

export function formatNgay(ngay) {
  return ngay ? dayjs(ngay).format('DD/MM/YYYY') : 'Chưa có'
}

export function formatNgayGio(ngay) {
  return ngay ? dayjs(ngay).format('HH:mm DD/MM/YYYY') : 'Chưa có'
}

/** "LC00000001" -> "LC00 0000 01" cho dễ đọc trên thẻ */
export function formatMaThe(maThe = '') {
  return String(maThe).replace(/(.{4})(?=.)/g, '$1 ')
}

/** 2026-11-16T09:30 -> "09:30" */
export function formatGio(ngay) {
  return ngay ? dayjs(ngay).format('HH:mm') : 'Chưa có'
}

/** 2026-11-16T... -> "16/11" */
export function formatNgayNgan(ngay) {
  return ngay ? dayjs(ngay).format('DD/MM') : 'Chưa có'
}

/**
 * Gom danh sách theo tháng, giữ thứ tự sẵn có (sổ điểm, giao dịch mới nhất trước).
 * Trả về [{ khoa: '2026-11', nhan: 'Tháng 11/2026', ds: [...] }].
 */
export function nhomTheoThang(ds, layNgay) {
  const nhom = new Map()
  for (const muc of ds) {
    const d = dayjs(layNgay(muc))
    const khoa = d.format('YYYY-MM')
    if (!nhom.has(khoa)) nhom.set(khoa, { khoa, nhan: `Tháng ${d.format('MM/YYYY')}`, ds: [] })
    nhom.get(khoa).ds.push(muc)
  }
  return [...nhom.values()]
}
