
const phimService = require("../services/phimService");

// Lay danh sach phim
const getAllMovies = async (req, res) => {
    try {
        const movies = await phimService.getAllMovies(req.query);

        res.status(200).json({
            success: true,
            count: movies.length,
            data: movies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Lay chi tiet phim
const getMovieById = async (req, res) => {
    try {
        const movie = await phimService.getMovieById(req.params.MaPhim);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay phim"
            });
        }

        res.status(200).json({
            success: true,
            data: movie
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Them phim moi
const createMovie = async (req, res) => {
    try {
        const movie = await phimService.createMovie(req.body);

        res.status(201).json({
            success: true,
            message: "Them phim thanh cong",
            data: movie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Cap nhat thong tin phim
const updateMovie = async (req, res) => {
    try {
        const movie = await phimService.updateMovie(
            req.params.MaPhim,
            req.body
        );

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay phim"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cap nhat phim thanh cong",
            data: movie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Cap nhat trang thai phim
const updateMovieStatus = async (req, res) => {
    try {
        const movie = await phimService.updateMovieStatus(
            req.params.MaPhim,
            req.body.TrangThai
        );

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay phim"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cap nhat trang thai phim thanh cong",
            data: movie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllMovies,
    getMovieById,
    createMovie,
    updateMovie,
    updateMovieStatus
};
