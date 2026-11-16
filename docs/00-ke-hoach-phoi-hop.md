# Kế hoạch phối hợp: 3 người làm song song, không chờ nhau

## Trả lời nhanh: Lâm có phải đợi Tính và Linh xong mới làm không?

**Không cần đợi.** Bốn bước trong tài liệu phân công (Tính → Linh → Lâm → cả nhóm) mô tả đường đi của **dữ liệu**: MongoDB → API → giao diện. Nó không phải thứ tự **làm việc** bắt buộc. Nếu chờ tuần tự, toàn bộ phần frontend, báo cáo, slide và demo sẽ dồn vào cuối kỳ. Đó là phần rủi ro nhất của cả nhóm.

Cách làm song song:

1. **Chốt hợp đồng API trước** (`01-hop-dong-api.md`): danh sách endpoint, mẫu JSON và tên trường.
2. **Lâm làm frontend với API giả (mock)** theo đúng hợp đồng. Bản này **đã chạy được**.
3. **Tính và Linh làm backend thật** theo cùng hợp đồng.
4. Khi backend xong, frontend đặt `VITE_USE_MOCK=false` là chạy với dữ liệu thật, không phải sửa giao diện.

## Ai làm gì ngay bây giờ

| Người | Làm ngay được | Cần người khác |
|---|---|---|
| **Tính** | <ul><li>Tạo 8 collection và dữ liệu mẫu theo mục 2 của hợp đồng (có 4 tài khoản demo)</li><li>Khởi tạo Express, kết nối MongoDB</li><li>Viết các endpoint đọc/ghi cơ bản: `/khach-hang`, `/hang-thanh-vien`, `/giao-dich`, `/phan-thuong`, …</li></ul> | Chỉ cần hợp đồng API đã chốt |
| **Linh** | <ul><li>Viết logic `COMPLETED → EARN → thăng hạng ($switch)`</li><li>Đổi quà an toàn</li><li>2 pipeline thống kê</li><li>Export CSV, mongodump/mongorestore</li></ul> | Khung server và model của Tính. Có thể viết và thử trước pipeline trong Studio 3T. |
| **Lâm** | <ul><li>Frontend: đã xong bản chạy mock</li><li>Đặc tả kiến trúc (`02`), dàn ý slide (`03`), kịch bản demo (`04`)</li></ul> | API thật, để nối vào và chụp ảnh số liệu thật |

## Các mốc tích hợp

| Mốc | Nội dung | Đầu ra | Kiểm tra bằng |
|---|---|---|---|
| **M1** | Cả nhóm đọc và chốt hợp đồng API | Bản `01-hop-dong-api.md` đã đánh dấu mục 6 "Việc cần chốt" | Không còn câu hỏi mở |
| **M2** | Tính xong khung server và các endpoint đọc/ghi | Server chạy ở `http://localhost:3000/api` | Lâm tắt mock: đăng nhập, thẻ thành viên, lịch sử, danh mục quà hiển thị đúng |
| **M3** | Linh xong logic và thống kê | `PATCH /giao-dich/:maGD/trang-thai`, `POST /doi-thuong`, 2 API thống kê | Chạy trọn kịch bản demo trên dữ liệu thật |
| **M4** | Đóng băng tính năng | Ảnh chụp số liệu thật cho báo cáo và slide | Báo cáo và slide hoàn chỉnh |
| **M5** | Tập dượt demo, sao lưu dữ liệu | Thư mục `mongodump` chuẩn và kịch bản đã tập 2 lần | Chạy `04-kich-ban-demo.md` không lỗi |

## Checklist nối API thật (sau mốc M2)

1. Tính chạy server ở port 3000. Mọi route có tiền tố `/api`, response theo dạng `{ success, data, message }`.
2. Lâm tạo file `frontend/.env.development.local`:
   ```
   VITE_USE_MOCK=false
   VITE_API_TARGET=http://localhost:3000
   ```
   Sau đó chạy lại `npm run dev`. Trên thanh tiêu đề Admin sẽ đổi từ nhãn "Dữ liệu giả (mock)" sang **"API thật"**.
3. Đi lần lượt các màn hình theo bảng endpoint ★ trong hợp đồng. Màn hình báo lỗi nào thì xem thông báo, vì frontend hiển thị đúng `message` backend trả về.
4. Nếu **tên trường lệch** so với hợp đồng: sửa `frontend/src/api/mappers.js`, hoặc cả nhóm sửa hợp đồng cho thống nhất.
5. Cập nhật danh sách SĐT tài khoản demo trong `frontend/src/config.js` (`DEMO_ACCOUNTS`) cho khớp dữ liệu thật.

## Những điểm trong tài liệu phân công nên chỉnh lại cho khớp

- **Kịch bản demo** "tài khoản 9.500 điểm, mua 1 triệu → lên Bạc" chỉ đúng nếu hạng xét theo **tổng chi tiêu** và tài khoản có tổng chi tiêu gần 10 triệu. Đề xuất dữ liệu demo:
  - KH001 có `TongChiTieu` = 9.850.000đ và 9.500 điểm.
  - Màn hình hiện "Bạn cần chi tiêu thêm **150.000đ** để lên hạng Bạc".
  - Mua 2 vé 2D (190.000đ) qua MoMo được +190 điểm và lên **Bạc** ngay.

  Như vậy sát với rạp phim hơn mua 1 triệu.
- **Hạng xét theo `TongChiTieu`, không theo `DiemHienTai`**, vì đổi quà làm giảm điểm.
- Bước 2 có câu "mua sắm thời trang trực tuyến". Đề tài là **rạp phim** nên đổi thành "đặt vé xem phim, mua combo bắp nước".
