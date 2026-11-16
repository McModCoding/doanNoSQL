# Quy chuẩn thiết kế giao diện [TÊN THƯƠNG HIỆU]

> - Các giá trị trong file là **bắt buộc**, không phải gợi ý. Không dùng màu, font, cỡ chữ, khoảng cách hay độ bo góc nào khác.
> - Gặp chỗ ghi "CHƯA QUYẾT", hoặc cần một giá trị chưa có ở đây: **hỏi người phụ trách giao diện** (Khánh Lâm), không tự chọn.
> - Trước khi làm mới hoặc làm lại cả một phần của trang, vẽ bố cục bằng sơ đồ chữ (ASCII) để nhóm duyệt. Sửa nhỏ thì làm luôn.

---

## 1. Thương hiệu

**Web này dành cho ai, để làm gì** (1–2 câu, viết như đang nói với người lạ):
[ ... ]
VD: Tiệm sửa xe đạp ở quận 3, khách là dân văn phòng đạp xe đi làm. Web để xem bảng giá và đặt lịch sửa.

**Ba tính từ** (tránh "hiện đại / chuyên nghiệp / tối giản": chữ chung chung thì kết quả chung chung):
[ ... ], [ ... ], [ ... ]
VD: mộc, thật thà, nhanh gọn

**Không phải là:**
[ ... ]
VD: không bóng bẩy kiểu startup công nghệ, không sang chảnh, không dễ thương.

**Web nên gợi cảm giác giống thứ gì ngoài đời:**
[ ... ]
VD: tờ phiếu sửa chữa viết tay dán trên tường xưởng. Rõ ràng, có số, hơi thô.

**Chất liệu, màu sắc, đồ vật đặc trưng của lĩnh vực này** (nguồn để lấy màu, hình ảnh, họa tiết):
[ ... ]
VD: dầu máy, xích thép, băng keo điện nhiều màu, bảng giá viết phấn, phiếu biên nhận giấy than.

**Giọng văn:**
[ ... ]
VD: nói thẳng, câu ngắn, có con số cụ thể ("Vá săm 30.000đ, xong trong 15 phút"). Không dùng từ hoa mỹ.

---

## 2. Màu sắc

Tối đa 6 màu. Màu nào cũng phải có lý do.

| Vai trò   | Mã hex  | Dùng ở đâu                     | Lấy từ đâu / vì sao |
|-----------|---------|--------------------------------|---------------------|
| Nền chính | #______ | Nền toàn trang                 | [ ... ]             |
| Nền phụ   | #______ | Khối cần tách biệt, chân trang | [ ... ]             |
| Chữ chính | #______ | Tiêu đề và nội dung            | [ ... ]             |
| Chữ phụ   | #______ | Chú thích, ghi chú nhỏ         | [ ... ]             |
| Màu nhấn  | #______ | Chỉ nút chính và link          | [ ... ]             |
| Viền      | #______ | Đường kẻ, viền ô nhập liệu     | [ ... ]             |

VD (cột "Lấy từ đâu" của màu nhấn): màu băng keo điện vàng quấn trên ghi-đông xe trong xưởng.

Quy tắc:
- Màu nhấn chiếm tối đa khoảng [ 10 ]% diện tích một màn hình.
- Không gradient. Không dùng màu nào ngoài bảng này.
- Trạng thái hover / nhấn của nút: [ ... ] VD: nền tối hơn một bậc, không đổi sang màu khác.
- Chữ trên nền đạt độ tương phản tối thiểu 4.5:1 (chuẩn WCAG AA).

---

## 3. Chữ (typography)

| Vai trò  | Font    | Độ đậm (weight) | Nguồn                |
|----------|---------|-----------------|----------------------|
| Tiêu đề  | [ ... ] | [ ... ]         | [Google Fonts / ...] |
| Nội dung | [ ... ] | [ ... ]         | [ ... ]              |

