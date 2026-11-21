// CinemaLoyalty one-pass Studio 3T IntelliShell script.
// Targets CinemaLoyaltyDB. Run only on the intended non-production server.
// Ordered: create collections, validators, indexes, reference seed, business seed, read-only verification.
// If business seeding fails partway, do not rerun blindly; inspect the database first.

// ===== BEGIN 01_create_collections.js =====
// Studio 3T IntelliShell / mongosh. Targets only the approved database name.
(function createCinemaLoyaltyCollections() {
    const TARGET_DB = "CinemaLoyaltyDB";
    const COLLECTIONS = [
        "bien_dong_diem", "cum_rap", "doi_thuong", "ghi_nhan_chi_tieu",
        "giao_dich", "hang_thanh_vien", "khach_hang", "khuyen_mai",
        "lich_su_hang", "lich_su_ton_kho", "phan_thuong", "phim",
        "phong_chieu", "san_pham", "suat_chieu", "thanh_toan", "ve"
    ];

    const target = db.getSiblingDB(TARGET_DB);
    if (target.getName() !== TARGET_DB) throw new Error("Wrong database; no changes made");

    const existing = new Set(target.getCollectionNames());
    const created = [];
    const alreadyPresent = [];
    COLLECTIONS.forEach((name) => {
        if (existing.has(name)) {
            alreadyPresent.push(name);
            return;
        }
        target.createCollection(name);
        created.push(name);
    });
    printjson({ database: target.getName(), created, alreadyPresent, collectionCount: COLLECTIONS.length });
})();
// ===== END 01_create_collections.js =====

