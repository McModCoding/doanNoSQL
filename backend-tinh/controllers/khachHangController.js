
const khachHangService = require("../services/khachHangService");

const canAccessCustomer = (req, res) => {
    if (
        req.user?.VaiTro === "ADMIN" ||
        req.user?.MaKH === req.params.MaKH
    ) {
        return true;
    }

    res.status(403).json({
        success: false,
        message: "Ban khong co quyen truy cap ho so khach hang nay"
    });
    return false;
};

// GET danh sach khach hang
const getAllCustomers = async (req, res) => {
    try {
        const customers = await khachHangService.getAllCustomers(req.query);

        return res.status(200).json({
            success: true,
            count: customers.length,
            data: customers
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET chi tiet khach hang
const getCustomerById = async (req, res) => {
    if (!canAccessCustomer(req, res)) return;

    try {
        const customer = await khachHangService.getCustomerById(
            req.params.MaKH
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay khach hang"
            });
        }

        return res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// PUT cap nhat thong tin
const updateCustomer = async (req, res) => {
    if (!canAccessCustomer(req, res)) return;

    try {
        const customer = await khachHangService.updateCustomer(
            req.params.MaKH,
            req.body
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay khach hang"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cap nhat khach hang thanh cong",
            data: customer
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// PATCH cap nhat trang thai
const updateCustomerStatus = async (req, res) => {
    try {
        const customer = await khachHangService.updateCustomerStatus(
            req.params.MaKH,
            req.body.TrangThai
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay khach hang"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cap nhat trang thai thanh cong",
            data: customer
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    updateCustomerStatus
};