- Một font cho tất cả cũng được. Nếu dùng hai font thì hai font phải khác nhau rõ rệt.
- Web có tiếng Việt: đã gõ thử "ắ ẳ ẵ ặ ữ ỹ ợ Đ" với font đã chọn, dấu hiển thị đúng font, không bị vá bằng font khác: [ ĐÃ KIỂM TRA / CHƯA ]

**Thang cỡ chữ:**

| Cấp      | Desktop | Mobile | Line-height | Letter-spacing |
|----------|---------|--------|-------------|----------------|
| H1       | [ ]px   | [ ]px  | [ ]         | [ ]            |
| H2       | [ ]px   | [ ]px  | [ ]         | [ ]            |
| H3       | [ ]px   | [ ]px  | [ ]         | [ ]            |
| Nội dung | [ ]px   | [ ]px  | [ ]         | 0              |
| Chữ nhỏ  | [ ]px   | [ ]px  | [ ]         | [ ]            |

VD: H1 72px / 40px, line-height 1.0, letter-spacing -0.02em. Nội dung 18px / 16px, line-height 1.6.

- Độ dài một dòng chữ tối đa: [ 65 ] ký tự.
- Căn lề: [ ... ] VD: mọi thứ căn trái; chỉ căn giữa ở [ ... ].
- Tiêu đề, nút và nhãn viết như câu bình thường (chỉ hoa chữ đầu), không viết hoa toàn bộ.

---

## 4. Khoảng cách và bố cục

- Đơn vị cơ sở: [ 8 ]px. Chỉ dùng các bước: [ 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 ]px.
- Chiều rộng nội dung tối đa: [ ... ]px. Lề hai bên: [ ... ]px trên điện thoại, [ ... ]px trên máy tính.
- Lưới: [ 12 ] cột, khoảng cách giữa các cột [ 24 ]px.

**Nhịp khoảng cách, cố tình không đều:**
- Các thứ thuộc về nhau (tiêu đề và đoạn văn của nó): đặt sát, [ ... ]px
- Giữa các nhóm trong cùng một phần: [ ... ]px
- Giữa các phần lớn của trang: [ ... ]px. Phần quan trọng nhất được nhiều khoảng trống nhất.

**Phần đầu trang (hero):** mở đầu bằng thứ đặc trưng nhất của lĩnh vực này, không mặc định là khẩu hiệu to đặt giữa.
[ mô tả, hoặc vẽ sơ đồ chữ ]

VD: mở đầu bằng chính bảng giá, vì đó là thứ khách cần nhất và đặc trưng nhất của tiệm.

    +--------------------------------------------------+
    | Xe Đạp Ba Tư                  Bảng giá  Đặt lịch |
    |--------------------------------------------------|
    | Vá săm .............................. 30.000đ    |
    | Thay xích .......................... 150.000đ    |
    | Chỉnh phanh ......................... 40.000đ    |
    |                                                  |
    | [Đặt lịch sửa]     Mở 7:00–19:00, nghỉ thứ Hai   |
    +--------------------------------------------------+

---

## 5. Thành phần giao diện

- **Bo góc:** [ ... ]px cho [ ... ], [ ... ]px cho [ ... ]. Độ bo theo vai trò của từng thứ, không dùng một con số cho mọi thứ.
- **Bóng đổ:** [ không dùng ] hoặc [ chỉ dùng cho ... với giá trị ... ].
- **Nút chính:** nền [màu nhấn], chữ [ ... ], cao [ 48 ]px, đệm ngang [ 24 ]px, bo [ ... ]px. Không phát sáng.
- **Nút phụ:** [ ... ]
- **Chữ trên nút và link:** nói rõ bấm vào thì chuyện gì xảy ra. VD: "Đặt lịch sửa", không phải "Khám phá ngay".
- **Thẻ (card):** [ dùng / không dùng ]. Nếu dùng thì cho nội dung nào: [ ... ]
- **Ảnh:** [ ảnh thật của ... ]. Tỉ lệ [ ... ]. Bo góc [ ... ]. VD: ảnh chụp thật tay thợ đang làm, không dùng ảnh stock.
- **Icon:** bộ [ ... ], nét [ ... ]px. Không đặt icon trong vòng tròn màu nhạt, không dùng emoji thay icon.
- **Chuyển động:** [ ... ] VD: không có hiệu ứng khi cuộn; menu mở/đóng 200ms; nút đổi màu khi rê chuột 150ms.