// ===== BEGIN 02_create_validators.js =====
// Applies model-aligned validators to empty test collections only.
(function configureCinemaLoyaltyValidators() {
    const TARGET_DB = "CinemaLoyaltyDB";
    const S = (required, properties) => {
        const schemaProperties = { _id: { bsonType: "objectId" } };
        Object.keys(properties).forEach((key) => { schemaProperties[key] = properties[key]; });
        return { $jsonSchema: { bsonType: "object", required, properties: schemaProperties } };
    };
    const str = { bsonType: "string" };
    const nullableString = { bsonType: ["string", "null"] };
    const date = { bsonType: "date" };
    const nullableDate = { bsonType: ["date", "null"] };
    const decimal = { bsonType: "decimal", minimum: 0 };
    const nullableDecimal = { bsonType: ["decimal", "null"], minimum: 0 };
    // Mongoose Number fields may serialize as BSON int32 or double.
    const number = { bsonType: ["int", "double"] };
    const nonNegativeNumber = { bsonType: ["int", "double"], minimum: 0 };
    const positiveNumber = { bsonType: ["int", "double"], minimum: 1 };

    const seat = {
        bsonType: "object",
        required: ["MaGhe", "HangGhe", "LoaiGhe", "GiaPhuThu", "TrangThai"],
        properties: {
            MaGhe: str, HangGhe: str,
            LoaiGhe: { bsonType: "string", enum: ["STANDARD", "VIP", "COUPLE"] },
            GiaPhuThu: decimal,
            TrangThai: { bsonType: "string", enum: ["AVAILABLE", "HELD", "BOOKED", "MAINTENANCE"] },
            MaGDGiuCho: nullableString,
            ThoiGianGiuCho: nullableDate
        }
    };
    const ticketLine = {
        bsonType: "object",
        required: ["MaSuat", "MaGhe", "LoaiGhe", "GiaVe"],
        properties: {
            MaVe: str, MaSuat: str, MaGhe: str,
            LoaiGhe: { bsonType: "string", enum: ["STANDARD", "VIP", "COUPLE"] },
            GiaVe: decimal
        }
    };
    const comboComponent = {
        bsonType: "object",
        required: ["MaSP", "TenSP", "LoaiSP", "SoLuong"],
        properties: {
            MaSP: str, TenSP: str,
            LoaiSP: { bsonType: "string", enum: ["BAP", "NUOC", "SNACK"] },
            SoLuong: positiveNumber
        }
    };
    const comboLine = {
        bsonType: "object",
        required: ["MaSP", "TenSP", "SoLuong", "DonGia", "ThanhTien"],
        properties: {
            MaSP: str, TenSP: str,
            LoaiSP: { bsonType: ["string", "null"], enum: ["BAP", "NUOC", "SNACK", "COMBO", null] },
            SoLuong: positiveNumber,
            DonGia: decimal, ThanhTien: decimal,
            ThanhPhan: { bsonType: "array", items: comboComponent }
        }
    };
    const productComponent = {
        bsonType: "object", required: ["MaSP", "SoLuong"],
        properties: { MaSP: str, SoLuong: positiveNumber }
    };
    const stockItem = {
        bsonType: "object", required: ["MaSP", "SoLuong", "TrangThai"],
        properties: {
            MaSP: str, SoLuong: positiveNumber,
            TrangThai: { bsonType: "string", enum: ["PENDING", "PROCESSING", "APPLIED", "RECONCILIATION_REQUIRED"] }
        }
    };

    const validators = [
        ["bien_dong_diem", S(
            ["MaLedger", "MaKH", "Loai", "SoDiem", "NgayPhatSinh", "LyDo", "TrangThai", "IdempotencyKey"],
            {
                MaLedger: str, MaKH: str, MaGD: nullableString, MaDoi: nullableString,
                Loai: { bsonType: "string", enum: ["EARN", "REDEEM", "BONUS", "EXPIRE", "ADJUST", "REVERSE"] },
                SoDiem: number, NgayPhatSinh: date, NgayHetHan: nullableDate, LyDo: str,
                TrangThai: { bsonType: "string", enum: ["PENDING", "PROCESSING", "POSTED", "REVERSED"] },
                IdempotencyKey: str
            })],
        ["cum_rap", S(["MaRap", "TenRap", "DiaChi", "ThanhPho", "TrangThai"], {
            MaRap: str, TenRap: str, DiaChi: str, ThanhPho: str,
            SoDienThoai: nullableString, GioMoCua: nullableString, GioDongCua: nullableString,
            TrangThai: { bsonType: "string", enum: ["ACTIVE", "INACTIVE"] }
        })],
        ["doi_thuong", S(["MaDoi", "MaKH", "MaQua", "SoLuong", "DiemSuDung", "NgayDoi", "TrangThai"], {
            MaDoi: str, MaKH: str, MaQua: str, SoLuong: positiveNumber,
            DiemSuDung: nonNegativeNumber, MaVoucher: nullableString, NgayDoi: date,
            HanSuDung: nullableDate,
            TrangThai: { bsonType: "string", enum: ["PENDING", "COMPLETED", "CANCELLED", "EXPIRED"] }
        })],
        ["ghi_nhan_chi_tieu", S(["IdempotencyKey", "MaGD", "MaKH", "NamChiTieu", "SoTien", "LoaiSuKien", "TrangThai", "DaXacMinh", "NgayPhatSinh", "NgayTao", "NgayCapNhat"], {
            IdempotencyKey: str, MaGD: str, MaThanhToan: nullableString, MaKH: str,
            NamChiTieu: number, SoTien: decimal,
            LoaiSuKien: { bsonType: "string", enum: ["SPEND", "REFUND_REVIEW"] },
            TrangThai: { bsonType: "string", enum: ["PENDING", "PROCESSING", "CUSTOMER_UPDATED", "POSTED", "RECONCILIATION_REQUIRED"] },
            DaXacMinh: { bsonType: "bool" }, MaHangCu: nullableString, MaHangMoi: nullableString,
            TongChiTieuSau: nullableDecimal, NamXetHang: { bsonType: ["int", "double", "null"] },
            MaLichSu: nullableString, ChiTieuLichSu: { bsonType: "bool" }, ChiTieuCuNam: { bsonType: "bool" },
            LockToken: nullableString, LockUntil: nullableDate, CanDoiSoatRefund: { bsonType: "bool" },
            RefundCheckedAt: nullableDate, LyDoDoiSoat: nullableString,
            NgayPhatSinh: date, NgayTao: date, NgayCapNhat: date
        })],
        ["giao_dich", S(["MaGD", "MaKH", "LoaiGiaoDich", "TamTinh", "SoTienGiam", "TongTien", "DiemDuKien", "TrangThai", "NgayTao"], {
            MaGD: str, MaKH: str,
            LoaiGiaoDich: { bsonType: "string", enum: ["DAT_VE", "MUA_COMBO", "HON_HOP"] },
            ChiTietVe: { bsonType: "array", items: ticketLine },
            ChiTietCombo: { bsonType: "array", items: comboLine },
            TamTinh: decimal, SoTienGiam: decimal, SoTienGiamVe: decimal, SoTienGiamSanPham: decimal,
            TongTien: decimal, MaKM: nullableString, DiemDuKien: nonNegativeNumber,
            TrangThai: { bsonType: "string", enum: ["PENDING_PAYMENT", "COMPLETED", "CANCELLED", "REFUNDED"] },
            NgayTao: date, NgayHoanTat: nullableDate
        })],
        ["hang_thanh_vien", S(["MaHang", "TenHang", "MucChiTieuToiThieu", "TyLeTichDiemVe", "TyLeTichDiemBapNuoc", "QuyenLoi", "TrangThai"], {
            MaHang: str, TenHang: { bsonType: "string", enum: ["Dong", "Bac", "Vang"] },
            MucChiTieuToiThieu: decimal, MucChiTieuToiDa: nullableDecimal,
            TyLeTichDiemVe: { bsonType: ["int", "double"], minimum: 0 },
            TyLeTichDiemBapNuoc: { bsonType: ["int", "double"], minimum: 0 },
            QuyenLoi: { bsonType: "array", items: str }, MoTa: nullableString,
            TrangThai: { bsonType: "string", enum: ["ACTIVE", "INACTIVE"] }
        })],
        ["khach_hang", S(["MaKH", "HoTen", "SDT", "Email", "MatKhauHash", "NgayDangKy", "MaTheThanhVien", "MaQR", "MaHangHienTai", "DiemHienTai", "TongDiemTichLuy", "TongChiTieuNam", "NamXetHang", "TrangThai", "VaiTro"], {
            MaKH: str, HoTen: str, SDT: str, Email: str, MatKhauHash: str,
            NgaySinh: nullableDate, GioiTinh: nullableString, NgayDangKy: date,
            MaTheThanhVien: str, MaQR: str, MaHangHienTai: str,
            DiemHienTai: nonNegativeNumber, TongDiemTichLuy: nonNegativeNumber,
            TongChiTieuNam: decimal, NamXetHang: number,
            TrangThai: { bsonType: "string", enum: ["ACTIVE", "INACTIVE", "BLOCKED"] },
            VaiTro: { bsonType: "string", enum: ["KHACHHANG", "ADMIN"] }
        })],
        ["khuyen_mai", S(["MaKM", "TenKM", "LoaiKM", "GiaTriKM", "NgayBatDau", "NgayKetThuc", "TrangThai"], {
            MaKM: str, TenKM: str,
            LoaiKM: { bsonType: "string", enum: ["GIAM_GIA", "TANG_DIEM", "GIA_VE"] },
            GiaTriKM: decimal, HeSoDiem: { bsonType: ["int", "double", "null"], minimum: 0 },
            HangApDung: { bsonType: "array", items: str }, NgayBatDau: date, NgayKetThuc: date,
            // DieuKienApDung is Mongoose Mixed. It is intentionally not type-restricted here.
            TrangThai: { bsonType: "string", enum: ["ACTIVE", "INACTIVE"] }
        })],
        ["lich_su_hang", S(["MaLichSu", "MaKH", "MaHangMoi", "NgayThayDoi", "NamXetHang", "LyDo"], {
            MaLichSu: str, MaKH: str, MaHangCu: nullableString, MaHangMoi: str,
            NgayThayDoi: date, NamXetHang: number, LyDo: str
        })],
        ["lich_su_ton_kho", S(["MaGD", "MaKH", "DanhSachTruKho", "TrangThai", "NgayTao", "NgayCapNhat"], {
            MaGD: str, MaKH: str, DanhSachTruKho: { bsonType: "array", items: stockItem },
            TrangThai: { bsonType: "string", enum: ["PENDING", "PROCESSING", "POSTED", "RECONCILIATION_REQUIRED"] },
            LyDoDoiSoat: nullableString, NgayTao: date, NgayCapNhat: date
        })],
        ["phan_thuong", S(["MaQua", "TenQua", "LoaiQua", "DiemCan", "SoLuongTon", "NgayBatDau", "NgayKetThuc", "TrangThai"], {
            MaQua: str, TenQua: str,
            LoaiQua: { bsonType: "string", enum: ["VOUCHER_VE", "VOUCHER_COMBO", "QUA_TANG"] },
            DiemCan: nonNegativeNumber, MoTa: nullableString, GiaTriGiam: nullableDecimal,
            SoLuongTon: nonNegativeNumber, NgayBatDau: date, NgayKetThuc: date,
            TrangThai: { bsonType: "string", enum: ["ACTIVE", "INACTIVE"] }
        })],
        ["phim", S(["MaPhim", "TenPhim", "TheLoai", "DienVien", "ThoiLuong", "NgonNgu", "PhanLoaiDoTuoi", "NgayKhoiChieu", "TrangThai"], {
            MaPhim: str, TenPhim: str, TheLoai: { bsonType: "array", items: str },
            DaoDien: nullableString, DienVien: { bsonType: "array", items: str },
            ThoiLuong: positiveNumber, NgonNgu: str, PhuDe: nullableString,
            PhanLoaiDoTuoi: { bsonType: "string", enum: ["P", "K", "T13", "T16", "T18"] },
            NgayKhoiChieu: date, NgayKetThuc: nullableDate, Poster: nullableString,
            TrangThai: { bsonType: "string", enum: ["COMING_SOON", "SHOWING", "ENDED"] }
        })],
        ["phong_chieu", S(["MaPhong", "MaRap", "TenPhong", "LoaiPhong", "SoHangGhe", "SoCotGhe", "SucChua", "TrangThai"], {
            MaPhong: str, MaRap: str, TenPhong: str,
            LoaiPhong: { bsonType: "string", enum: ["2D", "3D", "IMAX", "4DX"] },
            SoHangGhe: positiveNumber, SoCotGhe: positiveNumber,
            SucChua: positiveNumber, TrangThai: { bsonType: "string", enum: ["ACTIVE", "INACTIVE"] }
        })],
        ["san_pham", S(["MaSP", "TenSP", "LoaiSP", "GiaBan", "SoLuongTon", "TrangThai"], {
            MaSP: str, TenSP: str,
            LoaiSP: { bsonType: "string", enum: ["BAP", "NUOC", "SNACK", "COMBO"] },
            MoTa: nullableString, GiaBan: decimal,
            ThanhPhan: { bsonType: "array", items: productComponent },
            SoLuongTon: nonNegativeNumber, HinhAnh: nullableString,
            TrangThai: { bsonType: "string", enum: ["ACTIVE", "INACTIVE"] }
        })],
        ["suat_chieu", S(["MaSuat", "MaPhim", "MaRap", "MaPhong", "NgayChieu", "GioBatDau", "GioKetThuc", "GiaVeCoBan", "DanhSachGhe", "TrangThai"], {
            MaSuat: str, MaPhim: str, MaRap: str, MaPhong: str, NgayChieu: date,
            GioBatDau: str, GioKetThuc: str, GiaVeCoBan: decimal,
            DanhSachGhe: { bsonType: "array", items: seat },
            TrangThai: { bsonType: "string", enum: ["SCHEDULED", "CANCELLED", "COMPLETED"] }
        })],
        ["thanh_toan", S(["MaThanhToan", "MaGD", "MaKH", "PhuongThuc", "SoTien", "TrangThai", "ThoiGianTao"], {
            MaThanhToan: str, MaGD: str, MaKH: str,
            PhuongThuc: { bsonType: "string", enum: ["MOMO", "DEV_MOCK"] }, SoTien: decimal,
            MaGiaoDichMoMo: nullableString,
            TrangThai: { bsonType: "string", enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"] },
            ThoiGianTao: date, ThoiGianThanhToan: nullableDate, NoiDung: nullableString,
            CanDoiSoat: { bsonType: "bool" }, LyDoDoiSoat: nullableString, NgayKiemTraTrangThaiMoMo: nullableDate
        })],
        ["ve", S(["MaVe", "MaGD", "MaKH", "MaSuat", "MaPhim", "MaRap", "MaPhong", "MaGhe", "GiaVe", "MaQRTicket", "TrangThai", "NgayPhatHanh"], {
            MaVe: str, MaGD: str, MaKH: str, MaSuat: str, MaPhim: str, MaRap: str, MaPhong: str, MaGhe: str,
            GiaVe: decimal, MaQRTicket: str,
            TrangThai: { bsonType: "string", enum: ["VALID", "USED", "CANCELLED", "REFUNDED"] },
            NgayPhatHanh: date, NgaySuDung: nullableDate
        })]
    ];

    const target = db.getSiblingDB(TARGET_DB);
    if (target.getName() !== TARGET_DB) throw new Error("Wrong database; no changes made");
    const names = new Set(target.getCollectionNames());
    if (validators.some(function (entry) { return !names.has(entry[0]); })) throw new Error("Run 01_create_collections.js first");

    const stable = (value) => {
        if (Array.isArray(value)) return value.map(stable);
        if (value && typeof value === "object") {
            return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out; }, {});
        }
        return value;
    };
    const same = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));
    const infos = validators.map(([name, validator]) => {
        const info = target.getCollectionInfos({ name })[0];
        const current = info && info.options ? info.options.validator : null;
        if (current && !same(current, validator)) throw new Error(`${name} already has a different validator; inspect manually`);
        if (!current && target.getCollection(name).countDocuments({}) !== 0) {
            throw new Error(`${name} contains documents but has no validator; refusing to apply validator`);
        }
        return { name, validator, current };
    });

    infos.forEach(({ name, validator, current }) => {
        if (current) return;
        const result = target.runCommand({
            collMod: name,
            validator,
            validationLevel: "strict",
            validationAction: "error"
        });
        if (!result || result.ok !== 1) throw new Error(`Could not apply validator to ${name}: ${tojson(result)}`);
    });
    printjson({ database: target.getName(), validatorCount: validators.length, applied: infos.filter((x) => !x.current).map((x) => x.name), alreadyMatched: infos.filter((x) => x.current).map((x) => x.name) });
})();
// ===== END 02_create_validators.js =====

