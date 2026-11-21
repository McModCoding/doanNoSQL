
const mongoose = require("mongoose");

const PhongChieuSchema = new mongoose.Schema(
  {
    MaPhong: {
      type: String,
      required: true,
      trim: true
    },

    MaRap: {
      type: String,
      required: true,
      trim: true
    },

    TenPhong: {
      type: String,
      required: true
    },

    LoaiPhong: {
      type: String,
      required: true,
      enum: ["2D", "3D", "IMAX", "4DX"]
    },

    SoHangGhe: {
      type: Number,
      required: true,
      min: 1
    },

    SoCotGhe: {
      type: Number,
      required: true,
      min: 1
    },

    SucChua: {
      type: Number,
      required: true,
      min: 1
    },

    TrangThai: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE"]
    }
  },
  {
    collection: "phong_chieu",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("PhongChieu", PhongChieuSchema);
