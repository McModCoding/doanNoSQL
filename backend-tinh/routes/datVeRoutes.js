const express = require("express");
const router = express.Router();

const datVeController = require("../controllers/datVeController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", datVeController.createBooking);

module.exports = router;