
const mongoose = require("mongoose");

const BienDongDiemSchema = new mongoose.Schema(
  {
    MaLedger: {
      type: String,
      required: true,
      trim: true
    },

    MaKH: {
      type: String,
      required: true
    },

    MaGD: {
      type: String,
      default: null
    },

    MaDoi: {
      type: String,
      default: null
    },

    Loai: {
      type: String,
      required: true,
      enum: ["EARN", "REDEEM", "BONUS", "EXPIRE", "ADJUST", "REVERSE"]
    },

    SoDiem: {
      type: Number,
      required: true
    },

    NgayPhatSinh: {
      type: Date,
      required: true
    },

    NgayHetHan: {
      type: Date,
      default: null
    },

    LyDo: {
      type: String,
      required: true
    },

    TrangThai: {
      type: String,
      required: true,
      enum: ["PENDING", "PROCESSING", "POSTED", "REVERSED"]
    },

    IdempotencyKey: {
      type: String,
      required: true
    }
  },
  {
    collection: "bien_dong_diem",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

// Required for cross-process idempotency; autoIndex is disabled, so deployment
// must run the guarded migration after its duplicate-data preflight.
BienDongDiemSchema.index(
  { IdempotencyKey: 1 },
  { unique: true, name: "uq_bien_dong_diem_idempotency" }
);

module.exports = mongoose.model("BienDongDiem", BienDongDiemSchema);
