// Ảnh minh họa TẠM THỜI, lấy từ Wikimedia Commons theo giấy phép tự do hoặc chỉ cần ghi nguồn.
// Ảnh đã được cắt và thu nhỏ. Không chọn ảnh có người hay logo thương hiệu.
// Nguồn, tác giả, giấy phép ghi ở NGUON_ANH bên dưới, hiện ở trang /nguon-anh và docs/07-nguon-anh.md.
// Khi nhóm có ảnh thật: thay tệp trong src/assets/anh và sửa NGUON_ANH cho khớp.
import aoThun from '../assets/anh/ao-thun.jpg'
import bap1 from '../assets/anh/bap-1.jpg'
import bap2 from '../assets/anh/bap-2.jpg'
import bap3 from '../assets/anh/bap-3.jpg'
import gauBong from '../assets/anh/gau-bong.jpg'
import lyGiuNhiet from '../assets/anh/ly-giu-nhiet.jpg'
import mocKhoa from '../assets/anh/moc-khoa.jpg'
import nuocNgot from '../assets/anh/nuoc-ngot.jpg'
import phimDemTrang from '../assets/anh/phim-dem-trang.jpg'
import phimHanhTinh from '../assets/anh/phim-hanh-tinh.jpg'
import phimHoiAn from '../assets/anh/phim-hoi-an.jpg'
import phimMeoMun from '../assets/anh/phim-meo-mun.jpg'
import rap1 from '../assets/anh/rap-1.jpg'
import rap2 from '../assets/anh/rap-2.jpg'
import rap3 from '../assets/anh/rap-3.jpg'
import trangDauDoc900 from '../assets/anh/trang-dau-doc-900.jpg'
import trangDauDoc1500 from '../assets/anh/trang-dau-doc-1500.jpg'
import trangDauNgang960 from '../assets/anh/trang-dau-ngang-960.jpg'
import trangDauNgang1600 from '../assets/anh/trang-dau-ngang-1600.jpg'

/** Poster theo MaPhim (tỉ lệ 2:3). Phim không có ở đây thì dùng poster dạng chữ. */
export const POSTER_PHIM = { P01: phimHanhTinh, P02: phimHoiAn, P03: phimMeoMun, P04: phimDemTrang }

/** Ảnh vuông theo MaSanPham của combo bắp nước. */
export const ANH_COMBO = { 'CB-SOLO': bap1, 'CB-COUPLE': bap2, 'CB-FAMILY': bap3 }

/** Ảnh vuông theo MaPhanThuong. Quà mới thêm mà chưa có ảnh thì để ô trống. */
export const ANH_QUA = {
  PT001: rap1,
  PT002: rap2,
  PT003: rap3,
  PT004: nuocNgot,
  PT005: bap1,
  PT006: bap2,
  PT007: mocKhoa,
  PT008: lyGiuNhiet,
  PT009: gauBong,
  PT010: aoThun,
}

/**
 * Ảnh phòng chiếu ở trang đầu, cắt từ cùng một ảnh gốc (ảnh của rap-1.jpg), mỗi kiểu hai cỡ để màn nét mà không tải thừa.
 * doc: tỉ lệ 3:4, phủ nửa trái màn hình từ 1024px. ngang: tỉ lệ 4:3, nằm trên tấm vé ở màn nhỏ hơn.
 */
export const ANH_TRANG_DAU = {
  doc: `${trangDauDoc900} 900w, ${trangDauDoc1500} 1500w`,
  ngang: `${trangDauNgang960} 960w, ${trangDauNgang1600} 1600w`,
  ngangMacDinh: trangDauNgang960,
}

