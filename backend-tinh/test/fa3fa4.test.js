const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const stockService = require("../services/tonKhoService");
const paymentService = require("../services/thanhToanService");
const GiaoDich = require("../models/GiaoDich");
const ThanhToan = require("../models/ThanhToan");
const SanPham = require("../models/SanPham");
const LichSuTonKho = require("../models/LichSuTonKho");
const previousMomoEndpoint = process.env.MOMO_ENDPOINT;

const original = [];
const replace = (object, key, value) => {
    if (!original.some((entry) => entry.object === object && entry.key === key)) {
        original.push({ object, key, value: object[key] });
    }
    object[key] = value;
};
const restore = () => {
    for (const { object, key, value } of original) object[key] = value;
    original.length = 0;
};

const createStockHarness = ({ transactions, initialStock, paymentStatus = "SUCCESS", failProduct = null }) => {
    const stock = { ...initialStock };
    const ledgers = new Map();
    const payments = new Map(Object.keys(transactions).map((MaGD) => [MaGD, {
        MaGD, MaKH: transactions[MaGD].MaKH, SoTien: transactions[MaGD].TongTien,
        TrangThai: paymentStatus, PhuongThuc: "MOMO"
    }]));
    replace(GiaoDich, "findOne", ({ MaGD }) => ({ lean: async () => transactions[MaGD] || null }));
    replace(ThanhToan, "findOne", (filter) => ({ lean: async () => {
        const payment = payments.get(filter.MaGD);
        if (!payment || (filter.TrangThai && payment.TrangThai !== filter.TrangThai)) return null;
        return payment;
    } }));
    replace(LichSuTonKho.collection, "indexes", async () => [
        { key: { _id: 1 }, unique: true }, { key: { MaGD: 1 }, unique: true }
    ]);
    replace(LichSuTonKho, "findOne", ({ MaGD }) => ledgers.get(MaGD) || null);
    replace(LichSuTonKho, "create", async (data) => {
        const ledger = structuredClone(data);
        ledgers.set(data.MaGD, ledger);
        return ledger;
    });
    replace(LichSuTonKho, "findOneAndUpdate", async (filter, update) => {
        const ledger = ledgers.get(filter.MaGD);
        if (!ledger || !["PENDING", "PROCESSING"].includes(ledger.TrangThai)) return null;
        if (update.$set.TrangThai === "POSTED") {
            if (!ledger.DanhSachTruKho.every((line) => line.TrangThai === "APPLIED")) return null;
            ledger.TrangThai = "POSTED";
            return structuredClone(ledger);
        }
        const target = filter.DanhSachTruKho.$elemMatch;
        const line = ledger.DanhSachTruKho.find((entry) => entry.MaSP === target.MaSP && entry.SoLuong === target.SoLuong && entry.TrangThai === "PENDING");
        if (!line) return null;
        line.TrangThai = "PROCESSING";
        ledger.TrangThai = "PROCESSING";
        return structuredClone(ledger);
    });
    replace(LichSuTonKho, "updateOne", async (filter, update) => {
        const ledger = ledgers.get(filter.MaGD);
        const match = filter.DanhSachTruKho?.$elemMatch;
        const line = ledger?.DanhSachTruKho.find((entry) => entry.MaSP === match?.MaSP && entry.TrangThai === "PROCESSING");
        if (!line) return { modifiedCount: 0 };
        line.TrangThai = update.$set["DanhSachTruKho.$.TrangThai"];
        ledger.TrangThai = update.$set.TrangThai || ledger.TrangThai;
        return { modifiedCount: 1 };
    });
    replace(SanPham, "findOneAndUpdate", async ({ MaSP, SoLuongTon }, update) => {
        if (MaSP === failProduct) throw new Error("simulated storage failure");
        if (stock[MaSP] === undefined || stock[MaSP] < SoLuongTon.$gte) return null;
        stock[MaSP] += update.$inc.SoLuongTon;
        return { MaSP, SoLuongTon: stock[MaSP] };
    });
    replace(SanPham, "findOne", ({ MaSP }) => ({
        select: () => ({ lean: async () => stock[MaSP] === undefined ? null : { SoLuongTon: stock[MaSP] } })
    }));
    return { stock, ledgers };
};

