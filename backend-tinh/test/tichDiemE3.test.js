const test = require("node:test");
const assert = require("node:assert/strict");

const KhachHang = require("../models/KhachHang");
const HangThanhVien = require("../models/HangThanhVien");
const GiaoDich = require("../models/GiaoDich");
const BienDongDiem = require("../models/BienDongDiem");
const loyalty = require("../services/tichDiemService");

const originalMethods = new Map();
const mock = (target, name, implementation) => {
    if (!originalMethods.has(`${target.modelName}.${name}`)) {
        originalMethods.set(`${target.modelName}.${name}`, [target, name, target[name]]);
    }
    target[name] = implementation;
};

test.afterEach(() => {
    for (const [target, name, original] of originalMethods.values()) {
        target[name] = original;
    }
    originalMethods.clear();
    delete process.env.VND_PER_POINT;
});

const rateByTier = { H01: 0.05, H02: 0.07, H03: 0.10 };
const foodRateByTier = { H01: 0.03, H02: 0.04, H03: 0.05 };
const formula = (tier, ticket, food = 0) => loyalty.calculateTierPoints({
    EligibleTicketAmount: ticket,
    EligiblePopcornBeverageAmount: food,
    VNDPerPoint: 1000,
    TyLeTichDiemVe: rateByTier[tier],
    TyLeTichDiemBapNuoc: foodRateByTier[tier]
});

test("tier formula and single final rounding match approved examples", () => {
    assert.equal(formula("H01", 100000).totalPoints, 105);
    assert.equal(formula("H02", 100000).totalPoints, 107);
    assert.equal(formula("H03", 100000).totalPoints, 110);
    assert.equal(formula("H01", 100000, 20000).totalPoints, 126);
    assert.equal(formula("H02", 100000, 20000).totalPoints, 128);
    assert.equal(formula("H03", 100000, 20000).totalPoints, 131);
    assert.equal(formula("H01", 100000, 0).totalPoints, 105);
    assert.equal(formula("H01", 0, 20000).totalPoints, 21);
});

test("paid amount is used for ticket-only transactions; unknown product types are skipped", () => {
    const ticketOnly = loyalty.getEligiblePointAmounts({
        LoaiGiaoDich: "DAT_VE",
        ChiTietCombo: [],
        TongTien: 95000,
        SoTienGiam: 5000
    });
    assert.equal(ticketOnly.EligibleTicketAmount, 95000);

    const mixedWithoutDiscount = loyalty.getEligiblePointAmounts({
        LoaiGiaoDich: "HON_HOP",
        ChiTietVe: [{ GiaVe: 100000 }],
        ChiTietCombo: [{ MaSP: "SP1", TenSP: "Bap nuoc", SoLuong: 1, ThanhTien: 20000 }],
        TongTien: 120000,
        SoTienGiam: 0
    });
    assert.equal(mixedWithoutDiscount.EligibleTicketAmount, 100000);
    assert.equal(mixedWithoutDiscount.EligiblePopcornBeverageAmount, 0);
    assert.equal(mixedWithoutDiscount.SkippedProductLineCount, 1);
    const productOnly = loyalty.getEligiblePointAmounts({
        LoaiGiaoDich: "MUA_COMBO",
        ChiTietVe: [],
        ChiTietCombo: [{ MaSP: "SP2", TenSP: "Snack/combo", SoLuong: 1, ThanhTien: 20000 }],
        TongTien: 20000,
        SoTienGiam: 0
    });
    assert.equal(productOnly.EligibleTicketAmount, 0);
    assert.equal(productOnly.EligiblePopcornBeverageAmount, 0);
    assert.equal(productOnly.SkippedProductLineCount, 1);
    assert.throws(() => loyalty.getEligiblePointAmounts({
        LoaiGiaoDich: "HON_HOP",
        ChiTietVe: [{ GiaVe: 100000 }],
        ChiTietCombo: [{ MaSP: "SP1", TenSP: "Combo", SoLuong: 1, ThanhTien: 20000 }],
        TongTien: 110000,
        SoTienGiam: 10000
    }), { code: "EARN_MIXED_DISCOUNT_UNALLOCATABLE", requiresReconciliation: true });
});

