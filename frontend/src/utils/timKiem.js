/** Chuẩn hóa chuỗi để tìm kiếm không dấu, không phân biệt hoa thường: "Trần" -> "tran" */
export function boDauTimKiem(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}
