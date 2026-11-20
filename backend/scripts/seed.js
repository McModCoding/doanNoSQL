import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = process.env.DB_NAME || 'CinemaLoyaltyDB'

export const HANG_THANH_VIEN = [
  {
    MaHang: 'DONG',
    TenHang: 'Đồng',
    NguongChiTieu: 0,
    MucChiTieuToiThieu: 0,
    MucChiTieuToiDa: 9999999,
    ThuTu: 1,
    MauSac: '#a0522d',
    QuyenLoi: ['Tích 1 điểm cho mỗi 1.000đ chi tiêu', 'Đổi điểm lấy voucher vé, bắp nước, quà tặng'],
    TrangThai: 'ACTIVE',
  },
  {
    MaHang: 'BAC',
    TenHang: 'Bạc',
    NguongChiTieu: 10000000,
    MucChiTieuToiThieu: 10000000,
    MucChiTieuToiDa: 29999999,
    ThuTu: 2,
    MauSac: '#6b7785',
    QuyenLoi: ['Toàn bộ quyền lợi hạng Đồng', 'Tặng 1 combo bắp nước trong tháng sinh nhật', 'Ưu tiên đổi quà sự kiện'],
    TrangThai: 'ACTIVE',
  },
  {
    MaHang: 'VANG',
    TenHang: 'Vàng',
    NguongChiTieu: 30000000,
    MucChiTieuToiThieu: 30000000,
    MucChiTieuToiDa: null,
    ThuTu: 3,
    MauSac: '#b8860b',
    QuyenLoi: ['Toàn bộ quyền lợi hạng Bạc', 'Tặng 2 vé 2D trong tháng sinh nhật', 'Quầy thanh toán ưu tiên'],
    TrangThai: 'ACTIVE',
  },
]

export const PHAN_THUONG = [
  { MaPhanThuong: 'PT001', MaQua: 'PT001', TenPhanThuong: 'Voucher giảm 20.000đ vé 2D', TenQua: 'Voucher giảm 20.000đ vé 2D', LoaiPhanThuong: 'VOUCHER_VE', LoaiQua: 'VOUCHER_VE', DiemCanDoi: 200, DiemCan: 200, SoLuongTon: 500, GiaTri: 20000, HanSuDungNgay: 30, MoTa: 'Áp dụng cho 1 vé 2D bất kỳ suất chiếu.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT002', MaQua: 'PT002', TenPhanThuong: 'Voucher giảm 50.000đ vé 2D/3D', TenQua: 'Voucher giảm 50.000đ vé 2D/3D', LoaiPhanThuong: 'VOUCHER_VE', LoaiQua: 'VOUCHER_VE', DiemCanDoi: 450, DiemCan: 450, SoLuongTon: 400, GiaTri: 50000, HanSuDungNgay: 30, MoTa: 'Áp dụng cho 1 vé 2D hoặc 3D.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT003', MaQua: 'PT003', TenPhanThuong: 'Voucher 1 vé 2D miễn phí', TenQua: 'Voucher 1 vé 2D miễn phí', LoaiPhanThuong: 'VOUCHER_VE', LoaiQua: 'VOUCHER_VE', DiemCanDoi: 900, DiemCan: 900, SoLuongTon: 250, GiaTri: 95000, HanSuDungNgay: 45, MoTa: 'Đổi 1 vé 2D miễn phí, trừ suất chiếu đặc biệt.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT004', MaQua: 'PT004', TenPhanThuong: 'Voucher nước ngọt size L', TenQua: 'Voucher nước ngọt size L', LoaiPhanThuong: 'VOUCHER_BAP_NUOC', LoaiQua: 'VOUCHER_COMBO', DiemCanDoi: 350, DiemCan: 350, SoLuongTon: 600, GiaTri: 35000, HanSuDungNgay: 30, MoTa: '1 ly nước ngọt size L tại quầy bắp nước.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT005', MaQua: 'PT005', TenPhanThuong: 'Voucher bắp ngọt size L', TenQua: 'Voucher bắp ngọt size L', LoaiPhanThuong: 'VOUCHER_BAP_NUOC', LoaiQua: 'VOUCHER_COMBO', DiemCanDoi: 500, DiemCan: 500, SoLuongTon: 500, GiaTri: 55000, HanSuDungNgay: 30, MoTa: '1 hộp bắp ngọt size L.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT006', MaQua: 'PT006', TenPhanThuong: 'Voucher Combo Couple', TenQua: 'Voucher Combo Couple', LoaiPhanThuong: 'VOUCHER_BAP_NUOC', LoaiQua: 'VOUCHER_COMBO', DiemCanDoi: 950, DiemCan: 950, SoLuongTon: 300, GiaTri: 109000, HanSuDungNgay: 30, MoTa: '1 bắp lớn + 2 nước ngọt size L.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT007', MaQua: 'PT007', TenPhanThuong: 'Móc khóa linh vật LoyalCine', TenQua: 'Móc khóa linh vật LoyalCine', LoaiPhanThuong: 'QUA_HIEN_VAT', LoaiQua: 'QUA_TANG', DiemCanDoi: 800, DiemCan: 800, SoLuongTon: 150, GiaTri: 60000, HanSuDungNgay: 60, MoTa: 'Nhận tại quầy vé, mang theo mã đổi quà.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT008', MaQua: 'PT008', TenPhanThuong: 'Ly giữ nhiệt LoyalCine', TenQua: 'Ly giữ nhiệt LoyalCine', LoaiPhanThuong: 'QUA_HIEN_VAT', LoaiQua: 'QUA_TANG', DiemCanDoi: 1500, DiemCan: 1500, SoLuongTon: 120, GiaTri: 150000, HanSuDungNgay: 60, MoTa: 'Ly giữ nhiệt 500ml phiên bản giới hạn.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT009', MaQua: 'PT009', TenPhanThuong: 'Gấu bông linh vật', TenQua: 'Gấu bông linh vật', LoaiPhanThuong: 'QUA_HIEN_VAT', LoaiQua: 'QUA_TANG', DiemCanDoi: 2500, DiemCan: 2500, SoLuongTon: 80, GiaTri: 250000, HanSuDungNgay: 60, MoTa: 'Gấu bông cao 30cm.', TrangThai: 'ACTIVE' },
  { MaPhanThuong: 'PT010', MaQua: 'PT010', TenPhanThuong: 'Áo thun LoyalCine', TenQua: 'Áo thun LoyalCine', LoaiPhanThuong: 'QUA_HIEN_VAT', LoaiQua: 'QUA_TANG', DiemCanDoi: 3000, DiemCan: 3000, SoLuongTon: 60, GiaTri: 300000, HanSuDungNgay: 60, MoTa: 'Áo thun cotton, nhiều size.', TrangThai: 'ACTIVE' },
]

