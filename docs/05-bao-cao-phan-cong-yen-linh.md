# BÁO CÁO CHI TIẾT CÔNG VIỆC: YẾN LINH
## Đề tài: Hệ thống Quản lý Khách hàng Thân thiết Rạp Chiếu Phim (LoyalCine)
**Thành viên thực hiện:** Yến Linh  
**Phân công nhiệm vụ:** Tích hợp Logic Nghiệp vụ & API Truy vấn Backend – Quản trị An toàn Dữ liệu

---

## 1. TỔNG QUAN ĐỐI CHIẾU NHIỆM VỤ THEO BẢNG PHÂN CÔNG

| Nhiệm vụ trong phân công | Yêu cầu chi tiết | Trạng thái | Mã nguồn & Công cụ thực hiện |
|---|---|:---:|---|
| **Chuyển đổi truy vấn** | Tích hợp bộ truy vấn CRUD (thêm, sửa, xóa an toàn, tìm kiếm) và các pipeline aggregation từ Studio 3T vào thẳng mã nguồn API của Backend. | **HOÀN THÀNH** | `backend/src/routes/khachHang.routes.js`<br>`backend/src/services/khachHang.service.js` |
| **Xử lý logic tích điểm** | Khi giao dịch thành công (thanh toán vé xem phim/combo), API nhận request tạo giao dịch; nếu `TrangThai` là `COMPLETED`, tự động tạo bản ghi `EARN` vào `bien_dong_diem`, cộng `DiemHienTai` và `TongChiTieu`. Đảm bảo tính nhất quán (Idempotency), không cộng 2 lần. | **HOÀN THÀNH** | `backend/src/routes/giaoDich.routes.js`<br>`backend/src/services/giaoDich.service.js` |
| **Xử lý logic tự động thăng hạng** | Chạy pipeline dùng toán tử `$switch` để xét tổng chi tiêu. Đạt 10 triệu lên Bạc (`BAC`), đạt 30 triệu lên Vàng (`VANG`). Tự động ghi nhật ký `lich_su_hang`. | **HOÀN THÀNH** | Pipeline `$switch` trong `giaoDich.service.js`<br>Collection `lich_su_hang` |
| **Xử lý logic đổi quà** | Kiểm tra tài khoản ACTIVE, quà còn hàng, đủ điểm. Trừ điểm và trừ kho nguyên tử. Sinh mã voucher `VC-XXXXXX`. Đổi quà trừ điểm nhưng bảo toàn `TongChiTieu` để **không làm tụt hạng**. | **HOÀN THÀNH** | `backend/src/routes/doiThuong.routes.js`<br>`backend/src/services/doiThuong.service.js` |
| **API Thống kê & Báo cáo** | - Điểm thưởng phát hành theo tháng (đủ 12 tháng, đặc biệt tháng 9)<br>- Top 10 khách hàng đổi quà nhiều nhất (`$group`, `$lookup`, `$sort`, `$limit`) | **HOÀN THÀNH** | `backend/src/routes/thongKe.routes.js`<br>`backend/src/services/thongKe.service.js` |
| **Quản trị & An toàn dữ liệu** | - Export danh sách khách hàng ra tệp CSV<br>- Sao lưu CSDL an toàn bằng `mongodump`<br>- Khôi phục dữ liệu tức thì bằng `mongorestore --drop` phục vụ demo | **HOÀN THÀNH** | `scripts/export-csv.js` (`XUAT-CSV.bat`)<br>`scripts/backup.js` (`SAO-LUU-CSDL.bat`)<br>`scripts/restore.js` (`KHOI-PHUC-CSDL.bat`) |

---

## 2. KIẾN TRÚC VÀ TỔ CHỨC MÃ NGUỒN BACKEND

Backend được xây dựng bằng **Node.js (ES Modules) + Express.js**, kết nối trực tiếp với **MongoDB (Database: `CinemaLoyaltyDB`)** theo cấu trúc phân tầng rõ ràng:

