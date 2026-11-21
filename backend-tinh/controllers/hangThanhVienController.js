const hangThanhVienService = require("../services/hangThanhVienService");
const chiTieuHangService = require("../services/chiTieuHangService");

const sendError = (res, error, fallback) => {
    const status = error.statusCode || (error.code === 11000 ? 409 :
        ["ValidationError", "CastError"].includes(error.name) ? 400 : 500);
    return res.status(status).json({
        success: false,
        message: error.code === 11000 ? "Ma hang thanh vien da ton tai" : status >= 500 ? fallback : error.message
    });
};

const sendTierList = async (req, res, admin) => {
    try {
        const allowed = admin ? ["keyword", "TrangThai", "page", "limit"] : ["keyword", "page", "limit"];
        const filters = {};
        for (const key of allowed) {
            if (req.query[key] !== undefined) {
                if (typeof req.query[key] !== "string") {
                    return res.status(400).json({ success: false, message: `${key} chi duoc truyen mot gia tri` });
                }
                filters[key] = req.query[key];
            }
        }
        const result = await hangThanhVienService.getAllTiers(filters, admin);
        return res.status(200).json({
            success: true,
            count: result.pagination.total,
            data: result.items,
            pagination: result.pagination
        });
    } catch (error) {
        return sendError(res, error, "Khong the lay danh sach hang thanh vien");
    }
};

const getAllTiers = (req, res) => sendTierList(req, res, false);
const getAdminTiers = (req, res) => sendTierList(req, res, true);

const sendTierDetail = async (req, res, admin) => {
    try {
        const tier = await hangThanhVienService.getTierById(req.params.MaHang, admin);
        if (!tier) return res.status(404).json({ success: false, message: "Khong tim thay hang thanh vien" });
        return res.status(200).json({ success: true, data: tier });
    } catch (error) {
        return sendError(res, error, "Khong the lay thong tin hang thanh vien");
    }
};

const getTierById = (req, res) => sendTierDetail(req, res, false);
const getAdminTierById = (req, res) => sendTierDetail(req, res, true);

const createTier = async (req, res) => {
    try {
        const tier = await hangThanhVienService.createTier(req.body);
        return res.status(201).json({ success: true, message: "Them hang thanh vien thanh cong", data: tier });
    } catch (error) {
        return sendError(res, error, "Khong the tao hang thanh vien");
    }
};

const updateTier = async (req, res) => {
    try {
        const tier = await hangThanhVienService.updateTier(req.params.MaHang, req.body);
        if (!tier) return res.status(404).json({ success: false, message: "Khong tim thay hang thanh vien" });
        return res.status(200).json({ success: true, message: "Cap nhat hang thanh vien thanh cong", data: tier });
    } catch (error) {
        return sendError(res, error, "Khong the cap nhat hang thanh vien");
    }
};

const updateTierStatus = async (req, res) => {
    try {
        const tier = await hangThanhVienService.updateTierStatus(req.params.MaHang, req.body?.TrangThai);
        if (!tier) return res.status(404).json({ success: false, message: "Khong tim thay hang thanh vien" });
        return res.status(200).json({ success: true, message: "Cap nhat trang thai hang thanh vien thanh cong", data: tier });
    } catch (error) {
        return sendError(res, error, "Khong the cap nhat trang thai hang thanh vien");
    }
};

const getMyTierHistory = async (req, res) => {
    const MaKH = req.user?.MaKH;
    if (!MaKH) return res.status(401).json({ success: false, message: "Token khong co MaKH hop le" });
    try {
        const result = await hangThanhVienService.getCustomerTierHistory(MaKH, req.query);
        return res.status(200).json({ success: true, data: result.items, pagination: result.pagination });
    } catch (error) {
        return sendError(res, error, "Khong the lay lich su hang thanh vien");
    }
};

const getCustomerTierHistory = async (req, res) => {
    try {
        const result = await hangThanhVienService.getAllCustomerTierHistory(req.params.MaKH, req.query);
        if (!result) return res.status(404).json({ success: false, message: "Khong tim thay khach hang" });
        return res.status(200).json({ success: true, data: result.items, pagination: result.pagination });
    } catch (error) {
        return sendError(res, error, "Khong the lay lich su hang thanh vien");
    }
};

const getSpendReconciliation = async (req, res) => {
    try {
        for (const field of ["page", "limit"]) {
            if (req.query[field] !== undefined && typeof req.query[field] !== "string") {
                return res.status(400).json({ success: false, message: `${field} chi duoc truyen mot gia tri` });
            }
        }
        const result = await chiTieuHangService.getSpendReconciliation({
            page: req.query.page,
            limit: req.query.limit
        });
        return res.status(200).json({ success: true, message: "Lay danh sach chi tieu can doi soat thanh cong", data: result });
    } catch (error) {
        const clientError = error.message.includes("so nguyen duong");
        return res.status(clientError ? 400 : 500).json({
            success: false,
            message: clientError ? error.message : "Khong the lay danh sach chi tieu can doi soat"
        });
    }
};

module.exports = {
    getAllTiers,
    getAdminTiers,
    getTierById,
    getAdminTierById,
    createTier,
    updateTier,
    updateTierStatus,
    getMyTierHistory,
    getCustomerTierHistory,
    getSpendReconciliation
};
