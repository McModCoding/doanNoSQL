
const KhachHang = require("../models/KhachHang");

// Lay danh sach khach hang
const getAllCustomers = async (filters = {}) => {
    const query = {};

    if (filters.TrangThai) {
        query.TrangThai = filters.TrangThai;
    }

    if (filters.keyword) {
        query.$or = [
            { MaKH: { $regex: filters.keyword, $options: "i" } },
            { HoTen: { $regex: filters.keyword, $options: "i" } },
            { Email: { $regex: filters.keyword, $options: "i" } },
            { SDT: { $regex: filters.keyword, $options: "i" } }
        ];
    }

    return KhachHang.find(query)
        .select("-MatKhauHash")
        .sort({ NgayDangKy: -1 });
};

// Lay chi tiet khach hang
const getCustomerById = async (MaKH) => {
    return KhachHang.findOne({ MaKH })
        .select("-MatKhauHash");
};

// Cap nhat thong tin khach hang
const updateCustomer = async (MaKH, data) => {
    const allowedFields = [
        "HoTen",
        "SDT",
        "Email",
        "NgaySinh",
        "GioiTinh"
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

    return KhachHang.findOneAndUpdate(
        { MaKH },
        { $set: updateData },
        {
            new: true,
            runValidators: true
        }
    ).select("-MatKhauHash");
};

// Cap nhat trang thai khach hang
const updateCustomerStatus = async (MaKH, TrangThai) => {
    const allowedStatus = ["ACTIVE", "INACTIVE", "BLOCKED"];

    if (!allowedStatus.includes(TrangThai)) {
        throw new Error("Trang thai khong hop le");
    }

    return KhachHang.findOneAndUpdate(
        { MaKH },
        { $set: { TrangThai } },
        {
            new: true,
            runValidators: true
        }
    ).select("-MatKhauHash");
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    updateCustomerStatus
};
