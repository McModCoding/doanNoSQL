import { getDB } from '../config/db.js'
import { boDau, sinhMaTiepTheo } from '../utils/helpers.js'

const SDT_HOP_LE = /^0\d{9}$/

export class LoiNghiepVu extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'LoiNghiepVu'
    this.status = status
  }
}

/** Chuẩn hóa document khách hàng để tương thích cả 2 chuẩn field */
export function chuanHoaKhachHang(kh) {
  if (!kh) return null
  const sdt = kh.SoDienThoai || kh.SDT || ''
  const tongChiTieu = Number(kh.TongChiTieu ?? kh.TongChiTieuNam ?? 0)
  const diemHienTai = Number(kh.DiemHienTai ?? 0)
  const maThe = kh.MaThe || kh.MaTheThanhVien || ('LC' + (kh.MaKH ? kh.MaKH.slice(2).padStart(8, '0') : ''))

  return {
    ...kh,
    SoDienThoai: sdt,
    SDT: sdt,
    TongChiTieu: tongChiTieu,
    TongChiTieuNam: tongChiTieu,
    DiemHienTai: diemHienTai,
    MaThe: maThe,
    MaTheThanhVien: maThe,
  }
}

export async function timKiemKhachHang({ q, soDienThoai, maHang, trangThai } = {}) {
  const db = getDB()
  const filter = {}

  if (soDienThoai) {
    const s = String(soDienThoai).trim()
    filter.$or = [{ SoDienThoai: s }, { SDT: s }]
  }

  if (maHang) {
    filter.MaHangHienTai = maHang
  }

  if (trangThai) {
    filter.TrangThai = trangThai
  }

  let ds = await db.collection('khach_hang').find(filter).sort({ MaKH: 1 }).toArray()

  // Tìm kiếm không phân biệt dấu và hoa thường nếu có tham số q
  if (q) {
    const tuKhoa = boDau(String(q).trim())
    ds = ds.filter((k) => {
      const sdt = k.SoDienThoai || k.SDT || ''
      return [k.MaKH, k.HoTen, sdt, k.Email].some((v) => boDau(v ?? '').includes(tuKhoa))
    })
  }

  return ds.map(chuanHoaKhachHang)
}

export async function layKhachHangTheoMa(maKH) {
  const db = getDB()
  const kh = await db.collection('khach_hang').findOne({ MaKH: maKH })
  if (!kh) {
    throw new LoiNghiepVu(404, `Không tìm thấy khách hàng ${maKH}.`)
  }
  return chuanHoaKhachHang(kh)
}

