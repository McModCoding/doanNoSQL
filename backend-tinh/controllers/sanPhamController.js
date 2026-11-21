const sanPhamService = require("../services/sanPhamService");

const sendError = (res, error, fallback) => {
    const status = error.statusCode || (error.code === 11000 ? 409 :
        ["ValidationError", "CastError"].includes(error.name) ? 400 : 500);
    return res.status(status).json({
        success: false,
        message: error.code === 11000 ? "MaSP da ton tai" : (status >= 500 ? fallback : error.message)
    });
};

const getProducts = async (req, res) => {
    try {
        const result = await sanPhamService.listProducts(req.query, false);
        return res.status(200).json({
            success: true,
            message: "Lay danh sach san pham thanh cong",
            data: result.items,
            pagination: result.pagination
        });
    } catch (error) {
        return sendError(res, error, "Khong the lay danh sach san pham");
    }
};

const getAdminProducts = async (req, res) => {
    try {
        const result = await sanPhamService.listProducts(req.query, true);
        return res.status(200).json({
            success: true,
            message: "Lay danh sach san pham quan tri thanh cong",
            data: result.items,
            pagination: result.pagination
        });
    } catch (error) {
        return sendError(res, error, "Khong the lay danh sach san pham");
    }
};

const getProductById = async (req, res, admin = false) => {
    try {
        const product = await sanPhamService.getProductById(req.params.MaSP, admin);
        if (!product) {
            return res.status(404).json({ success: false, message: "Khong tim thay san pham" });
        }
        return res.status(200).json({ success: true, data: product });
    } catch (error) {
        return sendError(res, error, "Khong the lay thong tin san pham");
    }
};

const getPublicProductById = (req, res) => getProductById(req, res, false);
const getAdminProductById = (req, res) => getProductById(req, res, true);

const createProduct = async (req, res) => {
    try {
        const product = await sanPhamService.createProduct(req.body);
        return res.status(201).json({ success: true, message: "Them san pham thanh cong", data: product });
    } catch (error) {
        return sendError(res, error, "Khong the them san pham");
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await sanPhamService.updateProduct(req.params.MaSP, req.body);
        if (!product) return res.status(404).json({ success: false, message: "Khong tim thay san pham" });
        return res.status(200).json({ success: true, message: "Cap nhat san pham thanh cong", data: product });
    } catch (error) {
        return sendError(res, error, "Khong the cap nhat san pham");
    }
};

const updateProductStatus = async (req, res) => {
    try {
        const product = await sanPhamService.updateProductStatus(req.params.MaSP, req.body?.TrangThai);
        if (!product) return res.status(404).json({ success: false, message: "Khong tim thay san pham" });
        return res.status(200).json({ success: true, message: "Cap nhat trang thai san pham thanh cong", data: product });
    } catch (error) {
        return sendError(res, error, "Khong the cap nhat trang thai san pham");
    }
};

module.exports = {
    getProducts,
    getAdminProducts,
    getPublicProductById,
    getAdminProductById,
    createProduct,
    updateProduct,
    updateProductStatus
};
