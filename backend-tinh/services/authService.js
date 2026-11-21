
const KhachHang = require("../models/KhachHang");
const HangThanhVien = require("../models/HangThanhVien");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const crypto = require("crypto");
const generateToken = require("../utils/generateToken");

// Tao ma khach hang va ma the duy nhat
const generateCustomerCode = () => {
    return "KH" + Date.now() + crypto.randomBytes(2).toString("hex").toUpperCase();
};

const generateMemberCode = () => {
    return "THE" + crypto.randomBytes(6).toString("hex").toUpperCase();
};

const generateQRCode = () => {
    return "QR_MEMBER_" + crypto.randomBytes(8).toString("hex").toUpperCase();
};

// Dang ky tai khoan
const register = async (data) => {
    const {
        HoTen,
        SDT,
        Email,
        MatKhau,
        NgaySinh,
        GioiTinh
    } = data;

    const defaultTier = "H01";

    // Kiem tra email hoac SDT da ton tai
    const existingCustomer = await KhachHang.findOne({
        $or: [
            { Email: Email.toLowerCase().trim() },
            { SDT: SDT.trim() }
        ]
    });

    if (existingCustomer) {
        throw new Error("Email hoac so dien thoai da duoc su dung");
    }

    // Ma hoa mat khau
    const hashedPassword = await bcrypt.hash(MatKhau, 12);

    // Kiem tra sat truoc khi tao customer de thu hep cua so race voi thay doi trang thai hạng.
    const tier = await HangThanhVien.findOne({
        MaHang: defaultTier,
        TrangThai: "ACTIVE"
    }).select("MaHang -_id").lean();

    if (!tier) {
        const error = new Error(
            "Hang thanh vien mac dinh H01 khong ton tai hoac khong hoat dong; khong the dang ky"
        );
        error.code = "DEFAULT_TIER_UNAVAILABLE";
        error.statusCode = 503;
        throw error;
    }

    const customer = new KhachHang({
        MaKH: generateCustomerCode(),
        HoTen: HoTen.trim(),
        SDT: SDT.trim(),
        Email: Email.toLowerCase().trim(),
        MatKhauHash: hashedPassword,
        NgaySinh: NgaySinh || null,
        GioiTinh: GioiTinh || null,
        NgayDangKy: new Date(),
        MaTheThanhVien: generateMemberCode(),
        MaQR: generateQRCode(),
        MaHangHienTai: defaultTier,
        DiemHienTai: 0,
        TongDiemTichLuy: 0,
        TongChiTieuNam: mongoose.Types.Decimal128.fromString("0"),
        NamXetHang: new Date().getFullYear(),
        TrangThai: "ACTIVE",
        VaiTro: "KHACHHANG"
    });

    await customer.save();

    const token = generateToken(customer);

    return {
        customer: {
            MaKH: customer.MaKH,
            HoTen: customer.HoTen,
            Email: customer.Email,
            SDT: customer.SDT,
            MaTheThanhVien: customer.MaTheThanhVien,
            MaHangHienTai: customer.MaHangHienTai,
            DiemHienTai: customer.DiemHienTai,
            TrangThai: customer.TrangThai,
            VaiTro: customer.VaiTro
        },
        token
    };
};

// Dang nhap
const login = async (identifier, MatKhau) => {
    const customer = await KhachHang.findOne({
        $or: [
            { Email: identifier.toLowerCase().trim() },
            { SDT: identifier.trim() }
        ]
    });

    if (!customer) {
        throw new Error("Tai khoan hoac mat khau khong chinh xac");
    }

    if (customer.TrangThai !== "ACTIVE") {
        throw new Error("Tai khoan khong duoc phep dang nhap");
    }

    const isMatch = await bcrypt.compare(
        MatKhau,
        customer.MatKhauHash
    );

    if (!isMatch) {
        throw new Error("Tai khoan hoac mat khau khong chinh xac");
    }

    const token = generateToken(customer);

    return {
        customer: {
            MaKH: customer.MaKH,
            HoTen: customer.HoTen,
            Email: customer.Email,
            SDT: customer.SDT,
            MaHangHienTai: customer.MaHangHienTai,
            DiemHienTai: customer.DiemHienTai,
            TrangThai: customer.TrangThai,
            VaiTro: customer.VaiTro || "KHACHHANG"
        },
        token
    };
};

// Lay thong tin tai khoan hien tai
const getMe = async (MaKH) => {
    const customer = await KhachHang.findOne({ MaKH }).select("-MatKhauHash");

    if (!customer) {
        throw new Error("Khong tim thay tai khoan");
    }

    return customer;
};

// Doi mat khau
const changePassword = async (MaKH, oldPassword, newPassword) => {
    const customer = await KhachHang.findOne({ MaKH });

    if (!customer) {
        throw new Error("Khong tim thay tai khoan");
    }

    const isMatch = await bcrypt.compare(
        oldPassword,
        customer.MatKhauHash
    );

    if (!isMatch) {
        throw new Error("Mat khau hien tai khong chinh xac");
    }

    if (oldPassword === newPassword) {
        throw new Error("Mat khau moi phai khac mat khau cu");
    }

    customer.MatKhauHash = await bcrypt.hash(newPassword, 12);

    await customer.save();

    return {
        message: "Doi mat khau thanh cong"
    };
};

module.exports = {
    register,
    login,
    getMe,
    changePassword
};