```
backend/
├── .env                          # Cấu hình MONGODB_URI, DB_NAME (CinemaLoyaltyDB), PORT (3000)
├── package.json                  # Dependencies: express, mongodb, cors, dotenv
├── src/
│   ├── server.js                 # Khởi tạo Express, request logging, error handling
│   ├── config/
│   │   └── db.js                 # Quản lý kết nối MongoDB client singleton
│   ├── routes/                   # Định tuyến API theo chuẩn Hợp đồng (01-hop-dong-api.md)
│   │   ├── khachHang.routes.js   # CRUD & sub-resources khách hàng
│   │   ├── giaoDich.routes.js    # Tạo & đổi trạng thái giao dịch
│   │   ├── doiThuong.routes.js   # Đổi thưởng & lịch sử đổi quà
│   │   ├── hangThanhVien.routes.js# Danh mục hạng & quyền lợi
│   │   ├── phanThuong.routes.js  # Danh mục phần thưởng & tồn kho
│   │   ├── khuyenMai.routes.js   # Danh sách khuyến mãi
│   │   └── thongKe.routes.js     # Thống kê điểm theo tháng & Top 10 đổi quà
│   ├── services/                 # Bộ não xử lý nghiệp vụ & pipeline MongoDB
│   │   ├── khachHang.service.js  # CRUD, tìm kiếm không dấu, kiểm tra xóa an toàn
│   │   ├── giaoDich.service.js   # Tích điểm EARN, $switch thăng hạng, idempotency
│   │   ├── doiThuong.service.js  # Trừ điểm & kho nguyên tử, sinh voucher
│   │   └── thongKe.service.js    # Aggregation pipelines trích xuất từ Studio 3T
│   └── utils/
│       ├── helpers.js            # Sinh mã KH/GD/DT/BD, bỏ dấu tiếng Việt, sinh voucher
│       └── response.js           # Chuẩn hóa JSON { success, data, message }
├── scripts/
│   ├── seed.js                   # Nạp dữ liệu chuẩn (20 khách, 183 GD, 141 đổi quà)
│   ├── export-csv.js             # Xuất danh sách khách hàng ra CSV (UTF-8 BOM)
│   ├── backup.js                 # Sao lưu CSDL bằng mongodump
│   └── restore.js                # Khôi phục CSDL bằng mongorestore --drop
└── backup/
    └── chuan/CinemaLoyaltyDB/    # Thư mục chứa bản snapshot CSDL chuẩn phục vụ demo
```

---

## 3. CÁC NGHIỆP VỤ CỐT LÕI ĐÃ ĐƯỢC LẬP TRÌNH

### 3.1. Luồng Tích điểm (EARN) & Kiểm tra Tính nhất quán (Idempotency)
- **Quy tắc tính điểm:** `DiemCong = floor(TongTien / 1000)` (1 điểm cho mỗi 1.000đ thanh toán vé hoặc combo).
- **Ngăn chặn cộng trùng:** Sử dụng cập nhật nguyên tử có điều kiện `TrangThai: 'PENDING'`. Nếu một giao dịch đã ở trạng thái `COMPLETED`, các request tiếp theo sẽ bị từ chối ngay với mã lỗi **HTTP 409 Conflict**.
- **Ghi nhận:**
  - Cập nhật giao dịch sang `COMPLETED`, ghi nhận `DiemCong`.
  - Tạo document trong sổ cái `bien_dong_diem` với loại `EARN`, `IdempotencyKey: "EARN_" + maGD`.
  - Cộng điểm vào `DiemHienTai` và tích lũy vào `TongChiTieu` của khách hàng.