test.afterEach(() => {
    restore();
    if (previousMomoEndpoint === undefined) delete process.env.MOMO_ENDPOINT;
    else process.env.MOMO_ENDPOINT = previousMomoEndpoint;
});

test("FA3 aggregates direct products and shared combo components", () => {
    assert.deepEqual(stockService.buildStockRequirements([
        { MaSP: "BAP", LoaiSP: "BAP", SoLuong: 1 },
        { MaSP: "C1", LoaiSP: "COMBO", SoLuong: 2, ThanhPhan: [
            { MaSP: "BAP", LoaiSP: "BAP", SoLuong: 1 },
            { MaSP: "NUOC", LoaiSP: "NUOC", SoLuong: 2 }
        ] },
        { MaSP: "C2", LoaiSP: "COMBO", SoLuong: 1, ThanhPhan: [
            { MaSP: "NUOC", LoaiSP: "NUOC", SoLuong: 1 }
        ] }
    ]), [
        { MaSP: "BAP", SoLuong: 3 }, { MaSP: "NUOC", SoLuong: 5 }
    ]);
    assert.throws(() => stockService.buildStockRequirements([
        { MaSP: "C3", LoaiSP: "COMBO", SoLuong: 1, ThanhPhan: [] }
    ]), /thanh phan ton kho/);
});

test("FA3 decrements multiple item requirements once and repeat delivery is idempotent", async () => {
    const transaction = {
        MaGD: "GD1", MaKH: "KH1", TrangThai: "COMPLETED", TongTien: 100,
        ChiTietCombo: [
            { MaSP: "BAP", LoaiSP: "BAP", SoLuong: 2 },
            { MaSP: "C1", LoaiSP: "COMBO", SoLuong: 1, ThanhPhan: [
                { MaSP: "BAP", LoaiSP: "BAP", SoLuong: 1 },
                { MaSP: "NUOC", LoaiSP: "NUOC", SoLuong: 2 }
            ] }
        ]
    };
    const { stock, ledgers } = createStockHarness({ transactions: { GD1: transaction }, initialStock: { BAP: 8, NUOC: 8 } });
    const first = await stockService.deductForPaidTransaction("GD1");
    const second = await stockService.deductForPaidTransaction("GD1");
    assert.equal(first.success, true);
    assert.equal(second.alreadyProcessed, true);
    assert.deepEqual(stock, { BAP: 5, NUOC: 6 });
    assert.equal(ledgers.get("GD1").TrangThai, "POSTED");
});

test("FA3 keeps insufficient stock in reconciliation and concurrent last-unit claims cannot go negative", async () => {
    const makeTransaction = (MaGD) => ({
        MaGD, MaKH: `KH-${MaGD}`, TrangThai: "COMPLETED", TongTien: 100,
        ChiTietCombo: [{ MaSP: "BAP", LoaiSP: "BAP", SoLuong: 1 }]
    });
    const transactions = { GD1: makeTransaction("GD1"), GD2: makeTransaction("GD2") };
    const { stock, ledgers } = createStockHarness({ transactions, initialStock: { BAP: 1 } });
    const results = await Promise.all([
        stockService.deductForPaidTransaction("GD1"),
        stockService.deductForPaidTransaction("GD2")
    ]);
    assert.equal(stock.BAP, 0);
    assert.equal(results.filter((result) => result.success).length, 1);
    assert.equal(results.filter((result) => result.requiresReconciliation).length, 1);
    assert.equal([...ledgers.values()].filter((ledger) => ledger.TrangThai === "RECONCILIATION_REQUIRED").length, 1);
});

