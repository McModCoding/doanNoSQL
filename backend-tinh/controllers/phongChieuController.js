
const phongChieuService = require("../services/phongChieuService");

// GET danh sach phong chieu
const getAllRooms = async (req, res) => {
    try {
        const rooms = await phongChieuService.getAllRooms(req.query);

        return res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET chi tiet phong chieu
const getRoomById = async (req, res) => {
    try {
        const room = await phongChieuService.getRoomById(req.params.MaPhong);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay phong chieu"
            });
        }

        return res.status(200).json({
            success: true,
            data: room
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// POST them phong chieu
const createRoom = async (req, res) => {
    try {
        const room = await phongChieuService.createRoom(req.body);

        return res.status(201).json({
            success: true,
            message: "Them phong chieu thanh cong",
            data: room
        });
    } catch (error) {
        return res.status(error.code === 11000 ? 409 : 400).json({
            success: false,
            message: error.code === 11000
                ? "Ma phong chieu da ton tai"
                : error.message
        });
    }
};

// PUT cap nhat phong chieu
const updateRoom = async (req, res) => {
    try {
        const room = await phongChieuService.updateRoom(
            req.params.MaPhong,
            req.body
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay phong chieu"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cap nhat phong chieu thanh cong",
            data: room
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// PATCH cap nhat trang thai
const updateRoomStatus = async (req, res) => {
    try {
        const room = await phongChieuService.updateRoomStatus(
            req.params.MaPhong,
            req.body.TrangThai
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay phong chieu"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cap nhat trang thai phong chieu thanh cong",
            data: room
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    updateRoomStatus
};