### 3.2. Luồng Tự động Thăng hạng bằng Toán tử `$switch`
Ngay sau khi giao dịch hoàn tất, hệ thống thực thi cập nhật thứ hạng trên MongoDB thông qua pipeline cập nhật với `$switch`:
```javascript
await db.collection('khach_hang').updateOne(
  { MaKH: kh.MaKH },
  [
    {
      $set: {
        MaHangHienTai: {
          $switch: {
            branches: [
              { case: { $gte: ['$TongChiTieu', 30000000] }, then: 'VANG' },
              { case: { $gte: ['$TongChiTieu', 10000000] }, then: 'BAC' },
            ],
            default: 'DONG',
          },
        },
      },
    },
  ]
)
```
- Nếu thứ hạng mới khác thứ hạng cũ (ví dụ KH001 từ `DONG` lên `BAC` khi tổng chi tiêu vượt 10 triệu):
  - Hệ thống tự động ghi 1 dòng nhật ký vào `lich_su_hang`.
  - Trả về đối tượng `thangHang: { HangCu: "DONG", HangMoi: "BAC" }` trong response của API để Frontend hiển thị popup chúc mừng người dùng.

### 3.3. Luồng Đổi quà (REDEEM) An toàn
- **Kiểm tra nghiệp vụ:**
  1. Khách hàng phải ở trạng thái `ACTIVE` (mã 403 nếu `INACTIVE`).
  2. Phần thưởng phải ở trạng thái `ACTIVE` và `SoLuongTon > 0` (mã 409 nếu hết hàng).
  3. `DiemHienTai >= DiemCanDoi` (mã 400 nếu thiếu điểm: *"Không đủ điểm: cần X điểm, bạn đang có Y điểm"*).
- **Cập nhật nguyên tử:**
  - Trừ tồn kho quà tặng (`$inc: { SoLuongTon: -1 }`).
  - Trừ điểm của khách hàng (`$inc: { DiemHienTai: -DiemCanDoi }`).
  - **Đặc biệt:** `TongChiTieu` được giữ nguyên vẹn $\rightarrow$ **Đổi quà không bao giờ làm khách hàng bị tụt hạng.**
  - Sinh mã voucher ngẫu nhiên định dạng `VC-XXXXXX`.
  - Ghi bản ghi vào `doi_thuong` và bản ghi loại `REDEEM` (số điểm âm) vào `bien_dong_diem`.

---

## 4. BỘ TRUY VẤN VÀ CÁC PIPELINE AGGREGATION TỪ STUDIO 3T

### 4.1. Pipeline Thống kê Điểm thưởng Phát hành theo Tháng (`GET /api/thong-ke/diem-phat-hanh-theo-thang`)
Xuất từ Aggregation Editor của Studio 3T và đưa vào mã nguồn Node.js:
```javascript
[
  {
    $match: {
      $or: [{ LoaiBienDong: 'EARN' }, { Loai: 'EARN' }],
      NgayTao: {
        $gte: ISODate('2026-01-01T00:00:00.000Z'),
        $lt: ISODate('2027-01-01T00:00:00.000Z')
      }
    }
  },
  {
    $group: {
      _id: { $month: { date: '$NgayTao', timezone: 'Asia/Ho_Chi_Minh' } },
      tongDiem: { $sum: '$SoDiem' },
      soGiaoDich: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      thang: '$_id',
      tongDiem: 1,
      soGiaoDich: 1
    }
  },
  { $sort: { thang: 1 } }
]
```
*Kết quả:* Trả về dữ liệu 12 tháng liên tục để vẽ biểu đồ cột trên Admin Dashboard (tháng không có giao dịch được bù giá trị 0).

