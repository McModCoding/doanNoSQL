
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const khachHangRoutes = require("./routes/khachHangRoutes");
const hangThanhVienRoutes = require("./routes/hangThanhVienRoutes");
const cumRapRoutes = require("./routes/cumRapRoutes");
const phongChieuRoutes = require("./routes/phongChieuRoutes");
const phimRoutes = require("./routes/phimRoutes");
const suatChieuRoutes = require("./routes/suatChieuRoutes");
const sanPhamRoutes = require("./routes/sanPhamRoutes");
const khuyenMaiRoutes = require("./routes/khuyenMaiRoutes");

const datVeRoutes = require("./routes/datVeRoutes");
const giaoDichRoutes = require("./routes/giaoDichRoutes");
const thanhToanRoutes = require("./routes/thanhToanRoutes");
const veRoutes = require("./routes/veRoutes");
const tichDiemRoutes = require("./routes/tichDiemRoutes");
const baoCaoRoutes = require("./routes/baoCaoRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Trang chu
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Cinema Loyalty Backend is running!"
    });
});

// Auth API - Nhom 1
app.use("/api/auth", authRoutes);

// Khach hang API - Nhom 2
app.use("/api/khach-hang", khachHangRoutes);
app.use("/api/hang-thanh-vien", hangThanhVienRoutes);
app.use("/api/cum-rap", cumRapRoutes);
app.use("/api/phong-chieu", phongChieuRoutes);
app.use("/api/phim", phimRoutes);
app.use("/api/suat-chieu", suatChieuRoutes);
app.use("/api/san-pham", sanPhamRoutes);
app.use("/api/khuyen-mai", khuyenMaiRoutes);

// API - Nhom 3
app.use("/api/dat-ve", datVeRoutes);
app.use("/api/giao-dich", giaoDichRoutes);
app.use("/api/thanh-toan", thanhToanRoutes);
app.use("/api/ve", veRoutes);
app.use("/api/tich-diem", tichDiemRoutes);
app.use("/api/bao-cao", baoCaoRoutes);

// Requiring this module only builds and exports the Express application.
module.exports = app;

// Preserve `node server.js` as a supported runtime entry point.
if (require.main === module) {
    require("./index").runServer();
}
