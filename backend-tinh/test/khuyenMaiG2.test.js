const test = require("node:test");
const assert = require("node:assert/strict");
const loyalty = require("../services/tichDiemService");
const KhachHang = require("../models/KhachHang");
const SuatChieu = require("../models/SuatChieu");
const GiaoDich = require("../models/GiaoDich");
const SanPham = require("../models/SanPham");
const KhuyenMai = require("../models/KhuyenMai");
const datVeService = require("../services/datVeService");

const originals = [];
const replace = (target, key, value) => {
    originals.push([target, key, target[key]]);
    target[key] = value;
};
test.afterEach(() => {
    for (const [target, key, original] of originals.splice(0)) target[key] = original;
});
const {
    calculatePromotionDiscount,
    calculateTransactionAmounts,
    allocatePromotionDiscount
} = require("../services/datVeService");

const now = new Date("2026-11-20T12:00:00.000Z");
const customer = { MaHangHienTai: "H02" };
const promotion = (overrides = {}) => ({
    MaKM: "KM-1",
    LoaiKM: "GIAM_GIA",
    GiaTriKM: "15000",
    TrangThai: "ACTIVE",
    NgayBatDau: new Date("2026-11-01T00:00:00.000Z"),
    NgayKetThuc: new Date("2026-11-30T23:59:59.000Z"),
    HangApDung: [],
    DieuKienApDung: null,
    ...overrides
});

test("no promotion preserves existing booking totals", () => {
    assert.deepEqual(calculateTransactionAmounts({ ticketSubtotal: "100000", productSubtotal: "25000" }), {
        TamTinh: "125000", SoTienGiam: "0", TongTien: "125000", SoTienGiamVe: "0", SoTienGiamSanPham: "0"
    });
});

test("missing, inactive, expired, not-yet-active, unsupported and tier-restricted promotions fail closed", () => {
    assert.throws(() => calculatePromotionDiscount({ promotion: null, customer, ticketSubtotal: "1", transactionSubtotal: "1", now }), /khong ton tai/);
    assert.throws(() => calculatePromotionDiscount({ promotion: promotion({ TrangThai: "INACTIVE" }), customer, ticketSubtotal: "1", transactionSubtotal: "1", now }), /khong hoat dong/);
    assert.throws(() => calculatePromotionDiscount({ promotion: promotion({ NgayKetThuc: new Date("2026-11-19T23:59:59Z") }), customer, ticketSubtotal: "1", transactionSubtotal: "1", now }), /het han/);
    assert.throws(() => calculatePromotionDiscount({ promotion: promotion({ NgayBatDau: new Date("2026-11-21T00:00:00Z") }), customer, ticketSubtotal: "1", transactionSubtotal: "1", now }), /chua den/);
    assert.throws(() => calculatePromotionDiscount({ promotion: promotion({ LoaiKM: "TANG_DIEM" }), customer, ticketSubtotal: "1", transactionSubtotal: "1", now }), /TANG_DIEM/);
    assert.throws(() => calculatePromotionDiscount({ promotion: promotion({ HangApDung: ["H03"] }), customer, ticketSubtotal: "1", transactionSubtotal: "1", now }), /Hang thanh vien/);
    assert.throws(() => calculatePromotionDiscount({ promotion: promotion({ DieuKienApDung: { minSpend: 100 } }), customer, ticketSubtotal: "1", transactionSubtotal: "1", now }), /DieuKienApDung/);
});

test("GIAM_GIA applies to the complete subtotal and caps at the eligible amount", () => {
    const result = calculateTransactionAmounts({
        ticketSubtotal: "100000", productSubtotal: "50000",
        promotion: promotion({ GiaTriKM: "200000" }), customer, now
    });
    assert.deepEqual(result, {
        TamTinh: "150000", SoTienGiam: "150000", TongTien: "0",
        SoTienGiamVe: "100000", SoTienGiamSanPham: "50000"
    });
});

test("GIA_VE reduces tickets only, including mixed transactions", () => {
    const result = calculateTransactionAmounts({
        ticketSubtotal: "80000", productSubtotal: "50000",
        promotion: promotion({ LoaiKM: "GIA_VE", GiaTriKM: "100000" }), customer, now
    });
    assert.deepEqual(result, {
        TamTinh: "130000", SoTienGiam: "80000", TongTien: "50000",
        SoTienGiamVe: "80000", SoTienGiamSanPham: "0"
    });
});

