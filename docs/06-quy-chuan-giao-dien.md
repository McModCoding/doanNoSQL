# Quy chuẩn thiết kế giao diện LoyalCine

> - Các giá trị trong file là **bắt buộc**, không phải gợi ý. Không dùng màu, font, cỡ chữ, khoảng cách hay độ bo góc nào khác.
> - Gặp chỗ ghi "CHƯA QUYẾT", hoặc cần một giá trị chưa có ở đây: **hỏi người phụ trách giao diện** (Khánh Lâm), không tự chọn.
> - Trước khi làm mới hoặc làm lại cả một phần của trang, vẽ bố cục bằng sơ đồ chữ (ASCII) để nhóm duyệt. Sửa nhỏ thì làm luôn.

---

## 1. Thương hiệu

**Web này dành cho ai, để làm gì** (1–2 câu, viết như đang nói với người lạ):
LoyalCine là app thành viên của một rạp chiếu phim (tên hư cấu, làm cho đồ án NoSQL). Khách xem phim mở app để xem thẻ thành viên, điểm và hạng, mua vé hoặc combo bắp nước rồi đổi điểm lấy quà; nhân viên rạp dùng trang quản trị để tra cứu khách, xử lý giao dịch và xem thống kê.

**Ba tính từ** (tránh "hiện đại / chuyên nghiệp / tối giản": chữ chung chung thì kết quả chung chung):
rõ số, nhanh gọn, có chất giấy

**Không phải là:**
không bóng bẩy kiểu app ngân hàng, không neon kiểu game, không dễ thương kiểu app trẻ em, không sang chảnh.

**Web nên gợi cảm giác giống thứ gì ngoài đời:**
tấm vé giấy in nhiệt xé ở quầy soát vé: con số in to và rõ (giờ chiếu, hàng ghế, giá tiền), mực đen trên giấy trắng ngà, một con dấu đỏ, đường răng cưa ngăn phần cuống vé.

**Chất liệu, màu sắc, đồ vật đặc trưng của lĩnh vực này** (nguồn để lấy màu, hình ảnh, họa tiết):
vé giấy in nhiệt, cuống vé xé theo đường răng cưa, con dấu đỏ "đã soát vé", bảng giờ chiếu ở quầy, số ghế in trên lưng ghế, hộp bắp giấy.

**Giọng văn:**
nói thẳng, câu ngắn, có con số cụ thể ("Còn 150.000đ nữa là lên hạng Bạc", "2 vé 2D: +190 điểm"). Gọi khách là "bạn". Nút nói rõ việc sẽ xảy ra. Không dùng từ hoa mỹ.

---

## 2. Màu sắc

Tối đa 6 màu. Màu nào cũng phải có lý do.

| Vai trò   | Mã hex  | Dùng ở đâu                     | Lấy từ đâu / vì sao |
|-----------|---------|--------------------------------|---------------------|
| Nền chính | #F5F4F0 | Nền toàn trang                 | Giấy vé in nhiệt: trắng ngà hơi lạnh, không phải màu kem |
| Nền phụ   | #E8E5DD | Tấm vé thành viên, rãnh thanh tiến độ, hàng tiêu đề bảng, chân trang | Phần cuống vé, giấy dày hơn và hơi xám |
| Chữ chính | #1A1A1A | Tiêu đề và nội dung            | Mực in đen trên vé (15,8:1 trên nền chính) |
| Chữ phụ   | #5C5852 | Chú thích, ghi chú nhỏ         | Mực in đã nhạt trên vé cũ (6,4:1 trên nền chính, 5,6:1 trên nền phụ) |
| Màu nhấn  | #B42318 | Chỉ nút chính và link          | Mực đỏ con dấu "đã soát vé" (chữ trắng trên màu này 6,6:1) |
| Viền      | #CFCAC0 | Đường kẻ, viền ô nhập liệu, đường răng cưa | Đường răng cưa xé cuống vé |

Quy tắc:
- Màu nhấn chiếm tối đa khoảng 10% diện tích một màn hình.
- Không gradient. Không dùng màu nào ngoài bảng này và bảng màu chức năng ngay bên dưới.
- Trạng thái hover / nhấn của nút: nút chính có nền tối hơn một bậc #8F1B12 (cùng màu đỏ dấu, đậm hơn); nút phụ có nền chuyển sang Nền phụ #E8E5DD. Không đổi sang màu khác.
- Chữ trên nền đạt độ tương phản tối thiểu 4.5:1 (chuẩn WCAG AA).

**Màu chức năng** (thêm theo quyết định ngày 16/11/2026): chỉ dùng cho nhãn nhỏ, thông báo và biểu đồ, luôn đi kèm chữ, không dùng làm nền cho khối lớn.

