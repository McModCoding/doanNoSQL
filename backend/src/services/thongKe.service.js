import { getDB } from '../config/db.js'

/**
 * Thống kê điểm thưởng phát hành (EARN) theo từng tháng trong năm:
 * Dùng pipeline aggregation:
 *  - $match: Loại biến động là EARN trong khoảng thời gian của năm chỉ định
 *  - $group: Nhóm theo tháng bằng $month với múi giờ Asia/Ho_Chi_Minh
 *  - $project: Định dạng lại trường thang, tongDiem, soGiaoDich
 *  - $sort: Sắp xếp từ tháng 1 đến tháng 12
 * Luôn đảm bảo trả về mảng đủ 12 tháng (tháng không có phát sinh được gán 0).
 */
export async function thongKeDiemTheoThang(nam) {
  const db = getDB()
  const namInt = parseInt(nam, 10) || new Date().getFullYear()

  // Khoảng thời gian từ đầu năm đến hết năm, theo giờ Việt Nam (khớp với $month timezone bên dưới)
  const startDate = new Date(`${namInt}-01-01T00:00:00+07:00`)
  const endDate = new Date(`${namInt + 1}-01-01T00:00:00+07:00`)

  const pipeline = [
    {
      // Hai điều kiện $or phải bọc trong $and: nếu viết hai khóa $or cạnh nhau trong một object,
      // khóa sau ghi đè khóa trước và điểm đổi quà (REDEEM, số âm) bị cộng lẫn vào "điểm phát hành".
      $match: {
        $and: [
          { $or: [{ LoaiBienDong: 'EARN' }, { Loai: 'EARN' }] },
          {
            $or: [
              { NgayTao: { $gte: startDate, $lt: endDate } },
              { NgayPhatSinh: { $gte: startDate, $lt: endDate } },
            ],
          },
        ],
      },
    },
    {
      $project: {
        SoDiem: 1,
        Ngay: { $ifNull: ['$NgayTao', '$NgayPhatSinh'] },
      },
    },
    {
      $group: {
        _id: {
          $month: {
            date: '$Ngay',
            timezone: 'Asia/Ho_Chi_Minh',
          },
        },
        tongDiem: { $sum: '$SoDiem' },
        soGiaoDich: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        thang: '$_id',
        tongDiem: 1,
        soGiaoDich: 1,
      },
    },
    { $sort: { thang: 1 } },
  ]

  const ketQuaQuery = await db.collection('bien_dong_diem').aggregate(pipeline).toArray()

  // Tạo khung đủ 12 tháng và điền số liệu từ kết quả aggregation
  const mapData = new Map(ketQuaQuery.map((item) => [item.thang, item]))
  const ketQua12Thang = Array.from({ length: 12 }, (_, i) => {
    const thang = i + 1
    const daCo = mapData.get(thang)
    return {
      thang,
      tongDiem: daCo ? daCo.tongDiem : 0,
      soGiaoDich: daCo ? daCo.soGiaoDich : 0,
    }
  })

  return ketQua12Thang
}

/**
 * Top khách hàng đổi quà nhiều nhất:
 * Pipeline aggregation:
 *  - $match (nếu có lọc theo năm): lọc theo NgayDoi
 *  - $group: nhóm theo MaKH, đếm soLuotDoi = $sum 1, tính tongDiemDaDoi = $sum DiemDaDoi
 *  - $sort: sắp xếp soLuotDoi giảm dần, nếu bằng nhau thì theo tongDiemDaDoi giảm dần
 *  - $limit: giới hạn top N khách hàng (mặc định 10)
 *  - $lookup: kết nối sang collection khach_hang để lấy họ tên và hạng hiện tại
 *  - $unwind: bóc tách mảng kết quả lookup
 *  - $project: định dạng lại các trường hiển thị cho Admin Dashboard
 */
export async function topDoiQua({ limit = 10, nam } = {}) {
  const db = getDB()
  const pipeline = []

  if (nam) {
    const namInt = parseInt(nam, 10)
    pipeline.push({
      $match: {
        NgayDoi: {
          $gte: new Date(`${namInt}-01-01T00:00:00+07:00`),
          $lt: new Date(`${namInt + 1}-01-01T00:00:00+07:00`),
        },
      },
    })
  }

  pipeline.push(
    {
      $group: {
        _id: '$MaKH',
        soLuotDoi: { $sum: 1 },
        tongDiemDaDoi: { $sum: { $ifNull: ['$DiemDaDoi', '$DiemSuDung'] } },
      },
    },
    {
      $sort: {
        soLuotDoi: -1,
        tongDiemDaDoi: -1,
      },
    },
    {
      $limit: parseInt(limit, 10) || 10,
    },
    {
      $lookup: {
        from: 'khach_hang',
        localField: '_id',
        foreignField: 'MaKH',
        as: 'khach',
      },
    },
    {
      $unwind: {
        path: '$khach',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        MaKH: '$_id',
        HoTen: { $ifNull: ['$khach.HoTen', '(Đã xóa hoặc không rõ)'] },
        MaHangHienTai: { $ifNull: ['$khach.MaHangHienTai', 'DONG'] },
        soLuotDoi: 1,
        tongDiemDaDoi: 1,
      },
    },
  )

  return await db.collection('doi_thuong').aggregate(pipeline).toArray()
}

