const express = require("express");
const router = express.Router();

const sanPhamController = require("../controllers/sanPhamController");
const tonKhoController = require("../controllers/tonKhoController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// Catalog công khai chỉ hiển thị sản phẩm đang hoạt động.
router.get("/", sanPhamController.getProducts);
router.get("/admin", protect, allowRoles("ADMIN"), sanPhamController.getAdminProducts);
router.get("/admin/reconciliation/stock", protect, allowRoles("ADMIN"), tonKhoController.getReconciliation);
router.get("/admin/:MaSP", protect, allowRoles("ADMIN"), sanPhamController.getAdminProductById);
router.get("/:MaSP", sanPhamController.getPublicProductById);

router.post("/", protect, allowRoles("ADMIN"), sanPhamController.createProduct);
router.put("/:MaSP", protect, allowRoles("ADMIN"), sanPhamController.updateProduct);
router.patch("/:MaSP/status", protect, allowRoles("ADMIN"), sanPhamController.updateProductStatus);

module.exports = router;