// ===== BEGIN 03_create_indexes.js =====
// Preflights every unique key before creating any index. Never drops/replaces indexes.
(function createCinemaLoyaltyIndexes() {
    const TARGET_DB = "CinemaLoyaltyDB";
    const indexes = [
        ["khach_hang", { MaKH: 1 }, { unique: true, name: "uq_khach_hang_makh" }],
        ["khach_hang", { SDT: 1 }, { unique: true, name: "uq_khach_hang_sdt" }],
        ["khach_hang", { Email: 1 }, { unique: true, name: "uq_khach_hang_email" }],
        ["khach_hang", { MaTheThanhVien: 1 }, { unique: true, name: "uq_khach_hang_mathe" }],
        ["khach_hang", { MaQR: 1 }, { unique: true, name: "uq_khach_hang_maqrcode" }],
        ["hang_thanh_vien", { MaHang: 1 }, { unique: true, name: "uq_hang_thanh_vien_mahang" }],
        ["hang_thanh_vien", { TrangThai: 1, MucChiTieuToiThieu: 1 }, { name: "ix_hang_active_threshold" }],
        ["lich_su_hang", { MaLichSu: 1 }, { unique: true, name: "uq_lich_su_hang_ma_lich_su" }],
        ["lich_su_hang", { MaKH: 1, NgayThayDoi: -1, MaLichSu: -1 }, { name: "ix_lich_su_hang_customer_time" }],
        ["cum_rap", { MaRap: 1 }, { unique: true, name: "uq_cum_rap_marap" }],
        ["phong_chieu", { MaPhong: 1 }, { unique: true, name: "uq_phong_chieu_maphong" }],
        ["phong_chieu", { MaRap: 1 }, { name: "ix_phong_chieu_marap" }],
        ["phim", { MaPhim: 1 }, { unique: true, name: "uq_phim_maphim" }],
        ["suat_chieu", { MaSuat: 1 }, { unique: true, name: "uq_suat_chieu_masuat" }],
        ["suat_chieu", { MaPhim: 1 }, { name: "ix_suat_chieu_maphim" }],
        ["suat_chieu", { MaRap: 1 }, { name: "ix_suat_chieu_marap" }],
        ["suat_chieu", { MaPhong: 1 }, { name: "ix_suat_chieu_maphong" }],
        ["giao_dich", { MaGD: 1 }, { unique: true, name: "uq_giao_dich_magd" }],
        ["giao_dich", { MaKH: 1 }, { name: "ix_giao_dich_makh" }],
        ["giao_dich", { TrangThai: 1 }, { name: "ix_giao_dich_trangthai" }],
        ["giao_dich", { TrangThai: 1, NgayTao: 1 }, { name: "ix_giao_dich_expiry_scan" }],
        ["giao_dich", { TrangThai: 1, NgayHoanTat: 1 }, { name: "ix_giao_dich_completed_revenue" }],
        ["giao_dich", { MaKH: 1, NgayTao: -1, MaGD: 1 }, { name: "ix_giao_dich_customer_time" }],
        ["ve", { MaVe: 1 }, { unique: true, name: "uq_ve_mave" }],
        ["ve", { MaQRTicket: 1 }, { unique: true, name: "uq_ve_qrticket" }],
        ["ve", { MaGD: 1 }, { name: "ix_ve_magd" }],
        ["ve", { MaKH: 1, NgayPhatHanh: -1, MaVe: 1 }, { name: "ix_ve_customer_time" }],
        ["ve", { MaSuat: 1, MaGhe: 1 }, {
            unique: true,
            name: "uq_ve_active_seat",
            partialFilterExpression: { $or: [{ TrangThai: "VALID" }, { TrangThai: "USED" }] }
        }],
        ["thanh_toan", { MaThanhToan: 1 }, { unique: true, name: "uq_thanh_toan_mathanhtoan" }],
        ["thanh_toan", { MaGD: 1 }, { name: "ix_thanh_toan_magd" }],
        ["thanh_toan", { MaGiaoDichMoMo: 1 }, {
            unique: true,
            name: "uq_thanh_toan_momo_id_string",
            partialFilterExpression: { MaGiaoDichMoMo: { $type: "string" } }
        }],
        ["thanh_toan", { PhuongThuc: 1, TrangThai: 1, NgayKiemTraTrangThaiMoMo: 1, ThoiGianTao: 1 }, { name: "ix_thanh_toan_reconciliation_scan" }],
        ["bien_dong_diem", { MaLedger: 1 }, { unique: true, name: "uq_bien_dong_diem_maledger" }],
        ["bien_dong_diem", { IdempotencyKey: 1 }, { unique: true, name: "uq_bien_dong_diem_idempotency" }],
        ["bien_dong_diem", { MaKH: 1 }, { name: "ix_bien_dong_diem_makh" }],
        ["bien_dong_diem", { NgayHetHan: 1 }, { name: "ix_bien_dong_diem_expiry" }],
        ["bien_dong_diem", { MaKH: 1, NgayPhatSinh: -1, MaLedger: -1 }, { name: "ix_bien_dong_diem_customer_history" }],
        ["phan_thuong", { MaQua: 1 }, { unique: true, name: "uq_phan_thuong_maqua" }],
        ["phan_thuong", { TrangThai: 1, NgayBatDau: 1, NgayKetThuc: 1, DiemCan: 1 }, { name: "ix_phan_thuong_available" }],
        ["doi_thuong", { MaDoi: 1 }, { unique: true, name: "uq_doi_thuong_madoi" }],
        ["doi_thuong", { MaKH: 1, NgayDoi: -1, MaDoi: -1 }, { name: "ix_doi_thuong_customer_history" }],
        ["san_pham", { MaSP: 1 }, { unique: true, name: "uq_san_pham_masp" }],
        ["san_pham", { TrangThai: 1, LoaiSP: 1, TenSP: 1, MaSP: 1 }, { name: "ix_san_pham_catalog" }],
        ["khuyen_mai", { MaKM: 1 }, { unique: true, name: "uq_khuyen_mai_makm" }],
        ["khuyen_mai", { TrangThai: 1, NgayBatDau: -1, MaKM: 1 }, { name: "ix_khuyen_mai_list" }],
        ["ghi_nhan_chi_tieu", { IdempotencyKey: 1 }, { unique: true, name: "uq_chi_tieu_idempotency" }],
        ["ghi_nhan_chi_tieu", { MaKH: 1, NamChiTieu: 1, TrangThai: 1 }, { name: "ix_chi_tieu_customer_year_status" }],
        ["ghi_nhan_chi_tieu", { TrangThai: 1, DaXacMinh: 1, CanDoiSoatRefund: 1, RefundCheckedAt: 1, NgayTao: 1 }, { name: "ix_chi_tieu_recovery_scan" }],
        ["lich_su_ton_kho", { MaGD: 1 }, { unique: true, name: "uq_lich_su_ton_kho_magd" }],
        ["lich_su_ton_kho", { TrangThai: 1, NgayCapNhat: 1, MaGD: 1 }, { name: "ix_lich_su_ton_kho_recovery_scan" }]
    ];

    const target = db.getSiblingDB(TARGET_DB);
    if (target.getName() !== TARGET_DB) throw new Error("Wrong database; no changes made");
    const collectionNames = new Set(target.getCollectionNames());
    const indexCollectionNames = [];
    indexes.forEach((entry) => {
        if (indexCollectionNames.indexOf(entry[0]) === -1) indexCollectionNames.push(entry[0]);
    });
    const missingCollections = indexCollectionNames.filter((name) => !collectionNames.has(name));
    if (missingCollections.length) throw new Error(`Run 01_create_collections.js first; missing: ${missingCollections.join(", ")}`);

    const stable = (value) => {
        if (Array.isArray(value)) return value.map(stable);
        if (value && typeof value === "object") return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out; }, {});
        return value;
    };
    const same = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
    const keySame = (a, b) => same(a, b);
    const existingState = indexes.map(([name, key, options]) => {
        const collection = target.getCollection(name);
        const found = collection.getIndexes().find((index) => keySame(index.key, key));
        if (found) {
            const actualOptions = { unique: found.unique === true, name: found.name };
            if (found.partialFilterExpression) actualOptions.partialFilterExpression = found.partialFilterExpression;
            const expectedOptions = { unique: options.unique === true, name: options.name };
            if (options.partialFilterExpression) expectedOptions.partialFilterExpression = options.partialFilterExpression;
            if (!same(actualOptions, expectedOptions)) throw new Error(`${name} has incompatible index on ${JSON.stringify(key)}; no index was changed`);
        }
        return { name, key, options, collection, found };
    });

    const duplicateFor = (collection, field, partialFilterExpression) => {
        const pipeline = [];
        if (partialFilterExpression) pipeline.push({ $match: partialFilterExpression });
        else pipeline.push({ $match: { [field]: { $exists: true, $nin: [null, ""] } } });
        pipeline.push({ $group: { _id: partialFilterExpression ? { MaSuat: "$MaSuat", MaGhe: "$MaGhe" } : `$${field}`, count: { $sum: 1 } } });
        pipeline.push({ $match: { count: { $gt: 1 } } }, { $limit: 1 });
        return collection.aggregate(pipeline).toArray();
    };
    const requiredUniqueFields = [
        ["khach_hang", "MaKH"], ["khach_hang", "SDT"], ["khach_hang", "Email"], ["khach_hang", "MaTheThanhVien"], ["khach_hang", "MaQR"],
        ["hang_thanh_vien", "MaHang"], ["lich_su_hang", "MaLichSu"], ["cum_rap", "MaRap"], ["phong_chieu", "MaPhong"], ["phim", "MaPhim"],
        ["suat_chieu", "MaSuat"], ["giao_dich", "MaGD"], ["ve", "MaVe"], ["ve", "MaQRTicket"], ["thanh_toan", "MaThanhToan"],
        ["bien_dong_diem", "MaLedger"], ["bien_dong_diem", "IdempotencyKey"], ["phan_thuong", "MaQua"], ["doi_thuong", "MaDoi"],
        ["san_pham", "MaSP"], ["khuyen_mai", "MaKM"], ["ghi_nhan_chi_tieu", "IdempotencyKey"], ["lich_su_ton_kho", "MaGD"]
    ];
    requiredUniqueFields.forEach(([name, field]) => {
        const collection = target.getCollection(name);
        const missing = collection.countDocuments({ $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: "" }] });
        if (missing) throw new Error(`${name}.${field} has ${missing} missing/empty values; no indexes created`);
        const duplicates = duplicateFor(collection, field, null);
        if (duplicates.length) throw new Error(`${name}.${field} contains duplicates; no indexes created`);
    });

    const seatCollection = target.getCollection("ve");
    const missingActiveSeatKeys = seatCollection.countDocuments({
        $and: [{ $or: [{ TrangThai: "VALID" }, { TrangThai: "USED" }] }, {
            $or: [{ MaSuat: { $exists: false } }, { MaSuat: null }, { MaSuat: "" }, { MaGhe: { $exists: false } }, { MaGhe: null }, { MaGhe: "" }]
        }]
    });
    if (missingActiveSeatKeys) throw new Error("VALID/USED tickets are missing MaSuat/MaGhe; no indexes created");
    const duplicateSeats = duplicateFor(seatCollection, null, { $or: [{ TrangThai: "VALID" }, { TrangThai: "USED" }] });
    if (duplicateSeats.length) throw new Error("Active/used ticket seats are duplicated; no indexes created");
    const paymentCollection = target.getCollection("thanh_toan");
    const duplicateMomoIds = paymentCollection.aggregate([
        { $match: { MaGiaoDichMoMo: { $type: "string" } } },
        { $group: { _id: "$MaGiaoDichMoMo", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }, { $limit: 1 }
    ]).toArray();
    if (duplicateMomoIds.length) throw new Error("Duplicate string MaGiaoDichMoMo values exist; no indexes created");

    const created = [];
    const matched = [];
    existingState.forEach(({ name, key, options, collection, found }) => {
        if (found) { matched.push(found.name); return; }
        collection.createIndex(key, options);
        created.push(options.name);
    });
    printjson({ database: target.getName(), targetIndexCount: indexes.length, created, alreadyMatched: matched });
})();
// ===== END 03_create_indexes.js =====

