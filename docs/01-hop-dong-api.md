# Hợp đồng API – Ứng dụng Khách hàng thân thiết Rạp chiếu phim

> **Phiên bản 0.1 – bản đề xuất** · Người soạn: Khánh Lâm (Frontend) · Cần **Tính** (Backend/CSDL) và **Linh** (Logic nghiệp vụ/Thống kê) xác nhận hoặc sửa.
>
> Mục đích: chốt trước "hình dạng" dữ liệu giữa Backend và Frontend để 3 người **làm song song**. Frontend hiện đã chạy bằng API giả đúng theo tài liệu này. Khi backend thật trả đúng hợp đồng, frontend chỉ cần đặt `VITE_USE_MOCK=false`.

---

## 1. Quy ước chung

| Mục | Quy ước |
|---|---|
| Địa chỉ | `http://localhost:3000/api/...`. Mọi route có tiền tố `/api`. Port đổi được. |
| Định dạng | JSON, UTF-8 |
| Response thành công | `{ "success": true, "data": <dữ liệu>, "message": "<tùy chọn>" }` |
| Response lỗi | Mã HTTP 4xx/5xx và `{ "success": false, "message": "Thông báo tiếng Việt cho người dùng" }` |
| Mã lỗi | `400` dữ liệu sai hoặc không đủ điểm · `403` tài khoản INACTIVE · `404` không tìm thấy · `409` xung đột (trùng SĐT, giao dịch đã xử lý, hết quà) · `500` lỗi server |
| Tên trường | Trường của document giữ đúng tên trong MongoDB: PascalCase, không dấu (`DiemHienTai`, `MaHangHienTai`, `TrangThai`). Trường do API tự tính hoặc bọc ngoài dùng camelCase (`diemCong`, `thangHang`, `tongDiem`). |
| Định danh | Dùng **mã nghiệp vụ** trên URL và để tham chiếu giữa các collection: `MaKH`, `MaGiaoDich`, `MaPhanThuong`, `MaDoiThuong`. Vẫn giữ `_id` (ObjectId) của MongoDB. |
| Ngày giờ | Lưu kiểu **Date** trong MongoDB, không lưu chuỗi, để dùng được `$month`, `$year`. API trả chuỗi ISO 8601. Thống kê theo tháng dùng múi giờ `Asia/Ho_Chi_Minh`. |
| Tiền và điểm | Số nguyên: tiền tính bằng VND, điểm tính bằng điểm |
| Đăng nhập | **Mô phỏng**: tra cứu khách theo số điện thoại, không cần mật khẩu (ngoài phạm vi môn NoSQL) |
| CORS | Khi dev không cần cấu hình vì frontend dùng Vite proxy. Nếu chạy frontend ở domain khác thì bật `app.use(cors())`. |

> Frontend vẫn đọc được nếu backend trả **thẳng dữ liệu, không có lớp `{ success, data }`**. Tuy vậy nên theo đúng quy ước để thông báo lỗi hiển thị đẹp.

---

## 2. Cấu trúc document đề xuất (8 collection)

> Đây là tên trường mà frontend đang dùng. **Nếu JSON schema giữa kỳ của Tính đặt tên khác, ưu tiên schema của Tính** rồi báo Lâm sửa. Phía frontend chỉ cần sửa 1 file `frontend/src/api/mappers.js`.

### 2.1. `khach_hang`
```json
{
  "_id": "6721f0c8a1b2c3d4e5f60718",
  "MaKH": "KH001",
  "HoTen": "Trần Minh Anh",
  "SoDienThoai": "0901000001",
  "Email": "tran.minh.anh01@example.com",
  "NgaySinh": "2003-11-20",
  "GioiTinh": "Nữ",
  "MaThe": "LC00000001",
  "DiemHienTai": 9500,
  "TongChiTieu": 9850000,
  "MaHangHienTai": "DONG",
  "TrangThai": "ACTIVE",
  "NgayDangKy": "2025-09-21T03:15:00.000Z"
}
```
- `MaThe`: số thẻ để mã hóa thành QR/Barcode. Nếu không có trường này, frontend dùng `MaKH`.
- `TongChiTieu`: tổng tiền các giao dịch **COMPLETED**, dùng để xét hạng.
- `DiemHienTai`: điểm còn dùng được, bằng EARN − REDEEM.
- `TrangThai`: `ACTIVE` hoặc `INACTIVE`.

