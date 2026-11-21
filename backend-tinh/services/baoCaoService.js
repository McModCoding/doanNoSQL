const mongoose = require("mongoose");
const GiaoDich = require("../models/GiaoDich");
const Ve = require("../models/Ve");
const KhachHang = require("../models/KhachHang");

const TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY_MS = 24 * 60 * 60 * 1000;
const DECIMAL_ZERO = mongoose.Types.Decimal128.fromString("0");

const validationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const parseDateOnly = (value, field) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw validationError(`${field} phai co dinh dang YYYY-MM-DD`);
    }
    const utc = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(utc.getTime()) || utc.toISOString().slice(0, 10) !== value) {
        throw validationError(`${field} khong phai ngay hop le`);
    }
    // Vietnam is UTC+07:00. Construct explicit local-day boundaries, independent of host TZ.
    return new Date(`${value}T00:00:00.000+07:00`);
};

const parseDateRange = (filters = {}) => {
    const allowed = new Set(["fromDate", "toDate", "page", "limit"]);
    const unknown = Object.keys(filters).filter((key) => !allowed.has(key));
    if (unknown.length) throw validationError(`Tham so khong duoc ho tro: ${unknown.join(", ")}`);
    const from = filters.fromDate === undefined ? null : parseDateOnly(filters.fromDate, "fromDate");
    const toDay = filters.toDate === undefined ? null : parseDateOnly(filters.toDate, "toDate");
    if (from && toDay && from > toDay) throw validationError("fromDate khong duoc sau toDate");
    const match = {};
    if (from || toDay) {
        match.NgayHoanTat = {};
        if (from) match.NgayHoanTat.$gte = from;
        if (toDay) match.NgayHoanTat.$lt = new Date(toDay.getTime() + DAY_MS);
    }
    return { match, from, toDay };
};

const parsePagination = (filters = {}, defaultLimit = 20) => {
    const parse = (value, fallback, name) => {
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^\d+$/.test(value)) throw validationError(`${name} phai la so nguyen duong`);
        const parsed = Number(value);
        if (!Number.isSafeInteger(parsed) || parsed < 1) throw validationError(`${name} phai la so nguyen duong`);
        return parsed;
    };
    const page = parse(filters.page, 1, "page");
    const limit = Math.min(parse(filters.limit, defaultLimit, "limit"), 100);
    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip)) throw validationError("page vuot qua gioi han");
    return { page, limit, skip };
};

const paidCompletedTransactionStages = (dateMatch = {}) => [
    { $match: { TrangThai: "COMPLETED", NgayHoanTat: { $type: "date", ...(dateMatch.NgayHoanTat || {}) } } },
    {
        $lookup: {
            from: "thanh_toan",
            let: { maGD: "$MaGD", maKH: "$MaKH", amount: "$TongTien" },
            pipeline: [
                { $match: { $expr: { $and: [
                    { $eq: ["$MaGD", "$$maGD"] },
                    { $eq: ["$MaKH", "$$maKH"] },
                    { $eq: ["$TrangThai", "SUCCESS"] },
                    { $eq: ["$SoTien", "$$amount"] }
                ] } } },
                { $limit: 1 },
                { $project: { _id: 1 } }
            ],
            as: "_successfulPayment"
        }
    },
    { $match: { "_successfulPayment.0": { $exists: true } } },
    { $set: { _reportAmount: { $convert: { input: "$TongTien", to: "decimal", onError: null, onNull: null } } } },
    { $match: { _reportAmount: { $ne: null, $gte: DECIMAL_ZERO } } }
];

const paidTicketStages = (dateMatch = {}) => [
    { $lookup: { from: "giao_dich", localField: "MaGD", foreignField: "MaGD", as: "_transaction" } },
    { $unwind: "$_transaction" },
    { $match: {
        "_transaction.TrangThai": "COMPLETED",
        "_transaction.NgayHoanTat": { $type: "date", ...(dateMatch.NgayHoanTat || {}) }
    } },
    {
        $lookup: {
            from: "thanh_toan",
            let: { maGD: "$_transaction.MaGD", maKH: "$_transaction.MaKH", amount: "$_transaction.TongTien" },
            pipeline: [
                { $match: { $expr: { $and: [
                    { $eq: ["$MaGD", "$$maGD"] },
                    { $eq: ["$MaKH", "$$maKH"] },
                    { $eq: ["$TrangThai", "SUCCESS"] },
                    { $eq: ["$SoTien", "$$amount"] }
                ] } } },
                { $limit: 1 },
                { $project: { _id: 1 } }
            ],
            as: "_successfulPayment"
        }
    },
    { $match: { "_successfulPayment.0": { $exists: true } } }
];

