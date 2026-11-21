const test = require("node:test");
const assert = require("node:assert/strict");
const GiaoDich = require("../models/GiaoDich");
const Ve = require("../models/Ve");
const KhachHang = require("../models/KhachHang");
const baoCao = require("../services/baoCaoService");
const reportRouter = require("../routes/baoCaoRoutes");

const originalAggregate = GiaoDich.aggregate;
const originalTicketAggregate = Ve.aggregate;
const originalCustomerAggregate = KhachHang.aggregate;
test.afterEach(() => {
    GiaoDich.aggregate = originalAggregate;
    Ve.aggregate = originalTicketAggregate;
    KhachHang.aggregate = originalCustomerAggregate;
});

test("date filters are Vietnam-local whole days and reject malformed or reversed dates", () => {
    const { match } = baoCao.parseDateRange({ fromDate: "2026-11-01", toDate: "2026-11-03" });
    assert.equal(match.NgayHoanTat.$gte.toISOString(), "2026-10-31T17:00:00.000Z");
    assert.equal(match.NgayHoanTat.$lt.toISOString(), "2026-11-03T17:00:00.000Z");
    assert.throws(() => baoCao.parseDateRange({ fromDate: "2026-02-30" }), /ngay hop le/);
    assert.throws(() => baoCao.parseDateRange({ fromDate: "2026-11-04", toDate: "2026-11-03" }), /khong duoc sau/);
    assert.throws(() => baoCao.parseDateRange({ fromDate: { $gte: "x" } }), /YYYY-MM-DD/);
});

test("revenue pipeline uses completed paid transactions, net transaction total and Vietnam timezone", () => {
    const { pipeline } = baoCao.revenuePipeline({ fromDate: "2026-11-01", page: "2", limit: "10" });
    const match = pipeline.find((stage) => stage.$match)?.$match;
    assert.equal(match.TrangThai, "COMPLETED");
    assert.ok(match.NgayHoanTat.$gte instanceof Date);
    assert.equal(pipeline.find((stage) => stage.$lookup)?.$lookup.from, "thanh_toan");
    const facet = pipeline.find((stage) => stage.$facet).$facet;
    assert.ok(facet.summary.some((stage) => stage.$group?.tongDoanhThu?.$sum === "$_reportAmount"));
    assert.equal(facet.daily[0].$group._id.$dateToString.timezone, "Asia/Ho_Chi_Minh");
    assert.equal(facet.monthly[0].$group._id.$dateToString.format, "%Y-%m");
    assert.ok(facet.daily.some((stage) => stage.$skip === 10));
});

test("empty revenue result returns zero totals and empty paged series", async () => {
    GiaoDich.aggregate = async () => [{}];
    const result = await baoCao.getRevenueReport({});
    assert.equal(result.summary.soGiaoDich, 0);
    assert.equal(result.summary.tongDoanhThu, "0");
    assert.deepEqual(result.daily.items, []);
    assert.deepEqual(result.monthly.items, []);
});

test("empty ticket, film, product and customer reports return empty summaries safely", async () => {
    Ve.aggregate = async () => [{}];
    GiaoDich.aggregate = async () => [{}];
    KhachHang.aggregate = async () => [{}];
    assert.deepEqual((await baoCao.getFilmReport({})).items, []);
    assert.equal((await baoCao.getTicketReport({})).summary.tongSoVe, 0);
    assert.equal((await baoCao.getProductReport({})).summary.soNhomSanPham, 0);
    const customers = await baoCao.getCustomerReport({});
    assert.equal(customers.totalCustomers, 0);
    assert.deepEqual(customers.byTier, []);
    assert.deepEqual(customers.topSpenders.items, []);
});

test("film report follows ticket to transaction, showtime, and film keys", () => {
    const { pipeline } = baoCao.filmPipeline({ fromDate: "2026-11-01" });
    const lookups = pipeline.flatMap((stage) => stage.$lookup ? [stage.$lookup.from] : []);
    assert.ok(lookups.includes("giao_dich"));
    assert.ok(lookups.includes("thanh_toan"));
    assert.ok(lookups.includes("suat_chieu"));
    assert.ok(lookups.includes("phim"));
    assert.ok(pipeline.some((stage) => stage.$match?.["_transaction.TrangThai"] === "COMPLETED"));
    assert.ok(pipeline.some((stage) => stage.$match?.TrangThai?.$in?.includes("USED")));
    assert.ok(pipeline.some((stage) => stage.$group?.doanhThuVeTruocGiam));
});

test("ticket report counts only tickets whose transaction and payment completed", () => {
    const { pipeline } = baoCao.ticketPipeline({ toDate: "2026-11-20" });
    assert.ok(pipeline.some((stage) => stage.$lookup?.from === "giao_dich"));
    assert.ok(pipeline.some((stage) => stage.$match?.["_transaction.TrangThai"] === "COMPLETED"));
    assert.ok(pipeline.some((stage) => stage.$match?.["_successfulPayment.0"]?.$exists === true));
    const facet = pipeline.find((stage) => stage.$facet).$facet;
    assert.ok(facet.byStatus && facet.byDay && facet.byShowtime);
});

test("product report groups purchased transaction snapshots without unwinding combo components", () => {
    const { pipeline } = baoCao.productPipeline({ page: "1", limit: "5" });
    assert.ok(pipeline.some((stage) => stage.$unwind === "$ChiTietCombo"));
    assert.ok(!pipeline.some((stage) => stage.$unwind === "$ChiTietCombo.ThanhPhan"));
    const group = pipeline.find((stage) => stage.$group)?.$group;
    assert.deepEqual(group._id, { MaSP: "$ChiTietCombo.MaSP", LoaiSP: { $ifNull: ["$ChiTietCombo.LoaiSP", "KHONG_XAC_DINH"] } });
    assert.ok(pipeline.some((stage) => stage.$facet?.byType));
    assert.equal(pipeline.find((stage) => stage.$project)?.$project.loaiSanPham, "$_id.LoaiSP");
    assert.equal(group.doanhThuTruocGiam.$sum, "$_productAmount");
    assert.ok(pipeline.some((stage) => stage.$set?._productAmount?.$convert?.onError === null));
});

test("customer report groups completed spend by MaKH and never projects personal contact fields", () => {
    const { pipeline } = baoCao.customerSpendPipeline({ fromDate: "2026-01-01" });
    assert.equal(pipeline.find((stage) => stage.$match)?.$match.TrangThai, "COMPLETED");
    assert.ok(pipeline.some((stage) => stage.$group?._id === "$MaKH"));
    const project = pipeline.find((stage) => stage.$project)?.$project;
    assert.equal(project.MaKH, "$_id");
    assert.equal(project.HoTen, undefined);
    assert.equal(project.Email, undefined);
    assert.equal(project.SDT, undefined);
});

test("all report endpoints are behind protect and ADMIN role middleware", () => {
    assert.equal(reportRouter.stack[0].handle.name, "protect");
    const adminGuard = reportRouter.stack[1].handle;
    assert.equal(typeof adminGuard, "function");
    let continued = false;
    adminGuard({ user: { VaiTro: "KHACHHANG" } }, { status(code) { this.code = code; return this; }, json(body) { this.body = body; } }, () => { continued = true; });
    assert.equal(continued, false);
    continued = false;
    adminGuard({ user: { VaiTro: "ADMIN" } }, {}, () => { continued = true; });
    assert.equal(continued, true);
    assert.equal(reportRouter.stack.filter((layer) => layer.route).length, 5);
});
