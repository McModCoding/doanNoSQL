// Cấu hình chung của ứng dụng – nhóm có thể đổi tên rạp, màu sắc, tài khoản demo tại đây.

/** Tên rạp/ứng dụng (tên hư cấu, đổi tùy ý). */
export const APP_NAME = 'LoyalCine'
export const APP_SLOGAN = 'Xem phim tích điểm – Đổi quà liền tay'

/** true khi đang chạy với API giả (MSW). Xem file .env.development */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/**
 * Tỷ lệ tích điểm dùng để HIỂN THỊ "điểm dự kiến" trước khi thanh toán.
 * Số điểm thật luôn do backend (logic của Linh) tính và trả về.
 */
export const SO_TIEN_MOI_DIEM = 1000 // 1 điểm cho mỗi 1.000đ

/** Màu dự phòng cho từng hạng (dùng khi document hang_thanh_vien không có MauSac). */
export const TIER_STYLE = {
  DONG: { color: '#a0522d', gradient: 'linear-gradient(135deg, #5c2a12 0%, #8e4d27 60%, #b8743f 100%)' },
  BAC: { color: '#6b7785', gradient: 'linear-gradient(135deg, #39414b 0%, #5f6b78 60%, #8a96a3 100%)' },
  VANG: { color: '#b8860b', gradient: 'linear-gradient(135deg, #5e3f00 0%, #93690c 60%, #be9128 100%)' },
}
/** Màu hồng dùng cho màn hình mô phỏng ví MoMo */
export const MAU_MOMO = '#ae2070'

export const TIER_STYLE_MAC_DINH = { color: '#595959', gradient: 'linear-gradient(135deg, #262626, #595959)' }

/**
 * Tài khoản demo hiện ở màn hình đăng nhập.
 * Khi nối backend thật, sửa số điện thoại cho khớp dữ liệu mẫu của Tính.
 */
export const DEMO_ACCOUNTS = [
  { soDienThoai: '0901000001', nhan: 'Hạng Đồng · còn 150.000đ lên Bạc' },
  { soDienThoai: '0901000002', nhan: 'Hạng Bạc · còn 150.000đ lên Vàng' },
  { soDienThoai: '0901000003', nhan: 'Hạng Vàng' },
  { soDienThoai: '0901000004', nhan: 'Tài khoản ngừng hoạt động' },
]
