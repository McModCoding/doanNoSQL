
const Phim = require("../models/Phim");

// Lay danh sach phim
const getAllMovies = async (filters = {}) => {
    const query = {};

    if (filters.TrangThai) {
        query.TrangThai = filters.TrangThai;
    }

    if (filters.PhanLoaiDoTuoi) {
        query.PhanLoaiDoTuoi = filters.PhanLoaiDoTuoi;
    }

    if (filters.keyword) {
        query.$or = [
            { MaPhim: { $regex: filters.keyword, $options: "i" } },
            { TenPhim: { $regex: filters.keyword, $options: "i" } },
            { DaoDien: { $regex: filters.keyword, $options: "i" } },
            { TheLoai: { $regex: filters.keyword, $options: "i" } }
        ];
    }

    return Phim.find(query).sort({ NgayKhoiChieu: -1 });
};

// Lay chi tiet phim
const getMovieById = async (MaPhim) => {
    return Phim.findOne({ MaPhim });
};

// Them phim moi
const createMovie = async (data) => {
    const {
        MaPhim,
        TenPhim,
        TheLoai,
        DienVien,
        ThoiLuong,
        NgonNgu,
        PhanLoaiDoTuoi,
        NgayKhoiChieu,
        TrangThai
    } = data;

    if (
        !MaPhim || !TenPhim ||
        !Array.isArray(TheLoai) || TheLoai.length === 0 ||
        !Array.isArray(DienVien) || DienVien.length === 0 ||
        ThoiLuong === undefined ||
        !NgonNgu || !PhanLoaiDoTuoi ||
        !NgayKhoiChieu || !TrangThai
    ) {
        throw new Error("Vui long nhap day du thong tin bat buoc");
    }

    // Kiem tra ma phim trung
    const existing = await Phim.findOne({ MaPhim });

    if (existing) {
        throw new Error("Ma phim da ton tai");
    }

    return Phim.create(data);
};

// Cap nhat thong tin phim
const updateMovie = async (MaPhim, data) => {
    const allowedFields = [
        "TenPhim",
        "TheLoai",
        "DaoDien",
        "DienVien",
        "ThoiLuong",
        "NgonNgu",
        "PhuDe",
        "PhanLoaiDoTuoi",
        "NgayKhoiChieu",
        "NgayKetThuc",
        "Poster"
    ];

    const updateData = {};

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field];
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error("Khong co thong tin hop le de cap nhat");
    }

    return Phim.findOneAndUpdate(
        { MaPhim },
        { $set: updateData },
        {
            new: true,
            runValidators: true
        }
    );
};

// Cap nhat trang thai phim
const updateMovieStatus = async (MaPhim, TrangThai) => {
    if (!["COMING_SOON", "SHOWING", "ENDED"].includes(TrangThai)) {
        throw new Error("Trang thai phim khong hop le");
    }

    return Phim.findOneAndUpdate(
        { MaPhim },
        { $set: { TrangThai } },
        {
            new: true,
            runValidators: true
        }
    );
};

module.exports = {
    getAllMovies,
    getMovieById,
    createMovie,
    updateMovie,
    updateMovieStatus
};
