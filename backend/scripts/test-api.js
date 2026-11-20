import { connectDB, closeDB, getDB } from '../src/config/db.js'
import * as khachHangService from '../src/services/khachHang.service.js'
import * as giaoDichService from '../src/services/giaoDich.service.js'
import * as doiThuongService from '../src/services/doiThuong.service.js'
import * as thongKeService from '../src/services/thongKe.service.js'

async function runTests() {
  console.log('='.repeat(65))
  console.log('BẮT ĐẦU KIỂM THỬ TOÀN DIỆN BACKEND API VÀ LOGIC NGHIỆP VỤ (YẾN LINH)')
  console.log('='.repeat(65))

  await connectDB()

  let passCount = 0
  let totalCount = 0

  function assert(condition, name) {
    totalCount++
    if (condition) {
      console.log(`  ✓ PASS: ${name}`)
      passCount++
    } else {
      console.error(`  ✗ FAIL: ${name}`)
    }
  }

  try {
    // 1. Kiểm tra tìm kiếm khách hàng & đăng nhập bằng SĐT
    console.log('\n[1] Kiểm thử CRUD & Tìm kiếm khách hàng:')
    const timSDT = await khachHangService.timKiemKhachHang({ soDienThoai: '0901000001' })
    assert(timSDT.length === 1 && timSDT[0].MaKH === 'KH001', 'Đăng nhập mô phỏng bằng SĐT 0901000001')

    const timKhongDau = await khachHangService.timKiemKhachHang({ q: 'minh anh' })
    assert(timKhongDau.some(k => k.MaKH === 'KH001'), 'Tìm kiếm không phân biệt dấu: "minh anh"')

    const kh001 = await khachHangService.layKhachHangTheoMa('KH001')
    assert(kh001.MaKH === 'KH001' && kh001.MaHangHienTai === 'DONG', 'KH001 ban đầu ở hạng DONG')
    assert(kh001.TongChiTieu === 9850000 && kh001.DiemHienTai === 9500, 'KH001 có đúng 9.500 điểm và 9.850.000đ chi tiêu')

    // 2. Tạo giao dịch mới (PENDING)
    console.log('\n[2] Kiểm thử Luồng Giao dịch mới (Mua vé xem phim):')
    const gdMoi = await giaoDichService.taoGiaoDich({
      MaKH: 'KH001',
      ChiTiet: [
        { MaSanPham: 'P01-2D', TenSanPham: 'Vé 2D – Hành Tinh Cuối Cùng', Loai: 'VE', SoLuong: 2, DonGia: 95000 },
      ],
      PhuongThucThanhToan: 'MOMO',
    })
    assert(gdMoi.TrangThai === 'PENDING' && gdMoi.TongTien === 190000, 'Tạo giao dịch PENDING thành công (190.000đ)')
    assert(gdMoi.DiemCong === 0, 'Giao dịch PENDING chưa cộng điểm')

    // 3. Cập nhật trạng thái COMPLETED -> Tích điểm + Tự động thăng hạng bằng $switch
    console.log('\n[3] Kiểm thử Luồng Tích điểm & Thăng hạng tự động ($switch):')
    const ketQuaHoanTat = await giaoDichService.capNhatTrangThaiGiaoDich(gdMoi.MaGiaoDich, 'COMPLETED')
    assert(ketQuaHoanTat.diemCong === 190, 'Tích điểm đúng tỷ lệ 1 điểm / 1.000đ (+190 điểm)')
    assert(ketQuaHoanTat.khachHang.DiemHienTai === 9690, 'Điểm số mới của KH001 đạt 9.690 điểm')
    assert(ketQuaHoanTat.khachHang.TongChiTieu === 10040000, 'Tổng chi tiêu đạt 10.040.000đ (vượt ngưỡng 10 triệu)')
    assert(ketQuaHoanTat.khachHang.MaHangHienTai === 'BAC', 'Hệ thống tự động nâng hạng lên BAC qua $switch')
    assert(ketQuaHoanTat.thangHang && ketQuaHoanTat.thangHang.HangCu === 'DONG' && ketQuaHoanTat.thangHang.HangMoi === 'BAC', 'Trả về thông tin thăng hạng { DONG -> BAC }')

    // 4. Kiểm tra tính nhất quán (Idempotency - Không cộng điểm 2 lần)
    console.log('\n[4] Kiểm thử Tính nhất quán (Idempotency - Chặn cộng điểm 2 lần):')
    try {
      await giaoDichService.capNhatTrangThaiGiaoDich(gdMoi.MaGiaoDich, 'COMPLETED')
      assert(false, 'Không được phép cập nhật lại giao dịch đã COMPLETED')
    } catch (err) {
      assert(err.status === 409, 'Chặn thành công request thứ 2 với mã lỗi 409 Conflict')
    }

    // 5. Kiểm tra Luồng Đổi quà (Redeem)
    console.log('\n[5] Kiểm thử Luồng Đổi quà an toàn:')
    const pt002Truoc = await doiThuongService.layPhanThuongTheoMa('PT002')
    const ketQuaDoi = await doiThuongService.thucHienDoiThuong({
      MaKH: 'KH001',
      MaPhanThuong: 'PT002',
    })
    assert(ketQuaDoi.doiThuong && ketQuaDoi.doiThuong.MaVoucher.startsWith('VC-'), 'Sinh mã voucher hợp lệ: ' + ketQuaDoi.doiThuong.MaVoucher)
    assert(ketQuaDoi.khachHang.DiemHienTai === 9690 - 450, 'Số dư điểm bị trừ chính xác 450 điểm (còn 9.240 điểm)')
    assert(ketQuaDoi.khachHang.MaHangHienTai === 'BAC', 'Đổi quà KHÔNG làm tụt hạng, khách vẫn ở hạng BAC')
    assert(ketQuaDoi.khachHang.TongChiTieu === 10040000, 'TongChiTieu được bảo toàn nguyên vẹn')

    const pt002Sau = await doiThuongService.layPhanThuongTheoMa('PT002')
    assert(pt002Sau.SoLuongTon === pt002Truoc.SoLuongTon - 1, 'Tồn kho phần thưởng giảm đúng 1 đơn vị')

    // 6. Kiểm tra xử lý lỗi khi không đủ điểm đổi quà
    try {
      await doiThuongService.thucHienDoiThuong({
        MaKH: 'KH004', // INACTIVE và chỉ có 2150 điểm
        MaPhanThuong: 'PT010', // Cần 3000 điểm
      })
      assert(false, 'Không được đổi quà khi không đủ điều kiện')
    } catch (err) {
      assert(err.status === 403 || err.status === 400, 'Xử lý chuẩn xác từ chối tài khoản INACTIVE/thiếu điểm')
    }

    // 7. Kiểm tra Pipeline Aggregation Thống kê theo tháng
    console.log('\n[6] Kiểm thử Pipeline Aggregation - Điểm phát hành theo tháng:')
    const thongKeThang = await thongKeService.thongKeDiemTheoThang(2026)
    assert(Array.isArray(thongKeThang) && thongKeThang.length === 12, 'Trả về đủ 12 tháng trong năm 2026')
    const thang9 = thongKeThang.find(t => t.thang === 9)
    assert(thang9 && thang9.tongDiem > 0, `Điểm phát hành tháng 9/2026 đạt ${thang9?.tongDiem} điểm`)

    // 8. Kiểm tra Pipeline Aggregation Top 10 đổi quà
    console.log('\n[7] Kiểm thử Pipeline Aggregation - Top 10 khách đổi quà:')
    const top10 = await thongKeService.topDoiQua({ limit: 10, nam: 2026 })
    assert(Array.isArray(top10) && top10.length === 10, 'Trả về danh sách top 10 khách hàng đổi quà')
    assert(top10[0].soLuotDoi >= top10[1].soLuotDoi, 'Danh sách được sắp xếp giảm dần theo số lượt đổi')
    assert(top10[0].HoTen && top10[0].MaHangHienTai, 'Lookup thành công họ tên và hạng thành viên: ' + top10[0].HoTen)

    // 9. Thống kê theo hạng & KPI
    console.log('\n[8] Kiểm thử Thống kê theo hạng và KPI tổng quan:')
    const theoHang = await thongKeService.khachHangTheoHang()
    assert(theoHang.length === 3, 'Trả về đủ 3 hạng thành viên')

    const kpi = await thongKeService.tongQuan()
    assert(kpi.tongKhachHang >= 20, 'Tổng số khách hàng trong hệ thống: ' + kpi.tongKhachHang)
    assert(kpi.khachHangActive >= 19, 'Số khách hàng ACTIVE: ' + kpi.khachHangActive)

    console.log('\n' + '='.repeat(65))
    console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${totalCount} BÀI TEST THÀNH CÔNG!`)
    console.log('='.repeat(65))
  } finally {
    await closeDB()
  }
}

runTests().catch(console.error)
