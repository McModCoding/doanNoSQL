import { beforeEach, describe, expect, it } from 'vitest'
import * as L from './logic.js'
import { taoDuLieuMau } from './seed.js'

const NOW = new Date('2026-11-15T10:00:00+07:00')
let db

beforeEach(() => {
  db = taoDuLieuMau(NOW)
})

const kh = (ma) => db.khach_hang.find((k) => k.MaKH === ma)

describe('dữ liệu mẫu', () => {
  it('có đủ 8 collection', () => {
    expect(Object.keys(db).sort()).toEqual(
      ['bien_dong_diem', 'doi_thuong', 'giao_dich', 'hang_thanh_vien', 'khach_hang', 'khuyen_mai', 'lich_su_hang', 'phan_thuong'].sort(),
    )
    expect(db.khach_hang).toHaveLength(20)
  })

  it('tài khoản demo KH001: Đồng, 9.850.000đ, 9.500 điểm', () => {
    expect(kh('KH001')).toMatchObject({ SoDienThoai: '0901000001', TongChiTieu: 9_850_000, DiemHienTai: 9_500, MaHangHienTai: 'DONG' })
    expect(kh('KH002')).toMatchObject({ TongChiTieu: 29_850_000, MaHangHienTai: 'BAC' })
    expect(kh('KH003').MaHangHienTai).toBe('VANG')
    expect(kh('KH004').TrangThai).toBe('INACTIVE')
  })

  it('nhất quán: chi tiêu = tổng GD COMPLETED, điểm = EARN + REDEEM, số dư cuối khớp', () => {
    for (const k of db.khach_hang) {
      const tongGD = db.giao_dich.filter((g) => g.MaKH === k.MaKH && g.TrangThai === 'COMPLETED').reduce((s, g) => s + g.TongTien, 0)
      expect(tongGD).toBe(k.TongChiTieu)
      const bd = db.bien_dong_diem.filter((b) => b.MaKH === k.MaKH)
      expect(bd.reduce((s, b) => s + b.SoDiem, 0)).toBe(k.DiemHienTai)
      if (bd.length) expect(bd.at(-1).SoDuSau).toBe(k.DiemHienTai)
      expect(k.DiemHienTai).toBeGreaterThanOrEqual(0)
    }
  })

  it('mã không trùng & tham chiếu hợp lệ', () => {
    const maGD = new Set(db.giao_dich.map((g) => g.MaGiaoDich))
    expect(maGD.size).toBe(db.giao_dich.length)
    const maDT = new Set(db.doi_thuong.map((d) => d.MaDoiThuong))
    for (const b of db.bien_dong_diem) {
      expect(b.LoaiBienDong === 'EARN' ? maGD.has(b.MaThamChieu) : maDT.has(b.MaThamChieu)).toBe(true)
    }
  })
})

