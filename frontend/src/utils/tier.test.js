import { describe, expect, it } from 'vitest'
import { formatVND } from './format.js'
import { tinhTienDoHang, xacDinhHang } from './tier.js'

const DS_HANG = [
  { MaHang: 'VANG', TenHang: 'Vàng', NguongChiTieu: 30_000_000 },
  { MaHang: 'DONG', TenHang: 'Đồng', NguongChiTieu: 0 },
  { MaHang: 'BAC', TenHang: 'Bạc', NguongChiTieu: 10_000_000 },
]

describe('xacDinhHang', () => {
  it('xếp hạng theo tổng chi tiêu', () => {
    expect(xacDinhHang(0, DS_HANG).MaHang).toBe('DONG')
    expect(xacDinhHang(9_999_999, DS_HANG).MaHang).toBe('DONG')
    expect(xacDinhHang(10_000_000, DS_HANG).MaHang).toBe('BAC')
    expect(xacDinhHang(29_999_999, DS_HANG).MaHang).toBe('BAC')
    expect(xacDinhHang(30_000_000, DS_HANG).MaHang).toBe('VANG')
  })
})

describe('tinhTienDoHang', () => {
  it('khách Đồng 9.850.000đ cần thêm 150.000đ để lên Bạc', () => {
    const t = tinhTienDoHang(9_850_000, DS_HANG)
    expect(t.hangHienTai.MaHang).toBe('DONG')
    expect(t.hangKeTiep.MaHang).toBe('BAC')
    expect(t.soTienCanThem).toBe(150_000)
    expect(formatVND(t.soTienCanThem)).toBe('150.000đ')
    expect(t.phanTram).toBe(98.5)
    expect(t.laHangCaoNhat).toBe(false)
  })

  it('khách Bạc 29.850.000đ cần thêm 150.000đ để lên Vàng', () => {
    const t = tinhTienDoHang(29_850_000, DS_HANG)
    expect(t.hangHienTai.MaHang).toBe('BAC')
    expect(t.hangKeTiep.MaHang).toBe('VANG')
    expect(t.soTienCanThem).toBe(150_000)
    expect(t.phanTram).toBe(99.2)
  })

  it('đúng 10.000.000đ là hạng Bạc, tiến độ 0%', () => {
    const t = tinhTienDoHang(10_000_000, DS_HANG)
    expect(t.hangHienTai.MaHang).toBe('BAC')
    expect(t.soTienCanThem).toBe(20_000_000)
    expect(t.phanTram).toBe(0)
  })

  it('35 triệu là hạng cao nhất', () => {
    const t = tinhTienDoHang(35_000_000, DS_HANG)
    expect(t.hangHienTai.MaHang).toBe('VANG')
    expect(t.hangKeTiep).toBeNull()
    expect(t.laHangCaoNhat).toBe(true)
    expect(t.phanTram).toBe(100)
  })

  it('không có danh sách hạng thì không lỗi', () => {
    expect(tinhTienDoHang(5_000_000, []).hangHienTai).toBeNull()
  })
})