### 2.2. `hang_thanh_vien`
```json
{ "MaHang": "BAC", "TenHang": "Bạc", "NguongChiTieu": 10000000, "ThuTu": 2, "MauSac": "#6b7785",
  "QuyenLoi": ["Toàn bộ quyền lợi hạng Đồng", "Tặng 1 combo bắp nước trong tháng sinh nhật"] }
```
Có 3 hạng: `DONG` (từ 0đ), `BAC` (từ 10.000.000đ), `VANG` (từ 30.000.000đ). `MauSac` và `QuyenLoi` không bắt buộc.

### 2.3. `giao_dich`
```json
{
  "MaGiaoDich": "GD001043",
  "MaKH": "KH001",
  "LoaiGiaoDich": "VE_XEM_PHIM",
  "ChiTiet": [
    { "MaSanPham": "P01-2D", "TenSanPham": "Vé 2D – Hành Tinh Cuối Cùng (suất 19:30)", "Loai": "VE",
      "SoLuong": 2, "DonGia": 95000, "ThanhTien": 190000 }
  ],
  "TongTien": 190000,
  "PhuongThucThanhToan": "MOMO",
  "TrangThai": "PENDING",
  "DiemCong": 0,
  "NgayTao": "2026-11-15T12:30:00.000Z",
  "NgayCapNhat": "2026-11-15T12:30:00.000Z"
}
```
- `LoaiGiaoDich`: `VE_XEM_PHIM`, `COMBO_BAP_NUOC` hoặc `VE_VA_COMBO`.
- `ChiTiet[].Loai`: `VE` hoặc `COMBO`.
- `TrangThai`: `PENDING`, `COMPLETED`, `CANCELLED` hoặc `FAILED`.
- `ChiTiet` được **nhúng (embed)** vào giao dịch vì chỉ được đọc cùng giao dịch, đây là lựa chọn điển hình của NoSQL.
- Danh mục phim và combo nằm ở frontend, không cần thêm collection.

### 2.4. `bien_dong_diem` (sổ cái điểm, chỉ ghi thêm)
```json
{ "MaBienDong": "BD001222", "MaKH": "KH001", "LoaiBienDong": "EARN", "SoDiem": 190, "SoDuSau": 9690,
  "MaThamChieu": "GD001043", "MoTa": "Tích điểm giao dịch GD001043", "NgayTao": "2026-11-15T12:31:00.000Z" }
```
- `LoaiBienDong`: `EARN` (cộng, `SoDiem` > 0) hoặc `REDEEM` (trừ, `SoDiem` < 0).
- `MaThamChieu` là `MaGiaoDich` (với EARN) hoặc `MaDoiThuong` (với REDEEM).
- `SoDuSau` giúp đối soát. Không bắt buộc nhưng nên có.

### 2.5. `phan_thuong`
```json
{ "MaPhanThuong": "PT002", "TenPhanThuong": "Voucher giảm 50.000đ vé 2D/3D", "LoaiPhanThuong": "VOUCHER_VE",
  "DiemCanDoi": 450, "SoLuongTon": 400, "GiaTri": 50000, "HanSuDungNgay": 30, "HinhAnh": "🎫",
  "MoTa": "Áp dụng cho 1 vé 2D hoặc 3D.", "TrangThai": "ACTIVE" }
```
`LoaiPhanThuong` nhận một trong ba giá trị: `VOUCHER_VE`, `VOUCHER_BAP_NUOC`, `QUA_HIEN_VAT`.

