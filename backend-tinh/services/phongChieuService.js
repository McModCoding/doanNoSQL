
const PhongChieu = require("../models/PhongChieu");
const CumRap = require("../models/CumRap");

// Lay danh sach phong chieu
const getAllRooms = async (filters = {}) => {
    const query = {};

    if (filters.MaRap) {
        query.MaRap = filters.MaRap;
    }

    if (filters.TrangThai) {
        query.TrangThai = filters.TrangThai;
    }

    if (filters.keyword) {
        query.$or = [
            { MaPhong: { $regex: filters.keyword, $options: "i" } },
            { TenPhong: { $regex: filters.keyword, $options: "i" } }
        ];
    }

    return PhongChieu.find(query).sort({ MaRap: 1, MaPhong: 1 });
};

// Lay chi tiet phong chieu
const getRoomById = async (MaPhong) => {
    return PhongChieu.findOne({ MaPhong });
};

// Them phong chieu
const createRoom = async (data) => {
    const {
        MaPhong,
        MaRap,
        TenPhong,
        LoaiPhong,
        SoHangGhe,
        SoCotGhe,
        SucChua,
        TrangThai
    } = data;

    if (
        !MaPhong || !MaRap || !TenPhong ||
        !LoaiPhong || SoHangGhe === undefined ||
        SoCotGhe === undefined || SucChua === undefined ||
        !TrangThai
    ) {
        throw new Error("Vui long nhap day du thong tin bat buoc");
    }

    // Kiem tra cum rap co ton tai
    const cinema = await CumRap.findOne({ MaRap });

    if (!cinema) {
        throw new Error("Cum rap khong ton tai");
    }

    // Kiem tra ma phong trung
    const existing = await PhongChieu.findOne({ MaPhong });

    if (existing) {
        throw new Error("Ma phong chieu da ton tai");
    }

    // Them phong chieu
    return PhongChieu.create({
        MaPhong,
        MaRap,
        TenPhong,
        LoaiPhong,
        SoHangGhe,
        SoCotGhe,
        SucChua,
        TrangThai
    });
};

// Cap nhat thong tin phong chieu
const updateRoom = async (MaPhong, data) => {
    const allowedFields = [
        "MaRap",
        "TenPhong",
        "LoaiPhong",
        "SoHangGhe",
        "SoCotGhe",
        "SucChua"
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

    const currentRoom = await PhongChieu.findOne({ MaPhong });

    if (!currentRoom) {
        return null;
    }

    // Kiem tra cum rap
    const MaRapMoi = updateData.MaRap || currentRoom.MaRap;

    const cinema = await CumRap.findOne({ MaRap: MaRapMoi });

    if (!cinema) {
        throw new Error("Cum rap khong ton tai");
    }

    // Cap nhat thong tin phong chieu
    return PhongChieu.findOneAndUpdate(
        { MaPhong },
        { $set: updateData },
        {
            new: true,
            runValidators: true
        }
    );
};

// Cap nhat trang thai phong chieu
const updateRoomStatus = async (MaPhong, TrangThai) => {
    if (!["ACTIVE", "INACTIVE"].includes(TrangThai)) {
        throw new Error("Trang thai khong hop le");
    }

    return PhongChieu.findOneAndUpdate(
        { MaPhong },
        { $set: { TrangThai } },
        {
            new: true,
            runValidators: true
        }
    );
};

module.exports = {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    updateRoomStatus
};
