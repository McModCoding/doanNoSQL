const express = require("express");
const router = express.Router();

const baoCaoController = require("../controllers/baoCaoController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.use(protect, allowRoles("ADMIN"));

router.get("/doanh-thu", baoCaoController.getRevenueReport);
router.get("/phim", baoCaoController.getFilmReport);
router.get("/ve", baoCaoController.getTicketReport);
router.get("/san-pham", baoCaoController.getProductReport);
router.get("/khach-hang", baoCaoController.getCustomerReport);

module.exports = router;