| Vai trò       | Mã hex  | Dùng ở đâu                                  | Vì sao |
|---------------|---------|---------------------------------------------|--------|
| Hạng Đồng     | #8A5A3B | Chấm màu cạnh chữ "Đồng"                    | Màu đồng xu (5,3:1 trên nền chính) |
| Hạng Bạc      | #5B6068 | Chấm màu cạnh chữ "Bạc"                     | Bạc xỉn (5,8:1) |
| Hạng Vàng     | #7A5B10 | Chấm màu cạnh chữ "Vàng"                    | Vàng đồng thau, đủ tối để đọc được (5,7:1) |
| Thành công    | #2F6B3A | Giao dịch thành công, đổi quà xong          | Mực dấu xanh "đã thanh toán" (5,8:1) |
| Đang chờ      | #8A5A00 | Giao dịch chờ thanh toán                    | Mực vàng nâu (5,4:1) |
| Lỗi, thất bại | #B42318 | Lỗi nhập liệu, giao dịch thất bại           | Dùng chung Màu nhấn, luôn kèm biểu tượng và chữ |

- Biểu đồ ở trang quản trị: cột và thanh dùng Chữ chính #1A1A1A; cột cần làm nổi (tháng hiện tại hoặc tháng cao nhất) dùng Màu nhấn; phân bố khách theo hạng dùng 3 màu hạng.

---

## 3. Chữ (typography)

| Vai trò  | Font             | Độ đậm (weight)                       | Nguồn                |
|----------|------------------|---------------------------------------|----------------------|
| Tiêu đề  | Barlow Condensed | 600; con số lớn 700                   | Google Fonts, lưu sẵn trong project qua gói @fontsource/barlow-condensed (chạy được khi không có mạng) |
| Nội dung | Be Vietnam Pro   | 400 nội dung, 500 nhãn, 600 nút       | Google Fonts, lưu sẵn qua gói @fontsource/be-vietnam-pro |

- Một font cho tất cả cũng được. Nếu dùng hai font thì hai font phải khác nhau rõ rệt.
- Web có tiếng Việt: đã gõ thử "ắ ẳ ẵ ặ ữ ỹ ợ Đ" với font đã chọn, dấu hiển thị đúng font, không bị vá bằng font khác: ĐÃ KIỂM TRA (16/11/2026, Chrome: cả 8 chữ ở cả hai font đều do đúng font vẽ)

**Thang cỡ chữ:**

| Cấp      | Desktop | Mobile | Line-height | Letter-spacing |
|----------|---------|--------|-------------|----------------|
| H1       | 40px    | 32px   | 1.05        | -0.01em        |
| H2       | 28px    | 24px   | 1.1         | 0              |
| H3       | 20px    | 20px   | 1.2         | 0              |
| Nội dung | 16px    | 16px   | 1.55        | 0              |
| Chữ nhỏ  | 13px    | 13px   | 1.4         | 0.01em         |

- Con số lớn (điểm trên thẻ, tổng tiền khi thanh toán): Barlow Condensed 700, 56px máy tính / 48px điện thoại, line-height 1.0. Số xếp thành cột trong bảng dùng chữ số đều nhau (tabular-nums).
- Độ dài một dòng chữ tối đa: 65 ký tự.
- Căn lề: mọi thứ căn trái; chỉ căn giữa ở mã QR, mã vạch và màn hình kết quả thanh toán.
- Tiêu đề, nút và nhãn viết như câu bình thường (chỉ hoa chữ đầu), không viết hoa toàn bộ.

---

## 4. Khoảng cách và bố cục

- Đơn vị cơ sở: 8px. Chỉ dùng các bước: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px.
- Chiều rộng nội dung tối đa: app khách hàng 440px (khung điện thoại, trên máy tính đặt giữa màn hình); trang quản trị 1280px. Lề hai bên: 16px trên điện thoại, 32px trên máy tính.
- Lưới: 12 cột, khoảng cách giữa các cột 24px (trang quản trị). App khách hàng dùng một cột.

**Nhịp khoảng cách, cố tình không đều:**
- Các thứ thuộc về nhau (tiêu đề và đoạn văn của nó): đặt sát, 8px
- Giữa các nhóm trong cùng một phần: 24px
- Giữa các phần lớn của trang: 48px. Phần quan trọng nhất được nhiều khoảng trống nhất: tấm vé thành viên có 64px phía dưới.

