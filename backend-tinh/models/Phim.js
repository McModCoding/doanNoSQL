
const mongoose = require("mongoose");

const PhimSchema = new mongoose.Schema(
  {
    MaPhim: {
      type: String,
      required: true,
      trim: true
    },

    TenPhim: {
      type: String,
      required: true
    },

    TheLoai: {
      type: [String],
      required: true
    },

    DaoDien: {
      type: String,
      default: null
    },

    DienVien: {
      type: [String],
      required: true
    },

    ThoiLuong: {
      type: Number,
      required: true,
      min: 1
    },

    NgonNgu: {
      type: String,
      required: true
    },

    PhuDe: {
      type: String,
      default: null
    },

    PhanLoaiDoTuoi: {
      type: String,
      required: true,
      enum: ["P", "K", "T13", "T16", "T18"]
    },

    NgayKhoiChieu: {
      type: Date,
      required: true
    },

    NgayKetThuc: {
      type: Date,
      default: null
    },

    Poster: {
      type: String,
      default: null
    },

    TrangThai: {
      type: String,
      required: true,
      enum: ["COMING_SOON", "SHOWING", "ENDED"]
    }
  },
  {
    collection: "phim",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("Phim", PhimSchema);
