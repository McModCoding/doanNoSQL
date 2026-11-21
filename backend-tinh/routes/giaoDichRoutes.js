
const express = require("express");
const router = express.Router();

const giaoDichController = require("../controllers/giaoDichController");
const { protect } = require("../middleware/authMiddleware");

// Tat ca API giao dich deu yeu cau dang nhap
router.use(protect);

// Lay danh sach giao dich cua khach hang dang dang nhap
router.get("/", giaoDichController.getAllTransactions);

// Lay lich su giao dich cua khach hang
router.get(
    "/khach-hang/:MaKH",
    giaoDichController.getTransactionsByCustomer
);

// Lay chi tiet giao dich
router.get("/:MaGD", giaoDichController.getTransactionById);

// Huy giao dich dang cho thanh toan
router.patch(
    "/:MaGD/huy",
    giaoDichController.cancelTransaction
);

module.exports = router;
