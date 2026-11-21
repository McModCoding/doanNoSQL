const KhuyenMai = require("../models/KhuyenMai");

const PROMOTION_TYPES = ["GIAM_GIA", "TANG_DIEM", "GIA_VE"];
const PROMOTION_STATUSES = ["ACTIVE", "INACTIVE"];
const FIELDS = [
    "MaKM", "TenKM", "LoaiKM", "GiaTriKM", "HeSoDiem", "HangApDung",
    "NgayBatDau", "NgayKetThuc", "DieuKienApDung", "TrangThai"
];
const PUBLIC_FIELDS = "MaKM TenKM LoaiKM GiaTriKM HeSoDiem HangApDung NgayBatDau NgayKetThuc TrangThai";
const NON_NEGATIVE_NUMBER = /^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

const validationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value, field) => {
    if (typeof value !== "string" || !value.trim()) {
        throw validationError(`${field} phai la ngay hop le`);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw validationError(`${field} phai la ngay hop le`);
    return date;
};

const parsePagination = (filters) => {
    const parse = (value, fallback, name) => {
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^\d+$/.test(value)) {
            throw validationError(`${name} phai la so nguyen duong`);
        }
        const result = Number(value);
        if (!Number.isSafeInteger(result) || result < 1) {
            throw validationError(`${name} phai la so nguyen duong`);
        }
        return result;
    };
    const page = parse(filters.page, 1, "page");
    const limit = Math.min(parse(filters.limit, 10, "limit"), 100);
    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip)) throw validationError("page vuot qua gioi han");
    return { page, limit, skip };
};

const buildListQuery = (filters = {}, admin = false) => {
    const query = {};
    if (!admin) query.TrangThai = "ACTIVE";
    else if (filters.status !== undefined) {
        if (!PROMOTION_STATUSES.includes(filters.status)) throw validationError("status khong hop le");
        query.TrangThai = filters.status;
    }

    if (filters.type !== undefined) {
        if (!PROMOTION_TYPES.includes(filters.type)) throw validationError("type khong hop le");
        query.LoaiKM = filters.type;
    }
    if (filters.keyword !== undefined) {
        if (typeof filters.keyword !== "string" || filters.keyword.length > 100) {
            throw validationError("keyword khong hop le");
        }
        const keyword = filters.keyword.trim();
        if (keyword) {
            const regex = new RegExp(escapeRegex(keyword), "i");
            query.$or = [{ MaKM: regex }, { TenKM: regex }];
        }
    }

    if (filters.fromDate !== undefined) {
        query.NgayKetThuc = { ...(query.NgayKetThuc || {}), $gte: parseDate(filters.fromDate, "fromDate") };
    }
    if (filters.toDate !== undefined) {
        query.NgayBatDau = { ...(query.NgayBatDau || {}), $lte: parseDate(filters.toDate, "toDate") };
    }
    if (filters.fromDate && filters.toDate) {
        const from = parseDate(filters.fromDate, "fromDate");
        const to = parseDate(filters.toDate, "toDate");
        if (from > to) throw validationError("fromDate khong duoc sau toDate");
    }

    if (!admin) {
        const now = new Date();
        query.NgayBatDau = { ...(query.NgayBatDau || {}), $lte: now };
        query.NgayKetThuc = { ...(query.NgayKetThuc || {}), $gte: now };
    } else if (filters.effective !== undefined) {
        const now = new Date();
        if (!["current", "upcoming", "expired"].includes(filters.effective)) {
            throw validationError("effective khong hop le");
        }
        if (filters.status !== undefined && filters.status !== "ACTIVE") {
            throw validationError("effective chi ap dung cho status ACTIVE");
        }
        query.TrangThai = "ACTIVE";
        if (filters.effective === "current") {
            query.NgayBatDau = { ...(query.NgayBatDau || {}), $lte: now };
            query.NgayKetThuc = { ...(query.NgayKetThuc || {}), $gte: now };
        } else if (filters.effective === "upcoming") {
            query.NgayBatDau = { ...(query.NgayBatDau || {}), $gt: now };
        } else {
            query.NgayKetThuc = { ...(query.NgayKetThuc || {}), $lt: now };
        }
    }
    return query;
};

const toPublic = (promotion) => {
    if (!promotion) return null;
    const output = {};
    for (const field of PUBLIC_FIELDS.split(" ")) {
        const value = promotion[field];
        output[field] = field === "GiaTriKM" || field === "HeSoDiem"
            ? (value?.toString?.() ?? value ?? null)
            : value;
    }
    return output;
};

const toAdmin = (promotion) => {
    if (!promotion) return null;
    const output = toPublic(promotion);
    output.DieuKienApDung = promotion.DieuKienApDung ?? null;
    return output;
};

const listPromotions = async (filters = {}, admin = false) => {
    const pagination = parsePagination(filters);
    const query = buildListQuery(filters, admin);
    const [rows, total] = await Promise.all([
        KhuyenMai.find(query).select(admin ? `${PUBLIC_FIELDS} DieuKienApDung` : PUBLIC_FIELDS)
            .sort({ NgayBatDau: -1, MaKM: 1 }).skip(pagination.skip).limit(pagination.limit).lean(),
        KhuyenMai.countDocuments(query)
    ]);
    return {
        items: rows.map(admin ? toAdmin : toPublic),
        pagination: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) }
    };
};

