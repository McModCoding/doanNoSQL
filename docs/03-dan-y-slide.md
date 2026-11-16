# Dàn ý slide thuyết trình (bản nháp)

> Tổng thời lượng dự kiến **khoảng 15 phút thuyết trình + 8–10 phút demo + hỏi đáp**. Ảnh có tiền tố `hinh/` nằm trong thư mục `docs/hinh/`. Ảnh hiện chụp từ dữ liệu giả, **khi chốt cần chụp lại bằng dữ liệu thật**.
> Gợi ý trình bày: mỗi slide tối đa 3–4 ý, chữ ≥ 24pt. Ưu tiên hình và sơ đồ hơn chữ.

| # | Tiêu đề slide | Ý chính | Hình / minh họa | Người trình bày | Thời gian |
|---|---|---|---|---|---|
| 1 | Ứng dụng Khách hàng thân thiết Rạp chiếu phim | Tên đề tài, môn NoSQL, 3 thành viên và vai trò | Logo app, `hinh/00-trang-chon-ung-dung.png` | Lâm | 0:30 |
| 2 | Bài toán | Rạp phim cần giữ chân khách (tương tự CGV): tích điểm khi mua vé/bắp nước, thăng hạng Đồng/Bạc/Vàng, đổi quà | Hình minh họa thẻ thành viên `hinh/03-the-ma-vach.png` | Lâm | 1:00 |
| 3 | Vì sao chọn MongoDB | <ul><li>Dữ liệu dạng document</li><li>Giao dịch có chi tiết lồng nhau</li><li>Lịch sử điểm tăng liên tục</li><li>Aggregation pipeline mạnh cho thống kê</li><li>Schema linh hoạt</li></ul> | Bảng so sánh ngắn SQL vs MongoDB cho bài toán này | Tính | 1:00 |
| 4 | Kiến trúc hệ thống | 3 tầng: React ↔ Express ↔ MongoDB; Studio 3T; API giả giúp làm song song | `hinh/so-do-1-kien-truc-tong-the.png` | Lâm | 1:00 |
| 5 | Thiết kế dữ liệu – 8 collection | Vai trò từng collection, quan hệ bằng mã nghiệp vụ | `hinh/so-do-2-quan-he-du-lieu.png` | Tính | 1:30 |
| 6 | Nhúng hay tham chiếu? | <ul><li>`ChiTiet` nhúng trong `giao_dich`</li><li>`MaKH` tham chiếu</li><li>Lưu kèm `TenPhanThuong`</li><li>Sổ cái `bien_dong_diem` chỉ ghi thêm</li></ul> | 1 document `giao_dich` mẫu (JSON) | Tính | 1:00 |
| 7 | JSON Schema & index | Ràng buộc kiểu dữ liệu, các index chính và lý do | Ảnh Studio 3T: schema / index **[Tính chụp]** | Tính | 1:00 |
| 8 | Logic tích điểm & thăng hạng | <ul><li>`COMPLETED` → ghi EARN</li><li>`$inc` điểm và chi tiêu</li><li>`$switch` xét hạng</li><li>Chống cộng điểm 2 lần bằng update có điều kiện</li></ul> | `hinh/so-do-3-luong-thanh-toan-tich-diem.png` | Linh | 1:30 |
| 9 | Đổi quà an toàn | Trừ điểm và tồn kho bằng update có điều kiện; transaction (replica set) | `hinh/so-do-4-luong-doi-qua.png` | Linh | 1:00 |
| 10 | Aggregation thống kê | Điểm phát hành theo tháng, top 10 khách đổi quà, giải thích từng stage | `hinh/so-do-5-luong-thong-ke.png` + ảnh Aggregation Editor **[Linh chụp]** | Linh | 1:30 |
| 11 | Customer App | Thẻ thành viên QR/Barcode, hạng, thanh tiến trình "cần chi tiêu thêm 150.000đ…" | `hinh/02-trang-chu-the-thanh-vien.png`, `hinh/07-trang-chu-hang-bac.png` | Lâm | 1:00 |
| 12 | Mua vé & thanh toán MoMo (mô phỏng) | Tạo giao dịch PENDING → xác nhận → +điểm → popup thăng hạng | `hinh/04-mua-ve.png`, `hinh/05-thanh-toan-momo.png`, `hinh/06-thang-hang.png` | Lâm | 1:00 |
| 13 | Đổi quà & lịch sử | Bảng giá bằng điểm, quà chưa đủ ghi số điểm còn thiếu; voucher dạng vé có mã; sổ điểm EARN/REDEEM có số dư | `hinh/08-doi-qua.png`, `hinh/09-doi-qua-thanh-cong.png`, `hinh/10-lich-su-diem.png` | Lâm | 0:45 |
| 14 | Admin Dashboard | Câu tóm tắt tháng, giao dịch chờ xử lý, biểu đồ theo tháng, top 10, phân bố hạng; quản lý khách hàng và giao dịch | `hinh/11-admin-dashboard.png`, `hinh/14-admin-giao-dich.png` | Lâm | 1:00 |
| 15 | Sao lưu & khôi phục | Export CSV, `mongodump`/`mongorestore`, vai trò trong buổi demo | Ảnh lệnh CMD + thư mục backup **[Linh chụp]** | Linh | 0:45 |
| 16 | **DEMO trực tiếp** | Chạy theo `04-kich-ban-demo.md` | (chuyển sang màn hình demo) | Lâm chủ trì, Tính và Linh hỗ trợ | 8–10 phút |
| 17 | So sánh: App vs IntelliShell vs Visual Query Builder | Cùng 1 truy vấn, 3 cách thực hiện. Ưu và nhược điểm từng cách | Bảng ở mục 5 của `04-kich-ban-demo.md` | Lâm | 1:00 |
| 18 | Kết luận & hướng phát triển | Đạt được gì; giới hạn (đăng nhập, thanh toán mô phỏng); hướng phát triển (OTP, IPN cổng thanh toán, hạn dùng điểm bằng TTL) | – | Lâm | 0:45 |
| 19 | Hỏi đáp | Cảm ơn thầy/cô | – | Cả nhóm | – |

## Câu hỏi giảng viên có thể hỏi và gợi ý trả lời

- **Vì sao không nhúng lịch sử giao dịch vào `khach_hang`?** Vì mảng sẽ tăng mãi, document có thể vượt giới hạn 16 MB, và việc ghi đè cả document lớn tốn tài nguyên. Tách collection riêng và tạo index `{MaKH, NgayTao}` thì đọc theo khách vẫn nhanh.
- **Làm sao không cộng điểm 2 lần?** Cập nhật có điều kiện `TrangThai: "PENDING"` bằng `findOneAndUpdate`. Thao tác này nguyên tử, nên chỉ 1 request đổi được trạng thái.
- **Đổi quà có làm tụt hạng không?** Không. Hạng xét theo `TongChiTieu`, đổi quà chỉ trừ `DiemHienTai`.
- **`DiemHienTai` lưu sẵn có bị lệch với lịch sử không?** Có thể đối soát bằng aggregate tổng `SoDiem` trong `bien_dong_diem`. `SoDuSau` ở mỗi dòng giúp kiểm tra nhanh.
- **Dữ liệu demo hỏng thì sao?** Chạy `mongorestore --drop` để quay về bản sao lưu chuẩn trong vài giây.
