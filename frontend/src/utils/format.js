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
  return ngay ? dayjs(ngay).format('DD/MM/YYYY') : '—'
}

export function formatNgayGio(ngay) {
  return ngay ? dayjs(ngay).format('HH:mm DD/MM/YYYY') : '—'
}

/** "LC00000001" -> "LC00 0000 01" cho dễ đọc trên thẻ */
export function formatMaThe(maThe = '') {
  return String(maThe).replace(/(.{4})(?=.)/g, '$1 ')
}
