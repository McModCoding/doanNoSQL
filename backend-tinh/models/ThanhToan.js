
const mongoose = require("mongoose");

const ThanhToanSchema = new mongoose.Schema(
  {
    MaThanhToan: {
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

    PhuongThuc: {
      type: String,
      required: true,
      enum: ["MOMO", "DEV_MOCK"]
    },

    SoTien: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    MaGiaoDichMoMo: {
      type: String,
      default: null
    },

    TrangThai: {
      type: String,
      required: true,
      enum: [
        "PENDING",
        "SUCCESS",
        "FAILED",
        "CANCELLED",
        "REFUNDED"
      ]
    },

    ThoiGianTao: {
      type: Date,
      required: true
    },

    ThoiGianThanhToan: {
      type: Date,
      default: null
    },

    NoiDung: {
      type: String,
      default: null
    },

    CanDoiSoat: {
      type: Boolean,
      default: false
    },

    LyDoDoiSoat: {
      type: String,
      default: null
    },

    NgayKiemTraTrangThaiMoMo: {
      type: Date,
      default: null
    }
  },
  {
    collection: "thanh_toan",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("ThanhToan", ThanhToanSchema);