export async function themKhachHang(duLieu) {
  const db = getDB()
  const hoTen = String(duLieu.HoTen ?? '').trim()
  const sdt = String(duLieu.SoDienThoai || duLieu.SDT || '').trim()

  if (!hoTen) throw new LoiNghiepVu(400, 'Họ tên không được để trống.')
  if (!SDT_HOP_LE.test(sdt)) throw new LoiNghiepVu(400, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.')

  // Kiểm tra trùng số điện thoại
  const daTonTai = await db.collection('khach_hang').findOne({
    $or: [{ SoDienThoai: sdt }, { SDT: sdt }],
  })
  if (daTonTai) {
    throw new LoiNghiepVu(409, `Số điện thoại ${sdt} đã được đăng ký.`)
  }

  const MaKH = await sinhMaTiepTheo(db.collection('khach_hang'), 'MaKH', 'KH', 3)
  const now = new Date()
  const maThe = 'LC' + MaKH.slice(2).padStart(8, '0')

  const doc = {
    MaKH,
    HoTen: hoTen,
    SoDienThoai: sdt,
    SDT: sdt,
    Email: duLieu.Email || null,
    MatKhauHash: duLieu.MatKhauHash || 'HASH_DEFAULT',
    NgaySinh: duLieu.NgaySinh ? new Date(duLieu.NgaySinh) : null,
    GioiTinh: duLieu.GioiTinh || null,
    NgayDangKy: now,
    MaThe: maThe,
    MaTheThanhVien: maThe,
    MaQR: `QR_${MaKH}`,
    MaHangHienTai: 'DONG',
    DiemHienTai: 0,
    TongDiemTichLuy: 0,
    TongChiTieu: 0,
    TongChiTieuNam: 0,
    NamXetHang: now.getFullYear(),
    TrangThai: 'ACTIVE',
  }

  await db.collection('khach_hang').insertOne(doc)

  // Ghi nhật ký lịch sử hạng khởi tạo
  const maLichSu = await sinhMaTiepTheo(db.collection('lich_su_hang'), 'MaLichSu', 'LS', 3)
  await db.collection('lich_su_hang').insertOne({
    MaLichSu: maLichSu,
    MaKH,
    HangCu: null,
    MaHangCu: null,
    HangMoi: 'DONG',
    MaHangMoi: 'DONG',
    TongChiTieuKhiDoi: 0,
    NamXetHang: now.getFullYear(),
    LyDo: 'Đăng ký thành viên',
    NgayThayDoi: now,
  })

  return chuanHoaKhachHang(doc)
}

export async function suaKhachHang(maKH, duLieu) {
  const db = getDB()
  const kh = await db.collection('khach_hang').findOne({ MaKH: maKH })
  if (!kh) throw new LoiNghiepVu(404, `Không tìm thấy khách hàng ${maKH}.`)

  const updates = {}
  if ('HoTen' in duLieu) {
    const hoTen = String(duLieu.HoTen).trim()
    if (!hoTen) throw new LoiNghiepVu(400, 'Họ tên không được để trống.')
    updates.HoTen = hoTen
  }

  const sdt = duLieu.SoDienThoai || duLieu.SDT
  if (sdt !== undefined) {
    const sdtTrim = String(sdt).trim()
    if (!SDT_HOP_LE.test(sdtTrim)) {
      throw new LoiNghiepVu(400, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.')
    }
    const daCo = await db.collection('khach_hang').findOne({
      MaKH: { $ne: maKH },
      $or: [{ SoDienThoai: sdtTrim }, { SDT: sdtTrim }],
    })
    if (daCo) throw new LoiNghiepVu(409, `Số điện thoại ${sdtTrim} đã được đăng ký cho tài khoản khác.`)
    updates.SoDienThoai = sdtTrim
    updates.SDT = sdtTrim
  }

  for (const field of ['Email', 'GioiTinh']) {
    if (field in duLieu) updates[field] = duLieu[field] || null
  }
  if ('NgaySinh' in duLieu) {
    updates.NgaySinh = duLieu.NgaySinh ? new Date(duLieu.NgaySinh) : null
  }
  if ('TrangThai' in duLieu) {
    if (!['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(duLieu.TrangThai)) {
      throw new LoiNghiepVu(400, 'TrangThai chỉ nhận ACTIVE, INACTIVE hoặc BLOCKED.')
    }
    updates.TrangThai = duLieu.TrangThai
  }

  if (Object.keys(updates).length > 0) {
    await db.collection('khach_hang').updateOne({ MaKH: maKH }, { $set: updates })
  }

  const sauKhiSua = await db.collection('khach_hang').findOne({ MaKH: maKH })
  return chuanHoaKhachHang(sauKhiSua)
}

export async function xoaKhachHang(maKH) {
  const db = getDB()
  const kh = await db.collection('khach_hang').findOne({ MaKH: maKH })
  if (!kh) throw new LoiNghiepVu(404, `Không tìm thấy khách hàng ${maKH}.`)

  // Kiểm tra lịch sử giao dịch hoặc đổi quà
  const coGD = await db.collection('giao_dich').findOne({ MaKH: maKH })
  const coDoi = await db.collection('doi_thuong').findOne({ MaKH: maKH })

  if (coGD || coDoi) {
    throw new LoiNghiepVu(
      409,
      'Khách hàng đã có giao dịch/đổi quà nên không thể xóa (để giữ lịch sử). Hãy chuyển trạng thái sang INACTIVE.',
    )
  }

  await db.collection('khach_hang').deleteOne({ MaKH: maKH })
  await db.collection('lich_su_hang').deleteMany({ MaKH: maKH })
  await db.collection('bien_dong_diem').deleteMany({ MaKH: maKH })

  return { MaKH: maKH }
}

export async function layBienDongDiemCuaKhach(maKH) {
  const db = getDB()
  await layKhachHangTheoMa(maKH)
  return await db
    .collection('bien_dong_diem')
    .find({ MaKH: maKH })
    .sort({ NgayTao: -1, NgayPhatSinh: -1 })
    .toArray()
}

export async function layGiaoDichCuaKhach(maKH) {
  const db = getDB()
  await layKhachHangTheoMa(maKH)
  return await db
    .collection('giao_dich')
    .find({ MaKH: maKH })
    .sort({ NgayTao: -1 })
    .toArray()
}

export async function layDoiThuongCuaKhach(maKH) {
  const db = getDB()
  await layKhachHangTheoMa(maKH)
  return await db
    .collection('doi_thuong')
    .find({ MaKH: maKH })
    .sort({ NgayDoi: -1 })
    .toArray()
}

export async function layLichSuHangCuaKhach(maKH) {
  const db = getDB()
  await layKhachHangTheoMa(maKH)
  return await db
    .collection('lich_su_hang')
    .find({ MaKH: maKH })
    .sort({ NgayThayDoi: -1 })
    .toArray()
}
