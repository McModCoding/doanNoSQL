
const datVeService = require("../services/datVeService");

// Dat ve va giu ghe
const createBooking = async (req, res) => {
    try {
        // Lay MaKH tu JWT, khong lay tu Frontend
        const MaKH = req.user.MaKH;

        const { MaSuat, DanhSachGhe, DanhSachSanPham, MaKM = null } = req.body;

        // Kiem tra du lieu dau vao
        if (!MaKH) {
            return res.status(401).json({
                success: false,
                message: "Khong xac dinh duoc tai khoan dang nhap"
            });
        }

        if (
            !MaSuat ||
            !Array.isArray(DanhSachGhe) ||
            DanhSachGhe.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Vui long cung cap MaSuat va DanhSachGhe"
            });
        }

        if (DanhSachSanPham !== undefined && !Array.isArray(DanhSachSanPham)) {
            return res.status(400).json({
                success: false,
                message: "DanhSachSanPham phai la mang"
            });
        }

        // Kiem tra ghe trung lap
        const gheKhongTrung = [...new Set(DanhSachGhe)];

        if (gheKhongTrung.length !== DanhSachGhe.length) {
            return res.status(400).json({
                success: false,
                message: "Danh sach ghe khong duoc co ghe trung lap"
            });
        }

        // Goi Service xu ly dat ve
        const booking = await datVeService.createBooking({
            MaKH,
            MaSuat,
            DanhSachGhe,
            DanhSachSanPham,
            MaKM
        });

        return res.status(201).json({
            success: true,
            message: "Dat ve va giu ghe thanh cong",
            data: booking
        });

    } catch (error) {
        console.error("Create booking error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createBooking
};