describe('giao dịch -> tích điểm -> thăng hạng', () => {
  const muaHaiVe = () =>
    L.taoGiaoDich(db, { MaKH: 'KH001', ChiTiet: [{ MaSanPham: 'P01-2D', TenSanPham: 'Vé 2D', Loai: 'VE', SoLuong: 2, DonGia: 95000 }] }, NOW)

  it('tạo giao dịch PENDING, chưa cộng điểm', () => {
    const gd = muaHaiVe()
    expect(gd).toMatchObject({ TrangThai: 'PENDING', TongTien: 190000, LoaiGiaoDich: 'VE_XEM_PHIM', DiemCong: 0 })
    expect(kh('KH001').DiemHienTai).toBe(9500)
  })

  it('COMPLETED: +190 điểm, chi tiêu 10.040.000đ, lên hạng Bạc, ghi EARN và lich_su_hang', () => {
    const gd = muaHaiVe()
    const kq = L.capNhatTrangThaiGiaoDich(db, gd.MaGiaoDich, 'COMPLETED', NOW)
    expect(kq.diemCong).toBe(190)
    expect(kq.khachHang).toMatchObject({ DiemHienTai: 9690, TongChiTieu: 10_040_000, MaHangHienTai: 'BAC' })
    expect(kq.thangHang).toEqual({ HangCu: 'DONG', HangMoi: 'BAC' })
    expect(db.bien_dong_diem.at(-1)).toMatchObject({ MaKH: 'KH001', LoaiBienDong: 'EARN', SoDiem: 190, SoDuSau: 9690, MaThamChieu: gd.MaGiaoDich })
    expect(db.lich_su_hang.at(-1)).toMatchObject({ MaKH: 'KH001', HangCu: 'DONG', HangMoi: 'BAC' })
  })

  it('gọi COMPLETED lần 2 bị từ chối, không cộng điểm 2 lần', () => {
    const gd = muaHaiVe()
    L.capNhatTrangThaiGiaoDich(db, gd.MaGiaoDich, 'COMPLETED', NOW)
    expect(() => L.capNhatTrangThaiGiaoDich(db, gd.MaGiaoDich, 'COMPLETED', NOW)).toThrow(/đã ở trạng thái COMPLETED/)
    expect(kh('KH001').DiemHienTai).toBe(9690)
  })

  it('CANCELLED không cộng điểm', () => {
    const gd = muaHaiVe()
    const kq = L.capNhatTrangThaiGiaoDich(db, gd.MaGiaoDich, 'CANCELLED', NOW)
    expect(kq.diemCong).toBe(0)
    expect(kh('KH001').DiemHienTai).toBe(9500)
  })

  it('khách INACTIVE không tạo được giao dịch', () => {
    expect(() => L.taoGiaoDich(db, { MaKH: 'KH004', ChiTiet: [{ Loai: 'VE', SoLuong: 1, DonGia: 95000 }] }, NOW)).toThrow(/ngừng hoạt động/)
  })
})

describe('đổi thưởng', () => {
  it('đủ điểm: trừ điểm, trừ tồn kho, ghi REDEEM, không đổi hạng', () => {
    const tonTruoc = db.phan_thuong.find((p) => p.MaPhanThuong === 'PT002').SoLuongTon
    const kq = L.doiThuong(db, { MaKH: 'KH001', MaPhanThuong: 'PT002' }, NOW)
    expect(kq.khachHang.DiemHienTai).toBe(9500 - 450)
    expect(kq.khachHang.MaHangHienTai).toBe('DONG')
    expect(kq.doiThuong.MaVoucher).toMatch(/^VC-[A-Z2-9]{6}$/)
    expect(db.phan_thuong.find((p) => p.MaPhanThuong === 'PT002').SoLuongTon).toBe(tonTruoc - 1)
    expect(db.bien_dong_diem.at(-1)).toMatchObject({ LoaiBienDong: 'REDEEM', SoDiem: -450, SoDuSau: 9050 })
  })

  it('không đủ điểm thì từ chối', () => {
    kh('KH001').DiemHienTai = 100
    expect(() => L.doiThuong(db, { MaKH: 'KH001', MaPhanThuong: 'PT002' }, NOW)).toThrow(/Không đủ điểm/)
  })

  it('hết hàng thì từ chối', () => {
    expect(() => L.doiThuong(db, { MaKH: 'KH003', MaPhanThuong: 'PT010' }, NOW)).toThrow(/đã hết/)
  })
})

describe('thống kê', () => {
  it('điểm phát hành theo tháng trả đủ 12 tháng và khớp tổng EARN trong năm', () => {
    const kq = L.thongKeDiemTheoThang(db, 2026)
    expect(kq).toHaveLength(12)
    const tongEarn2026 = db.bien_dong_diem
      .filter((b) => b.LoaiBienDong === 'EARN' && new Date(b.NgayTao).getFullYear() === 2026)
      .reduce((s, b) => s + b.SoDiem, 0)
    expect(kq.reduce((s, x) => s + x.tongDiem, 0)).toBe(tongEarn2026)
    expect(tongEarn2026).toBeGreaterThan(0)
  })

  it('top 10 đổi quà sắp xếp giảm dần', () => {
    const top = L.topDoiQua(db, 10)
    expect(top.length).toBeLessThanOrEqual(10)
    for (let i = 1; i < top.length; i++) expect(top[i - 1].soLuotDoi).toBeGreaterThanOrEqual(top[i].soLuotDoi)
    expect(top[0]).toHaveProperty('HoTen')
  })
})