### 4.2. Pipeline Top 10 Khách hàng Đổi quà Nhiều nhất (`GET /api/thong-ke/top-doi-qua`)
Kết nối hai collection `doi_thuong` và `khach_hang`:
```javascript
[
  {
    $group: {
      _id: '$MaKH',
      soLuotDoi: { $sum: 1 },
      tongDiemDaDoi: { $sum: '$DiemDaDoi' }
    }
  },
  {
    $sort: {
      soLuotDoi: -1,
      tongDiemDaDoi: -1
    }
  },
  { $limit: 10 },
  {
    $lookup: {
      from: 'khach_hang',
      localField: '_id',
      foreignField: 'MaKH',
      as: 'khach'
    }
  },
  {
    $unwind: {
      path: '$khach',
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $project: {
      _id: 0,
      MaKH: '$_id',
      HoTen: { $ifNull: ['$khach.HoTen', '(Không xác định)'] },
      MaHangHienTai: { $ifNull: ['$khach.MaHangHienTai', 'DONG'] },
      soLuotDoi: 1,
      tongDiemDaDoi: 1
    }
  }
]
```

---

## 5. BỘ LỆNH INTELLISHELL TRONG STUDIO 3T PHỤC VỤ BUỔI DEMO

Khi Lâm thao tác trên giao diện, Linh mở sẵn các tab IntelliShell trong Studio 3T và chạy các câu lệnh đối chiếu thời gian thực:

### Lệnh (A): Xem thông tin khách hàng demo (KH001) trước và sau giao dịch
```javascript
use CinemaLoyaltyDB;
db.khach_hang.findOne(
  { SoDienThoai: "0901000001" },
  { _id: 0, MaKH: 1, HoTen: 1, DiemHienTai: 1, TongChiTieu: 1, MaHangHienTai: 1 }
);
```
- **Trước khi thanh toán:** `DiemHienTai: 9500`, `TongChiTieu: 9850000`, `MaHangHienTai: "DONG"`.
- **Sau khi thanh toán 190.000đ:** `DiemHienTai: 9690`, `TongChiTieu: 10040000`, `MaHangHienTai: "BAC"`.

### Lệnh (B): Kiểm tra 3 biến động điểm mới nhất trong sổ cái
```javascript
use CinemaLoyaltyDB;
db.bien_dong_diem.find({ MaKH: "KH001" }).sort({ NgayTao: -1 }).limit(3);
```

### Lệnh (C): Kiểm tra lịch sử thăng hạng vừa được ghi nhận
```javascript
use CinemaLoyaltyDB;
db.lich_su_hang.find({ MaKH: "KH001" }).sort({ NgayThayDoi: -1 });
```

### Lệnh (D): Kiểm tra giao dịch vừa tạo
```javascript
use CinemaLoyaltyDB;
db.giao_dich.find({ MaKH: "KH001" }).sort({ NgayTao: -1 }).limit(1);
```

### Lệnh (E): Đối soát điểm - Tổng điểm trong sổ cái phải bằng đúng `DiemHienTai`
```javascript
use CinemaLoyaltyDB;
db.bien_dong_diem.aggregate([
  { $match: { MaKH: "KH001" } },
  { $group: { _id: "$MaKH", tongDiemSoCai: { $sum: "$SoDiem" } } }
]);
```

### Lệnh (F): Top 10 khách hàng đổi quà nhiều nhất
```javascript
use CinemaLoyaltyDB;
db.doi_thuong.aggregate([
  { $group: { _id: "$MaKH", soLuotDoi: { $sum: 1 }, tongDiemDaDoi: { $sum: "$DiemDaDoi" } } },
  { $sort: { soLuotDoi: -1, tongDiemDaDoi: -1 } },
  { $limit: 10 },
  { $lookup: { from: "khach_hang", localField: "_id", foreignField: "MaKH", as: "kh" } },
  { $project: { _id: 0, MaKH: "$_id", HoTen: { $first: "$kh.HoTen" }, soLuotDoi: 1, tongDiemDaDoi: 1 } }
]);
```

---

## 6. QUY TRÌNH AN TOÀN DỮ LIỆU: EXPORT CSV, SAO LƯU & KHÔI PHỤC

Để đảm bảo tính liên tục của hệ thống và phòng ngừa rủi ro hỏng dữ liệu trong quá trình báo cáo thực tế, Linh đã đóng gói 3 kịch bản:

