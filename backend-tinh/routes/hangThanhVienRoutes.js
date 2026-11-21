
const express = require("express");
const router = express.Router();

const hangThanhVienController = require("../controllers/hangThanhVienController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// GET danh sach hang thanh vien
router.get("/", hangThanhVienController.getAllTiers);

// ADMIN xem ca hang ACTIVE va INACTIVE
router.get("/admin", protect, allowRoles("ADMIN"), hangThanhVienController.getAdminTiers);
router.get("/admin/:MaHang", protect, allowRoles("ADMIN"), hangThanhVienController.getAdminTierById);
router.get("/admin/reconciliation/spending", protect, allowRoles("ADMIN"), hangThanhVienController.getSpendReconciliation);

// Lich su cua khach dang dang nhap; MaKH lay tu JWT
router.get("/history", protect, hangThanhVienController.getMyTierHistory);

// ADMIN xem lich su theo MaKH
router.get(
    "/admin/customers/:MaKH/history",
    protect,
    allowRoles("ADMIN"),
    hangThanhVienController.getCustomerTierHistory
);

// GET chi tiet hang thanh vien
router.get("/:MaHang", hangThanhVienController.getTierById);

// POST them hang thanh vien
router.post(
    "/",
    protect,
    allowRoles("ADMIN"),
    hangThanhVienController.createTier
);

// PUT cap nhat thong tin hang
router.put(
    "/:MaHang",
    protect,
    allowRoles("ADMIN"),
    hangThanhVienController.updateTier
);

// PATCH cap nhat trang thai
router.patch(
    "/:MaHang/status",
    protect,
    allowRoles("ADMIN"),
    hangThanhVienController.updateTierStatus
);

module.exports = router;
