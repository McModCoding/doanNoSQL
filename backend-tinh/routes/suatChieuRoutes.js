
const express = require("express");
const router = express.Router();

const suatChieuController = require("../controllers/suatChieuController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// Danh sach suat chieu
router.get("/", suatChieuController.getAllShowtimes);

// Chi tiet suat chieu
router.get("/:MaSuat", suatChieuController.getShowtimeById);

// Them suat chieu
router.post("/", protect, allowRoles("ADMIN"), suatChieuController.createShowtime);

// Cap nhat thong tin
router.put("/:MaSuat", protect, allowRoles("ADMIN"), suatChieuController.updateShowtime);

// Cap nhat trang thai
router.patch(
    "/:MaSuat/status",
    protect,
    allowRoles("ADMIN"),
    suatChieuController.updateShowtimeStatus
);

module.exports = router;
