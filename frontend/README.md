# Frontend – LoyalCine (React + Vite)

Xem hướng dẫn đầy đủ ở `../README.md`.

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy dev server tại http://localhost:5173 (mặc định dùng API giả – xem `.env.development`) |
| `npm test` | Chạy unit test (Vitest) |
| `npm run lint` | Kiểm tra mã nguồn (Oxlint) |
| `npm run build` | Build bản production vào `dist/` |

## Cấu trúc `src/`

| Thư mục | Nội dung |
|---|---|
| `api/` | Tầng gọi API (axios) – nơi duy nhất biết URL; `mappers.js` chuyển đổi tên trường |
| `mocks/` | API giả (MSW): `seed.js` dữ liệu mẫu 8 collection, `logic.js` mô phỏng nghiệp vụ, `handlers.js` các endpoint |
| `pages/customer/` | Đăng nhập, Trang chủ (thẻ thành viên), Mua vé, Thanh toán MoMo, Đổi quà, Lịch sử |
| `pages/admin/` | Dashboard, Khách hàng, Giao dịch, Đổi thưởng, Phần thưởng |
| `components/` | Thẻ thành viên, thanh tiến trình hạng, nhãn trạng thái... |
| `utils/` | Tính hạng/tiến độ (`tier.js`), định dạng tiền & ngày (`format.js`) |
| `config.js` | Tên rạp, màu hạng, tài khoản demo |
