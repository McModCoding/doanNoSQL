
const express = require("express");
const router = express.Router();

const phongChieuController = require("../controllers/phongChieuController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// GET danh sach phong chieu
router.get("/", phongChieuController.getAllRooms);

// GET chi tiet phong chieu
router.get("/:MaPhong", phongChieuController.getRoomById);

// POST them phong chieu
router.post("/", protect, allowRoles("ADMIN"), phongChieuController.createRoom);

// PUT cap nhat thong tin phong chieu
router.put("/:MaPhong", protect, allowRoles("ADMIN"), phongChieuController.updateRoom);

// PATCH cap nhat trang thai
router.patch(
    "/:MaPhong/status",
    protect,
    allowRoles("ADMIN"),
    phongChieuController.updateRoomStatus
);

module.exports = router;