const getPromotionById = async (MaKM, admin = false) => {
    const query = admin ? { MaKM } : {
        MaKM,
        TrangThai: "ACTIVE",
        NgayBatDau: { $lte: new Date() },
        NgayKetThuc: { $gte: new Date() }
    };
    const promotion = await KhuyenMai.findOne(query)
        .select(admin ? `${PUBLIC_FIELDS} DieuKienApDung` : PUBLIC_FIELDS).lean();
    return admin ? toAdmin(promotion) : toPublic(promotion);
};

const normalizePromotionInput = (input, creating) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw validationError("Du lieu khuyen mai phai la object");
    }
    const allowed = creating ? FIELDS : FIELDS.filter((field) => field !== "MaKM");
    const unknown = Object.keys(input).filter((field) => !allowed.includes(field));
    if (unknown.length) throw validationError(`Truong khong duoc ho tro: ${unknown.join(", ")}`);
    if (!creating && Object.keys(input).length === 0) throw validationError("Khong co thong tin hop le de cap nhat");

    const data = { ...input };
    for (const field of ["MaKM", "TenKM"]) {
        if ((creating && ["MaKM", "TenKM"].includes(field)) || data[field] !== undefined) {
            if (typeof data[field] !== "string" || !data[field].trim()) throw validationError(`${field} khong hop le`);
            data[field] = data[field].trim();
        }
    }
    if (creating && !PROMOTION_TYPES.includes(data.LoaiKM) || data.LoaiKM !== undefined && !PROMOTION_TYPES.includes(data.LoaiKM)) {
        throw validationError("LoaiKM khong hop le");
    }
    if (creating && data.GiaTriKM === undefined || data.GiaTriKM !== undefined) {
        const value = typeof data.GiaTriKM === "number" ? String(data.GiaTriKM) : data.GiaTriKM;
        if (typeof value !== "string" || !NON_NEGATIVE_NUMBER.test(value)) {
            throw validationError("GiaTriKM phai la so thap phan khong am");
        }
        data.GiaTriKM = value;
    }
    if (data.HeSoDiem !== undefined && data.HeSoDiem !== null) {
        if (typeof data.HeSoDiem !== "number" &&
            (typeof data.HeSoDiem !== "string" || !NON_NEGATIVE_NUMBER.test(data.HeSoDiem))) {
            throw validationError("HeSoDiem phai la so khong am hoac null");
        }
        const factor = Number(data.HeSoDiem);
        if (!Number.isFinite(factor) || factor < 0) throw validationError("HeSoDiem phai la so khong am hoac null");
        data.HeSoDiem = factor;
    }
    if (data.HangApDung !== undefined) {
        if (!Array.isArray(data.HangApDung) || data.HangApDung.some((item) => typeof item !== "string" || !item.trim())) {
            throw validationError("HangApDung phai la danh sach chuoi khong rong");
        }
        data.HangApDung = data.HangApDung.map((item) => item.trim());
    }
    for (const field of ["NgayBatDau", "NgayKetThuc"]) {
        if (creating || data[field] !== undefined) data[field] = parseDate(data[field], field);
    }
    if (creating && !PROMOTION_STATUSES.includes(data.TrangThai) || data.TrangThai !== undefined && !PROMOTION_STATUSES.includes(data.TrangThai)) {
        throw validationError("TrangThai khong hop le");
    }
    return data;
};

const ensureValidDateRange = (start, end) => {
    if (start > end) throw validationError("NgayBatDau phai nho hon hoac bang NgayKetThuc");
};

const createPromotion = async (input) => {
    const data = normalizePromotionInput(input, true);
    ensureValidDateRange(data.NgayBatDau, data.NgayKetThuc);
    if (await KhuyenMai.findOne({ MaKM: data.MaKM })) {
        const error = new Error("MaKM da ton tai");
        error.statusCode = 409;
        throw error;
    }
    return toAdmin((await KhuyenMai.create(data)).toObject());
};

const updatePromotion = async (MaKM, input) => {
    const data = normalizePromotionInput(input, false);
    const current = await KhuyenMai.findOne({ MaKM });
    if (!current) return null;
    const start = data.NgayBatDau ?? current.NgayBatDau;
    const end = data.NgayKetThuc ?? current.NgayKetThuc;
    ensureValidDateRange(start, end);
    const promotion = await KhuyenMai.findOneAndUpdate(
        { MaKM }, { $set: data }, { new: true, runValidators: true }
    ).select(`${PUBLIC_FIELDS} DieuKienApDung`).lean();
    return toAdmin(promotion);
};

const updatePromotionStatus = async (MaKM, TrangThai) => {
    if (!PROMOTION_STATUSES.includes(TrangThai)) throw validationError("TrangThai khong hop le");
    const promotion = await KhuyenMai.findOneAndUpdate(
        { MaKM }, { $set: { TrangThai } }, { new: true, runValidators: true }
    ).select(`${PUBLIC_FIELDS} DieuKienApDung`).lean();
    return toAdmin(promotion);
};

module.exports = { listPromotions, getPromotionById, createPromotion, updatePromotion, updatePromotionStatus };
