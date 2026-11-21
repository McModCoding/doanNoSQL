
const mongoose = require("mongoose");

const ThanhPhanSchema = new mongoose.Schema(
  {
    MaSP: {
      type: String,
      required: true
    },

    SoLuong: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    _id: false,
    versionKey: false
  }
);

const SanPhamSchema = new mongoose.Schema(
  {
    MaSP: {
      type: String,
      required: true,
      trim: true
    },

    TenSP: {
      type: String,
      required: true
    },

    LoaiSP: {
      type: String,
      required: true,
      enum: ["BAP", "NUOC", "SNACK", "COMBO"]
    },

    MoTa: {
      type: String,
      default: null
    },

    GiaBan: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    ThanhPhan: {
      type: [ThanhPhanSchema],
      default: []
    },

    SoLuongTon: {
      type: Number,
      required: true,
      min: 0
    },

    HinhAnh: {
      type: String,
      default: null
    },

    TrangThai: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE"]
    }
  },
  {
    collection: "san_pham",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("SanPham", SanPhamSchema);
