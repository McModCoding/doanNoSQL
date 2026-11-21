const tichDiemService = require("../services/tichDiemService");

const getMaKHFromToken = (req, res) => {
    if (!req.user?.MaKH) {
        res.status(401).json({
            success: false,
            message: "Token khong co MaKH hop le"
        });
        return null;
    }

    return req.user.MaKH;
};

const getPointSummary = async (req, res) => {
    const MaKH = getMaKHFromToken(req, res);
    if (!MaKH) return;

    try {
        const summary = await tichDiemService.getPointSummary(MaKH);
        return res.status(200).json({
            success: true,
            message: "Lay tong quan diem thanh cong",
            data: summary
        });
    } catch (error) {
        const status = error.message.includes("Khong tim thay") ? 404 : 500;
        if (status === 500) console.error("Get point summary error:", error);

        return res.status(status).json({
            success: false,
            message: status === 404
                ? error.message
                : "Khong the lay tong quan diem"
        });
    }
};

const createHistoryFilters = (query) => {
    for (const field of ["page", "limit", "type", "fromDate", "toDate"]) {
        if (query[field] !== undefined && typeof query[field] !== "string") {
            throw new Error(`${field} chi duoc truyen mot gia tri`);
        }
    }

    if (query.type !== undefined && !query.type.trim()) {
        throw new Error("type khong hop le");
    }

    return {
        page: query.page,
        limit: query.limit,
        Loai: query.type,
        TuNgay: query.fromDate,
        DenNgay: query.toDate
    };
};

const sendHistory = async (req, res, serviceMethod, successMessage) => {
    const MaKH = getMaKHFromToken(req, res);
    if (!MaKH) return;

    try {
        const filters = createHistoryFilters(req.query);
        const result = await serviceMethod(MaKH, filters);

        return res.status(200).json({
            success: true,
            message: successMessage,
            data: {
                items: result.data,
                pagination: result.pagination
            }
        });
    } catch (error) {
        const validationError =
            error.message.includes("khong hop le") ||
            error.message.includes("phai la so nguyen") ||
            error.message.includes("khong duoc sau") ||
            error.message.includes("vuot qua gioi han") ||
            error.message.includes("chi duoc truyen") ||
            error.message.includes("chi ho tro");

        if (!validationError) {
            console.error("Get point history error:", error);
        }

        return res.status(validationError ? 400 : 500).json({
            success: false,
            message: validationError
                ? error.message
                : "Khong the lay lich su bien dong diem"
        });
    }
};

const getPointHistory = (req, res) => sendHistory(
    req,
    res,
    tichDiemService.getPointHistory,
    "Lay lich su bien dong diem thanh cong"
);

const getEarnHistory = (req, res) => sendHistory(
    req,
    res,
    tichDiemService.getEarnHistory,
    "Lay lich su tich diem thanh cong"
);

const getRedeemHistory = (req, res) => sendHistory(
    req,
    res,
    tichDiemService.getRedeemHistory,
    "Lay lich su su dung diem thanh cong"
);

const getAvailableRewards = async (req, res) => {
    try {
        const rewards = await tichDiemService.getAvailableRewards();
        return res.status(200).json({
            success: true,
            message: "Lay danh sach phan thuong thanh cong",
            data: rewards
        });
    } catch (error) {
        console.error("Get available rewards error:", error);
        return res.status(500).json({
            success: false,
            message: "Khong the lay danh sach phan thuong"
        });
    }
};

const redeemReward = async (req, res) => {
    const MaKH = getMaKHFromToken(req, res);
    if (!MaKH) return;

    try {
        const body = req.body || {};
        const allowedFields = new Set(["MaQua", "SoLuong", "IdempotencyKey"]);
        const unexpectedFields = Object.keys(body).filter(
            (field) => !allowedFields.has(field)
        );

        if (unexpectedFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Truong request khong duoc ho tro: ${unexpectedFields.join(", ")}`
            });
        }

        const headerKey = req.get("Idempotency-Key");
        const bodyKey = body.IdempotencyKey;
        if (bodyKey !== undefined && typeof bodyKey !== "string") {
            return res.status(400).json({
                success: false,
                message: "IdempotencyKey phai la chuoi"
            });
        }
        if (
            headerKey &&
            bodyKey &&
            headerKey.trim() !== bodyKey.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "IdempotencyKey trong header va body khong khop"
            });
        }

        const idempotencyKey = headerKey || bodyKey;
        const result = await tichDiemService.redeemReward(
            MaKH,
            body.MaQua,
            body.SoLuong,
            idempotencyKey
        );

        return res.status(result.alreadyProcessed ? 200 : 201).json({
            success: true,
            message: result.message,
            data: {
                ...result.data,
                alreadyProcessed: result.alreadyProcessed
            }
        });
    } catch (error) {
        const status = error.statusCode || 500;
        if (status >= 500) console.error("Redeem reward error:", error);

        return res.status(status).json({
            success: false,
            message: status < 500
                ? error.message
                : error.requiresReconciliation
                    ? "Yeu cau doi thuong can doi soat; vui long lien he ho tro"
                    : "Khong the xu ly yeu cau doi thuong"
        });
    }
};

const sendReconciliation = async (req, res, serviceMethod, message, allowedFilters) => {
    try {
        const filters = {};
        for (const key of allowedFilters) {
            if (req.query[key] !== undefined) {
                if (typeof req.query[key] !== "string") {
                    return res.status(400).json({ success: false, message: `${key} chi duoc truyen mot gia tri` });
                }
                filters[key] = req.query[key];
            }
        }
        const result = await serviceMethod(filters);
        return res.status(200).json({ success: true, message, data: result });
    } catch (error) {
        const clientError = /phai la so nguyen|vuot qua gioi han|khong hop le/.test(error.message);
        if (!clientError) console.error("Loyalty reconciliation error:", error);
        return res.status(clientError ? 400 : 500).json({
            success: false,
            message: clientError ? error.message : "Khong the tao bao cao doi soat"
        });
    }
};

const getReconciliationSummary = (req, res) => sendReconciliation(
    req, res, tichDiemService.getReconciliationSummary,
    "Lay tong quan doi soat loyalty thanh cong", ["olderThanHours"]
);

const getPointReconciliation = (req, res) => sendReconciliation(
    req, res, tichDiemService.getPointReconciliation,
    "Lay bao cao doi soat diem thanh cong", ["page", "limit", "MaKH"]
);

const getRedemptionReconciliation = (req, res) => sendReconciliation(
    req, res, tichDiemService.getRedemptionReconciliation,
    "Lay bao cao doi soat doi thuong thanh cong", ["page", "limit", "olderThanHours"]
);

const getLedgerReconciliation = (req, res) => sendReconciliation(
    req, res, tichDiemService.getLedgerReconciliation,
    "Lay bao cao doi soat ledger thanh cong", ["page", "limit", "olderThanHours", "type", "status"]
);

const getInventoryReconciliation = (req, res) => sendReconciliation(
    req, res, tichDiemService.getInventoryReconciliation,
    "Lay bao cao doi soat ton kho thanh cong", ["page", "limit"]
);

module.exports = {
    getPointSummary,
    getPointHistory,
    getEarnHistory,
    getRedeemHistory,
    getAvailableRewards,
    redeemReward,
    getReconciliationSummary,
    getPointReconciliation,
    getRedemptionReconciliation,
    getLedgerReconciliation,
    getInventoryReconciliation
};