const setupEarnMocks = ({ customerActive = true, tierActive = true, failPosting = false, duplicateCreate = false } = {}) => {
    process.env.VND_PER_POINT = "1000";
    const transaction = {
        MaGD: "GD-UNIT-1", MaKH: "KH-UNIT-1", LoaiGiaoDich: "DAT_VE", TrangThai: "COMPLETED",
        TongTien: 100000, SoTienGiam: 0, ChiTietVe: [], ChiTietCombo: []
    };
    const customer = { MaKH: transaction.MaKH, MaHangHienTai: "H01", TrangThai: "ACTIVE", DiemHienTai: 0, TongDiemTichLuy: 0 };
    let ledger = null;
    let ledgerCreates = 0;
    let customerIncrements = 0;
    let postFailurePending = failPosting;

    mock(GiaoDich, "findOne", async () => transaction);
    mock(KhachHang, "findOne", async () => customerActive ? customer : null);
    mock(HangThanhVien, "findOne", () => ({
        lean: async () => tierActive ? {
            MaHang: "H01", TrangThai: "ACTIVE", TyLeTichDiemVe: 0.05, TyLeTichDiemBapNuoc: 0.03
        } : null
    }));
    mock(KhachHang, "findOneAndUpdate", async (_filter, update) => {
        customerIncrements += 1;
        customer.DiemHienTai += update.$inc.DiemHienTai;
        customer.TongDiemTichLuy += update.$inc.TongDiemTichLuy;
        return customer;
    });
    mock(BienDongDiem, "findOne", async () => ledger);
    mock(BienDongDiem, "create", async (doc) => {
        ledgerCreates += 1;
        if (duplicateCreate) {
            ledger = { ...doc, TrangThai: "PENDING" };
            const duplicate = new Error("E11000 duplicate key uq_bien_dong_diem_idempotency");
            duplicate.code = 11000;
            duplicate.keyPattern = { IdempotencyKey: 1 };
            throw duplicate;
        }
        ledger = { ...doc };
        return ledger;
    });
    mock(BienDongDiem, "findOneAndUpdate", async (filter, update) => {
        if (!ledger || ledger.IdempotencyKey !== filter.IdempotencyKey || ledger.TrangThai !== filter.TrangThai) return null;
        if (update.$set.TrangThai === "POSTED" && postFailurePending) {
            postFailurePending = false;
            throw new Error("simulated failure before POSTED");
        }
        ledger.TrangThai = update.$set.TrangThai;
        return ledger;
    });
    mock(BienDongDiem, "updateOne", async () => ({ modifiedCount: 0 }));
    return { customer, get ledger() { return ledger; }, get ledgerCreates() { return ledgerCreates; }, get customerIncrements() { return customerIncrements; } };
};

test("BienDongDiem declares the non-partial unique idempotency index", () => {
    const index = BienDongDiem.schema.indexes().find(([key]) =>
        key.IdempotencyKey === 1 && Object.keys(key).length === 1
    );
    assert.ok(index);
    assert.equal(index[1].unique, true);
    assert.equal(index[1].sparse, undefined);
    assert.equal(index[1].partialFilterExpression, undefined);
    assert.equal(index[1].name, "uq_bien_dong_diem_idempotency");
});

test("inactive customer or tier is blocked before ledger or balance writes", async () => {
    const inactiveCustomer = setupEarnMocks({ customerActive: false });
    await assert.rejects(loyalty.earnPoints("GD-UNIT-1"), { code: "EARN_CUSTOMER_UNAVAILABLE", requiresReconciliation: true });
    assert.equal(inactiveCustomer.ledgerCreates, 0);
    assert.equal(inactiveCustomer.customerIncrements, 0);

    // Restore between the two independent mock scenarios in this test.
    for (const [target, name, original] of originalMethods.values()) target[name] = original;
    originalMethods.clear();

    const inactiveTier = setupEarnMocks({ tierActive: false });
    await assert.rejects(loyalty.earnPoints("GD-UNIT-1"), { code: "EARN_TIER_UNAVAILABLE", requiresReconciliation: true });
    assert.equal(inactiveTier.ledgerCreates, 0);
    assert.equal(inactiveTier.customerIncrements, 0);
});

test("earn is idempotent and a failure before POSTED is never blindly credited again", async () => {
    const state = setupEarnMocks();
    const [first, second] = await Promise.all([
        loyalty.earnPoints("GD-UNIT-1"),
        loyalty.earnPoints("GD-UNIT-1")
    ]);
    assert.equal(first.pointsEarned, 105);
    assert.equal(second.alreadyProcessed, true);
    assert.equal(state.customer.DiemHienTai, 105);
    assert.equal(state.customerIncrements, 1);
    assert.equal(state.ledgerCreates, 1);

    for (const [target, name, original] of originalMethods.values()) target[name] = original;
    originalMethods.clear();
    const interrupted = setupEarnMocks({ failPosting: true });
    await assert.rejects(loyalty.earnPoints("GD-UNIT-1"), /simulated failure/);
    assert.equal(interrupted.ledger.TrangThai, "PROCESSING");
    const retry = await loyalty.earnPoints("GD-UNIT-1");
    assert.equal(retry.requiresReconciliation, true);
    assert.equal(interrupted.customer.DiemHienTai, 105);
    assert.equal(interrupted.customerIncrements, 1);
});

test("duplicate-key race loads the matching ledger and credits once", async () => {
    const state = setupEarnMocks({ duplicateCreate: true });
    const result = await loyalty.earnPoints("GD-UNIT-1");
    assert.equal(result.pointsEarned, 105);
    assert.equal(state.ledger.IdempotencyKey, "EARN:GD-UNIT-1");
    assert.equal(state.customerIncrements, 1);
});