/**
 * Thống kê số lượng khách hàng theo từng hạng thành viên
 */
export async function khachHangTheoHang() {
  const db = getDB()

  // Lấy danh sách các hạng
  const dsHang = await db.collection('hang_thanh_vien').find().sort({ ThuTu: 1, MucChiTieuToiThieu: 1 }).toArray()

  // Đếm số khách mỗi hạng
  const pipeline = [
    {
      $group: {
        _id: '$MaHangHienTai',
        soKhachHang: { $sum: 1 },
      },
    },
  ]
  const demKetQua = await db.collection('khach_hang').aggregate(pipeline).toArray()
  const mapDem = new Map(demKetQua.map((item) => [item._id, item.soKhachHang]))

  // Chuẩn hóa danh sách hạng
  const hangChuan = [
    { MaHang: 'DONG', TenHang: 'Đồng' },
    { MaHang: 'BAC', TenHang: 'Bạc' },
    { MaHang: 'VANG', TenHang: 'Vàng' },
  ]

  const ketQua = hangChuan.map((h) => {
    // Tìm cả mã H01, H02, H03 nếu có
    let count = mapDem.get(h.MaHang) || 0
    if (h.MaHang === 'DONG') count += mapDem.get('H01') || mapDem.get('H001') || 0
    if (h.MaHang === 'BAC') count += mapDem.get('H02') || mapDem.get('H002') || 0
    if (h.MaHang === 'VANG') count += mapDem.get('H03') || mapDem.get('H003') || 0

    return {
      MaHang: h.MaHang,
      TenHang: h.TenHang,
      soKhachHang: count,
    }
  })

  return ketQua
}

/**
 * Tổng hợp các chỉ số KPI vận hành của tháng hiện tại
 */
export async function tongQuan() {
  const db = getDB()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [tongKhachHang, khachHangActive, bienDongThang, doiThuongThang, giaoDichThang, giaoDichChoXuLy] =
    await Promise.all([
      db.collection('khach_hang').countDocuments(),
      db.collection('khach_hang').countDocuments({ TrangThai: 'ACTIVE' }),
      db
        .collection('bien_dong_diem')
        .find({
          $or: [
            { NgayTao: { $gte: startOfMonth, $lt: endOfMonth } },
            { NgayPhatSinh: { $gte: startOfMonth, $lt: endOfMonth } },
          ],
        })
        .toArray(),
      db
        .collection('doi_thuong')
        .countDocuments({ NgayDoi: { $gte: startOfMonth, $lt: endOfMonth } }),
      db
        .collection('giao_dich')
        .find({
          TrangThai: 'COMPLETED',
          $or: [
            { NgayCapNhat: { $gte: startOfMonth, $lt: endOfMonth } },
            { NgayTao: { $gte: startOfMonth, $lt: endOfMonth } },
          ],
        })
        .toArray(),
      db.collection('giao_dich').countDocuments({ TrangThai: 'PENDING' }),
    ])

  const diemPhatHanhThangNay = bienDongThang
    .filter((b) => b.LoaiBienDong === 'EARN' || b.Loai === 'EARN')
    .reduce((sum, b) => sum + (Number(b.SoDiem) || 0), 0)

  const diemDaDoiThangNay = Math.abs(
    bienDongThang
      .filter((b) => b.LoaiBienDong === 'REDEEM' || b.Loai === 'REDEEM')
      .reduce((sum, b) => sum + (Number(b.SoDiem) || 0), 0),
  )

  const doanhThuThangNay = giaoDichThang.reduce((sum, g) => sum + (Number(g.TongTien) || 0), 0)

  return {
    tongKhachHang,
    khachHangActive,
    diemPhatHanhThangNay,
    diemDaDoiThangNay,
    luotDoiThangNay: doiThuongThang,
    doanhThuThangNay,
    giaoDichChoXuLy,
  }
}
