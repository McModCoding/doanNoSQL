# Backend của Trung Tính (`backend-tinh`)

Backend Node.js do Trung Tính viết, gộp vào repo nhóm ngày 21/11/2026. Mã gốc nằm nguyên trong commit "Thêm backend Express + Mongoose của Trung Tính (nguyên bản)". Các chỗ sửa khi gộp ghi ở mục cuối.

- **Công nghệ:** Express 5, Mongoose 9 (CommonJS), JWT (`jsonwebtoken`), mật khẩu băm bằng `bcryptjs`.
- **Dữ liệu:** 17 collection. Gồm 8 collection cốt lõi của đề bài (`khach_hang`, `giao_dich`, `bien_dong_diem`, `doi_thuong`, `hang_thanh_vien`, `phan_thuong`, `khuyen_mai`, `lich_su_hang`) và 9 collection vận hành rạp (`cum_rap`, `phong_chieu`, `phim`, `suat_chieu`, `ve`, `thanh_toan`, `san_pham`, `lich_su_ton_kho`, `ghi_nhan_chi_tieu`).
- **Script tạo CSDL:** `database/setup_all.js` tạo 17 collection, validator JSON Schema chặt (strict, error), 50 index và 34 document mẫu.

## Quan hệ với phần còn lại của repo

Giao diện LoyalCine (`frontend/`) đang nối với **backend chính** trong thư mục `backend/` (Yến Linh, cổng 3000, CSDL `CinemaLoyaltyDB`). Backend này chạy **riêng**:

| | Backend chính (`backend/`) | Backend của Tính (`backend-tinh/`) |
|---|---|---|
| Cổng | 3000 | 5000 |
| CSDL | `CinemaLoyaltyDB` (bản sao lưu chuẩn `backend/backup/chuan`) | `CinemaLoyaltyDB_Tinh` |
| Đăng nhập | Tra số điện thoại, không mật khẩu | Email hoặc SĐT + mật khẩu, trả JWT |
| Ngưỡng hạng | Bạc 10 triệu, Vàng 30 triệu (đúng đề bài) | Bạc 2 triệu, Vàng 5 triệu (dữ liệu mẫu) |
| Tích điểm | 1.000đ = 1 điểm | 10.000đ = 1 điểm gốc, cộng thưởng theo hạng; bắp nước không được tính điểm |
| Thống kê điểm theo tháng, top 10 đổi quà | Có (`/api/thong-ke/...`) | Chưa có. Có báo cáo doanh thu, phim, vé, sản phẩm, khách hàng |
| Dữ liệu mẫu | 20 khách, 183 giao dịch, 141 lượt đổi quà, có khách KH001 9.500 điểm cho kịch bản demo | 4 tài khoản, 1 phim, 1 suất chiếu |

Hai bên dùng chung tên collection nhưng cấu trúc document khác nhau (ví dụ trạng thái giao dịch `PENDING` so với `PENDING_PAYMENT`), nên không dùng chung một CSDL. Muốn giao diện chạy với backend này thì phải làm lại phần đăng nhập, mua vé (chọn suất, chọn ghế) và thêm các API thống kê. Việc đó cần cả nhóm chốt trước.

## Chạy trên Windows

