const express = require("express");
const router = express.Router();

const tichDiemController = require("../controllers/tichDiemController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.use(protect);

router.get("/summary", tichDiemController.getPointSummary);
router.get("/history", tichDiemController.getPointHistory);
router.get("/earn-history", tichDiemController.getEarnHistory);
router.get("/redeem-history", tichDiemController.getRedeemHistory);
router.get("/rewards", tichDiemController.getAvailableRewards);
router.post("/redeem", tichDiemController.redeemReward);

router.get("/reconciliation/summary", allowRoles("ADMIN"), tichDiemController.getReconciliationSummary);
router.get("/reconciliation/points", allowRoles("ADMIN"), tichDiemController.getPointReconciliation);
router.get("/reconciliation/redemptions", allowRoles("ADMIN"), tichDiemController.getRedemptionReconciliation);
router.get("/reconciliation/ledger", allowRoles("ADMIN"), tichDiemController.getLedgerReconciliation);
router.get("/reconciliation/inventory", allowRoles("ADMIN"), tichDiemController.getInventoryReconciliation);

module.exports = router;
