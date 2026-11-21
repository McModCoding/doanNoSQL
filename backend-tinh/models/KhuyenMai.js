
const mongoose = require("mongoose");

const KhuyenMaiSchema = new mongoose.Schema(
  {
    MaKM: {
      type: String,
      required: true,
      trim: true
    },

    TenKM: {
      type: String,
      required: true
    },

    LoaiKM: {
      type: String,
      required: true,
      enum: ["GIAM_GIA", "TANG_DIEM", "GIA_VE"]
    },

    GiaTriKM: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    HeSoDiem: {
      type: Number,
      default: null,
      min: 0
    },

    HangApDung: {
      type: [String],
      default: []
    },

    NgayBatDau: {
      type: Date,
      required: true
    },

    NgayKetThuc: {
      type: Date,
      required: true
    },

    DieuKienApDung: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    TrangThai: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE"]
    }
  },
  {
    collection: "khuyen_mai",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("KhuyenMai", KhuyenMaiSchema);