const CC = (ma, ban) => `https://creativecommons.org/${ma === 'CC0' ? 'publicdomain/zero/1.0' : `licenses/${ma}/${ban}`}/`
const COMMONS = (ten) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(ten.replaceAll(' ', '_'))}`

/** Nguồn từng ảnh: dùng ở đâu, tên tệp trên Commons, tác giả, giấy phép. */
export const NGUON_ANH = [
  { anh: phimHanhTinh, dungCho: 'Poster phim "Hành Tinh Cuối Cùng"', tenTep: 'Earthrise over Compton crater -LRO full res.jpg', tacGia: 'NASA / Goddard Space Flight Center / Arizona State University', giayPhep: 'Phạm vi công cộng', urlGiayPhep: null },
  { anh: phimHoiAn, dungCho: 'Poster phim "Mùa Hè Ở Hội An"', tenTep: 'Lanterns in Hoi An (40480642302).jpg', tacGia: 'Mig Gilbert from Brighton', giayPhep: 'CC BY-SA 2.0', urlGiayPhep: CC('by-sa', '2.0') },
  { anh: phimMeoMun, dungCho: 'Poster phim "Thám Tử Mèo Mun"', tenTep: 'Yellow-eyed Black Cat.jpg', tacGia: 'Mcheer372', giayPhep: 'CC BY-SA 4.0', urlGiayPhep: CC('by-sa', '4.0') },
  { anh: phimDemTrang, dungCho: 'Poster phim "Đêm Trăng Sài Gòn"', tenTep: 'Ho Chi Minh skyline.jpg', tacGia: 'Azor84', giayPhep: 'CC0', urlGiayPhep: CC('CC0') },
  { anh: bap1, dungCho: 'Combo Solo, voucher bắp ngọt size L', tenTep: 'Popcorn 9.jpg', tacGia: 'ViajeroExtraviado', giayPhep: 'CC0', urlGiayPhep: CC('CC0') },
  { anh: bap2, dungCho: 'Combo Couple, voucher Combo Couple', tenTep: 'Popcorn 1.jpg', tacGia: 'Gaurav Dhwaj Khadka', giayPhep: 'CC BY-SA 4.0', urlGiayPhep: CC('by-sa', '4.0') },
  { anh: bap3, dungCho: 'Combo Family', tenTep: 'Popcorn Confection.jpg', tacGia: 'Capvideo', giayPhep: 'CC BY 4.0', urlGiayPhep: CC('by', '4.0') },
  { anh: rap1, dungCho: 'Voucher giảm 20.000đ vé 2D, ảnh phòng chiếu ở trang đầu', tenTep: 'Interior of movie theater, AMC Century City, Sept. 2024.jpg', tacGia: 'Alexis Doine', giayPhep: 'CC0', urlGiayPhep: CC('CC0') },
  { anh: rap2, dungCho: 'Voucher giảm 50.000đ vé 2D/3D', tenTep: 'Auditorium at Gilda on an afternoon in January 2025.jpg', tacGia: 'JIP', giayPhep: 'CC BY-SA 4.0', urlGiayPhep: CC('by-sa', '4.0') },
  { anh: rap3, dungCho: 'Voucher 1 vé 2D miễn phí', tenTep: 'Columbia City Cinema main hall.jpg', tacGia: 'Joe Mabel', giayPhep: 'CC BY-SA 3.0', urlGiayPhep: CC('by-sa', '3.0') },
  { anh: nuocNgot, dungCho: 'Voucher nước ngọt size L', tenTep: 'Raspberryade.jpg', tacGia: 'Ubcule', giayPhep: 'CC BY-SA 3.0', urlGiayPhep: CC('by-sa', '3.0') },
  { anh: mocKhoa, dungCho: 'Móc khóa linh vật LoyalCine', tenTep: 'Keyrings (ubt).JPG', tacGia: 'Tomasz Sienicki', giayPhep: 'CC BY 3.0', urlGiayPhep: CC('by', '3.0') },
  { anh: lyGiuNhiet, dungCho: 'Ly giữ nhiệt LoyalCine', tenTep: 'Thermos flask with hot water.jpg', tacGia: 'Robert Orzanna', giayPhep: 'CC BY-SA 4.0', urlGiayPhep: CC('by-sa', '4.0') },
  { anh: gauBong, dungCho: 'Gấu bông linh vật', tenTep: 'Handmade teddy bear.jpg', tacGia: 'Clément Bucco-Lechat', giayPhep: 'CC BY-SA 3.0', urlGiayPhep: CC('by-sa', '3.0') },
  { anh: aoThun, dungCho: 'Áo thun LoyalCine', tenTep: 'Worn T-shirt white.png', tacGia: 'Taylor_49', giayPhep: 'CC BY-SA 4.0', urlGiayPhep: CC('by-sa', '4.0') },
].map((a) => ({ ...a, trang: COMMONS(a.tenTep) }))
