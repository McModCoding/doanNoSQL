const GiaoDich = require("../models/GiaoDich");
const ThanhToan = require("../models/ThanhToan");
const SanPham = require("../models/SanPham");
const LichSuTonKho = require("../models/LichSuTonKho");

const PRODUCT_TYPES = new Set(["BAP", "NUOC", "SNACK"]);

const reconciliation = (message, extra = {}) => ({
    success: false,
    requiresReconciliation: true,
    message,
    ...extra
});

const buildStockRequirements = (lines = []) => {
    if (!Array.isArray(lines)) throw new Error("ChiTietCombo khong hop le");
    const totals = new Map();
    const add = (MaSP, quantity) => {
        if (typeof MaSP !== "string" || !MaSP.trim() || !Number.isSafeInteger(quantity) || quantity < 1) {
            throw new Error("Snapshot san pham trong giao dich khong hop le");
        }
        const next = (totals.get(MaSP.trim()) || 0) + quantity;
        if (!Number.isSafeInteger(next)) throw new Error("Tong so luong ton kho khong hop le");
        totals.set(MaSP.trim(), next);
    };

    for (const line of lines) {
        if (!line || !Number.isSafeInteger(line.SoLuong) || line.SoLuong < 1) {
            throw new Error("So luong trong snapshot giao dich khong hop le");
        }
        if (PRODUCT_TYPES.has(line.LoaiSP)) {
            add(line.MaSP, line.SoLuong);
            continue;
        }
        if (line.LoaiSP !== "COMBO" || !Array.isArray(line.ThanhPhan) || line.ThanhPhan.length === 0) {
            throw new Error(`Khong xac dinh duoc thanh phan ton kho cua ${line.MaSP || "san pham"}`);
        }
        for (const component of line.ThanhPhan) {
            if (!component || !PRODUCT_TYPES.has(component.LoaiSP) ||
                !Number.isSafeInteger(component.SoLuong) || component.SoLuong < 1) {
                throw new Error(`Snapshot thanh phan combo ${line.MaSP} khong hop le`);
            }
            const required = component.SoLuong * line.SoLuong;
            if (!Number.isSafeInteger(required)) throw new Error("So luong thanh phan combo vuot gioi han");
            add(component.MaSP, required);
        }
    }

    return [...totals.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([MaSP, SoLuong]) => ({ MaSP, SoLuong }));
};

const verifyIdempotencyIndex = async () => {
    const indexes = await LichSuTonKho.collection.indexes();
    const valid = indexes.some((index) =>
        index.unique === true && index.sparse !== true && !index.partialFilterExpression &&
        index.key?.MaGD === 1 && Object.keys(index.key).length === 1
    );
    if (!valid) throw new Error("Thieu unique index MaGD cho ledger ton kho; chua tru kho");
};

const sameItems = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const readLedger = (MaGD) => LichSuTonKho.findOne({ MaGD });

const markLedgerReview = async (MaGD, message, itemMaSP = null) => {
    const now = new Date();
    if (itemMaSP) {
        await LichSuTonKho.updateOne(
            { MaGD, DanhSachTruKho: { $elemMatch: { MaSP: itemMaSP, TrangThai: "PROCESSING" } } },
            { $set: {
                "DanhSachTruKho.$.TrangThai": "RECONCILIATION_REQUIRED",
                TrangThai: "RECONCILIATION_REQUIRED",
                LyDoDoiSoat: message,
                NgayCapNhat: now
            } }
        );
    } else {
        await LichSuTonKho.updateOne(
            { MaGD, TrangThai: { $ne: "POSTED" } },
            { $set: { TrangThai: "RECONCILIATION_REQUIRED", LyDoDoiSoat: message, NgayCapNhat: now } }
        );
    }
    return reconciliation(message, { MaGD });
};