1. **Xuất dữ liệu khách hàng ra CSV (`XUAT-CSV.bat`):**
   - Chạy lệnh `mongoexport --collection=khach_hang --type=csv ...`
   - File kết quả lưu tại `backend/exports/khach_hang_YYYY-MM-DD.csv` với định dạng UTF-8 BOM, mở bằng Excel hiển thị tiếng Việt hoàn hảo.
2. **Sao lưu định kỳ CSDL (`SAO-LUU-CSDL.bat`):**
   - Chạy `mongodump` chụp toàn bộ cấu trúc CSDL và các index ra thư mục `backend/backup/chuan/CinemaLoyaltyDB`.
3. **Khôi phục dữ liệu tức thì (`KHOI-PHUC-CSDL.bat`):**
   - Chạy `mongorestore --db CinemaLoyaltyDB --drop backend/backup/chuan/CinemaLoyaltyDB`.
   - Nếu trong buổi demo giảng viên yêu cầu lặp lại thao tác hoặc dữ liệu thử bị sai lệch, chỉ cần nhấp đúp file này là CSDL quay lại trạng thái hoàn hảo trong vòng **1 giây**!

---

## 7. KẾT QUẢ KIỂM THỬ (UNIT TEST & INTEGRATION TEST)

Bộ kiểm thử tự động tại `backend/scripts/test-api.js` đã chạy thành công **26/26 bài test (100%)**:
- ✓ CRUD & tìm kiếm không dấu
- ✓ Tạo giao dịch PENDING
- ✓ Tích điểm EARN chuẩn xác
- ✓ Thăng hạng tự động từ `DONG` lên `BAC` bằng toán tử `$switch`
- ✓ Chặn cộng điểm trùng lặp (Idempotency 409)
- ✓ Đổi thưởng an toàn, trừ điểm, trừ tồn kho, sinh voucher, bảo toàn hạng
- ✓ Xử lý tài khoản INACTIVE và thiếu điểm
- ✓ Pipeline aggregation điểm phát hành 12 tháng (tháng 9 đạt 34.485 điểm)
- ✓ Pipeline aggregation Top 10 khách đổi quà kèm `$lookup`
- ✓ Thống kê khách theo hạng và KPI tổng quan tháng

---

## 8. CẬP NHẬT DỮ LIỆU MẪU (21/11/2026, khi gộp vào repo nhóm)

`scripts/seed.js` và bản sao lưu chuẩn `backup/chuan` được sinh lại để các bảng khớp nhau:
- Không còn mốc thời gian nào sau ngày 20/11/2026. Bản cũ có 13 giao dịch ngày 02/12 đến 14/12/2026, nên giao dịch tạo lúc demo không đứng đầu danh sách mới nhất.
- `SoDuSau` là số dư dồn theo thời gian của từng khách. Bản cũ ghi cùng một giá trị cho mọi dòng (KH001 dòng nào cũng 9.500).
- 141 lượt đổi quà có đủ 141 dòng `REDEEM` trong `bien_dong_diem`. Cộng mọi dòng `SoDiem` của một khách ra đúng `DiemHienTai`, cộng tiền giao dịch ra đúng `TongChiTieu`, nên lệnh đối soát (E) trong `docs/04-kich-ban-demo.md` khớp với cả 20 khách.
- `lich_su_hang` có thêm dòng lên hạng Bạc, Vàng đúng lúc tổng chi tiêu vượt ngưỡng (36 dòng).
- Giữ nguyên: 20 khách, 183 giao dịch, 141 lượt đổi quà, tháng 9 đạt 34.485 điểm, KH001 có 9.500 điểm và 9.850.000đ, KH002 có 12.400 điểm. Số điểm hiện tại của một số khách khác và danh sách Top 10 thay đổi; KH003 vẫn đứng đầu với 28 lượt.
- Chạy `npm run seed` lần nào cũng ra đúng một bộ dữ liệu, không phụ thuộc múi giờ của máy.
