
const express = require("express");
const router = express.Router();

const thanhToanController = require("../controllers/thanhToanController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.get(
    "/admin/reconciliation",
    protect,
    allowRoles("ADMIN"),
    thanhToanController.getPaymentReconciliation
);

// Tao thanh toan MoMo
router.post(
    "/",
    protect,
    thanhToanController.createPayment
);

// Thanh toan gia lap DEV_MOCK
router.post(
    "/simulate",
    protect,
    thanhToanController.simulatePayment
);

// IPN: MoMo goi truc tiep, khong yeu cau JWT
// Chu ky duoc xac thuc trong Service
router.post(
    "/ipn",
    thanhToanController.handleIPN
);

// Redirect tu MoMo
// Khong dung Redirect de xac nhan thanh toan
router.get(
    "/return",
    thanhToanController.handleReturn
);

module.exports = router;
