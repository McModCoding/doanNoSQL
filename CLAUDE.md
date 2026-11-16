# CLAUDE.md

@DESIGN.md

## Dự án

- Web của: [tên thương hiệu]. [Mô tả 1 câu: web dành cho ai, để làm gì]
- Công nghệ: [VD: HTML/CSS/JS thuần, hoặc React, Next.js...]. Giữ nguyên công nghệ này. Không chuyển sang framework khác.
- Không cài thêm thư viện giao diện (bộ UI, bộ icon, thư viện hiệu ứng) khi chưa hỏi tôi.

## Thứ tự ưu tiên khi các nguồn mâu thuẫn nhau

1. Yêu cầu tôi gõ trực tiếp trong cuộc trò chuyện
2. DESIGN.md: quyết định thiết kế của tôi, bắt buộc tuân theo
3. PRODUCT.md: thông tin về sản phẩm và người dùng (do /impeccable init tạo)
4. Skill Impeccable
5. Taste Skill (design-taste-frontend)

Cần một giá trị chưa có trong DESIGN.md, gặp chỗ ghi "CHƯA QUYẾT", hoặc ô nào bên dưới còn trống: hỏi tôi, không tự chọn.

## Vai trò của từng công cụ

- DESIGN.md là hướng thiết kế MỚI do tôi viết, không phải mô tả giao diện cũ. Không thay thế, không viết lại DESIGN.md, không chạy /impeccable document.
- Taste Skill: dùng khi xây mới hoặc làm lại giao diện.
  Núm điều chỉnh (1 đến 10): VARIANCE = [ ], MOTION = [ ], DENSITY = [ ]
- Impeccable: dùng để đánh giá (critique, audit), kiểm lỗi tự động (detect) và hoàn thiện (polish).
- Không dùng skill thiết kế nào khác.

## Quy trình cho mỗi phần của trang

1. Đọc lại DESIGN.md. Đề xuất 2 bố cục bằng sơ đồ chữ (ASCII), nói rõ bố cục nào gần kiểu mặc định của AI hơn. Chờ tôi chọn.
2. Code phần đã chọn. Chỉ dùng design tokens. Không đụng vào phần khác.
3. Mở trang trong trình duyệt (trình duyệt của công cụ đang dùng, hoặc trình duyệt chạy ngầm qua script của skill). Chụp màn hình ở khổ máy tính (1440px) và khổ điện thoại (390px), rồi tự xem ảnh chụp.
4. Đối chiếu ảnh chụp với phần 7 và phần 8 của DESIGN.md. Chạy bộ kiểm tra tự động của Impeccable và của Taste Skill theo hướng dẫn trong từng skill. Sửa hết lỗi tìm được.
5. Báo lại ngắn gọn: đã đổi gì, ảnh chụp sau khi sửa, lỗi nào còn lại và vì sao.

## Quy tắc cho nội dung trên web

- Tiếng Việt có dấu đầy đủ. Font phải hiển thị đủ dấu, không để trình duyệt vá dấu bằng font khác.
- Không dùng dấu gạch dài (— hoặc –) để ngăn cách. Khoảng giờ, khoảng giá viết bằng chữ "đến", VD: 7:00 đến 19:00.
- Không bịa nội dung (lời khen của khách, số liệu, logo đối tác). Thiếu nội dung thì để [CẦN NỘI DUNG] và báo tôi.
- Ảnh: ưu tiên ảnh thật tôi cung cấp. Nếu phải dùng ảnh thay thế tạm, ghi rõ trong báo cáo để tôi thay.