test("GIAM_GIA discount allocation is proportional and conserves exact decimal total", () => {
    const result = calculateTransactionAmounts({
        ticketSubtotal: "100.00", productSubtotal: "50.00",
        promotion: promotion({ GiaTriKM: "10.01" }), customer, now
    });
    assert.equal(result.SoTienGiamVe, "6.67");
    assert.equal(result.SoTienGiamSanPham, "3.34");
    assert.equal(result.SoTienGiam, "10.01");
    assert.equal(result.TongTien, "139.99");
});

test("discount allocation rejects unsupported type and preserves zero product amount", () => {
    assert.deepEqual(allocatePromotionDiscount({ type: "GIA_VE", discount: "25", ticketSubtotal: "0", productSubtotal: "50" }), {
        SoTienGiamVe: "25", SoTienGiamSanPham: "0"
    });
    assert.throws(() => allocatePromotionDiscount({ type: "TANG_DIEM", discount: "0", ticketSubtotal: "10", productSubtotal: "10" }), /khong ho tro/);
});

test("E3 uses persisted post-discount ticket allocation without changing the tier formula", () => {
    const amounts = loyalty.getEligiblePointAmounts({
        LoaiGiaoDich: "HON_HOP",
        ChiTietVe: [{ GiaVe: "100000" }],
        ChiTietCombo: [{ LoaiSP: "BAP", ThanhTien: "50000" }],
        TamTinh: "150000",
        SoTienGiam: "15000",
        SoTienGiamVe: "10000",
        SoTienGiamSanPham: "5000",
        TongTien: "135000"
    });
    assert.equal(amounts.EligibleTicketAmount, 90000);
    assert.equal(amounts.EligiblePopcornBeverageAmount, 0);
    assert.equal(amounts.SkippedProductLineCount, 1);
});

test("mock booking persists server-calculated promotion totals and ignores client money", async () => {
    const dbPromotion = promotion({ GiaTriKM: "15000" });
    const product = {
        MaSP: "BAP01", TenSP: "Bap", LoaiSP: "BAP", GiaBan: "50000",
        SoLuongTon: 10, TrangThai: "ACTIVE", ThanhPhan: []
    };
    const showtime = {
        MaSuat: "S-1", TrangThai: "SCHEDULED", GiaVeCoBan: "100000",
        DanhSachGhe: [{ MaGhe: "A1", LoaiGhe: "STANDARD", GiaPhuThu: "0" }]
    };
    let persisted;
    replace(KhachHang, "findOne", async () => ({ MaKH: "KH-1", MaHangHienTai: "H02", TrangThai: "ACTIVE" }));
    replace(SuatChieu, "findOne", async () => showtime);
    replace(SuatChieu, "updateOne", async () => ({ modifiedCount: 1 }));
    replace(SanPham, "findOne", () => ({ lean: async () => product }));
    replace(KhuyenMai, "findOne", () => ({ lean: async () => dbPromotion }));
    replace(GiaoDich, "create", async (doc) => { persisted = doc; return doc; });

    const result = await datVeService.createBooking({
        MaKH: "KH-1", MaSuat: "S-1", DanhSachGhe: ["A1"],
        DanhSachSanPham: [{ MaSP: "BAP01", SoLuong: 1 }], MaKM: "KM-1",
        TamTinh: "1", SoTienGiam: "1", TongTien: "1", GiaVe: "1"
    });
    assert.equal(persisted.MaKM, "KM-1");
    assert.equal(persisted.TamTinh.toString(), "150000");
    assert.equal(persisted.SoTienGiam.toString(), "15000");
    assert.equal(persisted.TongTien.toString(), "135000");
    assert.equal(persisted.SoTienGiamVe.toString(), "10000");
    assert.equal(persisted.SoTienGiamSanPham.toString(), "5000");
    assert.equal(result.TongTien.toString(), "135000");

    const legacy = await datVeService.createBooking({
        MaKH: "KH-1", MaSuat: "S-1", DanhSachGhe: ["A1"]
    });
    assert.equal(persisted.MaKM, null);
    assert.equal(persisted.SoTienGiam.toString(), "0");
    assert.equal(persisted.TongTien.toString(), "100000");
    assert.equal(legacy.TongTien.toString(), "100000");
});
