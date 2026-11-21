const HangThanhVien = require("../models/HangThanhVien");
const KhachHang = require("../models/KhachHang");
const LichSuHang = require("../models/LichSuHang");

const TIER_NAMES = ["Dong", "Bac", "Vang"];
const TIER_STATUSES = ["ACTIVE", "INACTIVE"];

const validationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const normalizeDecimal = (value, field, allowNull = false) => {
    if (value === null && allowNull) return null;
    const text = typeof value === "number" ? String(value) : value;
    if (typeof text !== "string" || !/^\+?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
        throw validationError(`${field} phai la so thap phan khong am${allowNull ? " hoac null" : ""}`);
    }
    return text;
};

const compareDecimal = (left, right) => {
    const parts = [left, right].map((value) => {
        const [whole, fraction = ""] = String(value).replace(/^\+/, "").split(".");
        return { whole: whole || "0", fraction };
    });
    const scale = Math.max(...parts.map((part) => part.fraction.length));
    const integers = parts.map(({ whole, fraction }) => BigInt(`${whole}${fraction.padEnd(scale, "0")}`));
    return integers[0] < integers[1] ? -1 : integers[0] > integers[1] ? 1 : 0;
};

const normalizeRate = (value, field) => {
    const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
    if (!Number.isFinite(number) || number < 0) throw validationError(`${field} phai la so khong am`);
    return number;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (filters = {}) => {
    const parse = (value, fallback, field) => {
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^\d+$/.test(value)) throw validationError(`${field} phai la so nguyen duong`);
        const number = Number(value);
        if (!Number.isSafeInteger(number) || number < 1) throw validationError(`${field} phai la so nguyen duong`);
        return number;
    };
    const page = parse(filters.page, 1, "page");
    const limit = Math.min(parse(filters.limit, 10, "limit"), 100);
    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip)) throw validationError("page vuot qua gioi han");
    return { page, limit, skip };
};

const getAllTiers = async (filters = {}, admin = false) => {
    const pagination = parsePagination(filters);
    const query = {};
    if (!admin) query.TrangThai = "ACTIVE";
    else if (filters.TrangThai !== undefined) {
        if (!TIER_STATUSES.includes(filters.TrangThai)) throw validationError("TrangThai khong hop le");
        query.TrangThai = filters.TrangThai;
    }
    if (filters.keyword !== undefined) {
        if (typeof filters.keyword !== "string" || filters.keyword.length > 100) throw validationError("keyword khong hop le");
        const keyword = filters.keyword.trim();
        if (keyword) {
            const regex = new RegExp(escapeRegex(keyword), "i");
            query.$or = [{ MaHang: regex }, { TenHang: regex }];
        }
    }
    const [items, total] = await Promise.all([
        HangThanhVien.find(query).sort({ MaHang: 1 }).skip(pagination.skip).limit(pagination.limit).lean(),
        HangThanhVien.countDocuments(query)
    ]);
    return { items, pagination: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } };
};

const getTierById = async (MaHang, admin = false) => {
    return HangThanhVien.findOne(admin ? { MaHang } : { MaHang, TrangThai: "ACTIVE" }).lean();
};