const decimalConversion = (field, output) => ({
    $set: { [output]: { $convert: { input: field, to: "decimal", onError: null, onNull: null } } }
});

const facetPagination = ({ sort, pagination }) => ({
    rows: [{ $sort: sort }, { $skip: pagination.skip }, { $limit: pagination.limit }],
    total: [{ $count: "count" }]
});

const formatPage = (facet, pagination) => {
    const total = facet?.total?.[0]?.count || 0;
    return {
        items: facet?.rows || [],
        pagination: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) }
    };
};

const normalizeBson = (value) => {
    if (Array.isArray(value)) return value.map(normalizeBson);
    if (value && typeof value === "object") {
        if (value._bsontype === "Decimal128") return value.toString();
        const output = {};
        for (const [key, child] of Object.entries(value)) output[key] = normalizeBson(child);
        return output;
    }
    return value;
};

const revenuePipeline = (filters = {}) => {
    const { match } = parseDateRange(filters);
    const pagination = parsePagination(filters, 31);
    const base = paidCompletedTransactionStages(match);
    const makeSeries = (format) => [
        { $group: { _id: { $dateToString: { format, date: "$NgayHoanTat", timezone: TIME_ZONE } }, doanhThu: { $sum: "$_reportAmount" }, soGiaoDich: { $sum: 1 } } },
        { $sort: { _id: -1 } }
    ];
    return {
        pipeline: [...base, { $facet: {
            summary: [{ $group: { _id: null, tongDoanhThu: { $sum: "$_reportAmount" }, soGiaoDich: { $sum: 1 }, giaTriTrungBinh: { $avg: "$_reportAmount" } } }, { $project: { _id: 0, tongDoanhThu: 1, soGiaoDich: 1, giaTriTrungBinh: 1 } }],
            daily: [...makeSeries("%Y-%m-%d"), ...facetPagination({ sort: { _id: -1 }, pagination }).rows],
            monthly: [...makeSeries("%Y-%m"), ...facetPagination({ sort: { _id: -1 }, pagination }).rows],
            dailyCount: [...makeSeries("%Y-%m-%d"), { $count: "count" }],
            monthlyCount: [...makeSeries("%Y-%m"), { $count: "count" }]
        } }],
        pagination
    };
};

const ticketBasePipeline = (filters = {}) => {
    const { match } = parseDateRange(filters);
    return paidTicketStages(match);
};