---

## 6. Website tham khảo

Mỗi web chỉ học **một** điều cụ thể. Ghi luôn điều không học.

| Website  | Học điều này | Không học điều này |
|----------|--------------|--------------------|
| [ link ] | [ ... ]      | [ ... ]            |
| [ link ] | [ ... ]      | [ ... ]            |
| [ link ] | [ ... ]      | [ ... ]            |

VD: một trang tạp chí ảnh. Học: ảnh lớn tràn mép, chú thích nhỏ đặt sát dưới ảnh. Không học: màu đen trắng và font của họ.

---

## 7. Danh sách tránh: các kiểu giao diện rập khuôn

Không dùng bất kỳ mục nào dưới đây, trừ khi phần 1–6 ghi rõ là muốn.

**Màu và hiệu ứng**
- Gradient (nhất là tím sang xanh), chữ gradient, nút hoặc viền phát sáng, hiệu ứng kính mờ
- Lớp gradient nhạt phủ lên nền chỉ để trang trí
- Nền kem + font có chân (serif) tương phản cao + màu nhấn cam đất: kiểu đang bị dùng tràn lan
- Nền gần đen + đúng một màu nhấn neon (xanh chuối, đỏ cam)

**Chữ**
- Inter, Roboto, Arial, Open Sans, Poppins, Space Grotesk hoặc font hệ thống làm font chính
- Tô màu, in nghiêng hay in đậm riêng một từ trong tiêu đề
- Nhãn nhỏ viết hoa toàn bộ, giãn chữ, đặt trên mọi tiêu đề
- Font monospace cho các nhãn nhỏ
- Nối thông tin bằng dấu chấm giữa ("A · B · C"), nhãn kiểu "TỪ — cụm từ"

**Bố cục**
- Hero căn giữa: tiêu đề to + một đoạn mô tả + hai nút + huy hiệu kiểu "✨ Mới"
- Hero là một con số to + nhãn nhỏ + vài chỉ số
- Lưới ba thẻ "tính năng", mỗi thẻ một icon trong vòng tròn
- Cắt mọi nội dung vào các thẻ bo góc giống hệt nhau, cùng một bóng mờ nhạt
- Khoảng cách giữa mọi phần đều bằng nhau
- Đánh số 01 / 02 / 03 khi nội dung không thật sự là các bước theo thứ tự
- Kiểu trang báo: kẻ mảnh khắp nơi, góc vuông tuyệt đối, cột chữ dày đặc

**Chuyển động**
- Mọi phần đều trượt lên và hiện dần khi cuộn
- Thẻ nào cũng có hiệu ứng khi rê chuột

**Nội dung**
- Câu sáo rỗng: "Nâng tầm…", "Khai phá tiềm năng", "Giải pháp toàn diện", "Trải nghiệm liền mạch", "Đột phá", "Unlock", "Elevate", "Seamless"
- Lời chứng thực, số liệu, logo khách hàng bịa ra
- Mũi tên "→" gắn sau mọi link và nút
- Emoji dùng làm icon

---

## 8. Trước khi báo "xong" một phần

- [ ] Chỉ dùng giá trị trong file này, không có màu, cỡ chữ hay khoảng cách lạ
- [ ] Không vi phạm mục nào ở phần 7
- [ ] Hiển thị tốt ở chiều rộng 375px (điện thoại) và 1440px (máy tính)
- [ ] Dấu tiếng Việt hiển thị đúng font
- [ ] Có viền focus khi dùng bàn phím; tương phản chữ đạt tối thiểu 4.5:1
- [ ] Nội dung là chữ thật, không còn chữ giữ chỗ