const validateTierInput = (input, creating) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw validationError("Du lieu hang thanh vien phai la object");
    const allowed = creating
        ? ["MaHang", "TenHang", "MucChiTieuToiThieu", "MucChiTieuToiDa", "TyLeTichDiemVe", "TyLeTichDiemBapNuoc", "QuyenLoi", "MoTa", "TrangThai"]
        : ["TenHang", "MucChiTieuToiThieu", "MucChiTieuToiDa", "TyLeTichDiemVe", "TyLeTichDiemBapNuoc", "QuyenLoi", "MoTa"];
    const unknown = Object.keys(input).filter((field) => !allowed.includes(field));
    if (unknown.length) throw validationError(`Truong khong duoc ho tro: ${unknown.join(", ")}`);
    if (!creating && Object.keys(input).length === 0) throw validationError("Khong co thong tin hop le de cap nhat");

    const data = { ...input };
    if (creating || data.MaHang !== undefined) {
        if (typeof data.MaHang !== "string" || !data.MaHang.trim()) throw validationError("MaHang khong hop le");
        data.MaHang = data.MaHang.trim();
    }
    if (creating || data.TenHang !== undefined) {
        if (!TIER_NAMES.includes(data.TenHang)) throw validationError("TenHang khong hop le");
    }
    for (const field of ["MucChiTieuToiThieu", "MucChiTieuToiDa"]) {
        if (creating && field === "MucChiTieuToiThieu" || data[field] !== undefined) {
            data[field] = normalizeDecimal(data[field], field, field === "MucChiTieuToiDa");
        }
    }
    for (const field of ["TyLeTichDiemVe", "TyLeTichDiemBapNuoc"]) {
        if (creating || data[field] !== undefined) data[field] = normalizeRate(data[field], field);
    }
    if (data.QuyenLoi !== undefined) {
        if (!Array.isArray(data.QuyenLoi) || data.QuyenLoi.some((item) => typeof item !== "string")) {
            throw validationError("QuyenLoi phai la danh sach chuoi");
        }
        data.QuyenLoi = data.QuyenLoi.map((item) => item.trim());
    }
    if (data.MoTa !== undefined && data.MoTa !== null && typeof data.MoTa !== "string") {
        throw validationError("MoTa phai la chuoi hoac null");
    }
    if (creating && !TIER_STATUSES.includes(data.TrangThai)) throw validationError("TrangThai khong hop le");
    return data;
};

const ensureThresholds = (minimum, maximum) => {
    if (maximum !== null && maximum !== undefined && compareDecimal(minimum, maximum) > 0) {
        throw validationError("MucChiTieuToiDa phai lon hon hoac bang MucChiTieuToiThieu");
    }
};

const createTier = async (input) => {
    const data = validateTierInput(input, true);
    data.MaHang = data.MaHang.trim();
    data.TenHang = data.TenHang.trim();
    data.MucChiTieuToiDa ??= null;
    data.QuyenLoi ??= [];
    data.MoTa ??= null;
    ensureThresholds(data.MucChiTieuToiThieu, data.MucChiTieuToiDa);

    if (await HangThanhVien.findOne({ MaHang: data.MaHang })) {
        const error = new Error("Ma hang thanh vien da ton tai");
        error.statusCode = 409;
        throw error;
    }
    return HangThanhVien.create(data);
};

const updateTier = async (MaHang, input) => {
    const data = validateTierInput(input, false);
    if (data.TenHang !== undefined) data.TenHang = data.TenHang.trim();
    const current = await HangThanhVien.findOne({ MaHang });
    if (!current) return null;
    const minimum = data.MucChiTieuToiThieu ?? current.MucChiTieuToiThieu.toString();
    const maximum = data.MucChiTieuToiDa !== undefined ? data.MucChiTieuToiDa : current.MucChiTieuToiDa?.toString() ?? null;
    ensureThresholds(minimum, maximum);
    return HangThanhVien.findOneAndUpdate({ MaHang }, { $set: data }, { new: true, runValidators: true });
};

const updateTierStatus = async (MaHang, TrangThai) => {
    if (!TIER_STATUSES.includes(TrangThai)) throw validationError("TrangThai khong hop le");
    return HangThanhVien.findOneAndUpdate({ MaHang }, { $set: { TrangThai } }, { new: true, runValidators: true });
};

const getCustomerTierHistory = async (MaKH, filters = {}) => {
    const pagination = parsePagination(filters);
    const query = { MaKH };
    const [items, total] = await Promise.all([
        LichSuHang.find(query).select("MaLichSu MaKH MaHangCu MaHangMoi NgayThayDoi NamXetHang LyDo -_id")
            .sort({ NgayThayDoi: -1, MaLichSu: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
        LichSuHang.countDocuments(query)
    ]);
    return { items, pagination: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } };
};

const getAllCustomerTierHistory = async (MaKH, filters = {}) => {
    const customer = await KhachHang.findOne({ MaKH }).select("MaKH -_id").lean();
    if (!customer) return null;
    return getCustomerTierHistory(MaKH, filters);
};

module.exports = {
    getAllTiers,
    getTierById,
    createTier,
    updateTier,
    updateTierStatus,
    getCustomerTierHistory,
    getAllCustomerTierHistory
};
