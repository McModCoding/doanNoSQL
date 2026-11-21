const SanPham = require("../models/SanPham");

const PRODUCT_TYPES = ["BAP", "NUOC", "SNACK", "COMBO"];
const PRODUCT_STATUSES = ["ACTIVE", "INACTIVE"];
const PUBLIC_FIELDS = "MaSP TenSP LoaiSP MoTa GiaBan HinhAnh TrangThai";
const ADMIN_FIELDS = `${PUBLIC_FIELDS} ThanhPhan SoLuongTon`;

const createValidationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseListOptions = (filters = {}, admin = false) => {
    const parseInteger = (value, fallback, name) => {
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^\d+$/.test(value)) {
            throw createValidationError(`${name} phai la so nguyen duong`);
        }
        const parsed = Number(value);
        if (!Number.isSafeInteger(parsed) || parsed < 1) {
            throw createValidationError(`${name} phai la so nguyen duong`);
        }
        return parsed;
    };

    const page = parseInteger(filters.page, 1, "page");
    const limit = Math.min(parseInteger(filters.limit, 10, "limit"), 100);
    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip)) throw createValidationError("page vuot qua gioi han");

    const query = {};
    if (!admin) query.TrangThai = "ACTIVE";
    else if (filters.status !== undefined) {
        if (!PRODUCT_STATUSES.includes(filters.status)) throw createValidationError("status khong hop le");
        query.TrangThai = filters.status;
    }

    if (filters.type !== undefined) {
        if (!PRODUCT_TYPES.includes(filters.type)) throw createValidationError("type khong hop le");
        query.LoaiSP = filters.type;
    }
    if (filters.keyword !== undefined) {
        if (typeof filters.keyword !== "string" || filters.keyword.length > 100) {
            throw createValidationError("keyword khong hop le");
        }
        const keyword = filters.keyword.trim();
        if (keyword) {
            const regex = new RegExp(escapeRegex(keyword), "i");
            query.$or = [{ MaSP: regex }, { TenSP: regex }];
        }
    }

    return { query, page, limit, skip };
};

const listProducts = async (filters = {}, admin = false) => {
    const options = parseListOptions(filters, admin);
    const fields = admin ? ADMIN_FIELDS : PUBLIC_FIELDS;
    const [items, total] = await Promise.all([
        SanPham.find(options.query).select(fields).sort({ TenSP: 1, MaSP: 1 })
            .skip(options.skip).limit(options.limit).lean(),
        SanPham.countDocuments(options.query)
    ]);

    return {
        items: items.map((item) => serializeProduct(item, admin)),
        pagination: {
            page: options.page,
            limit: options.limit,
            total,
            totalPages: Math.ceil(total / options.limit)
        }
    };
};

const serializeProduct = (product, admin = false) => {
    if (!product) return null;
    const result = {
        MaSP: product.MaSP,
        TenSP: product.TenSP,
        LoaiSP: product.LoaiSP,
        MoTa: product.MoTa ?? null,
        GiaBan: product.GiaBan?.toString?.() ?? product.GiaBan,
        HinhAnh: product.HinhAnh ?? null,
        TrangThai: product.TrangThai
    };
    if (admin) {
        result.ThanhPhan = product.ThanhPhan || [];
        result.SoLuongTon = product.SoLuongTon;
    }
    return result;
};

const getProductById = async (MaSP, admin = false) => {
    const query = admin ? { MaSP } : { MaSP, TrangThai: "ACTIVE" };
    const product = await SanPham.findOne(query)
        .select(admin ? ADMIN_FIELDS : PUBLIC_FIELDS)
        .lean();
    return serializeProduct(product, admin);
};

const assertObject = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createValidationError("Du lieu san pham phai la object");
    }
};

const rejectUnknownFields = (data, allowedFields) => {
    const unknown = Object.keys(data).filter((field) => !allowedFields.includes(field));
    if (unknown.length) throw createValidationError(`Truong khong duoc ho tro: ${unknown.join(", ")}`);
};

const validateString = (value, field, required = false) => {
    if (value === undefined && !required) return;
    if (typeof value !== "string" || (required && !value.trim())) {
        throw createValidationError(`${field} khong hop le`);
    }
};