test("FA3 does not deduct for pending transaction or non-success payment", async () => {
    for (const scenario of [
        { MaGD: "GD-PENDING", TrangThai: "PENDING_PAYMENT", paymentStatus: "SUCCESS" },
        { MaGD: "GD-FAILED", TrangThai: "COMPLETED", paymentStatus: "FAILED" },
        { MaGD: "GD-WAITING", TrangThai: "COMPLETED", paymentStatus: "PENDING" }
    ]) {
        const transaction = {
            MaGD: scenario.MaGD, MaKH: "KH1", TrangThai: scenario.TrangThai, TongTien: 100,
            ChiTietCombo: [{ MaSP: "BAP", LoaiSP: "BAP", SoLuong: 1 }]
        };
        const { stock, ledgers } = createStockHarness({
            transactions: { [scenario.MaGD]: transaction }, initialStock: { BAP: 5 }, paymentStatus: scenario.paymentStatus
        });
        const result = await stockService.deductForPaidTransaction(scenario.MaGD);
        assert.equal(result.requiresReconciliation, true);
        assert.equal(stock.BAP, 5);
        assert.equal(ledgers.size, 0);
        restore();
    }
});

test("FA3 marks a multi-item partial failure for reconciliation without blind rollback", async () => {
    const transaction = {
        MaGD: "GD-PARTIAL", MaKH: "KH1", TrangThai: "COMPLETED", TongTien: 100,
        ChiTietCombo: [
            { MaSP: "BAP", LoaiSP: "BAP", SoLuong: 1 },
            { MaSP: "NUOC", LoaiSP: "NUOC", SoLuong: 1 }
        ]
    };
    const { stock, ledgers } = createStockHarness({
        transactions: { "GD-PARTIAL": transaction }, initialStock: { BAP: 4, NUOC: 4 }, failProduct: "NUOC"
    });
    const result = await stockService.deductForPaidTransaction("GD-PARTIAL");
    assert.equal(result.requiresReconciliation, true);
    assert.equal(stock.BAP, 3);
    assert.equal(stock.NUOC, 4);
    assert.equal(ledgers.get("GD-PARTIAL").TrangThai, "RECONCILIATION_REQUIRED");
});

test("FA4 classifies MoMo success, pending, final failure, authorization and unknown results distinctly", () => {
    assert.equal(paymentService.classifyMomoResultCode(0), "SUCCESS");
    assert.equal(paymentService.classifyMomoResultCode(1000), "PENDING");
    assert.equal(paymentService.classifyMomoResultCode(7002), "PENDING");
    assert.equal(paymentService.classifyMomoResultCode(9000), "AUTHORIZED_REVIEW");
    assert.equal(paymentService.classifyMomoResultCode(1001), "FAILED");
    assert.equal(paymentService.classifyMomoResultCode(876543), "UNKNOWN");
});

test("FA4 query request signs its fields and rejects a mismatched response", async () => {
    process.env.MOMO_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create";
    const config = { partnerCode: "PARTNER", accessKey: "ACCESS", secretKey: "SECRET" };
    let sent;
    const fetchImpl = async (url, options) => {
        assert.equal(url, "https://test-payment.momo.vn/v2/gateway/api/query");
        sent = JSON.parse(options.body);
        const raw = `accessKey=ACCESS&orderId=GD-1&partnerCode=PARTNER&requestId=${sent.requestId}`;
        assert.equal(sent.signature, crypto.createHmac("sha256", "SECRET").update(raw).digest("hex"));
        return { ok: true, json: async () => ({
            partnerCode: "PARTNER", orderId: "GD-1", requestId: sent.requestId,
            amount: 5000, resultCode: 1000
        }) };
    };
    const transaction = { MaGD: "GD-1", TongTien: 5000 };
    const result = await paymentService.queryMomoTransaction({ transaction, payment: { SoTien: 5000 }, config, fetchImpl });
    assert.equal(result.result.resultCode, 1000);
    await assert.rejects(paymentService.queryMomoTransaction({
        transaction, payment: { SoTien: 5000 }, config,
        fetchImpl: async () => ({ ok: true, json: async () => ({ partnerCode: "PARTNER", orderId: "GD-OTHER", amount: 5000, resultCode: 1000 }) })
    }), /khong khop/);
});
