const test = require("node:test");
const assert = require("node:assert/strict");
const { yearInVietnam, selectTier, loadValidTiers, validateSpendSnapshot } = require("../services/chiTieuHangService");
const GhiNhanChiTieu = require("../models/GhiNhanChiTieu");
const LichSuHang = require("../models/LichSuHang");
const GiaoDich = require("../models/GiaoDich");
const ThanhToan = require("../models/ThanhToan");
const KhachHang = require("../models/KhachHang");
const HangThanhVien = require("../models/HangThanhVien");
const { recordCompletedSpend } = require("../services/chiTieuHangService");

const tiers = [
    { MaHang: "H01", _minimum: 0, _maximum: 1999999 },
    { MaHang: "H02", _minimum: 2000000, _maximum: 4999999 },
    { MaHang: "H03", _minimum: 5000000, _maximum: null }
];

test("year is derived in Vietnam timezone, including UTC year boundary", () => {
    assert.equal(yearInVietnam("2025-12-31T17:00:00.000Z"), 2026);
    assert.equal(yearInVietnam("2026-01-01T00:00:00.000Z"), 2026);
    assert.equal(yearInVietnam("not-a-date"), null);
});

test("tier selection upgrades at both thresholds and keeps the matching tier below next threshold", () => {
    assert.equal(selectTier(tiers, 2000000).MaHang, "H02");
    assert.equal(selectTier(tiers, 5000000).MaHang, "H03");
    assert.equal(selectTier(tiers, 1999999).MaHang, "H01");
    assert.equal(selectTier(tiers, 4999999).MaHang, "H02");
});

test("tier gaps, overlaps, and no matching tier fail closed", async () => {
    assert.throws(() => selectTier([
        { MaHang: "A", _minimum: 0, _maximum: 10 },
        { MaHang: "B", _minimum: 12, _maximum: 20 }
    ], 11), { code: "EARN_TIER_NO_MATCH" });
    const service = require("../services/chiTieuHangService");
    const original = require("../models/HangThanhVien").find;
    try {
        require("../models/HangThanhVien").find = () => ({ lean: async () => [
            { MaHang: "A", MucChiTieuToiThieu: 0, MucChiTieuToiDa: 100 },
            { MaHang: "B", MucChiTieuToiThieu: 102, MucChiTieuToiDa: null }
        ] });
        await assert.rejects(service.loadValidTiers(), { code: "EARN_TIER_CONFIG_GAP" });
        require("../models/HangThanhVien").find = () => ({ lean: async () => [
            { MaHang: "A", MucChiTieuToiThieu: 0, MucChiTieuToiDa: 100 },
            { MaHang: "B", MucChiTieuToiThieu: 100, MucChiTieuToiDa: null }
        ] });
        await assert.rejects(service.loadValidTiers(), { code: "EARN_TIER_CONFIG_OVERLAP" });
    } finally {
        require("../models/HangThanhVien").find = original;
    }
});

test("only completed transactions with matching successful payment are eligible", () => {
    const transaction = {
        MaGD: "GD1", MaKH: "KH1", TrangThai: "COMPLETED",
        NgayHoanTat: "2026-02-01T00:00:00.000Z",
        TamTinh: "120000", SoTienGiam: "20000", TongTien: "100000"
    };
    const payment = { MaGD: "GD1", MaKH: "KH1", TrangThai: "SUCCESS", SoTien: "100000" };
    assert.deepEqual(validateSpendSnapshot(transaction, payment), { valid: true, year: 2026, amount: 100000 });
    assert.equal(validateSpendSnapshot({ ...transaction, TrangThai: "PENDING_PAYMENT" }, payment).skipped, true);
    assert.equal(validateSpendSnapshot({ ...transaction, TrangThai: "CANCELLED" }, payment).skipped, true);
    assert.equal(validateSpendSnapshot({ ...transaction, TongTien: "110000" }, payment).requiresReconciliation, true);
    assert.equal(validateSpendSnapshot(transaction, { ...payment, TrangThai: "FAILED" }).requiresReconciliation, true);
    assert.equal(validateSpendSnapshot({ ...transaction, TrangThai: "REFUNDED" }, payment).reason, "REFUND_DETAILS_MISSING");
});

test("schema declares the uniqueness constraints required for safe idempotency", () => {
    const spendIndexes = GhiNhanChiTieu.schema.indexes();
    const historyIndexes = LichSuHang.schema.indexes();
    assert.ok(spendIndexes.some(([keys, options]) => keys.IdempotencyKey === 1 && options.unique === true));
    assert.ok(historyIndexes.some(([keys, options]) => keys.MaLichSu === 1 && options.unique === true));
});

