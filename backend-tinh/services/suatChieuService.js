
const SuatChieu = require("../models/SuatChieu");
const Phim = require("../models/Phim");
const CumRap = require("../models/CumRap");
const PhongChieu = require("../models/PhongChieu");

// Lay danh sach suat chieu
const getAllShowtimes = async (filters = {}) => {
    const query = {};

    if (filters.MaPhim) {
        query.MaPhim = filters.MaPhim;
    }

    if (filters.MaRap) {
        query.MaRap = filters.MaRap;
    }

    if (filters.MaPhong) {
        query.MaPhong = filters.MaPhong;
    }

    if (filters.TrangThai) {
        query.TrangThai = filters.TrangThai;
    }

    if (filters.NgayChieu) {
        const start = new Date(filters.NgayChieu);
        const end = new Date(filters.NgayChieu);

        end.setDate(end.getDate() + 1);

        query.NgayChieu = {
            $gte: start,
            $lt: end
        };
    }

    return SuatChieu.find(query).sort({
        NgayChieu: 1,
        GioBatDau: 1
    });
};

// Lay chi tiet suat chieu
const getShowtimeById = async (MaSuat) => {
    return SuatChieu.findOne({ MaSuat });
};

// Them suat chieu moi
const createShowtime = async (data) => {
    const {
        MaSuat,
        MaPhim,
        MaRap,
        MaPhong,
        NgayChieu,
        GioBatDau,
        GioKetThuc,
        GiaVeCoBan,
        DanhSachGhe,
        TrangThai
    } = data;

    if (
        !MaSuat || !MaPhim || !MaRap || !MaPhong ||
        !NgayChieu || !GioBatDau || !GioKetThuc ||
        GiaVeCoBan === undefined ||
        !Array.isArray(DanhSachGhe) ||
        !TrangThai
    ) {
        throw new Error("Vui long nhap day du thong tin bat buoc");
    }

    // Kiem tra phim co ton tai
    const movie = await Phim.findOne({ MaPhim });

    if (!movie) {
        throw new Error("Phim khong ton tai");
    }

    // Kiem tra cum rap co ton tai
    const cinema = await CumRap.findOne({ MaRap });

    if (!cinema) {
        throw new Error("Cum rap khong ton tai");
    }

    // Kiem tra phong chieu co ton tai
    const room = await PhongChieu.findOne({
        MaPhong,
        MaRap
    });

    if (!room) {
        throw new Error("Phong chieu khong ton tai hoac khong thuoc cum rap nay");
    }

    // Kiem tra ma suat chieu trung
    const existing = await SuatChieu.findOne({ MaSuat });

    if (existing) {
        throw new Error("Ma suat chieu da ton tai");
    }

    return SuatChieu.create(data);
};

// Cap nhat thong tin suat chieu
const updateShowtime = async (MaSuat, data) => {
    const allowedFields = [
        "MaPhim",
        "MaRap",
        "MaPhong",
        "NgayChieu",
        "GioBatDau",
        "GioKetThuc",
        "GiaVeCoBan",
        "DanhSachGhe"
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

    const currentShowtime = await SuatChieu.findOne({ MaSuat });

    if (!currentShowtime) {
        return null;
    }

    // Kiem tra phim
    const MaPhimMoi = updateData.MaPhim || currentShowtime.MaPhim;
    const movie = await Phim.findOne({ MaPhim: MaPhimMoi });

    if (!movie) {
        throw new Error("Phim khong ton tai");
    }

    // Kiem tra cum rap va phong chieu
    const MaRapMoi = updateData.MaRap || currentShowtime.MaRap;
    const MaPhongMoi = updateData.MaPhong || currentShowtime.MaPhong;

    const room = await PhongChieu.findOne({
        MaPhong: MaPhongMoi,
        MaRap: MaRapMoi
    });

    if (!room) {
        throw new Error("Phong chieu khong ton tai hoac khong thuoc cum rap nay");
    }

    return SuatChieu.findOneAndUpdate(
        { MaSuat },
        { $set: updateData },
        {
            new: true,
            runValidators: true
        }
    );
};

// Cap nhat trang thai suat chieu
const updateShowtimeStatus = async (MaSuat, TrangThai) => {
    if (!["SCHEDULED", "CANCELLED", "COMPLETED"].includes(TrangThai)) {
        throw new Error("Trang thai suat chieu khong hop le");
    }

    return SuatChieu.findOneAndUpdate(
        { MaSuat },
        { $set: { TrangThai } },
        {
            new: true,
            runValidators: true
        }
    );
};

module.exports = {
    getAllShowtimes,
    getShowtimeById,
    createShowtime,
    updateShowtime,
    updateShowtimeStatus
};
