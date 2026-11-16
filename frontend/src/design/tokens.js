// Giá trị lấy ĐÚNG từ DESIGN.md (hướng "Vé giấy"). Không thêm màu, font, cỡ chữ hay khoảng cách nào
// ngoài file đó. Nếu cần một giá trị chưa có: hỏi chủ dự án trước (CLAUDE.md).
// Các biến CSS tương ứng nằm ở đầu src/index.css; hai nơi phải luôn khớp nhau.

export const MAU = {
  nen: '#F5F4F0', // Nền chính: giấy vé in nhiệt
  nenPhu: '#E8E5DD', // Nền phụ: cuống vé
  chu: '#1A1A1A', // Chữ chính: mực in vé
  chuPhu: '#5C5852', // Chữ phụ: mực in mờ
  nhan: '#B42318', // Màu nhấn: đỏ dấu soát vé (chỉ nút chính và link)
  nhanDam: '#8F1B12', // Hover / nhấn của nút chính
  vien: '#CFCAC0', // Viền: đường răng cưa
  // Màu chức năng (chỉ cho nhãn nhỏ, thông báo, biểu đồ; luôn kèm chữ)
  hangDong: '#8A5A3B',
  hangBac: '#5B6068',
  hangVang: '#7A5B10',
  thanhCong: '#2F6B3A',
  dangCho: '#8A5A00',
  loi: '#B42318',
  chuTrenNut: '#FFFFFF', // chữ trắng trên nút chính (DESIGN.md phần 5)
}

export const MAU_HANG = { DONG: MAU.hangDong, BAC: MAU.hangBac, VANG: MAU.hangVang }

export const FONT = {
  tieuDe: '"Barlow Condensed", "Be Vietnam Pro", sans-serif',
  noiDung: '"Be Vietnam Pro", sans-serif',
}

/** Bóng đổ: chỉ cho hộp thoại và menu nổi. */
export const BONG_NOI = '0 8px 24px rgba(26, 26, 26, 0.16)'