### 2.6. `doi_thuong`
```json
{ "MaDoiThuong": "DT000165", "MaKH": "KH001", "MaPhanThuong": "PT002",
  "TenPhanThuong": "Voucher giảm 50.000đ vé 2D/3D", "LoaiPhanThuong": "VOUCHER_VE",
  "DiemDaDoi": 450, "MaVoucher": "VC-7K2M9Q", "TrangThai": "CHUA_SU_DUNG",
  "NgayDoi": "2026-11-15T12:40:00.000Z", "HanSuDung": "2026-12-15T12:40:00.000Z" }
```
- `TenPhanThuong` và `LoaiPhanThuong` được **lưu kèm (denormalize)**, nhờ đó xem lịch sử không cần `$lookup`.
- `TrangThai`: `CHUA_SU_DUNG` hoặc `DA_SU_DUNG`.

### 2.7. `khuyen_mai`
```json
{ "MaKhuyenMai": "KM001", "TenKhuyenMai": "Sinh nhật vui vẻ", "MoTa": "...", "ApDungChoHang": ["BAC", "VANG"],
  "NgayBatDau": "2026-01-19T00:00:00.000Z", "NgayKetThuc": "2027-12-20T00:00:00.000Z", "TrangThai": "ACTIVE" }
```

### 2.8. `lich_su_hang`
```json
{ "MaKH": "KH001", "HangCu": "DONG", "HangMoi": "BAC", "TongChiTieuKhiDoi": 10040000,
  "LyDo": "Tổng chi tiêu đạt 10.000.000đ", "NgayThayDoi": "2026-11-15T12:31:00.000Z" }
```
Khi khách đăng ký, ghi 1 dòng có `HangCu: null` và `HangMoi: "DONG"`.

---

## 3. Danh sách endpoint

★ là endpoint **bắt buộc cho buổi demo**. Các endpoint còn lại làm nếu còn thời gian.

| | Method & đường dẫn | Mục đích | Phụ trách | Màn hình dùng |
|---|---|---|---|---|
| ★ | `GET /api/khach-hang?q=&soDienThoai=&maHang=&trangThai=` | Tìm kiếm, lọc khách; đăng nhập bằng SĐT | Tính (CRUD) + Linh (truy vấn) | Đăng nhập, Admin › Khách hàng |
| ★ | `GET /api/khach-hang/:maKH` | Chi tiết 1 khách | Tính | Thẻ thành viên |
| | `POST /api/khach-hang` | Thêm khách | Tính / Linh | Admin › Khách hàng |
| | `PUT /api/khach-hang/:maKH` | Sửa thông tin, trạng thái | Tính / Linh | Admin › Khách hàng |
| | `DELETE /api/khach-hang/:maKH` | Xóa khách chưa có giao dịch | Tính / Linh | Admin › Khách hàng |
| ★ | `GET /api/hang-thanh-vien` | Danh sách hạng và ngưỡng | Tính | Thanh tiến trình lên hạng |
| ★ | `GET /api/khach-hang/:maKH/bien-dong-diem` | Lịch sử điểm (mới nhất trước) | Tính | Lịch sử, Trang chủ |
| | `GET /api/khach-hang/:maKH/giao-dich` | Giao dịch của khách | Tính | Lịch sử |
| | `GET /api/khach-hang/:maKH/doi-thuong` | Quà đã đổi | Tính | Lịch sử › Quà của tôi |
| | `GET /api/khach-hang/:maKH/lich-su-hang` | Lịch sử thay đổi hạng | Tính | Lịch sử › Hạng |
| | `GET /api/khuyen-mai?conHieuLuc=true` | Ưu đãi đang hiệu lực | Tính | Trang chủ |
| ★ | `POST /api/giao-dich` | Tạo giao dịch vé/combo, trạng thái `PENDING` | Tính | Mua vé → MoMo |
| ★ | `GET /api/giao-dich/:maGD` | Chi tiết 1 giao dịch | Tính | Màn hình MoMo |
| ★ | `PATCH /api/giao-dich/:maGD/trang-thai` | Cập nhật trạng thái; `COMPLETED` → cộng điểm + xét hạng | **Linh** | MoMo, Admin › Giao dịch |
| | `GET /api/giao-dich?trangThai=&maKH=` | Danh sách giao dịch | Tính | Admin › Giao dịch |
| ★ | `GET /api/phan-thuong?loai=&trangThai=` | Danh mục quà (sắp xếp theo điểm) | Tính | Đổi quà, Admin |
| ★ | `POST /api/doi-thuong` | Đổi quà bằng điểm | **Linh** | Đổi quà |
| | `GET /api/doi-thuong?maKH=` | Danh sách lượt đổi | Tính | Admin › Đổi thưởng |
| ★ | `GET /api/thong-ke/diem-phat-hanh-theo-thang?nam=` | Điểm EARN theo tháng | **Linh** | Dashboard (biểu đồ cột) |
| ★ | `GET /api/thong-ke/top-doi-qua?limit=10&nam=` | Top khách đổi quà (`nam` không bắt buộc) | **Linh** | Dashboard (Top 10) |
| | `GET /api/thong-ke/khach-hang-theo-hang` | Số khách mỗi hạng | Linh | Dashboard |
| | `GET /api/thong-ke/tong-quan` | Các chỉ số KPI tháng hiện tại | Linh | Dashboard |

