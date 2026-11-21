# doanNoSQL: LoyalCine, app khách hàng thân thiết rạp chiếu phim

Phần việc của **Nguyễn Khánh Lâm**: Frontend (Customer App + Admin Dashboard) và tài liệu cuối kỳ (đặc tả kiến trúc, slide, kịch bản demo).
Frontend **chạy được ngay bằng dữ liệu giả (mock)**, không cần chờ backend. Khi backend của Tính & Linh xong, chỉ cần tắt mock.

## Nội dung thư mục

| Đường dẫn | Nội dung |
|---|---|
| `frontend/` | Ứng dụng React (Vite): app khách hàng (điện thoại và máy tính) + trang quản trị |
| `backend/` | API Node.js/Express + MongoDB (phần của Yến Linh): tích điểm, thăng hạng, đổi quà, thống kê; `scripts/` có nạp dữ liệu mẫu, sao lưu, khôi phục, xuất CSV; `backup/chuan/` là bản sao lưu chuẩn để demo |
| `backend-tinh/` | Backend của Trung Tính: Express 5 + Mongoose, đăng nhập JWT, 17 collection, script tạo CSDL có validator và index (`database/setup_all.js`). Chạy riêng ở cổng 5000, CSDL riêng `CinemaLoyaltyDB_Tinh`, chưa nối giao diện. Xem `backend-tinh/README.md` |
| `CHAY-APP.bat` | Chạy riêng frontend với dữ liệu giả, không cần MongoDB |
| `CHAY-HE-THONG.bat` | Chạy cả backend và frontend với dữ liệu thật |
| `KHOI-PHUC-CSDL.bat`, `SAO-LUU-CSDL.bat`, `XUAT-CSV.bat` | Khôi phục CSDL về bản chuẩn (`mongorestore --drop`), sao lưu (`mongodump`), xuất danh sách khách hàng ra CSV |
| `CHAY-BACKEND-TINH.bat`, `TAO-CSDL-TINH.bat` | Chạy backend của Tính (tự tạo CSDL riêng nếu đang trống); xóa và tạo lại CSDL riêng đó |
| `docs/00-ke-hoach-phoi-hop.md` | Cách 3 người làm song song, các mốc tích hợp, checklist nối API thật |
| `docs/01-hop-dong-api.md` | **Hợp đồng API**: gửi Tính & Linh chốt trước khi code |
| `docs/02-dac-ta-kien-truc.md` (+ `.docx`) | Bản nháp chương *Đặc tả kiến trúc phần mềm* cho báo cáo |
| `docs/03-dan-y-slide.md` | Dàn ý slide thuyết trình, có phân công người nói |
| `docs/04-kich-ban-demo.md` | Kịch bản demo vòng khép kín, lệnh IntelliShell, bảng so sánh App / IntelliShell / Visual Query Builder |
| `docs/05-bao-cao-phan-cong-yen-linh.md` | Báo cáo phần backend và logic nghiệp vụ của Yến Linh |
| `docs/hinh/` | Ảnh chụp màn hình (dữ liệu giả) và sơ đồ |
| `docs/so-do/` | Mã nguồn sơ đồ Mermaid (`.mmd`) để sửa lại khi cần |

## Chạy thử (dữ liệu giả, không cần backend)

Yêu cầu: **Node.js 22 LTS trở lên** (≥ 22.12).

**Cách nhanh nhất trên Windows:** nhấp đúp file **`CHAY-APP.bat`**. Lần đầu file sẽ tự cài thư viện, sau đó tự mở trình duyệt. Muốn tắt app thì đóng cửa sổ đen.

Hoặc chạy bằng lệnh:

```bash
cd frontend
```

```bash
npm install
```

```bash
npm run dev
```

Mở http://localhost:5173 và chọn **App khách hàng** hoặc **Trang quản trị**.

Đã có bản cũ trên máy và vừa lấy bản mới (tải ZIP mới hoặc `git pull`)? Chạy lại `npm install` trong thư mục `frontend` trước `npm run dev`, vì bản mới có thể thêm thư viện (`CHAY-APP.bat` tự làm bước này).

Tài khoản demo (bấm chọn nhanh ở màn hình đăng nhập):

