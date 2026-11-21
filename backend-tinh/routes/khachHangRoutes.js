
const express = require("express");
const router = express.Router();

const khachHangController = require("../controllers/khachHangController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// Danh sach khach hang chi danh cho quan tri vien
router.get(
    "/",
    protect,
    allowRoles("ADMIN"),
    khachHangController.getAllCustomers
);

// Chi tiet: khach hang chi duoc xem ho so cua minh; ADMIN xem duoc moi ho so
router.get("/:MaKH", protect, khachHangController.getCustomerById);

// Cap nhat truong ho so duoc phep; Controller kiem tra quyen so huu
router.put("/:MaKH", protect, khachHangController.updateCustomer);

// Thay doi trang thai tai khoan chi danh cho ADMIN
router.patch(
    "/:MaKH/status",
    protect,
    allowRoles("ADMIN"),
    khachHangController.updateCustomerStatus
);

module.exports = router;
