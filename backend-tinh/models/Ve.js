
const mongoose = require("mongoose");

const VeSchema = new mongoose.Schema(
  {
    MaVe: {
      type: String,
      required: true,
      trim: true
    },

    MaGD: {
      type: String,
      required: true
    },

    MaKH: {
      type: String,
      required: true
    },

    MaSuat: {
      type: String,
      required: true
    },

    MaPhim: {
      type: String,
      required: true
    },

    MaRap: {
      type: String,
      required: true
    },

    MaPhong: {
      type: String,
      required: true
    },

    MaGhe: {
      type: String,
      required: true
    },

    GiaVe: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    MaQRTicket: {
      type: String,
      required: true
    },

    TrangThai: {
      type: String,
      required: true,
      enum: ["VALID", "USED", "CANCELLED", "REFUNDED"]
    },

    NgayPhatHanh: {
      type: Date,
      required: true
    },

    NgaySuDung: {
      type: Date,
      default: null
    }
  },
  {
    collection: "ve",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("Ve", VeSchema);
