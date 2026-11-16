// "Bộ chuyển đổi" dữ liệu backend -> dữ liệu giao diện.
// Mặc định giữ nguyên tên trường theo hợp đồng API (giống tên trường trong MongoDB).
// NẾU tên trường thật của backend khác hợp đồng (vd. Tính đặt "diem_hien_tai" thay vì "DiemHienTai"),
// chỉ cần sửa trong file này, các màn hình không phải sửa.

const so = (v) => Number(v ?? 0) || 0
const ds = (mapper) => (list) => (Array.isArray(list) ? list.map(mapper) : [])

export function mapKhachHang(raw) {
  if (!raw) return raw
  return {
    ...raw,
    MaThe: raw.MaThe ?? raw.MaKH, // không có số thẻ riêng thì dùng mã khách hàng
    DiemHienTai: so(raw.DiemHienTai),
    TongChiTieu: so(raw.TongChiTieu),
  }
}

export function mapHang(raw) {
  return { ...raw, NguongChiTieu: so(raw.NguongChiTieu), QuyenLoi: raw.QuyenLoi ?? [] }
}

export function mapGiaoDich(raw) {
  if (!raw) return raw
  return { ...raw, ChiTiet: raw.ChiTiet ?? [], TongTien: so(raw.TongTien), DiemCong: so(raw.DiemCong) }
}

export const mapBienDongDiem = (raw) => ({ ...raw, SoDiem: so(raw.SoDiem) })
export const mapPhanThuong = (raw) => ({ ...raw, DiemCanDoi: so(raw.DiemCanDoi), SoLuongTon: so(raw.SoLuongTon) })
export const mapDoiThuong = (raw) => (raw ? { ...raw, DiemDaDoi: so(raw.DiemDaDoi) } : raw)
export const mapKhuyenMai = (raw) => raw
export const mapLichSuHang = (raw) => raw

export const mapDsKhachHang = ds(mapKhachHang)
export const mapDsHang = ds(mapHang)
export const mapDsGiaoDich = ds(mapGiaoDich)
export const mapDsBienDongDiem = ds(mapBienDongDiem)
export const mapDsPhanThuong = ds(mapPhanThuong)
export const mapDsDoiThuong = ds(mapDoiThuong)
export const mapDsKhuyenMai = ds(mapKhuyenMai)
export const mapDsLichSuHang = ds(mapLichSuHang)

/** Kết quả PATCH /giao-dich/:maGD/trang-thai */
export function mapKetQuaCapNhatGiaoDich(raw = {}) {
  return {
    giaoDich: mapGiaoDich(raw.giaoDich),
    khachHang: mapKhachHang(raw.khachHang),
    diemCong: so(raw.diemCong),
    thangHang: raw.thangHang ?? null,
  }
}

/** Kết quả POST /doi-thuong */
export function mapKetQuaDoiThuong(raw = {}) {
  return { doiThuong: mapDoiThuong(raw.doiThuong), khachHang: mapKhachHang(raw.khachHang) }
}