---

## 4. Chi tiết các endpoint ★

### 4.1. Đăng nhập mô phỏng – `GET /api/khach-hang?soDienThoai=0901000001`
Response `200`. Trả về mảng, mảng rỗng nghĩa là không tìm thấy. Frontend tự kiểm tra `TrangThai`.
```json
{ "success": true, "data": [ { "MaKH": "KH001", "HoTen": "Trần Minh Anh", "TrangThai": "ACTIVE", "...": "..." } ] }
```
Tham số `q` tìm gần đúng theo tên, SĐT, mã KH hoặc email, **không phân biệt hoa thường và không dấu nếu làm được**.

### 4.2. `GET /api/hang-thanh-vien`
```json
{ "success": true, "data": [
  { "MaHang": "DONG", "TenHang": "Đồng", "NguongChiTieu": 0 },
  { "MaHang": "BAC",  "TenHang": "Bạc",  "NguongChiTieu": 10000000 },
  { "MaHang": "VANG", "TenHang": "Vàng", "NguongChiTieu": 30000000 } ] }
```
Frontend tự tính câu "Bạn cần chi tiêu thêm **150.000đ** để lên hạng **Bạc**" theo công thức `NguongChiTieu(hạng kế tiếp) − TongChiTieu`.

### 4.3. Tạo giao dịch – `POST /api/giao-dich`
Request:
```json
{ "MaKH": "KH001", "PhuongThucThanhToan": "MOMO",
  "ChiTiet": [ { "MaSanPham": "P01-2D", "TenSanPham": "Vé 2D – Hành Tinh Cuối Cùng (suất 19:30)",
                 "Loai": "VE", "SoLuong": 2, "DonGia": 95000 } ] }
```
Response `201`: document `giao_dich` vừa tạo, có `TrangThai: "PENDING"` và `DiemCong: 0`. Server tự tính `ThanhTien`, `TongTien`, `LoaiGiaoDich` và `MaGiaoDich`.
Lỗi: `403` nếu khách INACTIVE, `400` nếu `ChiTiet` rỗng hoặc số lượng sai.

### 4.4. Cập nhật trạng thái – `PATCH /api/giao-dich/:maGD/trang-thai`
Request: `{ "TrangThai": "COMPLETED" }`. Các giá trị hợp lệ khác: `CANCELLED`, `FAILED`.

Response `200` khi chuyển sang COMPLETED:
```json
{ "success": true, "data": {
  "giaoDich":  { "MaGiaoDich": "GD001043", "TrangThai": "COMPLETED", "DiemCong": 190, "...": "..." },
  "diemCong":  190,
  "khachHang": { "MaKH": "KH001", "DiemHienTai": 9690, "TongChiTieu": 10040000, "MaHangHienTai": "BAC", "...": "..." },
  "thangHang": { "HangCu": "DONG", "HangMoi": "BAC" } } }
```
- `thangHang` bằng `null` nếu khách không đổi hạng.
- Lỗi `409` nếu giao dịch không còn ở trạng thái `PENDING`. Ví dụ bấm xác nhận 2 lần thì **không được cộng điểm 2 lần**.

