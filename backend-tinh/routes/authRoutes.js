
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Dang ky
router.post("/register", authController.register);

// Dang nhap
router.post("/login", authController.login);

// Lay thong tin tai khoan
router.get("/me", protect, authController.getMe);

// Doi mat khau
router.put("/change-password", protect, authController.changePassword);

// Dang xuat
router.post("/logout", protect, authController.logout);

module.exports = router;
