const mongoose = require("mongoose");

const MucTruKhoSchema = new mongoose.Schema({
    MaSP: { type: String, required: true, trim: true },
    SoLuong: { type: Number, required: true, min: 1 },
    TrangThai: {
        type: String,
        required: true,
        enum: ["PENDING", "PROCESSING", "APPLIED", "RECONCILIATION_REQUIRED"]
    }
}, { _id: false, versionKey: false });

const LichSuTonKhoSchema = new mongoose.Schema({
    MaGD: { type: String, required: true, trim: true },
    MaKH: { type: String, required: true, trim: true },
    DanhSachTruKho: { type: [MucTruKhoSchema], required: true },
    TrangThai: {
        type: String,
        required: true,
        enum: ["PENDING", "PROCESSING", "POSTED", "RECONCILIATION_REQUIRED"]
    },
    LyDoDoiSoat: { type: String, default: null },
    NgayTao: { type: Date, required: true },
    NgayCapNhat: { type: Date, required: true }
}, {
    collection: "lich_su_ton_kho",
    timestamps: false,
    versionKey: false,
    strict: true,
    autoIndex: false
});

LichSuTonKhoSchema.index(
    { MaGD: 1 },
    { unique: true, name: "uq_lich_su_ton_kho_magd" }
);

module.exports = mongoose.model("LichSuTonKho", LichSuTonKhoSchema);