export const KHUYEN_MAI = [
  { MaKM: 'KM001', MaKhuyenMai: 'KM001', TenKM: 'Sinh nhật vui vẻ', TenKhuyenMai: 'Sinh nhật vui vẻ', MoTa: 'Thành viên hạng Bạc trở lên được tặng combo bắp nước trong tháng sinh nhật.', ApDungChoHang: ['BAC', 'VANG'], HangApDung: ['BAC', 'VANG'], NgayBatDau: new Date('2026-01-01T00:00:00Z'), NgayKetThuc: new Date('2027-12-31T23:59:59Z'), TrangThai: 'ACTIVE' },
  { MaKM: 'KM002', MaKhuyenMai: 'KM002', TenKM: 'Chào thành viên mới', TenKhuyenMai: 'Chào thành viên mới', MoTa: 'Đăng ký thành viên trong tháng này được tặng 1 voucher nước ngọt size L.', ApDungChoHang: ['DONG', 'BAC', 'VANG'], HangApDung: ['DONG', 'BAC', 'VANG'], NgayBatDau: new Date('2026-10-01T00:00:00Z'), NgayKetThuc: new Date('2026-12-31T23:59:59Z'), TrangThai: 'ACTIVE' },
  { MaKM: 'KM003', MaKhuyenMai: 'KM003', TenKM: 'Mùa quà cuối năm', TenKhuyenMai: 'Mùa quà cuối năm', MoTa: 'Thêm nhiều quà tặng hiện vật mới, số lượng có hạn, đổi điểm tại app hoặc quầy vé.', ApDungChoHang: ['DONG', 'BAC', 'VANG'], HangApDung: ['DONG', 'BAC', 'VANG'], NgayBatDau: new Date('2026-11-01T00:00:00Z'), NgayKetThuc: new Date('2026-12-31T23:59:59Z'), TrangThai: 'ACTIVE' },
]

