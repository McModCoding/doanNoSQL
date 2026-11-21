
const suatChieuService = require("../services/suatChieuService");

// Lay danh sach suat chieu
const getAllShowtimes = async (req, res) => {
    try {
        const showtimes = await suatChieuService.getAllShowtimes(req.query);

        res.status(200).json({
            success: true,
            count: showtimes.length,
            data: showtimes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Lay chi tiet suat chieu
const getShowtimeById = async (req, res) => {
    try {
        const showtime = await suatChieuService.getShowtimeById(
            req.params.MaSuat
        );

        if (!showtime) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay suat chieu"
            });
        }

        res.status(200).json({
            success: true,
            data: showtime
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Them suat chieu
const createShowtime = async (req, res) => {
    try {
        const showtime = await suatChieuService.createShowtime(req.body);

        res.status(201).json({
            success: true,
            message: "Them suat chieu thanh cong",
            data: showtime
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Cap nhat thong tin suat chieu
const updateShowtime = async (req, res) => {
    try {
        const showtime = await suatChieuService.updateShowtime(
            req.params.MaSuat,
            req.body
        );

        if (!showtime) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay suat chieu"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cap nhat suat chieu thanh cong",
            data: showtime
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Cap nhat trang thai suat chieu
const updateShowtimeStatus = async (req, res) => {
    try {
        const showtime = await suatChieuService.updateShowtimeStatus(
            req.params.MaSuat,
            req.body.TrangThai
        );

        if (!showtime) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay suat chieu"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cap nhat trang thai suat chieu thanh cong",
            data: showtime
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllShowtimes,
    getShowtimeById,
    createShowtime,
    updateShowtime,
    updateShowtimeStatus
};
