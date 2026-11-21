
const mongoose = require("mongoose");

const PhanThuongSchema = new mongoose.Schema(
  {
    MaQua: {
      type: String,
      required: true,
      trim: true
    },

    TenQua: {
      type: String,
      required: true
    },

    LoaiQua: {
      type: String,
      required: true,
      enum: ["VOUCHER_VE", "VOUCHER_COMBO", "QUA_TANG"]
    },

    DiemCan: {
      type: Number,
      required: true,
      min: 0
    },

    MoTa: {
      type: String,
      default: null
    },

    GiaTriGiam: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
      min: 0
    },

    SoLuongTon: {
      type: Number,
      required: true,
      min: 0
    },

    NgayBatDau: {
      type: Date,
      required: true
    },

    NgayKetThuc: {
      type: Date,
      required: true
    },

    TrangThai: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE"]
    }
  },
  {
    collection: "phan_thuong",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("PhanThuong", PhanThuongSchema);
