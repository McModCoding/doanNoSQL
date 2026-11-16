// Cấu hình chung của ứng dụng: nhóm có thể đổi tên rạp và tài khoản demo tại đây.
// Màu sắc và font nằm ở src/design/tokens.js, lấy đúng theo docs/06-quy-chuan-giao-dien.md.

/** Tên rạp/ứng dụng (tên hư cấu, đổi tùy ý). */
export const APP_NAME = 'LoyalCine'
export const APP_SLOGAN = 'Thẻ thành viên rạp phim'

/** true khi đang chạy với API giả (MSW). Xem file .env.development */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/**
 * Tỷ lệ tích điểm dùng để HIỂN THỊ "điểm dự kiến" trước khi thanh toán.
 * Số điểm thật luôn do backend (logic của Linh) tính và trả về.
 */
export const SO_TIEN_MOI_DIEM = 1000 // 1 điểm cho mỗi 1.000đ

/**
 * Tài khoản demo hiện ở màn hình đăng nhập.
 * Khi nối backend thật, sửa số điện thoại cho khớp dữ liệu mẫu của Tính.
 */
export const DEMO_ACCOUNTS = [
  { soDienThoai: '0901000001', nhan: 'Hạng Đồng, còn 150.000đ lên Bạc' },
  { soDienThoai: '0901000002', nhan: 'Hạng Bạc, còn 150.000đ lên Vàng' },
  { soDienThoai: '0901000003', nhan: 'Hạng Vàng' },
  { soDienThoai: '0901000004', nhan: 'Tài khoản ngừng hoạt động' },
]
