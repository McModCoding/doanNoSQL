
const thanhToanService = require("../services/thanhToanService");

const getPaymentReconciliation = async (req, res) => {
    try {
        const result = await thanhToanService.listPaymentReconciliation(req.query || {});
        return res.status(200).json({
            success: true,
            message: "Lay danh sach thanh toan can doi soat thanh cong",
            data: result.items,
            pagination: result.pagination
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : "Khong the lay danh sach thanh toan can doi soat"
        });
    }
};

// Tao yeu cau thanh toan MoMo
const createPayment = async (req, res) => {
    try {
        const { MaGD } = req.body;
        const MaKH = req.user.MaKH;

        if (!MaGD) {
            return res.status(400).json({
                success: false,
                message: "Vui long cung cap MaGD"
            });
        }

        if (!MaKH) {
            return res.status(401).json({
                success: false,
                message: "Khong xac dinh duoc khach hang dang dang nhap"
            });
        }

        const payment = await thanhToanService.createPayment(
            MaGD,
            MaKH
        );

        return res.status(201).json({
            success: true,
            message: "Tao yeu cau thanh toan MoMo thanh cong",
            data: payment
        });

    } catch (error) {
        console.error("Create MoMo payment error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Nhan IPN tu MoMo
const handleIPN = async (req, res) => {
    try {
        const result = await thanhToanService.handleIPN(req.body);

        return res.status(200).json({
            partnerCode: req.body.partnerCode,
            orderId: req.body.orderId,
            requestId: req.body.requestId,
            resultCode: 0,
            message: result.requiresReview
                ? "Payment received, ticket issuance requires reconciliation"
                : result.duplicate
                    ? "IPN already processed"
                    : "IPN processed successfully",
            responseTime: Date.now(),
            extraData: req.body.extraData || ""
        });

    } catch (error) {
        console.error("MoMo IPN error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Nhan ket qua Redirect tu MoMo
const handleReturn = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Da quay lai tu MoMo. Vui long doi xac nhan thanh toan tu he thong.",
        data: {
            orderId: req.query.orderId || null,
            resultCode: req.query.resultCode || null,
            message: req.query.message || null,
            note: "Trang thai thanh toan chinh thuc duoc xac nhan bang IPN."
        }
    });
};

// Thanh toan gia lap DEV_MOCK
const simulatePayment = async (req, res) => {
    try {
        const { MaGD, outcome } = req.body;
        const MaKH = req.user.MaKH;

        if (!MaGD) {
            return res.status(400).json({
                success: false,
                message: "Vui long cung cap MaGD"
            });
        }

        if (!MaKH) {
            return res.status(401).json({
                success: false,
                message: "Khong xac dinh duoc khach hang dang dang nhap"
            });
        }

        const result = await thanhToanService.simulatePayment(
            MaGD,
            MaKH,
            outcome || "SUCCESS"
        );

        return res.status(200).json({
            success: true,
            message: "Xu ly thanh toan gia lap thanh cong",
            data: result
        });

    } catch (error) {
        console.error("Simulate payment error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getPaymentReconciliation,
    createPayment,
    handleIPN,
    handleReturn,
    simulatePayment
};
