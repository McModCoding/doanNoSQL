# Kịch bản demo vòng khép kín (bản nháp)

> **Mục tiêu:** chứng minh dữ liệu chạy thông suốt Giao diện → API → MongoDB theo thời gian thực. Có đối chiếu bằng IntelliShell và Visual Query Builder.
> **Thời lượng:** 8–10 phút. **Chủ trì:** Lâm. **Hỗ trợ:** Tính (terminal server), Linh (Studio 3T, sao lưu).
> Tên trường trong các lệnh dưới đây theo hợp đồng API. **Nếu schema thật khác, sửa lại trước buổi demo.**

## 1. Chuẩn bị trước giờ demo (T-30 phút)

- [ ] Linh: khôi phục dữ liệu chuẩn:
  ```bash
  mongorestore --db <ten_db> --drop ./backup/chuan/<ten_db>
  ```
- [ ] Kiểm tra dữ liệu demo:
  - KH001 (SĐT `0901000001`) ở hạng **Đồng**, `TongChiTieu` **9.850.000đ**, **9.500 điểm**.
  - PT002 (voucher 50.000đ, 450 điểm) còn hàng.
- [ ] Tính: chạy MongoDB và server (`npm start`). Terminal mở to, chữ lớn, để giảng viên thấy log request.
- [ ] Lâm:
  - Đặt `VITE_USE_MOCK=false` rồi chạy `npm run dev`.
  - Mở 2 tab: `http://localhost:5173/app` (thu nhỏ cửa sổ hoặc bật chế độ giả lập điện thoại trong DevTools) và `http://localhost:5173/admin`.
  - Đăng xuất sẵn ở Customer App.
- [ ] Linh: mở Studio 3T với 2 tab IntelliShell đã dán sẵn lệnh ở mục 4. Mở sẵn 1 tab Visual Query Builder trên `khach_hang`.
- [ ] **Phương án dự phòng:**
  - Mạng hoặc server lỗi: chuyển frontend về `VITE_USE_MOCK=true`. Vẫn demo được giao diện và luồng nghiệp vụ, nhưng phải nói rõ là "dữ liệu giả".
  - Dữ liệu hỏng: Linh chạy lại `mongorestore` (mục 3, bước 9).

## 2. Lời mở đầu (30 giây – Lâm)

> "Nhóm em demo một vòng khép kín. Khách hàng mua vé trên app và thanh toán qua MoMo mô phỏng. API ghi giao dịch và cộng điểm. MongoDB cập nhật hạng ngay lập tức. Nhóm em sẽ đối chiếu trực tiếp bằng IntelliShell."

## 3. Các bước demo

| Bước | Ai | Thao tác | Lời thoại gợi ý | Kết quả mong đợi |
|---|---|---|---|---|
| 1 | Lâm | Customer App → bấm tài khoản demo `0901000001` | "Đăng nhập bằng số điện thoại của thành viên Trần Minh Anh." | Thẻ thành viên **Đồng**, **9.500 điểm**, QR/Barcode |
| 2 | Lâm | Chỉ vào thanh tiến trình; bấm chuyển QR ↔ Mã vạch | "Hệ thống tính từ `TongChiTieu` và ngưỡng trong `hang_thanh_vien`: còn **150.000đ** nữa là lên Bạc." | Dòng chữ "Bạn cần chi tiêu thêm 150.000đ để lên hạng Bạc" |
| 3 | Linh | IntelliShell: chạy lệnh **(A)** | "Đây là document gốc trong MongoDB trước khi giao dịch." | `DiemHienTai: 9500`, `TongChiTieu: 9850000`, `MaHangHienTai: "DONG"` |
| 4 | Lâm | Mua vé → *Hành Tinh Cuối Cùng*, 2D, chọn suất, **2 vé** → "Thanh toán MoMo" | "Tạo giao dịch ở trạng thái PENDING, chưa cộng điểm." | Màn hình MoMo **190.000đ**, QR, đếm ngược |
| 5 | Tính | Chỉ vào terminal server | "Server vừa nhận `POST /api/giao-dich`." | Log request 201 |
| 6 | Lâm | Bấm **"Xác nhận thanh toán 190.000đ"** | "Khi trạng thái chuyển sang COMPLETED, API tự cộng điểm và xét hạng." | **+190 điểm**, popup **"Chúc mừng thăng hạng! Đồng → Bạc"** |
| 7 | Tính | Chỉ vào terminal | "Đây là request PATCH đổi trạng thái, xử lý thành công." | Log `PATCH .../trang-thai` 200 |
| 8 | Linh | IntelliShell: chạy lại **(A)**, rồi **(B)** và **(C)** | "Ngay lập tức điểm tăng lên 9.690, tổng chi tiêu 10.040.000đ và hạng chuyển sang BAC. Có thêm 1 dòng EARN trong `bien_dong_diem` và 1 dòng `lich_su_hang`." | Dữ liệu khớp với màn hình app |
| 9 | Lâm | (Tùy thời gian) Đổi quà → *Voucher giảm 50.000đ* (450 điểm) → xác nhận | "Đổi quà trừ điểm nhưng không làm tụt hạng." | Mã voucher + QR; điểm còn **9.240**; hạng vẫn **Bạc** |
| 10 | Lâm | Admin Dashboard: biểu đồ theo tháng, Top 10; Khách hàng → tìm "minh anh" | "Các biểu đồ này là kết quả của 2 pipeline aggregation." | KH001 hiện hạng Bạc; tháng hiện tại tăng thêm 190 điểm |
| 11 | Linh | (Nếu cần) `mongorestore --drop` | "Nếu dữ liệu thử bị hỏng, nhóm khôi phục về trạng thái chuẩn trong vài giây." | Dữ liệu quay về như bước 1 |

