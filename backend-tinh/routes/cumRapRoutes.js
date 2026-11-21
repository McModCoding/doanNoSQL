
const express = require("express");
const router = express.Router();

const cumRapController = require("../controllers/cumRapController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// GET danh sach cum rap
router.get("/", cumRapController.getAllCinemas);

// GET chi tiet cum rap
router.get("/:MaRap", cumRapController.getCinemaById);

// POST them cum rap
router.post("/", protect, allowRoles("ADMIN"), cumRapController.createCinema);

// PUT cap nhat cum rap
router.put("/:MaRap", protect, allowRoles("ADMIN"), cumRapController.updateCinema);

// PATCH cap nhat trang thai
router.patch(
    "/:MaRap/status",
    protect,
    allowRoles("ADMIN"),
    cumRapController.updateCinemaStatus
);

module.exports = router;