Cần cài sẵn:
1. Node.js 22 LTS, giống frontend (riêng backend này cần tối thiểu 20.19).
2. MongoDB Community Server, đang chạy ở `localhost:27017`.
3. MongoDB Shell `mongosh` (https://www.mongodb.com/try/download/shell), để tạo CSDL tự động. Không cài thì chạy `database/setup_all.js` bằng IntelliShell của Studio 3T.

Rồi nháy đúp ở thư mục gốc repo:
- **`CHAY-BACKEND-TINH.bat`**: lần đầu tự cài thư viện, tự tạo file `.env` (có `JWT_SECRET` ngẫu nhiên), tự tạo CSDL `CinemaLoyaltyDB_Tinh` nếu đang trống, rồi bật server ở http://localhost:5000.
- **`TAO-CSDL-TINH.bat`**: xóa CSDL `CinemaLoyaltyDB_Tinh` và tạo lại từ đầu (hỏi Y/N trước). Không đụng CSDL demo `CinemaLoyaltyDB`.

## Chạy bằng lệnh

```bash
cd backend-tinh
npm install
npm run tao-env        # tạo .env từ .env.example nếu chưa có
npm run tao-csdl       # chạy database/setup_all.js bằng mongosh trên CSDL trong MONGODB_URI
npm start              # http://localhost:5000
npm test               # 52 bài test node:test, không cần MongoDB
```

`npm run tao-csdl -- --lam-lai` xóa CSDL rồi tạo lại. Script không bao giờ tạo hay xóa `CinemaLoyaltyDB`. Không có `mongosh` thì script dừng trước khi xóa gì và in hướng dẫn.

## Tài khoản thử

| Vai trò | Email | Mật khẩu |
|---|---|---|
| ADMIN | `admin@cinemaloyalty.test` | `AdminDemo!2026` |
| Khách hàng | `member1@cinemaloyalty.test` (cũng có `member2`, `member3`) | `MemberDemo!2026` |

Đăng nhập: `POST /api/auth/login` với body `{ "identifier": "<email hoặc SĐT>", "MatKhau": "..." }`. Các API cần đăng nhập đọc header `Authorization: Bearer <token>`.

## Các nhóm API

| Đường dẫn | Việc chính | Quyền |
|---|---|---|
| `/api/auth` | Đăng ký, đăng nhập, xem tài khoản, đổi mật khẩu, đăng xuất | Đăng ký, đăng nhập: ai cũng gọi được |
| `/api/khach-hang` | Danh sách (ADMIN), xem và sửa hồ sơ của mình, đổi trạng thái tài khoản (ADMIN) | Đăng nhập |
| `/api/hang-thanh-vien` | Danh sách hạng, lịch sử hạng, đối soát chi tiêu (ADMIN) | Xem: công khai |
| `/api/cum-rap`, `/api/phong-chieu`, `/api/phim`, `/api/suat-chieu` | Danh mục rạp; thêm, sửa, đổi trạng thái (ADMIN) | Xem: công khai |
| `/api/san-pham`, `/api/khuyen-mai` | Bắp nước, combo, khuyến mãi; đối soát tồn kho (ADMIN) | Xem: công khai |
| `/api/dat-ve` | Đặt vé, giữ ghế 10 phút, tạo giao dịch `PENDING_PAYMENT` | Đăng nhập |
| `/api/giao-dich` | Giao dịch của mình, chi tiết, hủy giao dịch đang chờ | Đăng nhập |
| `/api/thanh-toan` | Thanh toán MoMo Sandbox, IPN, thanh toán giả lập `POST /simulate` | Đăng nhập (trừ IPN) |
| `/api/ve` | Vé của mình; soát vé bằng mã QR (ADMIN) | Đăng nhập |
| `/api/tich-diem` | Tóm tắt điểm, lịch sử điểm, quà đổi được, đổi quà `POST /redeem`; đối soát (ADMIN) | Đăng nhập |
| `/api/bao-cao` | Doanh thu, phim, vé, sản phẩm, khách hàng | ADMIN |

Thử một lượt (đã chạy được với dữ liệu mẫu): đăng nhập `member1`, đặt 2 ghế còn trống của `SUAT_TEST_01` kèm 1 `SP_TEST_BAP`, gọi `POST /api/thanh-toan/simulate` với `{ "MaGD": "...", "outcome": "SUCCESS" }`. Kết quả: phát hành 2 vé, trừ tồn kho bắp, cộng 27 điểm (dòng bắp không tính điểm), gọi lần hai không cộng thêm.

## Đã sửa gì khi gộp vào repo

Chạy với MongoDB 8.3 thật (bộ test của Tính dùng CSDL giả nên không bắt được):
1. **Đặt vé luôn lỗi** "Error parsing array filter". Mongoose ép kiểu sai điều kiện `$or` khi nó đứng sau `"g.MaGhe"` trong `arrayFilters`. Sửa: bọc hai điều kiện trong `$and` (`services/datVeService.js`). Không sửa thì không mua được vé nào, nên cũng không tích điểm được.
2. **`GET /api/bao-cao/san-pham` lỗi** "arguments to $facet must be arrays". Sửa: tách nhánh `products` thành `productRows` và `productTotal` như báo cáo vé (`services/baoCaoService.js`).
3. **Tên CSDL** đổi thành `CinemaLoyaltyDB_Tinh`, khai báo một chỗ ở đầu `database/setup_all.js` (biến `TEN_CSDL_DICH`), để không đè CSDL demo. Ba file `scripts/migrations/` giữ nguyên tên `CinemaLoyaltyDB` vì chỉ dùng để nâng cấp CSDL cũ trên máy Tính.
4. **Thêm** `.env.example`, `scripts/tao-env.js`, `scripts/tao-csdl.js`, các lệnh `npm start`, `npm test`, `npm run tao-csdl` trong `package.json`, và README này.

Không đưa lên GitHub: `.env` (có `JWT_SECRET`) và `node_modules`.

## Việc còn lại (để Tính xem)

- Ngưỡng hạng trong dữ liệu mẫu (2 triệu, 5 triệu) khác đề bài (10 triệu, 30 triệu).
- Dữ liệu mẫu mới có 4 tài khoản. Đề bài giao phần "mở rộng dữ liệu thử nghiệm giả lập".
- Chưa có tài liệu Postman bàn giao cho Linh như đề bài ghi.
- `database/README.md` nói có 6 file script và bước 06 kiểm tra, nhưng chỉ có `setup_all.js` gộp 5 bước đầu.
- Thông báo lỗi của API viết tiếng Việt không dấu.
- Mongoose in cảnh báo tùy chọn `new` của `findOneAndUpdate()` sắp bỏ, nên đổi sang `returnDocument: 'after'`.
