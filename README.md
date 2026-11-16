# doanNoSQL: LoyalCine, app khách hàng thân thiết rạp chiếu phim

Phần việc của **Nguyễn Khánh Lâm**: Frontend (Customer App + Admin Dashboard) và tài liệu cuối kỳ (đặc tả kiến trúc, slide, kịch bản demo).
Frontend **chạy được ngay bằng dữ liệu giả (mock)**, không cần chờ backend. Khi backend của Tính & Linh xong, chỉ cần tắt mock.

## Nội dung thư mục

| Đường dẫn | Nội dung |
|---|---|
| `frontend/` | Ứng dụng React (Vite): Customer App giao diện điện thoại + Admin Dashboard |
| `docs/00-ke-hoach-phoi-hop.md` | Cách 3 người làm song song, các mốc tích hợp, checklist nối API thật |
| `docs/01-hop-dong-api.md` | **Hợp đồng API**: gửi Tính & Linh chốt trước khi code |
| `docs/02-dac-ta-kien-truc.md` (+ `.docx`) | Bản nháp chương *Đặc tả kiến trúc phần mềm* cho báo cáo |
| `docs/03-dan-y-slide.md` | Dàn ý slide thuyết trình, có phân công người nói |
| `docs/04-kich-ban-demo.md` | Kịch bản demo vòng khép kín, lệnh IntelliShell, bảng so sánh App / IntelliShell / Visual Query Builder |
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

Mở http://localhost:5173 và chọn **Customer App** hoặc **Admin Dashboard**.

Tài khoản demo (bấm chọn nhanh ở màn hình đăng nhập):

| SĐT | Tình huống |
|---|---|
| 0901000001 | Hạng Đồng, 9.500 điểm, còn **150.000đ** lên Bạc → mua 2 vé 2D là lên Bạc |
| 0901000002 | Hạng Bạc, còn 150.000đ lên Vàng |
| 0901000003 | Hạng Vàng (hạng cao nhất) |
| 0901000004 | Tài khoản INACTIVE, không đăng nhập được |

Dữ liệu giả được lưu trong trình duyệt (localStorage). Bấm **"Khôi phục dữ liệu mẫu"** (ở trang đầu hoặc trang Admin) để quay về dữ liệu ban đầu, tương tự `mongorestore`.

## Nối với backend thật

Tạo file `frontend/.env.development.local` với nội dung:

```
VITE_USE_MOCK=false
VITE_API_TARGET=http://localhost:3000
```

Sau đó chạy lại `npm run dev`. Frontend gọi `/api/...` và Vite tự chuyển tiếp sang server Express, nên không cần cấu hình CORS. Nếu tên trường của backend khác hợp đồng, chỉ cần sửa `frontend/src/api/mappers.js`. Chi tiết xem `docs/00-ke-hoach-phoi-hop.md`.

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
