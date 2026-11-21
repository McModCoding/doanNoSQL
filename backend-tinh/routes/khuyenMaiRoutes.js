const express = require("express");
const router = express.Router();

const khuyenMaiController = require("../controllers/khuyenMaiController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.get("/", khuyenMaiController.getPromotions);
router.get("/admin", protect, allowRoles("ADMIN"), khuyenMaiController.getAdminPromotions);
router.get("/admin/:MaKM", protect, allowRoles("ADMIN"), khuyenMaiController.getAdminPromotionById);
router.get("/:MaKM", khuyenMaiController.getPublicPromotionById);

router.post("/", protect, allowRoles("ADMIN"), khuyenMaiController.createPromotion);
router.put("/:MaKM", protect, allowRoles("ADMIN"), khuyenMaiController.updatePromotion);
router.patch("/:MaKM/status", protect, allowRoles("ADMIN"), khuyenMaiController.updatePromotionStatus);

module.exports = router;
