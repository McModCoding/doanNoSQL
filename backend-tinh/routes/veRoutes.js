
const express = require("express");
const router = express.Router();

const veController = require("../controllers/veController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// Tat ca API trong file nay deu yeu cau dang nhap
router.use(protect);

// Khach hang xem danh sach ve cua minh
router.get("/cua-toi", veController.getMyTickets);

// Khach hang xem ve theo giao dich cua minh
router.get(
    "/giao-dich/:MaGD",
    veController.getTicketsByTransaction
);

// ADMIN kiem tra ma QR
router.post(
    "/kiem-tra-qr",
    allowRoles("ADMIN"),
    veController.verifyTicket
);

// ADMIN xac nhan su dung ve
router.post(
    "/su-dung",
    allowRoles("ADMIN"),
    veController.useTicket
);

// Khach hang xem chi tiet ve cua minh
router.get("/:MaVe", veController.getTicketDetail);

module.exports = router;