// ===== BEGIN 04_seed_reference_data.js =====
// Fictional reference fixtures. Run only after steps 01-03 on an empty target database.
(function seedCinemaLoyaltyReferenceData() {
    const TARGET_DB = "CinemaLoyaltyDB";
    const COLLECTIONS = [
        "bien_dong_diem", "cum_rap", "doi_thuong", "ghi_nhan_chi_tieu", "giao_dich",
        "hang_thanh_vien", "khach_hang", "khuyen_mai", "lich_su_hang", "lich_su_ton_kho",
        "phan_thuong", "phim", "phong_chieu", "san_pham", "suat_chieu", "thanh_toan", "ve"
    ];
    const target = db.getSiblingDB(TARGET_DB);
    if (target.getName() !== TARGET_DB) throw new Error("Wrong database; no seed inserted");
    const names = new Set(target.getCollectionNames());
    if (COLLECTIONS.some((name) => !names.has(name))) throw new Error("Run 01_create_collections.js first");
    const nonEmpty = COLLECTIONS.filter((name) => target.getCollection(name).countDocuments({}) > 0);
    if (nonEmpty.length) throw new Error(`Reference seed requires empty target collections; nonempty: ${nonEmpty.join(", ")}`);

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const showDay = new Date(now.getTime() + 2 * day);
    showDay.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(now.getTime() - 30 * day);
    const endDate = new Date(now.getTime() + 365 * day);
    const seat = (MaGhe, LoaiGhe = "STANDARD", GiaPhuThu = "0") => ({
        MaGhe, HangGhe: MaGhe[0], LoaiGhe, GiaPhuThu: NumberDecimal(GiaPhuThu),
        TrangThai: "AVAILABLE", MaGDGiuCho: null, ThoiGianGiuCho: null
    });

    target.hang_thanh_vien.insertMany([
        { MaHang: "H01", TenHang: "Dong", MucChiTieuToiThieu: NumberDecimal("0"), MucChiTieuToiDa: NumberDecimal("1999999"), TyLeTichDiemVe: 0.05, TyLeTichDiemBapNuoc: 0.03, QuyenLoi: ["Tich diem ve", "Tich diem bap nuoc"], MoTa: "Hang demo co ban", TrangThai: "ACTIVE" },
        { MaHang: "H02", TenHang: "Bac", MucChiTieuToiThieu: NumberDecimal("2000000"), MucChiTieuToiDa: NumberDecimal("4999999"), TyLeTichDiemVe: 0.07, TyLeTichDiemBapNuoc: 0.04, QuyenLoi: ["Tich diem uu dai"], MoTa: "Hang demo bac", TrangThai: "ACTIVE" },
        { MaHang: "H03", TenHang: "Vang", MucChiTieuToiThieu: NumberDecimal("5000000"), MucChiTieuToiDa: null, TyLeTichDiemVe: 0.10, TyLeTichDiemBapNuoc: 0.05, QuyenLoi: ["Tich diem cao"], MoTa: "Hang demo vang", TrangThai: "ACTIVE" }
    ]);
    target.cum_rap.insertOne({ MaRap: "RAP_TEST_01", TenRap: "Cinema Loyalty Test", DiaChi: "Dia chi gia lap", ThanhPho: "Ho Chi Minh", SoDienThoai: null, GioMoCua: "08:00", GioDongCua: "23:00", TrangThai: "ACTIVE" });
    target.phong_chieu.insertOne({ MaPhong: "PHONG_TEST_01", MaRap: "RAP_TEST_01", TenPhong: "Phong test", LoaiPhong: "2D", SoHangGhe: 2, SoCotGhe: 2, SucChua: 4, TrangThai: "ACTIVE" });
    target.phim.insertOne({ MaPhim: "PHIM_TEST_01", TenPhim: "Phim gia lap CinemaLoyalty", TheLoai: ["Gia lap"], DaoDien: null, DienVien: [], ThoiLuong: 100, NgonNgu: "Tieng Viet", PhuDe: null, PhanLoaiDoTuoi: "P", NgayKhoiChieu: new Date(now.getTime() - 10 * day), NgayKetThuc: null, Poster: null, TrangThai: "SHOWING" });
    target.suat_chieu.insertOne({
        MaSuat: "SUAT_TEST_01", MaPhim: "PHIM_TEST_01", MaRap: "RAP_TEST_01", MaPhong: "PHONG_TEST_01",
        NgayChieu: showDay, GioBatDau: "19:00", GioKetThuc: "20:40", GiaVeCoBan: NumberDecimal("120000"),
        DanhSachGhe: [seat("A01"), seat("A02"), seat("B01", "VIP", "20000"), seat("B02", "VIP", "20000")],
        TrangThai: "SCHEDULED"
    });
    target.san_pham.insertMany([
        { MaSP: "SP_TEST_BAP", TenSP: "Bap demo", LoaiSP: "BAP", MoTa: "Thanh phan combo demo", GiaBan: NumberDecimal("50000"), ThanhPhan: [], SoLuongTon: 100, HinhAnh: null, TrangThai: "ACTIVE" },
        { MaSP: "SP_TEST_NUOC", TenSP: "Nuoc demo", LoaiSP: "NUOC", MoTa: "Thanh phan combo demo", GiaBan: NumberDecimal("25000"), ThanhPhan: [], SoLuongTon: 200, HinhAnh: null, TrangThai: "ACTIVE" },
        { MaSP: "SP_TEST_COMBO", TenSP: "Combo demo", LoaiSP: "COMBO", MoTa: "Mot bap va hai nuoc", GiaBan: NumberDecimal("100000"), ThanhPhan: [{ MaSP: "SP_TEST_BAP", SoLuong: 1 }, { MaSP: "SP_TEST_NUOC", SoLuong: 2 }], SoLuongTon: 1000, HinhAnh: null, TrangThai: "ACTIVE" }
    ]);
    target.khuyen_mai.insertOne({ MaKM: "KM_TEST_TICKET", TenKM: "Giam gia ve demo", LoaiKM: "GIA_VE", GiaTriKM: NumberDecimal("10000"), HeSoDiem: null, HangApDung: ["H01"], NgayBatDau: startDate, NgayKetThuc: endDate, DieuKienApDung: null, TrangThai: "ACTIVE" });
    target.phan_thuong.insertOne({ MaQua: "QUA_TEST_10", TenQua: "Voucher demo 10 diem", LoaiQua: "VOUCHER_VE", DiemCan: 10, MoTa: "Phan thuong gia lap", GiaTriGiam: NumberDecimal("10000"), SoLuongTon: 100, NgayBatDau: startDate, NgayKetThuc: endDate, TrangThai: "ACTIVE" });

    printjson({ database: target.getName(), insertedReferenceDocuments: { hang_thanh_vien: 3, cum_rap: 1, phong_chieu: 1, phim: 1, suat_chieu: 1, san_pham: 3, khuyen_mai: 1, phan_thuong: 1 }, total: 12, note: "SP_TEST_BAP/NUOC and QUA_TEST_10 start at 100/200/100; step 05 applies the demo sales/redemption." });
})();
// ===== END 04_seed_reference_data.js =====

