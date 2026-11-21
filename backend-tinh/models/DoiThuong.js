
const mongoose = require("mongoose");

const DoiThuongSchema = new mongoose.Schema(
  {
    MaDoi: {
      type: String,
      required: true,
      trim: true
    },

    MaKH: {
      type: String,
      required: true
    },

    MaQua: {
      type: String,
      required: true
    },

    SoLuong: {
      type: Number,
      required: true,
      min: 1
    },

    DiemSuDung: {
      type: Number,
      required: true,
      min: 0
    },

    MaVoucher: {
      type: String,
      default: null
    },

    NgayDoi: {
      type: Date,
      required: true
    },

    HanSuDung: {
      type: Date,
      default: null
    },

    TrangThai: {
      type: String,
      required: true,
      enum: ["PENDING", "COMPLETED", "CANCELLED", "EXPIRED"]
    }
  },
  {
    collection: "doi_thuong",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("DoiThuong", DoiThuongSchema);
