/**
 * Tiện ích hỗ trợ xử lý chuỗi, định dạng và sinh mã nghiệp vụ
 */

/** Bỏ dấu tiếng Việt để tìm kiếm: "Trần Minh Anh" -> "tran minh anh" */
export function boDau(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/** Định dạng tiền VND */
export function formatVND(n) {
  return (Number(n) || 0).toLocaleString('vi-VN') + 'đ'
}

const KY_TU_VOUCHER = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Sinh mã voucher ngẫu nhiên: VC-7K2M9Q */
export function taoMaVoucher() {
  let ma = ''
  for (let i = 0; i < 6; i++) {
    ma += KY_TU_VOUCHER[Math.floor(Math.random() * KY_TU_VOUCHER.length)]
  }
  return `VC-${ma}`
}

/** Sinh mã nghiệp vụ tiếp theo trong collection: KH001 -> KH002, GD000041 -> GD000042 */
export async function sinhMaTiepTheo(col, truong, tienTo, doDai) {
  const docs = await col
    .find({ [truong]: { $regex: `^${tienTo}\\d+` } }, { projection: { [truong]: 1 } })
    .toArray()

  let max = 0
  for (const d of docs) {
    const val = String(d[truong] ?? '')
    const numPart = parseInt(val.slice(tienTo.length), 10)
    if (!Number.isNaN(numPart) && numPart > max) {
      max = numPart
    }
  }
  return tienTo + String(max + 1).padStart(doDai, '0')
}
