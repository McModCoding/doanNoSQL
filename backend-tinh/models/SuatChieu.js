
const mongoose = require("mongoose");

// Schema ghế nằm bên trong DanhSachGhe
const GheSchema = new mongoose.Schema(
  {
    MaGhe: {
      type: String,
      required: true
    },

    HangGhe: {
      type: String,
      required: true
    },

    LoaiGhe: {
      type: String,
      required: true,
      enum: ["STANDARD", "VIP", "COUPLE"]
    },

    GiaPhuThu: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    TrangThai: {
      type: String,
      required: true,
      enum: [
        "AVAILABLE",
        "HELD",
        "BOOKED",
        "MAINTENANCE"
      ]
    },

    MaGDGiuCho: {
      type: String,
      default: null
    },

    ThoiGianGiuCho: {
      type: Date,
      default: null
    }
  },
  {
    _id: false,
    versionKey: false
  }
);

// Schema suất chiếu
const SuatChieuSchema = new mongoose.Schema(
  {
    MaSuat: {
      type: String,
      required: true,
      trim: true
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

    NgayChieu: {
      type: Date,
      required: true
    },

    GioBatDau: {
      type: String,
      required: true
    },

    GioKetThuc: {
      type: String,
      required: true
    },

    GiaVeCoBan: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    DanhSachGhe: {
      type: [GheSchema],
      required: true
    },

    TrangThai: {
      type: String,
      required: true,
      enum: ["SCHEDULED", "CANCELLED", "COMPLETED"]
    }
  },
  {
    collection: "suat_chieu",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("SuatChieu", SuatChieuSchema);
