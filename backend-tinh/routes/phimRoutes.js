
const express = require("express");
const router = express.Router();

const phimController = require("../controllers/phimController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// Danh sach phim
router.get("/", phimController.getAllMovies);

// Chi tiet phim
router.get("/:MaPhim", phimController.getMovieById);

// Them phim
router.post("/", protect, allowRoles("ADMIN"), phimController.createMovie);

// Cap nhat thong tin phim
router.put("/:MaPhim", protect, allowRoles("ADMIN"), phimController.updateMovie);

// Cap nhat trang thai
router.patch(
    "/:MaPhim/status",
    protect,
    allowRoles("ADMIN"),
    phimController.updateMovieStatus
);

module.exports = router;