### 4.5. Đổi quà – `POST /api/doi-thuong`
Request: `{ "MaKH": "KH001", "MaPhanThuong": "PT002" }`

Response `201`:
```json
{ "success": true, "data": {
  "doiThuong": { "MaDoiThuong": "DT000165", "MaVoucher": "VC-7K2M9Q", "DiemDaDoi": 450, "HanSuDung": "...", "...": "..." },
  "khachHang": { "MaKH": "KH001", "DiemHienTai": 9240, "...": "..." } } }
```
Các trường hợp lỗi:

- `400`: "Không đủ điểm: cần 450 điểm, bạn đang có 300 điểm."
- `409`: "Phần thưởng đã hết…"
- `403`: khách INACTIVE.

### 4.6. Thống kê điểm theo tháng – `GET /api/thong-ke/diem-phat-hanh-theo-thang?nam=2026`
```json
{ "success": true, "data": [ { "thang": 1, "tongDiem": 18481, "soGiaoDich": 61 }, "...", { "thang": 12, "tongDiem": 0, "soGiaoDich": 0 } ] }
```
Nên trả đủ 12 tháng, nhưng frontend cũng tự điền 0 cho tháng thiếu. Kết quả này cũng trả lời được câu "điểm phát hành tháng 9".

### 4.7. Top khách đổi quà – `GET /api/thong-ke/top-doi-qua?limit=10&nam=2026`
```json
{ "success": true, "data": [ { "MaKH": "KH003", "HoTen": "Phạm Thu Hà", "MaHangHienTai": "VANG", "soLuotDoi": 31, "tongDiemDaDoi": 26950 } ] }
```
Kết quả sắp xếp theo `soLuotDoi` giảm dần, nếu bằng nhau thì theo `tongDiemDaDoi`.

---

## 5. Quy tắc nghiệp vụ đề xuất (Linh chốt) và gợi ý cài đặt MongoDB

1. **Tích điểm:** `DiemCong = floor(TongTien / 1000)`, tức 1 điểm cho mỗi 1.000đ. Con số này suy ra từ kịch bản demo trong tài liệu phân công.
2. **Xét hạng theo `TongChiTieu`, không xét theo `DiemHienTai`.** Đổi quà làm giảm điểm nhưng không được làm khách tụt hạng.
   ```js
   // Sau khi cộng TongChiTieu: cập nhật hạng bằng pipeline $switch
   db.khach_hang.updateOne({ MaKH: "KH001" }, [
     { $set: { MaHangHienTai: { $switch: { branches: [
       { case: { $gte: ["$TongChiTieu", 30000000] }, then: "VANG" },
       { case: { $gte: ["$TongChiTieu", 10000000] }, then: "BAC" } ], default: "DONG" } } } }
   ])
   ```
3. **Không cộng điểm 2 lần.** Chuyển trạng thái **có điều kiện**. Đây là thao tác nguyên tử nên chỉ 1 request thắng:
   ```js
   const gd = await db.collection("giao_dich").findOneAndUpdate(
     { MaGiaoDich: maGD, TrangThai: "PENDING" },
     { $set: { TrangThai: "COMPLETED", NgayCapNhat: new Date() } },
     { returnDocument: "after" })
   if (!gd) → trả 409   // giao dịch không tồn tại hoặc đã xử lý
   ```
4. **Đổi quà an toàn.** Trừ điểm và trừ tồn kho bằng điều kiện ngay trong câu lệnh update:
   ```js
   db.khach_hang.findOneAndUpdate({ MaKH, TrangThai: "ACTIVE", DiemHienTai: { $gte: diemCan } }, { $inc: { DiemHienTai: -diemCan } })
   db.phan_thuong.findOneAndUpdate({ MaPhanThuong, SoLuongTon: { $gt: 0 } }, { $inc: { SoLuongTon: -1 } })
   ```
