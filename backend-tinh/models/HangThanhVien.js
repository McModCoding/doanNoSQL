
const mongoose = require("mongoose");

const HangThanhVienSchema = new mongoose.Schema(
  {
    MaHang: {
      type: String,
      required: true,
      trim: true
    },

    TenHang: {
      type: String,
      required: true,
      enum: ["Dong", "Bac", "Vang"]
    },

    MucChiTieuToiThieu: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    MucChiTieuToiDa: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
      min: 0
    },

    TyLeTichDiemVe: {
      type: Number,
      required: true,
      min: 0
    },

    TyLeTichDiemBapNuoc: {
      type: Number,
      required: true,
      min: 0
    },

    QuyenLoi: {
      type: [String],
      required: true,
      default: []
    },

    MoTa: {
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
    collection: "hang_thanh_vien",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("HangThanhVien", HangThanhVienSchema);
