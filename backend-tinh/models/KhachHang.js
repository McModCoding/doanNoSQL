
const mongoose = require("mongoose");

const KhachHangSchema = new mongoose.Schema(
  {
    MaKH: {
      type: String,
      required: true,
      trim: true
    },

    HoTen: {
      type: String,
      required: true,
      trim: true
    },

    SDT: {
      type: String,
      required: true,
      trim: true
    },

    Email: {
      type: String,
      required: true,
      trim: true
    },

    MatKhauHash: {
      type: String,
      required: true
    },

    NgaySinh: {
      type: Date,
      default: null
    },

    GioiTinh: {
      type: String,
      default: null
    },

    NgayDangKy: {
      type: Date,
      required: true
    },

    MaTheThanhVien: {
      type: String,
      required: true
    },

    MaQR: {
      type: String,
      required: true
    },

    MaHangHienTai: {
      type: String,
      required: true
    },

    DiemHienTai: {
      type: Number,
      required: true,
      min: 0
    },

    TongDiemTichLuy: {
      type: Number,
      required: true,
      min: 0
    },

    TongChiTieuNam: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    NamXetHang: {
      type: Number,
      required: true
    },

    TrangThai: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"]
    },

    // Phân quyền tài khoản
    VaiTro: {
      type: String,
      required: true,
      enum: ["KHACHHANG", "ADMIN"],
      default: "KHACHHANG"
    }
  },
  {
    collection: "khach_hang",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("KhachHang", KhachHangSchema);
