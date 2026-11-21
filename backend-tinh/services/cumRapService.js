
const CumRap = require("../models/CumRap");

// Lay danh sach cum rap
const getAllCinemas = async (filters = {}) => {
    const query = {};

    if (filters.TrangThai) {
        query.TrangThai = filters.TrangThai;
    }

    if (filters.keyword) {
        query.$or = [
            { MaRap: { $regex: filters.keyword, $options: "i" } },
            { TenRap: { $regex: filters.keyword, $options: "i" } },
            { ThanhPho: { $regex: filters.keyword, $options: "i" } }
        ];
    }

    return CumRap.find(query).sort({ MaRap: 1 });
};

// Lay chi tiet cum rap
const getCinemaById = async (MaRap) => {
    return CumRap.findOne({ MaRap });
};

// Them cum rap
const createCinema = async (data) => {
    const {
        MaRap,
        TenRap,
        DiaChi,
        ThanhPho,
        SoDienThoai,
        GioMoCua,
        GioDongCua,
        TrangThai
    } = data;

    if (!MaRap || !TenRap || !DiaChi || !ThanhPho || !TrangThai) {
        throw new Error("Vui long nhap day du thong tin bat buoc");
    }

    const existing = await CumRap.findOne({ MaRap });

    if (existing) {
        throw new Error("Ma cum rap da ton tai");
    }

    return CumRap.create({
        MaRap,
        TenRap,
        DiaChi,
        ThanhPho,
        SoDienThoai: SoDienThoai ?? null,
        GioMoCua: GioMoCua ?? null,
        GioDongCua: GioDongCua ?? null,
        TrangThai
    });
};

// Cap nhat thong tin cum rap
const updateCinema = async (MaRap, data) => {
    const allowedFields = [
        "TenRap",
        "DiaChi",
        "ThanhPho",
        "SoDienThoai",
        "GioMoCua",
        "GioDongCua"
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

    return CumRap.findOneAndUpdate(
        { MaRap },
        { $set: updateData },
        {
            new: true,
            runValidators: true
        }
    );
};

// Cap nhat trang thai cum rap
const updateCinemaStatus = async (MaRap, TrangThai) => {
    if (!["ACTIVE", "INACTIVE"].includes(TrangThai)) {
        throw new Error("Trang thai khong hop le");
    }

    return CumRap.findOneAndUpdate(
        { MaRap },
        { $set: { TrangThai } },
        {
            new: true,
            runValidators: true
        }
    );
};

module.exports = {
    getAllCinemas,
    getCinemaById,
    createCinema,
    updateCinema,
    updateCinemaStatus
};
