
const mongoose = require("mongoose");

const CumRapSchema = new mongoose.Schema(
  {
    MaRap: {
      type: String,
      required: true,
      trim: true
    },

    TenRap: {
      type: String,
      required: true
    },

    DiaChi: {
      type: String,
      required: true
    },

    ThanhPho: {
      type: String,
      required: true
    },

    SoDienThoai: {
      type: String,
      default: null
    },

    GioMoCua: {
      type: String,
      default: null
    },

    GioDongCua: {
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
    collection: "cum_rap",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("CumRap", CumRapSchema);