5. **Transaction (tùy chọn):** muốn gộp nhiều thao tác thành 1 giao dịch MongoDB (`session.withTransaction`) thì MongoDB phải chạy dạng **replica set**. Có thể dùng 1 node: `mongod --replSet rs0` rồi chạy `rs.initiate()`. Nếu không dùng transaction, hãy làm theo thứ tự ở mục 3 và 4.
6. **Gợi ý pipeline thống kê.** Linh có thể dùng lại pipeline giữa kỳ xuất từ Studio 3T:
   ```js
   db.bien_dong_diem.aggregate([
     { $match: { LoaiBienDong: "EARN", NgayTao: { $gte: ISODate("2026-01-01T00:00:00+07:00"), $lt: ISODate("2027-01-01T00:00:00+07:00") } } },
     { $group: { _id: { $month: { date: "$NgayTao", timezone: "Asia/Ho_Chi_Minh" } }, tongDiem: { $sum: "$SoDiem" }, soGiaoDich: { $sum: 1 } } },
     { $project: { _id: 0, thang: "$_id", tongDiem: 1, soGiaoDich: 1 } }, { $sort: { thang: 1 } } ])

   db.doi_thuong.aggregate([
     { $group: { _id: "$MaKH", soLuotDoi: { $sum: 1 }, tongDiemDaDoi: { $sum: "$DiemDaDoi" } } },
     { $sort: { soLuotDoi: -1, tongDiemDaDoi: -1 } }, { $limit: 10 },
     { $lookup: { from: "khach_hang", localField: "_id", foreignField: "MaKH", as: "kh" } }, { $unwind: "$kh" },
     { $project: { _id: 0, MaKH: "$_id", HoTen: "$kh.HoTen", MaHangHienTai: "$kh.MaHangHienTai", soLuotDoi: 1, tongDiemDaDoi: 1 } } ])
   ```
7. **Index nên tạo:**
   - `khach_hang`: `{MaKH:1}` unique, `{SoDienThoai:1}` unique
   - `giao_dich`: `{MaGiaoDich:1}` unique, `{MaKH:1, NgayTao:-1}`
   - `bien_dong_diem`: `{MaKH:1, NgayTao:-1}`, `{LoaiBienDong:1, NgayTao:1}`
   - `doi_thuong`: `{MaKH:1, NgayDoi:-1}`
   - `phan_thuong`: `{MaPhanThuong:1}` unique

> File `frontend/src/mocks/logic.js` là bản **mô phỏng chạy được** của các quy tắc trên, có kèm test trong `logic.test.js`. Linh có thể dùng để đối chiếu kết quả.

---

## 6. Việc cần chốt

- [ ] Tên trường có khớp JSON schema giữa kỳ không? Trường nào khác thì ghi lại vào đây.
- [ ] URL dùng `MaKH` hay `_id`?
- [ ] Tỷ lệ tích điểm có giữ 1 điểm / 1.000đ không? Có nhân hệ số theo khuyến mãi hoặc hạng không?
- [ ] Ai chuyển giao dịch sang `COMPLETED`: màn hình MoMo của frontend, trang Admin, hay cả hai?
- [ ] Port server (mặc định 3000) và tiền tố `/api`.
- [ ] Dữ liệu demo trong DB thật phải có:
  - KH001 ở hạng Đồng, `TongChiTieu` 9.850.000đ, 9.500 điểm.
  - 1 khách hạng Bạc gần lên Vàng.
  - 1 khách hạng Vàng.
  - 1 khách INACTIVE.
  - 10 phần thưởng.

## 7. Lịch sử thay đổi

| Phiên bản | Ngày | Người sửa | Nội dung |
|---|---|---|---|
| 0.1 | 15/11/2026 | Khánh Lâm | Bản đề xuất đầu tiên, khớp với frontend đang chạy mock |
