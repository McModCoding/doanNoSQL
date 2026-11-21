const test = require("node:test");
const assert = require("node:assert/strict");
const { prepareProductOrder, addDecimalStrings, multiplyDecimalStringByInteger } = require("../services/datVeService");

const catalog = {
    BAP01: { MaSP: "BAP01", TenSP: "Bap lon", LoaiSP: "BAP", GiaBan: "45000", SoLuongTon: 20, TrangThai: "ACTIVE", ThanhPhan: [] },
    NUOC01: { MaSP: "NUOC01", TenSP: "Nuoc ngot", LoaiSP: "NUOC", GiaBan: "30000", SoLuongTon: 30, TrangThai: "ACTIVE", ThanhPhan: [] },
    SNACK01: { MaSP: "SNACK01", TenSP: "Snack", LoaiSP: "SNACK", GiaBan: "20000", SoLuongTon: 15, TrangThai: "ACTIVE", ThanhPhan: [] },
    COMBO01: { MaSP: "COMBO01", TenSP: "Combo A", LoaiSP: "COMBO", GiaBan: "80000", SoLuongTon: 0, TrangThai: "ACTIVE", ThanhPhan: [{ MaSP: "BAP01", SoLuong: 1 }, { MaSP: "NUOC01", SoLuong: 2 }] },
    COMBO02: { MaSP: "COMBO02", TenSP: "Combo mix", LoaiSP: "COMBO", GiaBan: "95000", SoLuongTon: 0, TrangThai: "ACTIVE", ThanhPhan: [{ MaSP: "SNACK01", SoLuong: 2 }, { MaSP: "NUOC01", SoLuong: 1 }] },
    INACTIVE: { MaSP: "INACTIVE", TenSP: "Inactive", LoaiSP: "BAP", GiaBan: "1", SoLuongTon: 4, TrangThai: "INACTIVE", ThanhPhan: [] },
    BADCOMBO: { MaSP: "BADCOMBO", TenSP: "Bad combo", LoaiSP: "COMBO", GiaBan: "1", SoLuongTon: 0, TrangThai: "ACTIVE", ThanhPhan: [{ MaSP: "MISSING", SoLuong: 1 }] },
    CYCLEA: { MaSP: "CYCLEA", TenSP: "A", LoaiSP: "COMBO", GiaBan: "1", SoLuongTon: 0, TrangThai: "ACTIVE", ThanhPhan: [{ MaSP: "CYCLEB", SoLuong: 1 }] },
    CYCLEB: { MaSP: "CYCLEB", TenSP: "B", LoaiSP: "COMBO", GiaBan: "1", SoLuongTon: 0, TrangThai: "ACTIVE", ThanhPhan: [{ MaSP: "CYCLEA", SoLuong: 1 }] }
};
const getProduct = async (MaSP) => catalog[MaSP] || null;

test("legacy no-product order has zero product subtotal", async () => {
    const result = await prepareProductOrder(undefined, getProduct);
    assert.deepEqual(result, { lines: [], subtotal: "0" });
});

test("bap, nuoc and snack use server snapshots and exact line totals", async () => {
    const result = await prepareProductOrder([
        { MaSP: "BAP01", SoLuong: 2 }, { MaSP: "NUOC01", SoLuong: 1 }, { MaSP: "SNACK01", SoLuong: 3 }
    ], getProduct);
    assert.deepEqual(result.lines.map(({ MaSP, DonGia, ThanhTien, LoaiSP }) => ({ MaSP, DonGia, ThanhTien, LoaiSP })), [
        { MaSP: "BAP01", DonGia: "45000", ThanhTien: "90000", LoaiSP: "BAP" },
        { MaSP: "NUOC01", DonGia: "30000", ThanhTien: "30000", LoaiSP: "NUOC" },
        { MaSP: "SNACK01", DonGia: "20000", ThanhTien: "60000", LoaiSP: "SNACK" }
    ]);
    assert.equal(result.subtotal, "180000");
});

test("combo price stays its own catalog price while stock checks components", async () => {
    const result = await prepareProductOrder([{ MaSP: "COMBO01", SoLuong: 3 }], getProduct);
    assert.equal(result.lines[0].DonGia, "80000");
    assert.equal(result.lines[0].ThanhTien, "240000");
    assert.deepEqual(result.lines[0].ThanhPhan, [
        { MaSP: "BAP01", TenSP: "Bap lon", LoaiSP: "BAP", SoLuong: 1 },
        { MaSP: "NUOC01", TenSP: "Nuoc ngot", LoaiSP: "NUOC", SoLuong: 2 }
    ]);
});

test("multiple duplicate lines and combos aggregate shared component stock requirements", async () => {
    const result = await prepareProductOrder([
        { MaSP: "BAP01", SoLuong: 1 }, { MaSP: "BAP01", SoLuong: 1 },
        { MaSP: "COMBO01", SoLuong: 2 }, { MaSP: "COMBO02", SoLuong: 1 }
    ], getProduct);
    assert.equal(result.subtotal, "345000");
    assert.equal(result.lines.length, 3);
    await assert.rejects(prepareProductOrder([
        { MaSP: "BAP01", SoLuong: 16 }, { MaSP: "COMBO01", SoLuong: 5 }
    ], getProduct), /khong du ton kho/);
});

test("unknown, inactive, invalid quantities and client price fields are rejected", async () => {
    await assert.rejects(prepareProductOrder([{ MaSP: "MISSING", SoLuong: 1 }], getProduct), /khong ton tai/);
    await assert.rejects(prepareProductOrder([{ MaSP: "INACTIVE", SoLuong: 1 }], getProduct), /khong hoat dong/);
    await assert.rejects(prepareProductOrder([{ MaSP: "BAP01", SoLuong: 0 }], getProduct), /khong hop le/);
    await assert.rejects(prepareProductOrder([{ MaSP: "BAP01", SoLuong: -2 }], getProduct), /khong hop le/);
    await assert.rejects(prepareProductOrder([{ MaSP: "BAP01", SoLuong: 1, DonGia: "0.01" }], getProduct), /chi duoc gui MaSP va SoLuong/);
});

test("invalid or inactive combo components and cyclic composition are rejected", async () => {
    await assert.rejects(prepareProductOrder([{ MaSP: "BADCOMBO", SoLuong: 1 }], getProduct), /khong ton tai/);
    await assert.rejects(prepareProductOrder([{ MaSP: "CYCLEA", SoLuong: 1 }], getProduct), /lap vong/);
    const withInactiveComponent = async (MaSP) => MaSP === "COMBO01"
        ? { ...catalog.COMBO01, ThanhPhan: [{ MaSP: "INACTIVE", SoLuong: 1 }] }
        : getProduct(MaSP);
    await assert.rejects(prepareProductOrder([{ MaSP: "COMBO01", SoLuong: 1 }], withInactiveComponent), /khong hoat dong/);
});

test("decimal multiplication and combined totals avoid floating point", () => {
    assert.equal(multiplyDecimalStringByInteger("12.35", 3), "37.05");
    assert.equal(addDecimalStrings("100000.10", "37.05"), "100037.15");
});
