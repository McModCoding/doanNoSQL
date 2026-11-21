
const mongoose = require("mongoose");

const LichSuHangSchema = new mongoose.Schema(
  {
    MaLichSu: {
      type: String,
      required: true,
      trim: true
    },

    MaKH: {
      type: String,
      required: true,
      trim: true
    },

    MaHangCu: {
      type: String,
      default: null
    },

    MaHangMoi: {
      type: String,
      required: true,
      trim: true
    },

    NgayThayDoi: {
      type: Date,
      required: true
    },

    NamXetHang: {
      type: Number,
      required: true
    },

    LyDo: {
      type: String,
      required: true
    }
  },
  {
    collection: "lich_su_hang",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

LichSuHangSchema.index(
  { MaLichSu: 1 },
  { unique: true, name: "uq_lich_su_hang_ma_lich_su" }
);

module.exports = mongoose.model("LichSuHang", LichSuHangSchema);
