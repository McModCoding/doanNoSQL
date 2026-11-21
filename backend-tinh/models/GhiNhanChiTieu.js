const mongoose = require("mongoose");

const GhiNhanChiTieuSchema = new mongoose.Schema(
  {
    IdempotencyKey: { type: String, required: true, trim: true },
    MaGD: { type: String, required: true, trim: true },
    MaThanhToan: { type: String, default: null },
    MaKH: { type: String, required: true, trim: true },
    NamChiTieu: { type: Number, required: true },
    SoTien: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
    LoaiSuKien: { type: String, enum: ["SPEND", "REFUND_REVIEW"], required: true },
    TrangThai: {
      type: String,
      enum: ["PENDING", "PROCESSING", "CUSTOMER_UPDATED", "POSTED", "RECONCILIATION_REQUIRED"],
      required: true
    },
    DaXacMinh: { type: Boolean, required: true, default: false },
    MaHangCu: { type: String, default: null },
    MaHangMoi: { type: String, default: null },
    TongChiTieuSau: { type: mongoose.Schema.Types.Decimal128, default: null },
    NamXetHang: { type: Number, default: null },
    MaLichSu: { type: String, default: null },
    ChiTieuLichSu: { type: Boolean, default: false },
    ChiTieuCuNam: { type: Boolean, default: false },
    LockToken: { type: String, default: null },
    LockUntil: { type: Date, default: null },
    CanDoiSoatRefund: { type: Boolean, default: false },
    RefundCheckedAt: { type: Date, default: null },
    LyDoDoiSoat: { type: String, default: null },
    NgayPhatSinh: { type: Date, required: true },
    NgayTao: { type: Date, required: true },
    NgayCapNhat: { type: Date, required: true }
  },
  {
    collection: "ghi_nhan_chi_tieu",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
  }
);

GhiNhanChiTieuSchema.index({ IdempotencyKey: 1 }, { unique: true, name: "uq_chi_tieu_idempotency" });
GhiNhanChiTieuSchema.index({ MaKH: 1, NamChiTieu: 1, TrangThai: 1 }, { name: "ix_chi_tieu_customer_year_status" });
GhiNhanChiTieuSchema.index({ TrangThai: 1, DaXacMinh: 1, CanDoiSoatRefund: 1, RefundCheckedAt: 1, NgayTao: 1 }, { name: "ix_chi_tieu_recovery_scan" });

module.exports = mongoose.model("GhiNhanChiTieu", GhiNhanChiTieuSchema);