const listReconciliation = async ({ page = 1, limit = 20 } = {}) => {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedLimit) || parsedLimit < 1) {
        const error = new Error("page va limit phai la so nguyen duong");
        error.statusCode = 400;
        throw error;
    }
    const boundedLimit = Math.min(parsedLimit, 100);
    const query = { TrangThai: { $in: ["PROCESSING", "RECONCILIATION_REQUIRED"] } };
    const [items, total] = await Promise.all([
        LichSuTonKho.find(query).select("MaGD MaKH DanhSachTruKho TrangThai LyDoDoiSoat NgayTao NgayCapNhat -_id")
            .sort({ NgayCapNhat: 1, MaGD: 1 }).skip((parsedPage - 1) * boundedLimit).limit(boundedLimit).lean(),
        LichSuTonKho.countDocuments(query)
    ]);
    return {
        items,
        pagination: { page: parsedPage, limit: boundedLimit, total, totalPages: Math.ceil(total / boundedLimit) }
    };
};

const deductForPaidTransaction = async (MaGD) => {
    const transaction = await GiaoDich.findOne({ MaGD }).lean();
    if (!transaction) return reconciliation("Khong tim thay giao dich", { MaGD });
    let requirements;
    try {
        requirements = buildStockRequirements(transaction.ChiTietCombo || []);
    } catch (error) {
        return reconciliation(error.message, { MaGD });
    }
    if (!requirements.length) return { success: true, skipped: true, MaGD };

    if (transaction.TrangThai !== "COMPLETED") {
        return reconciliation("Chi tru kho cho giao dich COMPLETED", { MaGD });
    }
    const payment = await ThanhToan.findOne({
        MaGD,
        MaKH: transaction.MaKH,
        SoTien: transaction.TongTien,
        TrangThai: "SUCCESS",
        PhuongThuc: { $in: ["MOMO", "DEV_MOCK"] }
    }).lean();
    if (!payment) return reconciliation("Khong xac minh duoc payment SUCCESS khop giao dich", { MaGD });

    try {
        await verifyIdempotencyIndex();
    } catch (error) {
        console.error("Stock deduction blocked:", MaGD, error.message);
        return reconciliation(error.message, { MaGD, ledgerCreated: false });
    }

    let ledger = await readLedger(MaGD);
    if (ledger) {
        const priorItems = ledger.DanhSachTruKho.map(({ MaSP, SoLuong }) => ({ MaSP, SoLuong }));
        if (ledger.MaKH !== transaction.MaKH || !sameItems(priorItems, requirements)) {
            return reconciliation("MaGD ton tai ledger ton kho voi snapshot khac", { MaGD });
        }
        if (ledger.TrangThai === "POSTED") {
            return { success: true, alreadyProcessed: true, MaGD, itemCount: ledger.DanhSachTruKho.length };
        }
        if (ledger.TrangThai !== "PENDING") {
            return reconciliation(ledger.LyDoDoiSoat || "Ledger ton kho dang can doi soat; khong tu dong tru lai", { MaGD, TrangThai: ledger.TrangThai });
        }
    } else {
        const now = new Date();
        try {
            ledger = await LichSuTonKho.create({
                MaGD,
                MaKH: transaction.MaKH,
                DanhSachTruKho: requirements.map((item) => ({ ...item, TrangThai: "PENDING" })),
                TrangThai: "PENDING",
                LyDoDoiSoat: null,
                NgayTao: now,
                NgayCapNhat: now
            });
        } catch (error) {
            if (error.code !== 11000) throw error;
            ledger = await readLedger(MaGD);
            if (!ledger) throw error;
            const priorItems = ledger.DanhSachTruKho.map(({ MaSP, SoLuong }) => ({ MaSP, SoLuong }));
            if (ledger.MaKH !== transaction.MaKH || !sameItems(priorItems, requirements)) {
                return reconciliation("MaGD ton tai ledger ton kho voi snapshot khac", { MaGD });
            }
            if (ledger.TrangThai === "POSTED") return { success: true, alreadyProcessed: true, MaGD };
            if (ledger.TrangThai !== "PENDING") return reconciliation("Ledger ton kho dang xu ly; khong tu dong tru lai", { MaGD, TrangThai: ledger.TrangThai });
        }
    }

    for (const item of requirements) {
        const claim = await LichSuTonKho.findOneAndUpdate(
            {
                MaGD,
                TrangThai: { $in: ["PENDING", "PROCESSING"] },
                DanhSachTruKho: { $elemMatch: { MaSP: item.MaSP, SoLuong: item.SoLuong, TrangThai: "PENDING" } }
            },
            {
                $set: {
                    TrangThai: "PROCESSING",
                    "DanhSachTruKho.$.TrangThai": "PROCESSING",
                    NgayCapNhat: new Date()
                }
            },
            { new: true }
        );
        if (!claim) {
            const current = await readLedger(MaGD);
            const line = current?.DanhSachTruKho.find((entry) => entry.MaSP === item.MaSP);
            if (line?.TrangThai === "APPLIED") continue;
            if (line?.TrangThai === "PROCESSING") {
                return reconciliation("Thao tac tru kho dang PROCESSING; khong retry de tranh tru trung", { MaGD, MaSP: item.MaSP });
            }
            return reconciliation("Khong the claim dong tru kho", { MaGD, MaSP: item.MaSP });
        }

        let updatedProduct;
        try {
            updatedProduct = await SanPham.findOneAndUpdate(
                { MaSP: item.MaSP, SoLuongTon: { $gte: item.SoLuong } },
                { $inc: { SoLuongTon: -item.SoLuong } },
                { new: true, runValidators: true }
            );
        } catch (error) {
            await markLedgerReview(MaGD, `Khong xac dinh duoc ket qua cap nhat ton kho ${item.MaSP}: ${error.message}`, item.MaSP);
            return reconciliation("Khong xac dinh duoc ket qua tru kho; can doi soat thu cong", { MaGD, MaSP: item.MaSP });
        }
        if (!updatedProduct) {
            const currentProduct = await SanPham.findOne({ MaSP: item.MaSP }).select("SoLuongTon -_id").lean();
            const reason = currentProduct
                ? `San pham ${item.MaSP} khong du ton kho tai thoi diem thanh toan`
                : `Khong tim thay san pham thanh phan ${item.MaSP}`;
            await markLedgerReview(MaGD, reason, item.MaSP);
            return reconciliation(reason, { MaGD, MaSP: item.MaSP });
        }

        try {
            const applied = await LichSuTonKho.updateOne(
                { MaGD, TrangThai: "PROCESSING", DanhSachTruKho: { $elemMatch: { MaSP: item.MaSP, TrangThai: "PROCESSING" } } },
                { $set: { "DanhSachTruKho.$.TrangThai": "APPLIED", NgayCapNhat: new Date() } }
            );
            if (!applied.modifiedCount) throw new Error("Khong xac nhan duoc trang thai APPLIED");
        } catch (error) {
            await markLedgerReview(MaGD, `Da cap nhat ton kho ${item.MaSP} nhung chua xac nhan ledger: ${error.message}`, item.MaSP);
            return reconciliation("Ton kho da co the thay doi nhung ledger chua xac nhan; can doi soat", { MaGD, MaSP: item.MaSP });
        }
    }

    const completed = await LichSuTonKho.findOneAndUpdate(
        {
            MaGD,
            TrangThai: "PROCESSING",
            DanhSachTruKho: { $not: { $elemMatch: { TrangThai: { $ne: "APPLIED" } } } }
        },
        { $set: { TrangThai: "POSTED", LyDoDoiSoat: null, NgayCapNhat: new Date() } },
        { new: true }
    );
    if (!completed) return reconciliation("Khong xac nhan duoc ledger ton kho POSTED", { MaGD });
    return { success: true, alreadyProcessed: false, MaGD, itemCount: requirements.length };
};

module.exports = { buildStockRequirements, verifyIdempotencyIndex, deductForPaidTransaction, listReconciliation };