**Phần đầu trang (hero):** mở đầu bằng thứ đặc trưng nhất của lĩnh vực này, không mặc định là khẩu hiệu to đặt giữa.
App khách hàng mở đầu bằng chính tấm vé thành viên (tên, hạng, điểm, mã QR, số tiền còn thiếu để lên hạng), vì đó là thứ khách đưa cho nhân viên quầy và là phần đặc trưng nhất của chương trình thành viên. Trang quản trị không mở đầu bằng một hàng con số lớn (xem phần 7); bố cục cụ thể của từng màn hình được duyệt bằng sơ đồ chữ trước khi làm.

    +------------------------------------+
    | LoyalCine                Đăng xuất |
    | +--------------------------------+ |
    | | Thẻ thành viên       Hạng Đồng | |
    | | Trần Minh Anh                  | |
    | | 9.500 điểm                     | |
    | |- - - - - - - - - - - - - - - - | |
    | | [QR]  Còn 150.000đ nữa là lên  | |
    | |       hạng Bạc                 | |
    | +--------------------------------+ |
    | Mua vé   Bắp nước   Đổi quà        |
    +------------------------------------+

---

## 5. Thành phần giao diện

- **Bo góc:** 2px cho nút, ô nhập và nhãn (góc vé in gần vuông); 8px cho tấm vé thành viên, vé, voucher và hộp thoại; 0 cho bảng và hàng danh sách. Độ bo theo vai trò của từng thứ, không dùng một con số cho mọi thứ.
- **Bóng đổ:** chỉ dùng cho hộp thoại và menu nổi, giá trị 0 8px 24px rgba(26, 26, 26, 0.16). Mọi khối khác tách lớp bằng Nền phụ và Viền.
- **Nút chính:** nền màu nhấn #B42318, chữ trắng Be Vietnam Pro 600 16px, cao 48px, đệm ngang 24px, bo 2px. Không phát sáng.
- **Nút phụ:** nền trong suốt, viền 1px Chữ chính #1A1A1A, chữ Chữ chính, cao 48px, bo 2px; hover nền Nền phụ #E8E5DD. Nút nhỏ trong bảng của trang quản trị cao 32px.
- **Chữ trên nút và link:** nói rõ bấm vào thì chuyện gì xảy ra, ví dụ "Thanh toán 190.000đ bằng MoMo", "Đổi voucher với 450 điểm". Link màu nhấn, có gạch chân.
- **Thẻ (card):** dùng cho những thứ ngoài đời là một tấm vé: thẻ thành viên, vé đã mua, voucher và từng món quà. Mỗi "vé" có Nền phụ hoặc viền 1px, bo 8px, một đường răng cưa nét đứt ngăn phần cuống. Danh sách (lịch sử điểm, giao dịch, bảng quản trị) là các hàng, không bọc từng hàng trong thẻ.
- **Ảnh:** chưa có ảnh thật. Poster phim tạm dùng poster dạng chữ (tên phim in Barlow Condensed trên Nền phụ, tỉ lệ 2:3, bo 2px), không dùng emoji. [CẦN NỘI DUNG: poster phim hoặc ảnh rạp thật được phép dùng, nếu nhóm có]
- **Icon:** bộ @ant-design/icons kiểu Outlined (đã có sẵn trong project, không cài thêm), nét mảnh khoảng 1px ở cỡ 16px, cùng màu với chữ đi kèm. Không đặt icon trong vòng tròn màu nhạt, không dùng emoji thay icon.
- **Chuyển động:** không có hiệu ứng khi cuộn; nút đổi màu khi rê chuột 150ms; hộp thoại mở và đóng 200ms; thanh tiến độ lên hạng chạy 400ms khi điểm thay đổi; tắt hết khi người dùng bật chế độ giảm chuyển động (prefers-reduced-motion).

---

## 6. Website tham khảo

Mỗi web chỉ học **một** điều cụ thể. Ghi luôn điều không học.

| Website  | Học điều này | Không học điều này |
|----------|--------------|--------------------|
| a24films.com | Tiết chế: nhiều khoảng trắng, mỗi màn hình chỉ một điểm nhấn | Font chữ riêng của họ và hiệu ứng đĩa CD trượt |
| picturehouses.com | Lõi đen trắng, màu chỉ dùng để phân nhóm (ở đây là màu hạng) | Logo và bộ màu riêng của từng rạp |
| Starbucks Rewards (app) | Điểm, hạng và thanh tiến độ thấy ngay ở trang chủ; quà chưa đủ điểm hiện số điểm còn thiếu | Màu xanh thương hiệu và giọng quảng cáo |
| Shaw Theatres (bài phân tích của filmgrail.com) | Nút giờ chiếu to và rõ; chọn ngày bằng một hàng | Bố cục và màu của họ |

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
