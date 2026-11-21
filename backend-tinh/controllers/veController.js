
const veService = require("../services/veService");
const GiaoDich = require("../models/GiaoDich");

// Lay danh sach ve cua khach hang dang dang nhap
const getMyTickets = async (req, res) => {
    try {
        const tickets = await veService.getTicketsByCustomer(
            req.user.MaKH,
            {
                TrangThai: req.query.TrangThai,
                MaSuat: req.query.MaSuat
            }
        );

        return res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Lay chi tiet ve, chi chu ve moi duoc xem
const getTicketDetail = async (req, res) => {
    try {
        const ticket = await veService.getTicketById(req.params.MaVe);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay ve"
            });
        }

        if (ticket.MaKH !== req.user.MaKH) {
            return res.status(403).json({
                success: false,
                message: "Ban khong co quyen xem ve nay"
            });
        }

        return res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Lay danh sach ve theo giao dich cua khach hang
const getTicketsByTransaction = async (req, res) => {
    try {
        const transaction = await GiaoDich.findOne({
            MaGD: req.params.MaGD,
            MaKH: req.user.MaKH
        }).lean();

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay giao dich"
            });
        }

        const tickets = await veService.getTicketsByTransaction(
            req.params.MaGD
        );

        return res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ADMIN kiem tra ve bang ma QR
const verifyTicket = async (req, res) => {
    try {
        const { MaQRTicket } = req.body;

        if (!MaQRTicket) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: "Vui long cung cap ma QR ve"
            });
        }

        const ticket = await veService.verifyTicket(MaQRTicket);

        return res.status(200).json({
            success: true,
            valid: true,
            message: "Ve hop le, co the su dung",
            data: ticket
        });
    } catch (error) {
        const isNotFound = error.message.includes("khong ton tai");
        const isInvalid = error.message.includes("khong con hieu luc");

        return res.status(isNotFound || isInvalid ? 404 : 400).json({
            success: false,
            valid: false,
            message: error.message
        });
    }
};

// ADMIN xac nhan khach hang su dung ve
const useTicket = async (req, res) => {
    try {
        const { MaQRTicket } = req.body;

        if (!MaQRTicket) {
            return res.status(400).json({
                success: false,
                message: "Vui long cung cap ma QR ve"
            });
        }

        const ticket = await veService.useTicket(MaQRTicket);

        return res.status(200).json({
            success: true,
            message: "Xac nhan su dung ve thanh cong",
            data: ticket
        });
    } catch (error) {
        const isNotFound = error.message === "Ve khong ton tai";
        const isConflict = error.message.includes("da duoc su dung");

        return res.status(isNotFound ? 404 : isConflict ? 409 : 400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getMyTickets,
    getTicketDetail,
    getTicketsByTransaction,
    verifyTicket,
    useTicket
};