// ===== BEGIN 05_seed_business_data.js =====
// Coherent, fictional business fixtures. Uses DEV_MOCK only; never calls a gateway.
(function seedCinemaLoyaltyBusinessData() {
    const TARGET_DB = "CinemaLoyaltyDB";
    const VND_PER_POINT = 10000;
    const HASH_ADMIN = "$2b$12$lbVmCbQc/mjhtEBvuwwAr.fvqQMYiH7HlrYnxfzluSVA3okFlKy7K";
    const HASH_MEMBER = "$2b$12$GJ0UyvM80DhPwo49U3Imo.05KVs8DSQVIFOePG.eIXQi6V1fM8u2m";
    const REDEEM_DIGEST = "6E36BDAEC745A216BECB073A782376D8F990B461EAB5E8454D40C19BB22859BD";
    const H02_HISTORY = "LS634C70B99BD5EA1A455C9EE5EF9CA3E6C2A990E86515E407C0D4FE0555AAE049";
    const H03_HISTORY = "LS89EC490585A0533650107790A6AEC243167BA00F93998F130E588A3CC0CB2D74";
    if (!Number.isFinite(VND_PER_POINT) || VND_PER_POINT <= 0) throw new Error("Invalid E3 seed divisor");

    const target = db.getSiblingDB(TARGET_DB);
    if (target.getName() !== TARGET_DB) throw new Error("Wrong database; no business seed inserted");
    const now = new Date();
    const expectedReferenceCounts = {
        hang_thanh_vien: 3, cum_rap: 1, phong_chieu: 1, phim: 1, suat_chieu: 1,
        san_pham: 3, khuyen_mai: 1, phan_thuong: 1
    };
    Object.keys(expectedReferenceCounts).forEach((name) => {
        if (target.getCollection(name).countDocuments({}) !== expectedReferenceCounts[name]) throw new Error(`Run 04 on the fresh target database first; unexpected ${name} count`);
    });
    const expectedReferenceIds = {
        hang_thanh_vien: ["H01", "H02", "H03"],
        cum_rap: ["RAP_TEST_01"],
        phong_chieu: ["PHONG_TEST_01"],
        phim: ["PHIM_TEST_01"],
        suat_chieu: ["SUAT_TEST_01"],
        san_pham: ["SP_TEST_BAP", "SP_TEST_NUOC", "SP_TEST_COMBO"],
        khuyen_mai: ["KM_TEST_TICKET"],
        phan_thuong: ["QUA_TEST_10"]
    };
    const referenceKey = {
        hang_thanh_vien: "MaHang", cum_rap: "MaRap", phong_chieu: "MaPhong", phim: "MaPhim",
        suat_chieu: "MaSuat", san_pham: "MaSP", khuyen_mai: "MaKM", phan_thuong: "MaQua"
    };
    Object.keys(expectedReferenceIds).forEach((name) => {
        const key = referenceKey[name];
        expectedReferenceIds[name].forEach((id) => {
            const filter = {};
            filter[key] = id;
            if (!target.getCollection(name).findOne(filter)) throw new Error(`Unexpected reference data in ${name}; business seed refused`);
        });
    });
    const businessCollections = ["khach_hang", "lich_su_hang", "giao_dich", "thanh_toan", "ve", "bien_dong_diem", "doi_thuong", "ghi_nhan_chi_tieu", "lich_su_ton_kho"];
    const occupied = businessCollections.filter((name) => target.getCollection(name).countDocuments({}) !== 0);
    if (occupied.length) throw new Error(`Business collections must be empty; refusing duplicate seed: ${occupied.join(", ")}`);

    const expectedOpeningState = [
        ["hang_thanh_vien", { MaHang: "H01", TenHang: "Dong", TrangThai: "ACTIVE", MucChiTieuToiThieu: NumberDecimal("0"), MucChiTieuToiDa: NumberDecimal("1999999"), TyLeTichDiemVe: 0.05, TyLeTichDiemBapNuoc: 0.03 }],
        ["hang_thanh_vien", { MaHang: "H02", TenHang: "Bac", TrangThai: "ACTIVE", MucChiTieuToiThieu: NumberDecimal("2000000"), MucChiTieuToiDa: NumberDecimal("4999999"), TyLeTichDiemVe: 0.07, TyLeTichDiemBapNuoc: 0.04 }],
        ["hang_thanh_vien", { MaHang: "H03", TenHang: "Vang", TrangThai: "ACTIVE", MucChiTieuToiThieu: NumberDecimal("5000000"), MucChiTieuToiDa: null, TyLeTichDiemVe: 0.10, TyLeTichDiemBapNuoc: 0.05 }],
        ["cum_rap", { MaRap: "RAP_TEST_01", TrangThai: "ACTIVE" }],
        ["phong_chieu", { MaPhong: "PHONG_TEST_01", MaRap: "RAP_TEST_01", TrangThai: "ACTIVE" }],
        ["phim", { MaPhim: "PHIM_TEST_01", TrangThai: "SHOWING" }],
        ["khuyen_mai", { MaKM: "KM_TEST_TICKET", LoaiKM: "GIA_VE", TrangThai: "ACTIVE", HangApDung: ["H01"], NgayBatDau: { $lte: now }, NgayKetThuc: { $gte: now } }],
        ["san_pham", { MaSP: "SP_TEST_BAP", LoaiSP: "BAP", TrangThai: "ACTIVE", SoLuongTon: 100 }],
        ["san_pham", { MaSP: "SP_TEST_NUOC", LoaiSP: "NUOC", TrangThai: "ACTIVE", SoLuongTon: 200 }],
        ["san_pham", { MaSP: "SP_TEST_COMBO", LoaiSP: "COMBO", TrangThai: "ACTIVE", SoLuongTon: 1000 }],
        ["phan_thuong", { MaQua: "QUA_TEST_10", TrangThai: "ACTIVE", SoLuongTon: 100, NgayBatDau: { $lte: now }, NgayKetThuc: { $gte: now } }],
        ["suat_chieu", { MaSuat: "SUAT_TEST_01", TrangThai: "SCHEDULED", DanhSachGhe: { $elemMatch: { MaGhe: "A01", TrangThai: "AVAILABLE" } } }]
    ];
    expectedOpeningState.forEach(([collectionName, filter]) => {
        if (target.getCollection(collectionName).countDocuments(filter) !== 1) {
            throw new Error(`Unexpected opening state for ${collectionName}; no business seed inserted`);
        }
    });

    const indexNames = new Set();
    businessCollections.forEach((name) => target.getCollection(name).getIndexes().forEach((index) => indexNames.add(index.name)));
    ["uq_giao_dich_magd", "uq_thanh_toan_mathanhtoan", "uq_ve_mave", "uq_ve_qrticket",
        "uq_ve_active_seat", "uq_bien_dong_diem_idempotency", "uq_doi_thuong_madoi",
        "uq_chi_tieu_idempotency", "uq_lich_su_hang_ma_lich_su", "uq_lich_su_ton_kho_magd"]
        .forEach((name) => { if (!indexNames.has(name)) throw new Error(`Run 03_create_indexes.js first; missing ${name}`); });

    const day = 24 * 60 * 60 * 1000;
    const finishedAt = [new Date(now.getTime() - 3 * 60000), new Date(now.getTime() - 2 * 60000), new Date(now.getTime() - 60000)];
    const createdAt = finishedAt.map((value) => new Date(value.getTime() - 5 * 60000));
    const year = new Date(now.getTime() + 7 * 60 * 60000).getUTCFullYear();
    const expiry = new Date(now.getTime() + 365 * day);
    const combos = (quantity) => [{
        MaSP: "SP_TEST_COMBO", TenSP: "Combo demo", LoaiSP: "COMBO", SoLuong: quantity,
        DonGia: NumberDecimal("100000"), ThanhTien: NumberDecimal(String(quantity * 100000)),
        ThanhPhan: [
            { MaSP: "SP_TEST_BAP", TenSP: "Bap demo", LoaiSP: "BAP", SoLuong: 1 },
            { MaSP: "SP_TEST_NUOC", TenSP: "Nuoc demo", LoaiSP: "NUOC", SoLuong: 2 }
        ]
    }];
    const transaction = (MaGD, MaKH, LoaiGiaoDich, ChiTietVe, ChiTietCombo, TamTinh, SoTienGiam, SoTienGiamVe, SoTienGiamSanPham, TongTien, MaKM, DiemDuKien, index) => ({
        MaGD, MaKH, LoaiGiaoDich, ChiTietVe, ChiTietCombo,
        TamTinh: NumberDecimal(String(TamTinh)), SoTienGiam: NumberDecimal(String(SoTienGiam)),
        SoTienGiamVe: NumberDecimal(String(SoTienGiamVe)), SoTienGiamSanPham: NumberDecimal(String(SoTienGiamSanPham)),
        TongTien: NumberDecimal(String(TongTien)), MaKM, DiemDuKien,
        TrangThai: "COMPLETED", NgayTao: createdAt[index], NgayHoanTat: finishedAt[index]
    });

    target.khach_hang.insertMany([
        { MaKH: "ADMIN_TEST", HoTen: "Admin Demo", SDT: "09000000001", Email: "admin@cinemaloyalty.test", MatKhauHash: HASH_ADMIN, NgaySinh: null, GioiTinh: null, NgayDangKy: createdAt[0], MaTheThanhVien: "THE_ADMIN_TEST", MaQR: "QR_ADMIN_TEST", MaHangHienTai: "H01", DiemHienTai: 0, TongDiemTichLuy: 0, TongChiTieuNam: NumberDecimal("0"), NamXetHang: year, TrangThai: "ACTIVE", VaiTro: "ADMIN" },
        { MaKH: "KH_TEST_01", HoTen: "Member Demo One", SDT: "09000000002", Email: "member1@cinemaloyalty.test", MatKhauHash: HASH_MEMBER, NgaySinh: null, GioiTinh: null, NgayDangKy: createdAt[0], MaTheThanhVien: "THE_MEMBER_TEST_01", MaQR: "QR_MEMBER_TEST_01", MaHangHienTai: "H01", DiemHienTai: 2, TongDiemTichLuy: 12, TongChiTieuNam: NumberDecimal("210000"), NamXetHang: year, TrangThai: "ACTIVE", VaiTro: "KHACHHANG" },
        { MaKH: "KH_TEST_02", HoTen: "Member Demo Two", SDT: "09000000003", Email: "member2@cinemaloyalty.test", MatKhauHash: HASH_MEMBER, NgaySinh: null, GioiTinh: null, NgayDangKy: createdAt[0], MaTheThanhVien: "THE_MEMBER_TEST_02", MaQR: "QR_MEMBER_TEST_02", MaHangHienTai: "H02", DiemHienTai: 0, TongDiemTichLuy: 0, TongChiTieuNam: NumberDecimal("2000000"), NamXetHang: year, TrangThai: "ACTIVE", VaiTro: "KHACHHANG" },
        { MaKH: "KH_TEST_03", HoTen: "Member Demo Three", SDT: "09000000004", Email: "member3@cinemaloyalty.test", MatKhauHash: HASH_MEMBER, NgaySinh: null, GioiTinh: null, NgayDangKy: createdAt[0], MaTheThanhVien: "THE_MEMBER_TEST_03", MaQR: "QR_MEMBER_TEST_03", MaHangHienTai: "H03", DiemHienTai: 0, TongDiemTichLuy: 0, TongChiTieuNam: NumberDecimal("5000000"), NamXetHang: year, TrangThai: "ACTIVE", VaiTro: "KHACHHANG" }
    ]);

    target.giao_dich.insertMany([
        transaction("GD_TEST_01", "KH_TEST_01", "HON_HOP",
            [{ MaVe: "VE_TEST_01", MaSuat: "SUAT_TEST_01", MaGhe: "A01", LoaiGhe: "STANDARD", GiaVe: NumberDecimal("120000") }],
            combos(1), 220000, 10000, 10000, 0, 210000, "KM_TEST_TICKET", 0, 0),
        transaction("GD_TEST_02", "KH_TEST_02", "MUA_COMBO", [], combos(20), 2000000, 0, 0, 0, 2000000, null, 0, 1),
        transaction("GD_TEST_03", "KH_TEST_03", "MUA_COMBO", [], combos(50), 5000000, 0, 0, 0, 5000000, null, 0, 2)
    ]);
    target.thanh_toan.insertMany([
        { MaThanhToan: "TT_TEST_01", MaGD: "GD_TEST_01", MaKH: "KH_TEST_01", PhuongThuc: "DEV_MOCK", SoTien: NumberDecimal("210000"), MaGiaoDichMoMo: "DEV_MOCK_TT_TEST_01", TrangThai: "SUCCESS", ThoiGianTao: createdAt[0], ThoiGianThanhToan: finishedAt[0], NoiDung: "DEV_MOCK seed only", CanDoiSoat: false, LyDoDoiSoat: null, NgayKiemTraTrangThaiMoMo: null },
        { MaThanhToan: "TT_TEST_02", MaGD: "GD_TEST_02", MaKH: "KH_TEST_02", PhuongThuc: "DEV_MOCK", SoTien: NumberDecimal("2000000"), MaGiaoDichMoMo: "DEV_MOCK_TT_TEST_02", TrangThai: "SUCCESS", ThoiGianTao: createdAt[1], ThoiGianThanhToan: finishedAt[1], NoiDung: "DEV_MOCK seed only", CanDoiSoat: false, LyDoDoiSoat: null, NgayKiemTraTrangThaiMoMo: null },
        { MaThanhToan: "TT_TEST_03", MaGD: "GD_TEST_03", MaKH: "KH_TEST_03", PhuongThuc: "DEV_MOCK", SoTien: NumberDecimal("5000000"), MaGiaoDichMoMo: "DEV_MOCK_TT_TEST_03", TrangThai: "SUCCESS", ThoiGianTao: createdAt[2], ThoiGianThanhToan: finishedAt[2], NoiDung: "DEV_MOCK seed only", CanDoiSoat: false, LyDoDoiSoat: null, NgayKiemTraTrangThaiMoMo: null }
    ]);
    target.ve.insertOne({ MaVe: "VE_TEST_01", MaGD: "GD_TEST_01", MaKH: "KH_TEST_01", MaSuat: "SUAT_TEST_01", MaPhim: "PHIM_TEST_01", MaRap: "RAP_TEST_01", MaPhong: "PHONG_TEST_01", MaGhe: "A01", GiaVe: NumberDecimal("120000"), MaQRTicket: "QR_TICKET_TEST_01", TrangThai: "VALID", NgayPhatHanh: finishedAt[0], NgaySuDung: null });

    target.bien_dong_diem.insertMany([
        { MaLedger: "LD_TEST_EARN_01", MaKH: "KH_TEST_01", MaGD: "GD_TEST_01", MaDoi: null, Loai: "EARN", SoDiem: 12, NgayPhatSinh: finishedAt[0], NgayHetHan: null, LyDo: "Tich diem giao dich GD_TEST_01; 110000 VND / 10000 VND moi diem * (1 + 0.05)", TrangThai: "POSTED", IdempotencyKey: "EARN:GD_TEST_01" },
        { MaLedger: "LD_TEST_REDEEM_01", MaKH: "KH_TEST_01", MaGD: null, MaDoi: `DOI_${REDEEM_DIGEST}`, Loai: "REDEEM", SoDiem: -10, NgayPhatSinh: now, NgayHetHan: null, LyDo: "Doi phan thuong demo QUA_TEST_10", TrangThai: "POSTED", IdempotencyKey: `REDEEM:${REDEEM_DIGEST}` }
    ]);
    target.doi_thuong.insertOne({ MaDoi: `DOI_${REDEEM_DIGEST}`, MaKH: "KH_TEST_01", MaQua: "QUA_TEST_10", SoLuong: 1, DiemSuDung: 10, MaVoucher: null, NgayDoi: now, HanSuDung: new Date(now.getTime() + 365 * day), TrangThai: "COMPLETED" });
    target.lich_su_hang.insertMany([
        { MaLichSu: H02_HISTORY, MaKH: "KH_TEST_02", MaHangCu: "H01", MaHangMoi: "H02", NgayThayDoi: finishedAt[1], NamXetHang: year, LyDo: "Xet hang demo tu chi tieu giao dich GD_TEST_02" },
        { MaLichSu: H03_HISTORY, MaKH: "KH_TEST_03", MaHangCu: "H01", MaHangMoi: "H03", NgayThayDoi: finishedAt[2], NamXetHang: year, LyDo: "Xet hang demo tu chi tieu giao dich GD_TEST_03" }
    ]);
    target.ghi_nhan_chi_tieu.insertMany([
        { IdempotencyKey: "SPEND:GD_TEST_01", MaGD: "GD_TEST_01", MaThanhToan: "TT_TEST_01", MaKH: "KH_TEST_01", NamChiTieu: year, SoTien: NumberDecimal("210000"), LoaiSuKien: "SPEND", TrangThai: "POSTED", DaXacMinh: true, MaHangCu: "H01", MaHangMoi: "H01", TongChiTieuSau: NumberDecimal("210000"), NamXetHang: year, MaLichSu: null, ChiTieuLichSu: true, ChiTieuCuNam: false, LockToken: null, LockUntil: null, CanDoiSoatRefund: false, RefundCheckedAt: null, LyDoDoiSoat: null, NgayPhatSinh: finishedAt[0], NgayTao: finishedAt[0], NgayCapNhat: finishedAt[0] },
        { IdempotencyKey: "SPEND:GD_TEST_02", MaGD: "GD_TEST_02", MaThanhToan: "TT_TEST_02", MaKH: "KH_TEST_02", NamChiTieu: year, SoTien: NumberDecimal("2000000"), LoaiSuKien: "SPEND", TrangThai: "POSTED", DaXacMinh: true, MaHangCu: "H01", MaHangMoi: "H02", TongChiTieuSau: NumberDecimal("2000000"), NamXetHang: year, MaLichSu: H02_HISTORY, ChiTieuLichSu: true, ChiTieuCuNam: false, LockToken: null, LockUntil: null, CanDoiSoatRefund: false, RefundCheckedAt: null, LyDoDoiSoat: null, NgayPhatSinh: finishedAt[1], NgayTao: finishedAt[1], NgayCapNhat: finishedAt[1] },
        { IdempotencyKey: "SPEND:GD_TEST_03", MaGD: "GD_TEST_03", MaThanhToan: "TT_TEST_03", MaKH: "KH_TEST_03", NamChiTieu: year, SoTien: NumberDecimal("5000000"), LoaiSuKien: "SPEND", TrangThai: "POSTED", DaXacMinh: true, MaHangCu: "H01", MaHangMoi: "H03", TongChiTieuSau: NumberDecimal("5000000"), NamXetHang: year, MaLichSu: H03_HISTORY, ChiTieuLichSu: true, ChiTieuCuNam: false, LockToken: null, LockUntil: null, CanDoiSoatRefund: false, RefundCheckedAt: null, LyDoDoiSoat: null, NgayPhatSinh: finishedAt[2], NgayTao: finishedAt[2], NgayCapNhat: finishedAt[2] }
    ]);
    target.lich_su_ton_kho.insertMany([
        { MaGD: "GD_TEST_01", MaKH: "KH_TEST_01", DanhSachTruKho: [{ MaSP: "SP_TEST_BAP", SoLuong: 1, TrangThai: "APPLIED" }, { MaSP: "SP_TEST_NUOC", SoLuong: 2, TrangThai: "APPLIED" }], TrangThai: "POSTED", LyDoDoiSoat: null, NgayTao: finishedAt[0], NgayCapNhat: finishedAt[0] },
        { MaGD: "GD_TEST_02", MaKH: "KH_TEST_02", DanhSachTruKho: [{ MaSP: "SP_TEST_BAP", SoLuong: 20, TrangThai: "APPLIED" }, { MaSP: "SP_TEST_NUOC", SoLuong: 40, TrangThai: "APPLIED" }], TrangThai: "POSTED", LyDoDoiSoat: null, NgayTao: finishedAt[1], NgayCapNhat: finishedAt[1] },
        { MaGD: "GD_TEST_03", MaKH: "KH_TEST_03", DanhSachTruKho: [{ MaSP: "SP_TEST_BAP", SoLuong: 50, TrangThai: "APPLIED" }, { MaSP: "SP_TEST_NUOC", SoLuong: 100, TrangThai: "APPLIED" }], TrangThai: "POSTED", LyDoDoiSoat: null, NgayTao: finishedAt[2], NgayCapNhat: finishedAt[2] }
    ]);

    const seatUpdate = target.suat_chieu.updateOne(
        { MaSuat: "SUAT_TEST_01", DanhSachGhe: { $elemMatch: { MaGhe: "A01", TrangThai: "AVAILABLE" } } },
        { $set: { "DanhSachGhe.$.TrangThai": "BOOKED", "DanhSachGhe.$.MaGDGiuCho": null, "DanhSachGhe.$.ThoiGianGiuCho": null } }
    );
    if (seatUpdate.modifiedCount !== 1) throw new Error("Could not mark seeded paid seat BOOKED; verify and repair test data manually");
    const bapUpdate = target.san_pham.updateOne({ MaSP: "SP_TEST_BAP", SoLuongTon: 100 }, { $inc: { SoLuongTon: -71 } });
    const nuocUpdate = target.san_pham.updateOne({ MaSP: "SP_TEST_NUOC", SoLuongTon: 200 }, { $inc: { SoLuongTon: -142 } });
    const rewardUpdate = target.phan_thuong.updateOne({ MaQua: "QUA_TEST_10", SoLuongTon: 100 }, { $inc: { SoLuongTon: -1 } });
    if (bapUpdate.modifiedCount !== 1 || nuocUpdate.modifiedCount !== 1 || rewardUpdate.modifiedCount !== 1) {
        throw new Error("Could not apply seeded stock movements; database may be partially seeded; do not rerun blindly");
    }

    printjson({ database: target.getName(), insertedBusinessDocuments: { khach_hang: 4, giao_dich: 3, thanh_toan: 3, ve: 1, bien_dong_diem: 2, doi_thuong: 1, lich_su_hang: 2, ghi_nhan_chi_tieu: 3, lich_su_ton_kho: 3 }, total: 22, stockAfterSeed: { SP_TEST_BAP: 29, SP_TEST_NUOC: 58, QUA_TEST_10: 99 }, vndPerPoint: VND_PER_POINT, earnedPoints: 12 });
})();
// ===== END 05_seed_business_data.js =====