export async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(DB_NAME)

  console.log(`[Seed] Bắt đầu nạp dữ liệu chuẩn cho "${DB_NAME}"...`)

  // Xóa sạch các collection cũ để chuẩn hóa về trạng thái ban đầu
  const existingCols = (await db.listCollections().toArray()).map((c) => c.name)
  for (const col of [
    'khach_hang',
    'hang_thanh_vien',
    'lich_su_hang',
    'phan_thuong',
    'doi_thuong',
    'bien_dong_diem',
    'giao_dich',
    'khuyen_mai',
  ]) {
    if (existingCols.includes(col)) {
      await db.collection(col).drop()
    }
  }

  // 1. Tạo indexes
  await db.collection('khach_hang').createIndex({ MaKH: 1 }, { unique: true })
  await db.collection('khach_hang').createIndex({ SoDienThoai: 1 })
  await db.collection('khach_hang').createIndex({ SDT: 1 })
  await db.collection('hang_thanh_vien').createIndex({ MaHang: 1 }, { unique: true })
  await db.collection('phan_thuong').createIndex({ MaPhanThuong: 1 })
  await db.collection('giao_dich').createIndex({ MaGiaoDich: 1 })
  await db.collection('giao_dich').createIndex({ MaKH: 1, NgayTao: -1 })
  await db.collection('bien_dong_diem').createIndex({ MaKH: 1, NgayTao: -1 })
  await db.collection('doi_thuong').createIndex({ MaKH: 1, NgayDoi: -1 })

  // 2. Nạp hang_thanh_vien, phan_thuong, khuyen_mai
  await db.collection('hang_thanh_vien').insertMany(HANG_THANH_VIEN)
  await db.collection('phan_thuong').insertMany(PHAN_THUONG)
  await db.collection('khuyen_mai').insertMany(KHUYEN_MAI)

  // 3. Nạp tài khoản khách hàng chuẩn Demo theo docs/04-kich-ban-demo.md
  const dsKhachHang = [
    {
      MaKH: 'KH001',
      HoTen: 'Trần Minh Anh',
      SoDienThoai: '0901000001',
      SDT: '0901000001',
      Email: 'tran.minh.anh01@example.com',
      NgaySinh: new Date('2003-11-20'),
      GioiTinh: 'Nữ',
      NgayDangKy: new Date('2025-09-21T03:15:00Z'),
      MaThe: 'LC00000001',
      MaTheThanhVien: 'LC00000001',
      MaQR: 'QR_MEMBER_001',
      MaHangHienTai: 'DONG',
      DiemHienTai: 9500,
      TongDiemTichLuy: 9850,
      TongChiTieu: 9850000,
      TongChiTieuNam: 9850000,
      NamXetHang: 2026,
      TrangThai: 'ACTIVE',
    },
    {
      MaKH: 'KH002',
      HoTen: 'Lê Hoàng Nam',
      SoDienThoai: '0901000002',
      SDT: '0901000002',
      Email: 'le.hoang.nam02@example.com',
      NgaySinh: new Date('1999-04-02'),
      GioiTinh: 'Nam',
      NgayDangKy: new Date('2025-05-10T08:30:00Z'),
      MaThe: 'LC00000002',
      MaTheThanhVien: 'LC00000002',
      MaQR: 'QR_MEMBER_002',
      MaHangHienTai: 'BAC',
      DiemHienTai: 12400,
      TongDiemTichLuy: 29850,
      TongChiTieu: 29850000,
      TongChiTieuNam: 29850000,
      NamXetHang: 2026,
      TrangThai: 'ACTIVE',
    },
    {
      MaKH: 'KH003',
      HoTen: 'Phạm Thu Hà',
      SoDienThoai: '0901000003',
      SDT: '0901000003',
      Email: 'pham.thu.ha03@example.com',
      NgaySinh: new Date('1995-08-15'),
      GioiTinh: 'Nữ',
      NgayDangKy: new Date('2024-12-01T10:00:00Z'),
      MaThe: 'LC00000003',
      MaTheThanhVien: 'LC00000003',
      MaQR: 'QR_MEMBER_003',
      MaHangHienTai: 'VANG',
      DiemHienTai: 35000,
      TongDiemTichLuy: 36420,
      TongChiTieu: 36420000,
      TongChiTieuNam: 36420000,
      NamXetHang: 2026,
      TrangThai: 'ACTIVE',
    },
    {
      MaKH: 'KH004',
      HoTen: 'Võ Đức Long',
      SoDienThoai: '0901000004',
      SDT: '0901000004',
      Email: 'vo.duc.long04@example.com',
      NgaySinh: new Date('2001-01-27'),
      GioiTinh: 'Nam',
      NgayDangKy: new Date('2026-02-14T09:00:00Z'),
      MaThe: 'LC00000004',
      MaTheThanhVien: 'LC00000004',
      MaQR: 'QR_MEMBER_004',
      MaHangHienTai: 'DONG',
      DiemHienTai: 2150,
      TongDiemTichLuy: 2150,
      TongChiTieu: 2150000,
      TongChiTieuNam: 2150000,
      NamXetHang: 2026,
      TrangThai: 'INACTIVE',
    },
  ]

  // Thêm 16 khách hàng mẫu phụ để có đủ top 10 đổi quà và dữ liệu phong phú
  const tenMau = [
    ['Nguyễn Văn An', 'Nam'], ['Trần Thị Bích', 'Nữ'], ['Lê Văn Cường', 'Nam'], ['Phạm Thị Dung', 'Nữ'],
    ['Hoàng Văn Em', 'Nam'], ['Vũ Thị Phương', 'Nữ'], ['Đặng Văn Giang', 'Nam'], ['Bùi Thị Hoa', 'Nữ'],
    ['Đỗ Văn Ích', 'Nam'], ['Hồ Thị Kim', 'Nữ'], ['Ngô Văn Long', 'Nam'], ['Dương Thị Mai', 'Nữ'],
    ['Lý Văn Nam', 'Nam'], ['Trịnh Thị Oanh', 'Nữ'], ['Mai Văn Phát', 'Nam'], ['Lâm Thị Quỳnh', 'Nữ'],
  ]

  for (let i = 0; i < tenMau.length; i++) {
    const idx = i + 5
    const maKH = `KH${String(idx).padStart(3, '0')}`
    const sdt = `09010000${String(idx).padStart(2, '0')}`
    const chiTieu = 1000000 + i * 2200000
    const hang = chiTieu >= 30000000 ? 'VANG' : chiTieu >= 10000000 ? 'BAC' : 'DONG'
    const diem = Math.floor(chiTieu / 1000)

    dsKhachHang.push({
      MaKH: maKH,
      HoTen: tenMau[i][0],
      SoDienThoai: sdt,
      SDT: sdt,
      Email: `user${idx}@example.com`,
      NgaySinh: new Date(1998 + (i % 8), (i % 12), 10 + i),
      GioiTinh: tenMau[i][1],
      NgayDangKy: new Date(2025, i % 12, 1 + i),
      MaThe: `LC${String(idx).padStart(8, '0')}`,
      MaTheThanhVien: `LC${String(idx).padStart(8, '0')}`,
      MaQR: `QR_MEMBER_${String(idx).padStart(3, '0')}`,
      MaHangHienTai: hang,
      DiemHienTai: diem,
      TongDiemTichLuy: diem,
      TongChiTieu: chiTieu,
      TongChiTieuNam: chiTieu,
      NamXetHang: 2026,
      TrangThai: 'ACTIVE',
    })
  }

  await db.collection('khach_hang').insertMany(dsKhachHang)

  // 4. Lịch sử hạng ban đầu
  const dsLichSuHang = dsKhachHang.map((k, i) => ({
    MaLichSu: `LS${String(i + 1).padStart(3, '0')}`,
    MaKH: k.MaKH,
    HangCu: null,
    MaHangCu: null,
    HangMoi: 'DONG',
    MaHangMoi: 'DONG',
    TongChiTieuKhiDoi: 0,
    NamXetHang: 2026,
    LyDo: 'Đăng ký thành viên',
    NgayThayDoi: k.NgayDangKy,
  }))
  await db.collection('lich_su_hang').insertMany(dsLichSuHang)

  // 5. Sinh biến động điểm (EARN) và giao dịch theo 12 tháng năm 2026 để biểu đồ phát hành điểm hiển thị đầy đủ
  const dsBienDong = []
  const dsGiaoDich = []
  let gdCounter = 1
  let bdCounter = 1

  // Điểm phát hành cho 12 tháng của năm 2026 (đặc biệt tháng 9 và các tháng gần nhất)
  const diemMoiThang = [12500, 14200, 16800, 18900, 21500, 24000, 26500, 29000, 34500, 31000, 38500, 20000]

  for (let m = 0; m < 12; m++) {
    const tongThang = diemMoiThang[m]
    const soGD = 10 + (m % 5) * 3
    const diemMoiGD = Math.floor(tongThang / soGD)

    for (let g = 0; g < soGD; g++) {
      const kh = dsKhachHang[g % dsKhachHang.length]
      const ngayGD = new Date(2026, m, 2 + (g % 26), 9 + (g % 10), 15)
      const maGD = `GD${String(gdCounter++).padStart(6, '0')}`
      const maBD = `BD${String(bdCounter++).padStart(6, '0')}`
      const tien = diemMoiGD * 1000

      dsGiaoDich.push({
        MaGiaoDich: maGD,
        MaGD: maGD,
        MaKH: kh.MaKH,
        LoaiGiaoDich: 'VE_VA_COMBO',
        ChiTiet: [
          { MaSanPham: 'P01-2D', TenSanPham: 'Vé 2D', Loai: 'VE', SoLuong: 1, DonGia: 95000, ThanhTien: 95000 },
          { MaSanPham: 'CB01', TenSanPham: 'Combo Bắp Nước', Loai: 'COMBO', SoLuong: 1, DonGia: tien - 95000 > 0 ? tien - 95000 : 85000, ThanhTien: tien - 95000 > 0 ? tien - 95000 : 85000 },
        ],
        TongTien: tien,
        PhuongThucThanhToan: 'MOMO',
        TrangThai: 'COMPLETED',
        DiemCong: diemMoiGD,
        NgayTao: ngayGD,
        NgayCapNhat: ngayGD,
      })

      dsBienDong.push({
        MaBienDong: maBD,
        MaLedger: maBD,
        MaKH: kh.MaKH,
        LoaiBienDong: 'EARN',
        Loai: 'EARN',
        SoDiem: diemMoiGD,
        SoDuSau: kh.DiemHienTai,
        MaThamChieu: maGD,
        MaGD: maGD,
        MoTa: `Tích điểm giao dịch ${maGD}`,
        TrangThai: 'POSTED',
        IdempotencyKey: `EARN_${maGD}`,
        NgayTao: ngayGD,
        NgayPhatSinh: ngayGD,
      })
    }
  }

  await db.collection('giao_dich').insertMany(dsGiaoDich)
  await db.collection('bien_dong_diem').insertMany(dsBienDong)

  // 6. Sinh lượt đổi quà (doi_thuong) để có bảng xếp hạng Top 10 đổi quà nhiều nhất
  const dsDoiThuong = []
  let dtCounter = 1

  // Sắp xếp số lượt đổi giảm dần cho top 10 khách hàng (KH003 nhiều nhất, rồi KH002, KH005,...)
  const topKhach = ['KH003', 'KH002', 'KH005', 'KH006', 'KH007', 'KH008', 'KH009', 'KH010', 'KH011', 'KH012']
  const soLuotMoiKhach = [28, 22, 19, 16, 14, 12, 10, 8, 7, 5]

  for (let k = 0; k < topKhach.length; k++) {
    const maKH = topKhach[k]
    const soLuot = soLuotMoiKhach[k]
    for (let l = 0; l < soLuot; l++) {
      const pt = PHAN_THUONG[l % PHAN_THUONG.length]
      const maDT = `DT${String(dtCounter++).padStart(6, '0')}`
      const ngayDoi = new Date(2026, 6 + (l % 5), 1 + (l * 2) % 28, 14, 20)
      const han = new Date(ngayDoi)
      han.setDate(han.getDate() + 30)

      dsDoiThuong.push({
        MaDoiThuong: maDT,
        MaDoi: maDT,
        MaKH: maKH,
        MaPhanThuong: pt.MaPhanThuong,
        MaQua: pt.MaPhanThuong,
        TenPhanThuong: pt.TenPhanThuong,
        LoaiPhanThuong: pt.LoaiPhanThuong,
        DiemDaDoi: pt.DiemCanDoi,
        DiemSuDung: pt.DiemCanDoi,
        SoLuong: 1,
        MaVoucher: `VC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        TrangThai: 'CHUA_SU_DUNG',
        NgayDoi: ngayDoi,
        HanSuDung: han,
      })
    }
  }

  await db.collection('doi_thuong').insertMany(dsDoiThuong)

  console.log(`[Seed] Nạp dữ liệu hoàn tất!`)
  console.log(`  - ${dsKhachHang.length} khách hàng (KH001: 9.500 điểm, 9.850.000đ - còn 150k lên Bạc)`)
  console.log(`  - ${HANG_THANH_VIEN.length} hạng thành viên (Đồng: 0đ, Bạc: 10tr, Vàng: 30tr)`)
  console.log(`  - ${PHAN_THUONG.length} phần thưởng`)
  console.log(`  - ${KHUYEN_MAI.length} chương trình khuyến mãi`)
  console.log(`  - ${dsGiaoDich.length} giao dịch mẫu trải dài 12 tháng`)
  console.log(`  - ${dsBienDong.length} biến động điểm EARN`)
  console.log(`  - ${dsDoiThuong.length} lượt đổi quà phục vụ Top 10`)

  await client.close()
}

// Chạy trực tiếp nếu file được gọi bằng node
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err)
      process.exit(1)
    })
}