const validateMoney = (value, field = "GiaBan") => {
    const text = typeof value === "number" ? String(value) : value;
    if (typeof text !== "string" || !/^\d+(?:\.\d+)?$/.test(text)) {
        throw createValidationError(`${field} phai la so thap phan khong am`);
    }
    return text;
};

const validateComponents = (components) => {
    if (!Array.isArray(components)) throw createValidationError("ThanhPhan phai la danh sach");
    for (const [index, component] of components.entries()) {
        assertObject(component);
        rejectUnknownFields(component, ["MaSP", "SoLuong"]);
        validateString(component.MaSP, `ThanhPhan[${index}].MaSP`, true);
        if (!Number.isSafeInteger(component.SoLuong) || component.SoLuong < 1) {
            throw createValidationError(`ThanhPhan[${index}].SoLuong phai la so nguyen lon hon 0`);
        }
    }
};

const validateProductData = (data, creating) => {
    assertObject(data);
    const allowedFields = creating
        ? ["MaSP", "TenSP", "LoaiSP", "MoTa", "GiaBan", "ThanhPhan", "SoLuongTon", "HinhAnh", "TrangThai"]
        : ["TenSP", "LoaiSP", "MoTa", "GiaBan", "ThanhPhan", "HinhAnh"];
    rejectUnknownFields(data, allowedFields);
    if (!creating && Object.keys(data).length === 0) {
        throw createValidationError("Khong co thong tin hop le de cap nhat");
    }

    if (creating) validateString(data.MaSP, "MaSP", true);
    if (creating || data.TenSP !== undefined) validateString(data.TenSP, "TenSP", true);
    if (creating || data.LoaiSP !== undefined) {
        if (!PRODUCT_TYPES.includes(data.LoaiSP)) throw createValidationError("LoaiSP khong hop le");
    }
    if (creating || data.GiaBan !== undefined) data.GiaBan = validateMoney(data.GiaBan);
    if (data.MoTa !== undefined && data.MoTa !== null) validateString(data.MoTa, "MoTa");
    if (data.HinhAnh !== undefined && data.HinhAnh !== null) validateString(data.HinhAnh, "HinhAnh");
    if (data.ThanhPhan !== undefined) validateComponents(data.ThanhPhan);

    if (creating) {
        if (!Number.isSafeInteger(data.SoLuongTon) || data.SoLuongTon < 0) {
            throw createValidationError("SoLuongTon phai la so nguyen khong am");
        }
        if (!PRODUCT_STATUSES.includes(data.TrangThai)) throw createValidationError("TrangThai khong hop le");
    }
    return data;
};

const createProduct = async (input) => {
    const data = validateProductData({ ...input }, true);
    const existing = await SanPham.findOne({ MaSP: data.MaSP.trim() });
    if (existing) {
        const error = new Error("MaSP da ton tai");
        error.statusCode = 409;
        throw error;
    }
    data.MaSP = data.MaSP.trim();
    if (data.TenSP) data.TenSP = data.TenSP.trim();
    if (data.ThanhPhan) data.ThanhPhan = data.ThanhPhan.map((part) => ({ ...part, MaSP: part.MaSP.trim() }));
    const product = await SanPham.create(data);
    return serializeProduct(product.toObject(), true);
};

const updateProduct = async (MaSP, input) => {
    const data = validateProductData({ ...input }, false);
    const update = {};
    for (const [field, value] of Object.entries(data)) {
        update[field] = typeof value === "string" ? value.trim() : value;
    }
    const product = await SanPham.findOneAndUpdate(
        { MaSP }, { $set: update }, { new: true, runValidators: true }
    ).select(ADMIN_FIELDS).lean();
    return serializeProduct(product, true);
};

const updateProductStatus = async (MaSP, TrangThai) => {
    if (!PRODUCT_STATUSES.includes(TrangThai)) throw createValidationError("TrangThai khong hop le");
    const product = await SanPham.findOneAndUpdate(
        { MaSP }, { $set: { TrangThai } }, { new: true, runValidators: true }
    ).select(ADMIN_FIELDS).lean();
    return serializeProduct(product, true);
};

module.exports = {
    listProducts,
    getProductById,
    createProduct,
    updateProduct,
    updateProductStatus
};