| SĐT | Tình huống |
|---|---|
| 0901000001 | Hạng Đồng, 9.500 điểm, còn **150.000đ** lên Bạc → mua 2 vé 2D là lên Bạc |
| 0901000002 | Hạng Bạc, còn 150.000đ lên Vàng |
| 0901000003 | Hạng Vàng (hạng cao nhất) |
| 0901000004 | Tài khoản INACTIVE, không đăng nhập được |

Dữ liệu giả được lưu trong trình duyệt (localStorage). Bấm **"Khôi phục dữ liệu mẫu"** (ở trang đầu hoặc trang Admin) để quay về dữ liệu ban đầu, tương tự `mongorestore`.

## Chạy cả hệ thống với backend thật (MongoDB)

Cần cài thêm:
- **MongoDB Community Server** (bản 8.x), để chạy ở cổng 27017 như mặc định.
- **MongoDB Database Tools**, chỉ cần khi dùng khôi phục hoặc sao lưu. Các script tự tìm công cụ trong thư mục cài mặc định (`C:\Program Files\MongoDB\...`) hoặc trong PATH. Cài ở chỗ khác thì đặt biến `MONGO_TOOLS_DIR` trỏ tới thư mục `bin` của công cụ.

Các bước trên Windows:
1. Lần đầu, hoặc trước buổi demo: nhấp đúp **`KHOI-PHUC-CSDL.bat`** để nạp bản sao lưu chuẩn `backend/backup/chuan`. Chưa cài Database Tools thì chạy `npm run seed` trong thư mục `backend` để nạp dữ liệu mẫu.
2. Nhấp đúp **`CHAY-HE-THONG.bat`**. Lần đầu file sẽ tự cài thư viện, sau đó mở 2 cửa sổ: backend ở http://localhost:3000/api và frontend ở http://localhost:5173 (chế độ dữ liệu thật).

Hoặc chạy bằng lệnh, mỗi lệnh trong một cửa sổ riêng:

```bash
cd backend && npm install && npm start
```

```bash
cd frontend && npm install && npm run dev:api
```

`npm run dev:api` đọc file `frontend/.env.api` (`VITE_USE_MOCK=false`). Frontend gọi `/api/...` và Vite tự chuyển tiếp sang server Express, nên không cần cấu hình CORS. Backend đọc cấu hình từ `backend/.env` nếu có (mẫu: `backend/.env.example`). Không có file này thì dùng mặc định `mongodb://127.0.0.1:27017`, CSDL `CinemaLoyaltyDB`, cổng 3000. **Không đưa file `.env` lên GitHub.**

Bộ kiểm thử backend của Yến Linh: chạy `node scripts/test-api.js` trong thư mục `backend` sau khi khôi phục dữ liệu chuẩn.

## Backend của Trung Tính (chạy riêng)

Thư mục `backend-tinh/` là backend thứ hai của nhóm, do Trung Tính viết: Express 5 + Mongoose, đăng nhập bằng email hoặc SĐT và mật khẩu (JWT), 17 collection (thêm rạp, phòng, phim, suất chiếu, vé, thanh toán, sản phẩm, tồn kho), đặt vé giữ ghế, thanh toán giả lập, tích điểm, đổi quà và báo cáo doanh thu.

Giao diện **vẫn nối với backend chính** trong `backend/`. Backend của Tính chạy song song ở http://localhost:5000/api với CSDL riêng `CinemaLoyaltyDB_Tinh`, nên không đụng CSDL demo `CinemaLoyaltyDB`.

Trên Windows: cài thêm MongoDB Shell (`mongosh`), rồi nhấp đúp **`CHAY-BACKEND-TINH.bat`**. Cách chạy bằng lệnh, tài khoản thử và các điểm khác với backend chính: xem `backend-tinh/README.md`.

## Kiểm thử

```bash
cd frontend
```

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

`npm test` chạy 23 unit test cho logic tính hạng, định dạng số và logic mô phỏng: tích điểm, thăng hạng, không cộng điểm 2 lần, đổi quà khi thiếu điểm hoặc hết hàng.

## Ghi chú

- Màn hình MoMo là **mô phỏng** cho đồ án, không kết nối ví thật và không phát sinh giao dịch thật.
- "LoyalCine" và tên phim đều là tên hư cấu. Đổi tên rạp trong `frontend/src/config.js`.
