
const mongoose = require("mongoose");

// Chi tiet ve trong giao dich
const ChiTietVeSchema = new mongoose.Schema(
  {
    MaVe: {
      type: String
    },

    MaSuat: {
      type: String,
      required: true
    },

    MaGhe: {
      type: String,
      required: true
    },

    LoaiGhe: {
      type: String,
      required: true,
      enum: ["STANDARD", "VIP", "COUPLE"]
    },

    GiaVe: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    }
  },
  {
    _id: false,
    versionKey: false
  }
);

// Chi tiet combo trong giao dich
const ChiTietThanhPhanSchema = new mongoose.Schema(
  {
    MaSP: { type: String, required: true },
    TenSP: { type: String, required: true },
    LoaiSP: { type: String, required: true, enum: ["BAP", "NUOC", "SNACK"] },
    SoLuong: { type: Number, required: true, min: 1 }
  },
  { _id: false, versionKey: false }
);

const ChiTietComboSchema = new mongoose.Schema(
  {
    MaSP: {
      type: String,
      required: true
    },

    TenSP: {
      type: String,
      required: true
    },

    LoaiSP: {
      type: String,
      enum: ["BAP", "NUOC", "SNACK", "COMBO"],
      default: null
    },

    SoLuong: {
      type: Number,
      required: true,
      min: 1
    },

    DonGia: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    ThanhTien: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    // Snapshot thanh phan combo de tham chieu dung product mix luc dat hang.
    ThanhPhan: {
      type: [ChiTietThanhPhanSchema],
      default: []
    }
  },
  {
    _id: false,
    versionKey: false
  }
);

// Model giao dich
const GiaoDichSchema = new mongoose.Schema(
  {
    MaGD: {
      type: String,
      required: true,
      trim: true
    },

    MaKH: {
      type: String,
      required: true
    },

    LoaiGiaoDich: {
      type: String,
      required: true,
      enum: ["DAT_VE", "MUA_COMBO", "HON_HOP"]
    },

    ChiTietVe: {
      type: [ChiTietVeSchema],
      default: []
    },

    ChiTietCombo: {
      type: [ChiTietComboSchema],
      default: []
    },

    TamTinh: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    SoTienGiam: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    // Snapshot phan bo giam gia de E3 tinh diem tren cac muc tien sau giam.
    SoTienGiamVe: {
      type: mongoose.Schema.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString("0"),
      min: 0
    },

    SoTienGiamSanPham: {
      type: mongoose.Schema.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString("0"),
      min: 0
    },

    TongTien: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0
    },

    MaKM: {
      type: String,
      default: null
    },

    DiemDuKien: {
      type: Number,
      required: true,
      min: 0
    },

    TrangThai: {
      type: String,
      required: true,
      enum: [
        "PENDING_PAYMENT",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED"
      ]
    },

    NgayTao: {
      type: Date,
      required: true
    },

    NgayHoanTat: {
      type: Date,
      default: null
    }
  },
  {
    collection: "giao_dich",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

module.exports = mongoose.model("GiaoDich", GiaoDichSchema);
