const khuyenMaiService = require("../services/khuyenMaiService");

const sendError = (res, error, fallback) => {
    const status = error.statusCode || (error.code === 11000 ? 409 :
        ["ValidationError", "CastError"].includes(error.name) ? 400 : 500);
    return res.status(status).json({
        success: false,
        message: error.code === 11000 ? "MaKM da ton tai" : status >= 500 ? fallback : error.message
    });
};

const getList = async (req, res, admin) => {
    try {
        const allowed = ["page", "limit", "keyword", "type", "status", "fromDate", "toDate", "effective"];
        const filters = {};
        for (const field of allowed) {
            if (req.query[field] !== undefined) {
                if (typeof req.query[field] !== "string") {
                    return res.status(400).json({ success: false, message: `${field} chi duoc truyen mot gia tri` });
                }
                filters[field] = req.query[field];
            }
        }
        const result = await khuyenMaiService.listPromotions(filters, admin);
        return res.status(200).json({
            success: true,
            message: "Lay danh sach khuyen mai thanh cong",
            data: result.items,
            pagination: result.pagination
        });
    } catch (error) {
        return sendError(res, error, "Khong the lay danh sach khuyen mai");
    }
};

const getPromotions = (req, res) => getList(req, res, false);
const getAdminPromotions = (req, res) => getList(req, res, true);

const getPromotion = async (req, res, admin) => {
    try {
        const promotion = await khuyenMaiService.getPromotionById(req.params.MaKM, admin);
        if (!promotion) return res.status(404).json({ success: false, message: "Khong tim thay khuyen mai" });
        return res.status(200).json({ success: true, data: promotion });
    } catch (error) {
        return sendError(res, error, "Khong the lay thong tin khuyen mai");
    }
};

const getPublicPromotionById = (req, res) => getPromotion(req, res, false);
const getAdminPromotionById = (req, res) => getPromotion(req, res, true);

const createPromotion = async (req, res) => {
    try {
        const promotion = await khuyenMaiService.createPromotion(req.body);
        return res.status(201).json({ success: true, message: "Tao khuyen mai thanh cong", data: promotion });
    } catch (error) {
        return sendError(res, error, "Khong the tao khuyen mai");
    }
};

const updatePromotion = async (req, res) => {
    try {
        const promotion = await khuyenMaiService.updatePromotion(req.params.MaKM, req.body);
        if (!promotion) return res.status(404).json({ success: false, message: "Khong tim thay khuyen mai" });
        return res.status(200).json({ success: true, message: "Cap nhat khuyen mai thanh cong", data: promotion });
    } catch (error) {
        return sendError(res, error, "Khong the cap nhat khuyen mai");
    }
};

const updatePromotionStatus = async (req, res) => {
    try {
        const promotion = await khuyenMaiService.updatePromotionStatus(req.params.MaKM, req.body?.TrangThai);
        if (!promotion) return res.status(404).json({ success: false, message: "Khong tim thay khuyen mai" });
        return res.status(200).json({ success: true, message: "Cap nhat trang thai khuyen mai thanh cong", data: promotion });
    } catch (error) {
        return sendError(res, error, "Khong the cap nhat trang thai khuyen mai");
    }
};

module.exports = {
    getPromotions,
    getAdminPromotions,
    getPublicPromotionById,
    getAdminPromotionById,
    createPromotion,
    updatePromotion,
    updatePromotionStatus
};