test("mocked completed-spend flow posts once and updates current-year tier/spend", async (context) => {
    const restorers = [];
    const replace = (object, key, value) => {
        const original = object[key];
        restorers.push(() => { object[key] = original; });
        object[key] = value;
    };
    context.after(() => restorers.reverse().forEach((restore) => restore()));

    const paymentTime = new Date("2026-06-01T05:00:00.000Z");
    const transaction = {
        MaGD: "GD-E42-MOCK", MaKH: "KH-E42-MOCK", TrangThai: "COMPLETED",
        NgayHoanTat: paymentTime, TamTinh: "2000000", SoTienGiam: "0", TongTien: "2000000"
    };
    const customer = { MaKH: transaction.MaKH, MaHangHienTai: "H01", NamXetHang: 2026, TongChiTieuNam: "0", TrangThai: "ACTIVE" };
    const eventDocs = new Map();
    let creates = 0;
    let customerUpdates = 0;
    let historyWrites = 0;
    replace(GhiNhanChiTieu.collection, "indexes", async () => [
        { key: { IdempotencyKey: 1 }, unique: true },
        { key: { MaLichSu: 1 }, unique: true }
    ]);
    replace(LichSuHang.collection, "indexes", async () => [
        { key: { MaLichSu: 1 }, unique: true }
    ]);
    replace(GiaoDich, "findOne", () => ({ lean: async () => transaction }));
    replace(ThanhToan, "findOne", () => ({ lean: async () => ({
        MaGD: transaction.MaGD, MaKH: transaction.MaKH, TrangThai: "SUCCESS", SoTien: "2000000"
    }) }));
    replace(GhiNhanChiTieu, "findOne", async ({ IdempotencyKey }) => eventDocs.get(IdempotencyKey) || null);
    replace(GhiNhanChiTieu, "create", async (event) => {
        if (eventDocs.has(event.IdempotencyKey)) {
            const duplicate = new Error("duplicate key");
            duplicate.code = 11000;
            throw duplicate;
        }
        creates += 1;
        eventDocs.set(event.IdempotencyKey, { ...event });
        return eventDocs.get(event.IdempotencyKey);
    });
    replace(GhiNhanChiTieu, "aggregate", async () => [{ total: 2000000 }]);
    replace(GhiNhanChiTieu, "updateOne", async (filter, update) => {
        const event = eventDocs.get(filter.IdempotencyKey);
        if (event) Object.assign(event, update.$set || {});
        return { modifiedCount: event ? 1 : 0 };
    });
    replace(GhiNhanChiTieu, "findOneAndUpdate", async (filter, update) => {
        const event = eventDocs.get(filter.IdempotencyKey);
        if (!event) return null;
        const statusMatches = filter.$or
            ? filter.$or.some((part) => part.TrangThai === event.TrangThai || part.TrangThai?.$in?.includes(event.TrangThai))
            : filter.TrangThai === event.TrangThai || filter.TrangThai?.$in?.includes(event.TrangThai);
        if (!statusMatches) return null;
        if (filter.LockToken && event.LockToken !== filter.LockToken) return null;
        if (filter.LockToken && !event.LockToken && update.$set?.LockToken !== filter.LockToken) return null;
        Object.assign(event, update.$set || {});
        return { ...event };
    });
    replace(KhachHang, "findOne", () => ({ lean: async () => ({ ...customer }) }));
    replace(HangThanhVien, "find", () => ({ lean: async () => [
        { MaHang: "H01", TrangThai: "ACTIVE", MucChiTieuToiThieu: "0", MucChiTieuToiDa: "1999999" },
        { MaHang: "H02", TrangThai: "ACTIVE", MucChiTieuToiThieu: "2000000", MucChiTieuToiDa: "4999999" },
        { MaHang: "H03", TrangThai: "ACTIVE", MucChiTieuToiThieu: "5000000", MucChiTieuToiDa: null }
    ] }));
    replace(KhachHang, "findOneAndUpdate", async (filter, update) => {
        if (filter.MaHangHienTai !== customer.MaHangHienTai || filter.NamXetHang !== customer.NamXetHang) return null;
        customer.MaHangHienTai = update.$set.MaHangHienTai;
        customer.NamXetHang = update.$set.NamXetHang;
        customer.TongChiTieuNam = update.$set.TongChiTieuNam.toString();
        customerUpdates += 1;
        return { ...customer };
    });
    replace(LichSuHang, "updateOne", async () => { historyWrites += 1; return { upsertedCount: 1 }; });

    const first = await recordCompletedSpend(transaction.MaGD);
    const second = await recordCompletedSpend(transaction.MaGD);
    assert.equal(first.success, true, JSON.stringify({ first, customer, events: [...eventDocs.values()] }));
    assert.equal(first.MaHangMoi, "H02");
    assert.equal(second.alreadyProcessed, true);
    assert.equal(customer.TongChiTieuNam, "2000000");
    assert.equal(customer.MaHangHienTai, "H02");
    assert.equal(creates, 1);
    assert.equal(customerUpdates, 1);
    assert.equal(historyWrites, 1);
});
