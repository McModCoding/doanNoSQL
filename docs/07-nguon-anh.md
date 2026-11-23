# Nguồn ảnh minh họa

Ảnh trong app là ảnh minh họa **tạm thời**, lấy từ Wikimedia Commons. Mỗi ảnh dùng theo giấy phép ghi trong bảng:
- Phạm vi công cộng và CC0: dùng tự do.
- CC BY và CC BY-SA: phải ghi tác giả, giấy phép và nguồn. App ghi ở trang `/nguon-anh`, có đường dẫn từ trang đầu. Ảnh cắt từ ảnh CC BY-SA vẫn theo giấy phép CC BY-SA của ảnh gốc.

Ảnh đã được cắt và thu nhỏ. Khi chọn, nhóm bỏ qua ảnh có người và ảnh có logo thương hiệu.

Tệp ảnh nằm ở `frontend/src/assets/anh/`; danh sách dùng trong code ở `frontend/src/data/anh.js` (`POSTER_PHIM`, `ANH_COMBO`, `ANH_QUA`, `NGUON_ANH`). Khi nhóm có poster phim hoặc ảnh rạp thật được phép dùng: thay tệp cùng tên, rồi sửa dòng tương ứng trong `NGUON_ANH` và bảng dưới đây. Phim hay quà chưa có ảnh thì app tự dùng poster dạng chữ hoặc ô trống.

| Tệp trong app | Dùng cho | Ảnh gốc trên Wikimedia Commons | Tác giả | Giấy phép |
|---|---|---|---|---|
| `phim-hanh-tinh.jpg` | Poster phim "Hành Tinh Cuối Cùng" | [Earthrise over Compton crater -LRO full res.jpg](https://commons.wikimedia.org/wiki/File:Earthrise_over_Compton_crater_-LRO_full_res.jpg) | NASA / Goddard Space Flight Center / Arizona State University | Phạm vi công cộng |
| `phim-hoi-an.jpg` | Poster phim "Mùa Hè Ở Hội An" | [Lanterns in Hoi An (40480642302).jpg](https://commons.wikimedia.org/wiki/File:Lanterns_in_Hoi_An_(40480642302).jpg) | Mig Gilbert from Brighton | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |
| `phim-meo-mun.jpg` | Poster phim "Thám Tử Mèo Mun" | [Yellow-eyed Black Cat.jpg](https://commons.wikimedia.org/wiki/File:Yellow-eyed_Black_Cat.jpg) | Mcheer372 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `phim-dem-trang.jpg` | Poster phim "Đêm Trăng Sài Gòn" | [Ho Chi Minh skyline.jpg](https://commons.wikimedia.org/wiki/File:Ho_Chi_Minh_skyline.jpg) | Azor84 | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `bap-1.jpg` | Combo Solo, voucher bắp ngọt size L | [Popcorn 9.jpg](https://commons.wikimedia.org/wiki/File:Popcorn_9.jpg) | ViajeroExtraviado | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `bap-2.jpg` | Combo Couple, voucher Combo Couple | [Popcorn 1.jpg](https://commons.wikimedia.org/wiki/File:Popcorn_1.jpg) | Gaurav Dhwaj Khadka | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `bap-3.jpg` | Combo Family | [Popcorn Confection.jpg](https://commons.wikimedia.org/wiki/File:Popcorn_Confection.jpg) | Capvideo | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `rap-1.jpg` | Voucher giảm 20.000đ vé 2D | [Interior of movie theater, AMC Century City, Sept. 2024.jpg](https://commons.wikimedia.org/wiki/File:Interior_of_movie_theater,_AMC_Century_City,_Sept._2024.jpg) | Alexis Doine | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `rap-2.jpg` | Voucher giảm 50.000đ vé 2D/3D | [Auditorium at Gilda on an afternoon in January 2025.jpg](https://commons.wikimedia.org/wiki/File:Auditorium_at_Gilda_on_an_afternoon_in_January_2025.jpg) | JIP | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `rap-3.jpg, rap-3-rong.jpg` | Voucher 1 vé 2D miễn phí, ảnh phòng chiếu ở trang đầu | [Columbia City Cinema main hall.jpg](https://commons.wikimedia.org/wiki/File:Columbia_City_Cinema_main_hall.jpg) | Joe Mabel | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `nuoc-ngot.jpg` | Voucher nước ngọt size L | [Raspberryade.jpg](https://commons.wikimedia.org/wiki/File:Raspberryade.jpg) | Ubcule | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `moc-khoa.jpg` | Móc khóa linh vật LoyalCine | [Keyrings (ubt).JPG](https://commons.wikimedia.org/wiki/File:Keyrings_(ubt).JPG) | Tomasz Sienicki | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| `ly-giu-nhiet.jpg` | Ly giữ nhiệt LoyalCine | [Thermos flask with hot water.jpg](https://commons.wikimedia.org/wiki/File:Thermos_flask_with_hot_water.jpg) | Robert Orzanna | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `gau-bong.jpg` | Gấu bông linh vật | [Handmade teddy bear.jpg](https://commons.wikimedia.org/wiki/File:Handmade_teddy_bear.jpg) | Clément Bucco-Lechat | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `ao-thun.jpg` | Áo thun LoyalCine | [Worn T-shirt white.png](https://commons.wikimedia.org/wiki/File:Worn_T-shirt_white.png) | Taylor_49 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