const filmPipeline = (filters = {}) => {
    const pagination = parsePagination(filters, 20);
    const base = [
        ...ticketBasePipeline(filters),
        { $match: { TrangThai: { $in: ["VALID", "USED"] } } },
        { $lookup: { from: "suat_chieu", localField: "MaSuat", foreignField: "MaSuat", as: "_showtime" } },
        { $unwind: "$_showtime" },
        { $match: { $expr: { $eq: ["$MaPhim", "$_showtime.MaPhim"] } } },
        decimalConversion("$GiaVe", "_ticketGross"),
        { $match: { _ticketGross: { $ne: null, $gte: DECIMAL_ZERO } } },
        { $lookup: { from: "phim", localField: "_showtime.MaPhim", foreignField: "MaPhim", as: "_film" } },
        { $unwind: { path: "$_film", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$_showtime.MaPhim", tenPhim: { $first: { $ifNull: ["$_film.TenPhim", "KHONG_TIM_THAY_PHIM"] } }, soVeBan: { $sum: 1 }, doanhThuVeTruocGiam: { $sum: "$_ticketGross" } } }
    ];
    return { pipeline: [...base, { $facet: facetPagination({ sort: { doanhThuVeTruocGiam: -1, _id: 1 }, pagination }) }], pagination };
};

const ticketPipeline = (filters = {}) => {
    const pagination = parsePagination(filters, 31);
    const base = ticketBasePipeline(filters);
    return {
        pipeline: [...base, { $facet: {
            summary: [
                { $match: { TrangThai: { $in: ["VALID", "USED"] } } },
                { $group: { _id: null, tongSoVe: { $sum: 1 } } },
                { $project: { _id: 0, tongSoVe: 1 } }
            ],
            byStatus: [{ $group: { _id: { $ifNull: ["$TrangThai", "KHONG_XAC_DINH"] }, soLuong: { $sum: 1 } } }, { $sort: { _id: 1 } }],
            byDay: [
                { $match: { TrangThai: { $in: ["VALID", "USED"] } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$_transaction.NgayHoanTat", timezone: TIME_ZONE } }, soLuong: { $sum: 1 } } },
                ...facetPagination({ sort: { _id: -1 }, pagination }).rows
            ],
            byDayCount: [{ $match: { TrangThai: { $in: ["VALID", "USED"] } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$_transaction.NgayHoanTat", timezone: TIME_ZONE } } } }, { $count: "count" }],
            byShowtime: [
                { $match: { TrangThai: { $in: ["VALID", "USED"] } } },
                { $group: { _id: "$MaSuat", MaPhim: { $first: "$MaPhim" }, soLuong: { $sum: 1 } } },
                ...facetPagination({ sort: { soLuong: -1, _id: 1 }, pagination }).rows
            ],
            byShowtimeCount: [{ $match: { TrangThai: { $in: ["VALID", "USED"] } } }, { $group: { _id: "$MaSuat" } }, { $count: "count" }]
        } }],
        pagination
    };
};

const productPipeline = (filters = {}) => {
    const { match } = parseDateRange(filters);
    const pagination = parsePagination(filters, 20);
    const base = [
        ...paidCompletedTransactionStages(match),
        { $unwind: "$ChiTietCombo" },
        { $set: {
            _productAmount: { $convert: { input: "$ChiTietCombo.ThanhTien", to: "decimal", onError: null, onNull: null } },
            _productQuantity: { $convert: { input: "$ChiTietCombo.SoLuong", to: "int", onError: null, onNull: null } }
        } },
        { $match: { "ChiTietCombo.MaSP": { $type: "string" }, _productAmount: { $ne: null, $gte: DECIMAL_ZERO }, _productQuantity: { $gt: 0 } } },
        { $group: {
            _id: {
                MaSP: "$ChiTietCombo.MaSP",
                LoaiSP: { $ifNull: ["$ChiTietCombo.LoaiSP", "KHONG_XAC_DINH"] }
            },
            tenSanPham: { $first: { $ifNull: ["$ChiTietCombo.TenSP", "KHONG_XAC_DINH"] } },
            soLuongBan: { $sum: "$_productQuantity" },
            doanhThuTruocGiam: { $sum: "$_productAmount" }
        } },
        { $project: { _id: 0, MaSP: "$_id.MaSP", loaiSanPham: "$_id.LoaiSP", tenSanPham: 1, soLuongBan: 1, doanhThuTruocGiam: 1 } }
    ];
    return {
        pipeline: [...base, { $facet: {
            summary: [{ $group: { _id: null, tongSoLuongBan: { $sum: "$soLuongBan" }, tongDoanhThuTruocGiam: { $sum: "$doanhThuTruocGiam" }, soNhomSanPham: { $sum: 1 } } }, { $project: { _id: 0, tongSoLuongBan: 1, tongDoanhThuTruocGiam: 1, soNhomSanPham: 1 } }],
            byType: [{ $group: { _id: "$loaiSanPham", soLuongBan: { $sum: "$soLuongBan" }, doanhThuTruocGiam: { $sum: "$doanhThuTruocGiam" }, soMaSanPham: { $sum: 1 } } }, { $sort: { _id: 1 } }],
            products: facetPagination({ sort: { doanhThuTruocGiam: -1, MaSP: 1 }, pagination })
        } }],
        pagination
    };
};

const customerSummaryPipeline = () => [{ $facet: {
    total: [{ $count: "count" }],
    byTier: [{ $group: { _id: { $ifNull: ["$MaHangHienTai", "KHONG_CO_HANG"] }, soKhachHang: { $sum: 1 } } }, { $sort: { _id: 1 } }]
} }];

const customerSpendPipeline = (filters = {}) => {
    const { match } = parseDateRange(filters);
    const pagination = parsePagination(filters, 20);
    return {
        pipeline: [...paidCompletedTransactionStages(match),
            { $group: { _id: "$MaKH", tongChiTieu: { $sum: "$_reportAmount" }, soGiaoDich: { $sum: 1 }, giaTriGiaoDichTrungBinh: { $avg: "$_reportAmount" } } },
            { $lookup: { from: "khach_hang", localField: "_id", foreignField: "MaKH", as: "_customer" } },
            { $unwind: { path: "$_customer", preserveNullAndEmptyArrays: true } },
            { $project: { _id: 0, MaKH: "$_id", MaHangHienTai: { $ifNull: ["$_customer.MaHangHienTai", "KHONG_CO_HANG"] }, tongChiTieu: 1, soGiaoDich: 1, giaTriGiaoDichTrungBinh: 1 } },
            { $facet: facetPagination({ sort: { tongChiTieu: -1, MaKH: 1 }, pagination }) }
        ],
        pagination
    };
};

const getRevenueReport = async (filters = {}) => {
    const { pipeline, pagination } = revenuePipeline(filters);
    const [result = {}] = await GiaoDich.aggregate(pipeline);
    const dailyTotal = result.dailyCount?.[0]?.count || 0;
    const monthlyTotal = result.monthlyCount?.[0]?.count || 0;
    const summary = result.summary?.[0] || { tongDoanhThu: DECIMAL_ZERO, soGiaoDich: 0, giaTriTrungBinh: DECIMAL_ZERO };
    return normalizeBson({
        summary,
        daily: formatPage({ rows: result.daily || [], total: [{ count: dailyTotal }] }, pagination),
        monthly: formatPage({ rows: result.monthly || [], total: [{ count: monthlyTotal }] }, pagination),
        timeZone: TIME_ZONE
    });
};

const getFilmReport = async (filters = {}) => {
    const { pipeline, pagination } = filmPipeline(filters);
    const [facet = {}] = await Ve.aggregate(pipeline);
    return normalizeBson(formatPage(facet, pagination));
};

const getTicketReport = async (filters = {}) => {
    const { pipeline, pagination } = ticketPipeline(filters);
    const [result = {}] = await Ve.aggregate(pipeline);
    return normalizeBson({
        summary: result.summary?.[0] || { tongSoVe: 0 },
        byStatus: result.byStatus || [],
        byDay: formatPage({ rows: result.byDay || [], total: result.byDayCount || [] }, pagination),
        byShowtime: formatPage({ rows: result.byShowtime || [], total: result.byShowtimeCount || [] }, pagination),
        timeZone: TIME_ZONE
    });
};

const getProductReport = async (filters = {}) => {
    const { pipeline, pagination } = productPipeline(filters);
    const [result = {}] = await GiaoDich.aggregate(pipeline);
    const facet = result.products || {};
    return normalizeBson({
        summary: result.summary?.[0] || { tongSoLuongBan: 0, tongDoanhThuTruocGiam: DECIMAL_ZERO, soNhomSanPham: 0 },
        byType: result.byType || [],
        ...formatPage(facet, pagination),
        revenueBasis: "ChiTietCombo.ThanhTien truoc phan bo giam gia cap SKU"
    });
};

const getCustomerReport = async (filters = {}) => {
    const { pipeline, pagination } = customerSpendPipeline(filters);
    const [tierResult = {}] = await KhachHang.aggregate(customerSummaryPipeline());
    const [spendFacet = {}] = await GiaoDich.aggregate(pipeline);
    return normalizeBson({
        totalCustomers: tierResult.total?.[0]?.count || 0,
        byTier: tierResult.byTier || [],
        topSpenders: formatPage(spendFacet, pagination)
    });
};

module.exports = {
    TIME_ZONE,
    parseDateRange,
    parsePagination,
    paidCompletedTransactionStages,
    paidTicketStages,
    revenuePipeline,
    filmPipeline,
    ticketPipeline,
    productPipeline,
    customerSummaryPipeline,
    customerSpendPipeline,
    getRevenueReport,
    getFilmReport,
    getTicketReport,
    getProductReport,
    getCustomerReport
};
