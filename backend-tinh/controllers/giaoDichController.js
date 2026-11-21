
const giaoDichService = require("../services/giaoDichService");

// Xac dinh ma loi HTTP tu loi nghiep vu
const getErrorStatus = (message = "") => {
    const msg = message.toLowerCase();

    if (
        msg.includes("khong ton tai") ||
        msg.includes("not found")
    ) {
        return 404;
    }

    if (
        msg.includes("khong co quyen") ||
        msg.includes("khong duoc phep")
    ) {
        return 403;
    }

    if (
        msg.includes("chi duoc huy") ||
        msg.includes("khong the huy") ||
        msg.includes("da duoc thanh toan") ||
        msg.includes("da hoan tat")
    ) {
        return 409;
    }

    if (
        msg.includes("thieu") ||
        msg.includes("khong hop le") ||
        msg.includes("khong duoc de trong")
    ) {
        return 400;
    }

    return 500;
};

// Lay danh sach giao dich cua khach hang dang dang nhap
const getAllTransactions = async (req, res) => {
    try {
        const filters = {
            ...req.query,
            MaKH: req.user.MaKH
        };

        const transactions =
            await giaoDichService.getAllTransactions(filters);

        return res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });

    } catch (error) {
        console.error("Get transactions error:", error);

        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message || "Khong the lay danh sach giao dich"
        });
    }
};

// Lay chi tiet giao dich
const getTransactionById = async (req, res) => {
    try {
        const transaction =
            await giaoDichService.getTransactionById(req.params.MaGD);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Giao dich khong ton tai"
            });
        }

        // Kiem tra quyen so huu giao dich
        if (transaction.MaKH !== req.user.MaKH) {
            return res.status(403).json({
                success: false,
                message: "Ban khong co quyen xem giao dich nay"
            });
        }

        return res.status(200).json({
            success: true,
            data: transaction
        });

    } catch (error) {
        console.error("Get transaction detail error:", error);

        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message || "Khong the lay chi tiet giao dich"
        });
    }
};

// Lay lich su giao dich cua khach hang
const getTransactionsByCustomer = async (req, res) => {
    try {
        const { MaKH } = req.params;

        // Khong cho xem lich su cua khach hang khac
        if (MaKH !== req.user.MaKH) {
            return res.status(403).json({
                success: false,
                message: "Ban khong co quyen xem lich su giao dich nay"
            });
        }

        const transactions =
            await giaoDichService.getTransactionsByCustomer(
                req.user.MaKH,
                req.query
            );

        return res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });

    } catch (error) {
        console.error("Get customer transactions error:", error);

        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message || "Khong the lay lich su giao dich"
        });
    }
};

// Huy giao dich dang cho thanh toan
const cancelTransaction = async (req, res) => {
    try {
        const transaction =
            await giaoDichService.cancelTransaction(
                req.params.MaGD,
                req.user.MaKH
            );

        return res.status(200).json({
            success: true,
            message: "Huy giao dich thanh cong",
            data: transaction
        });

    } catch (error) {
        console.error("Cancel transaction error:", error);

        return res.status(getErrorStatus(error.message)).json({
            success: false,
            message: error.message || "Khong the huy giao dich"
        });
    }
};

module.exports = {
    getAllTransactions,
    getTransactionById,
    getTransactionsByCustomer,
    cancelTransaction
};
