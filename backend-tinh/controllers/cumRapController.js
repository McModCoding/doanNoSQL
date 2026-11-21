
const cumRapService = require("../services/cumRapService");

// GET danh sach cum rap
const getAllCinemas = async (req, res) => {
    try {
        const cinemas = await cumRapService.getAllCinemas(req.query);

        return res.status(200).json({
            success: true,
            count: cinemas.length,
            data: cinemas
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET chi tiet cum rap
const getCinemaById = async (req, res) => {
    try {
        const cinema = await cumRapService.getCinemaById(req.params.MaRap);

        if (!cinema) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay cum rap"
            });
        }

        return res.status(200).json({
            success: true,
            data: cinema
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// POST them cum rap
const createCinema = async (req, res) => {
    try {
        const cinema = await cumRapService.createCinema(req.body);

        return res.status(201).json({
            success: true,
            message: "Them cum rap thanh cong",
            data: cinema
        });
    } catch (error) {
        return res.status(error.code === 11000 ? 409 : 400).json({
            success: false,
            message: error.code === 11000
                ? "Ma cum rap da ton tai"
                : error.message
        });
    }
};

// PUT cap nhat cum rap
const updateCinema = async (req, res) => {
    try {
        const cinema = await cumRapService.updateCinema(
            req.params.MaRap,
            req.body
        );

        if (!cinema) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay cum rap"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cap nhat cum rap thanh cong",
            data: cinema
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// PATCH cap nhat trang thai
const updateCinemaStatus = async (req, res) => {
    try {
        const cinema = await cumRapService.updateCinemaStatus(
            req.params.MaRap,
            req.body.TrangThai
        );

        if (!cinema) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay cum rap"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cap nhat trang thai cum rap thanh cong",
            data: cinema
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllCinemas,
    getCinemaById,
    createCinema,
    updateCinema,
    updateCinemaStatus
};