## 4. Lệnh IntelliShell chuẩn bị sẵn

```js
// (A) Thông tin thành viên demo
db.khach_hang.findOne(
  { SoDienThoai: "0901000001" },
  { _id: 0, MaKH: 1, HoTen: 1, DiemHienTai: 1, TongChiTieu: 1, MaHangHienTai: 1 }
)

// (B) 3 biến động điểm mới nhất
db.bien_dong_diem.find({ MaKH: "KH001" }).sort({ NgayTao: -1 }).limit(3)

// (C) Lịch sử hạng
db.lich_su_hang.find({ MaKH: "KH001" }).sort({ NgayThayDoi: -1 })

// (D) Giao dịch vừa tạo
db.giao_dich.find({ MaKH: "KH001" }).sort({ NgayTao: -1 }).limit(1)

// (E) Đối soát: tổng điểm trong sổ cái phải bằng DiemHienTai
db.bien_dong_diem.aggregate([
  { $match: { MaKH: "KH001" } },
  { $group: { _id: "$MaKH", tong: { $sum: "$SoDiem" } } }
])

// (F) Top 10 khách đổi quà (giống biểu đồ Admin)
db.doi_thuong.aggregate([
  { $group: { _id: "$MaKH", soLuotDoi: { $sum: 1 }, tongDiemDaDoi: { $sum: "$DiemDaDoi" } } },
  { $sort: { soLuotDoi: -1, tongDiemDaDoi: -1 } }, { $limit: 10 },
  { $lookup: { from: "khach_hang", localField: "_id", foreignField: "MaKH", as: "kh" } },
  { $project: { _id: 0, MaKH: "$_id", HoTen: { $first: "$kh.HoTen" }, soLuotDoi: 1, tongDiemDaDoi: 1 } }
])
```

## 5. Đối chiếu: Ứng dụng vs IntelliShell vs Visual Query Builder

| Nhu cầu | Trên ứng dụng | IntelliShell (gõ lệnh) | Visual Query Builder (kéo thả) |
|---|---|---|---|
| Tra cứu 1 khách theo SĐT | Đăng nhập, hoặc Admin › Khách hàng › ô tìm kiếm | Lệnh **(A)** | Kéo trường `SoDienThoai` vào *Query*, chọn *equals* `"0901000001"`; kéo các trường cần xem vào *Projection* |
| Xem lịch sử điểm | Customer App › Lịch sử › Điểm | Lệnh **(B)** | Collection `bien_dong_diem`: *Query* `MaKH = "KH001"`, *Sort* `NgayTao` giảm dần, *Limit* 3 |
| Top 10 đổi quà | Admin › Dashboard | Lệnh **(F)** | Không làm trực tiếp được (cần `$group`, `$lookup`). Phải dùng *Aggregation Editor* |
| **Ưu điểm** | Thân thiện, đúng nghiệp vụ, người dùng cuối dùng được | Đầy đủ sức mạnh, nhanh với người rành lệnh | Không cần nhớ cú pháp, tự sinh mã truy vấn |
| **Hạn chế** | Chỉ làm được các thao tác đã lập trình sẵn | Phải nhớ cú pháp, dễ gõ sai | Chỉ hợp với `find` đơn giản, không làm được aggregation phức tạp |

**[Bổ sung: ảnh chụp kết quả 3 cách trên dữ liệu thật – Lâm và Linh chụp sau mốc M3]**

## 6. Phân công khi demo

| Người | Màn hình phụ trách | Việc |
|---|---|---|
| Lâm | Trình duyệt (app + admin) | Thao tác và dẫn dắt lời thoại |
| Tính | Terminal server | Chỉ log request/response, trả lời câu hỏi về API và schema |
| Linh | Studio 3T | Chạy lệnh (A)–(F), sao lưu và khôi phục khi cần |
