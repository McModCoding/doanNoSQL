
const crypto = require("crypto");

const KhachHang = require("../models/KhachHang");
const HangThanhVien = require("../models/HangThanhVien");
const GiaoDich = require("../models/GiaoDich");
const BienDongDiem = require("../models/BienDongDiem");
const PhanThuong = require("../models/PhanThuong");
const DoiThuong = require("../models/DoiThuong");

// ==========================================
// KHOA XU LY DONG BO TRONG CUNG NODE.JS
// ==========================================

const processingLocks = new Map();

const withTransactionLock = async (key, callback) => {
    const previous = processingLocks.get(key) || Promise.resolve();

    let release;

    const current = new Promise((resolve) => {
        release = resolve;
    });

    processingLocks.set(key, current);

    await previous;

    try {
        return await callback();
    } finally {
        release();

        if (processingLocks.get(key) === current) {
            processingLocks.delete(key);
        }
    }
};

// ==========================================
// CAC HAM HO TRO
// ==========================================

const toNumber = (value) => {
    if (value === null || value === undefined) {
        return NaN;
    }

    const number = Number(value.toString());

    return Number.isFinite(number) ? number : NaN;
};

const getVndPerPoint = () => {
    const value = Number(process.env.VND_PER_POINT);

    if (
        !process.env.VND_PER_POINT ||
        !Number.isFinite(value) ||
        value <= 0
    ) {
        throw new Error(
            "Chua cau hinh VND_PER_POINT trong file .env"
        );
    }

    return value;
};

const createEarnReconciliationError = (code, message) => {
    const error = new Error(message);
    error.code = code;
    error.requiresReconciliation = true;
    return error;
};

const calculateTierPoints = ({
    EligibleTicketAmount = 0,
    EligiblePopcornBeverageAmount = 0,
    VNDPerPoint,
    TyLeTichDiemVe,
    TyLeTichDiemBapNuoc
}) => {
    const ticketAmount = toNumber(EligibleTicketAmount);
    const popcornBeverageAmount = toNumber(EligiblePopcornBeverageAmount);
    const vndPerPoint = toNumber(VNDPerPoint);
    const ticketRate = toNumber(TyLeTichDiemVe);
    const popcornBeverageRate = toNumber(TyLeTichDiemBapNuoc);

    if (
        !Number.isFinite(ticketAmount) || ticketAmount < 0 ||
        !Number.isFinite(popcornBeverageAmount) || popcornBeverageAmount < 0 ||
        !Number.isFinite(vndPerPoint) || vndPerPoint <= 0 ||
        !Number.isFinite(ticketRate) || ticketRate < 0 ||
        !Number.isFinite(popcornBeverageRate) || popcornBeverageRate < 0
    ) {
        throw new Error("Du lieu dau vao tinh diem theo hang khong hop le");
    }

    const baseTicketPoints = ticketAmount / vndPerPoint;
    const basePopcornBeveragePoints = popcornBeverageAmount / vndPerPoint;
    const ticketPointsWithBonus = baseTicketPoints * (1 + ticketRate);
    const popcornBeveragePointsWithBonus = basePopcornBeveragePoints * (1 + popcornBeverageRate);
    const totalBeforeRounding = ticketPointsWithBonus + popcornBeveragePointsWithBonus;
    const totalPoints = Math.round(totalBeforeRounding);

    if (!Number.isSafeInteger(totalPoints)) {
        throw new Error("Tong diem vuot qua gioi han so nguyen an toan");
    }

    return {
        baseTicketPoints,
        basePopcornBeveragePoints,
        ticketPointsWithBonus,
        popcornBeveragePointsWithBonus,
        totalBeforeRounding,
        totalPoints
    };
};

const getEligiblePointAmounts = (transaction) => {
    const transactionType = transaction.LoaiGiaoDich;
    const comboLines = Array.isArray(transaction.ChiTietCombo)
        ? transaction.ChiTietCombo
        : [];
    const ticketLines = Array.isArray(transaction.ChiTietVe)
        ? transaction.ChiTietVe
        : [];
    const discount = transaction.SoTienGiam === null || transaction.SoTienGiam === undefined
        ? NaN
        : toNumber(transaction.SoTienGiam);

    if (transactionType === "DAT_VE") {
        if (comboLines.length > 0) {
            throw createEarnReconciliationError(
                "EARN_TRANSACTION_LINES_MISMATCH",
                "Giao dich DAT_VE co dong san pham; can doi soat"
            );
        }
        const paidAmount = toNumber(transaction.TongTien);
        if (!Number.isFinite(paidAmount) || paidAmount < 0) {
            throw createEarnReconciliationError(
                "EARN_INVALID_PAID_AMOUNT",
                "Khong xac dinh duoc TongTien thuc tra hop le de tinh diem"
            );
        }

        return {
            EligibleTicketAmount: paidAmount,
            EligiblePopcornBeverageAmount: 0,
            SkippedProductLineCount: 0,
            SkippedProductReason: null
        };
    }

    if (transactionType === "MUA_COMBO") {
        if (ticketLines.length > 0) {
            throw createEarnReconciliationError(
                "EARN_TRANSACTION_LINES_MISMATCH",
                "Giao dich MUA_COMBO co dong ve; can doi soat"
            );
        }
        return {
            EligibleTicketAmount: 0,
            EligiblePopcornBeverageAmount: 0,
            SkippedProductLineCount: comboLines.length,
            SkippedProductReason: comboLines.length
                ? "Khong co snapshot LoaiSP tai thoi diem mua; khong tinh diem cho san pham"
                : null
        };
    }

    if (transactionType !== "HON_HOP" || comboLines.length === 0) {
        throw createEarnReconciliationError(
            "EARN_TRANSACTION_LINES_MISMATCH",
            "Loai giao dich khong khop chi tiet ve/san pham; can doi soat"
        );
    }

    if (!Number.isFinite(discount) || discount < 0) {
        throw createEarnReconciliationError(
            "EARN_MIXED_DISCOUNT_UNALLOCATABLE",
            "Giao dich co san pham nhung khong xac dinh duoc khoan giam gia; can doi soat"
        );
    }

    const ticketDiscount = transaction.SoTienGiamVe === undefined || transaction.SoTienGiamVe === null
        ? (discount === 0 ? 0 : NaN)
        : toNumber(transaction.SoTienGiamVe);
    const productDiscount = transaction.SoTienGiamSanPham === undefined || transaction.SoTienGiamSanPham === null
        ? (discount === 0 ? 0 : NaN)
        : toNumber(transaction.SoTienGiamSanPham);
    if (
        !Number.isFinite(ticketDiscount) || ticketDiscount < 0 ||
        !Number.isFinite(productDiscount) || productDiscount < 0 ||
        Math.abs(ticketDiscount + productDiscount - discount) > 0.000001
    ) {
        throw createEarnReconciliationError(
            "EARN_MIXED_DISCOUNT_UNALLOCATABLE",
            "Phan bo giam gia ve/san pham khong day du hoac khong khop SoTienGiam"
        );
    }

    const ticketAmounts = ticketLines.map((line) => toNumber(line.GiaVe));
    if (ticketAmounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
        throw createEarnReconciliationError(
            "EARN_INVALID_TICKET_SNAPSHOT",
            "Chi tiet ve khong co GiaVe hop le de doi soat"
        );
    }

    const grossTicketAmount = ticketAmounts.reduce((sum, amount) => sum + amount, 0);
    const productAmounts = comboLines.map((line) => toNumber(line.ThanhTien));
    if (productAmounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
        throw createEarnReconciliationError(
            "EARN_INVALID_PRODUCT_SNAPSHOT",
            "Chi tiet san pham khong co ThanhTien hop le de doi soat"
        );
    }
    const grossProductAmount = productAmounts.reduce((sum, amount) => sum + amount, 0);
    const eligibleTicketAmount = grossTicketAmount - ticketDiscount;
    const eligibleProductAmount = grossProductAmount - productDiscount;
    if (eligibleTicketAmount < -0.000001 || eligibleProductAmount < -0.000001) {
        throw createEarnReconciliationError(
            "EARN_MIXED_DISCOUNT_EXCEEDS_LINES",
            "Khoan giam gia phan bo vuot qua gia tri dong giao dich"
        );
    }
    const lineTotal = eligibleTicketAmount + eligibleProductAmount;
    const transactionTotal = toNumber(transaction.TongTien);
    if (
        !Number.isFinite(transactionTotal) || transactionTotal < 0 ||
        Math.abs(lineTotal - transactionTotal) > 0.000001
    ) {
        throw createEarnReconciliationError(
            "EARN_MIXED_TOTAL_MISMATCH",
            "Tong cac dong giao dich khong khop TongTien; can doi soat"
        );
    }

    return {
        EligibleTicketAmount: eligibleTicketAmount,
        EligiblePopcornBeverageAmount: 0,
        SkippedProductLineCount: comboLines.length,
        SkippedProductReason: "Khong co snapshot LoaiSP tai thoi diem mua; bo qua toan bo dong san pham de tranh suy doan tu danh muc hien tai"
    };
};

const createEarnIdempotencyKey = (MaGD) => {
    return `EARN:${MaGD}`;
};

const isDuplicateIdempotencyKeyError = (error) => {
    if (error?.code !== 11000) return false;

    return Boolean(
        error.keyPattern?.IdempotencyKey ||
        error.keyValue?.IdempotencyKey ||
        String(error.message || "").includes("IdempotencyKey_1") ||
        String(error.message || "").includes("uq_bien_dong_diem_idempotency")
    );
};

const getEarnProcessingResult = (ledger) => {
    if (ledger?.TrangThai === "POSTED" || ledger?.TrangThai === "REVERSED") {
        return {
            success: true,
            alreadyProcessed: true,
            pointsEarned: 0,
            message: "Giao dich da co ledger tich diem",
            data: ledger
        };
    }

    if (ledger?.TrangThai === "PROCESSING") {
        return {
            success: false,
            alreadyProcessed: false,
            requiresReconciliation: true,
            pointsEarned: 0,
            message: "Ledger dang PROCESSING; khong tu dong cong lai de tranh trung diem",
            data: ledger
        };
    }

    return null;
};

const markEarnReconciliationRequired = (error, MaGD, IdempotencyKey) => {
    console.error(
        "Tich diem can doi soat:",
        MaGD,
        IdempotencyKey,
        error.message
    );

    error.requiresReconciliation = true;
    error.code = error.code || "EARN_RECONCILIATION_REQUIRED";
    return error;
};

const createCode = (prefix) => {
    return `${prefix}_${crypto.randomUUID()
        .replace(/-/g, "")
        .toUpperCase()}`;
};

// ==========================================
// 5.1 - TICH DIEM
// ==========================================

// 5.1.1 - Xem diem du kien

const previewPoints = async (MaGD) => {
    if (!MaGD) {
        throw new Error("MaGD khong duoc de trong");
    }

    const transaction = await GiaoDich.findOne({ MaGD });

    if (!transaction) {
        throw new Error("Giao dich khong ton tai");
    }

    const customer = await KhachHang.findOne({ MaKH: transaction.MaKH, TrangThai: "ACTIVE" })
        .select("MaHangHienTai -_id")
        .lean();
    if (!customer) {
        throw createEarnReconciliationError("EARN_CUSTOMER_UNAVAILABLE", "Khach hang khong ton tai hoac khong hoat dong; can doi soat");
    }
    const tier = await HangThanhVien.findOne({ MaHang: customer.MaHangHienTai, TrangThai: "ACTIVE" }).lean();
    if (!tier) {
        throw createEarnReconciliationError("EARN_TIER_UNAVAILABLE", "Hang hien tai khong ton tai hoac khong hoat dong; can doi soat");
    }
    const amounts = getEligiblePointAmounts(transaction);
    const calculated = calculateTierPoints({
        ...amounts,
        VNDPerPoint: getVndPerPoint(),
        TyLeTichDiemVe: tier.TyLeTichDiemVe,
        TyLeTichDiemBapNuoc: tier.TyLeTichDiemBapNuoc
    });

    return {
        MaGD: transaction.MaGD,
        MaKH: transaction.MaKH,
        TongTien: toNumber(transaction.TongTien),
        DiemDuKien: calculated.totalPoints,
        MaHang: tier.MaHang,
        TienVeDuocTinhDiem: amounts.EligibleTicketAmount,
        TienBapNuocDuocTinhDiem: amounts.EligiblePopcornBeverageAmount,
        SoDongSanPhamBoQua: amounts.SkippedProductLineCount,
        LyDoBoQuaSanPham: amounts.SkippedProductReason
    };
};

// 5.1.2 - Tich diem sau khi giao dich hoan tat

const earnPoints = async (MaGD) => {
    if (!MaGD) {
        throw new Error("MaGD khong duoc de trong");
    }

    return withTransactionLock(`GD:${MaGD}`, async () => {

        const transaction = await GiaoDich.findOne({ MaGD });

        if (!transaction) {
            throw new Error("Giao dich khong ton tai");
        }

        if (transaction.TrangThai !== "COMPLETED") {
            throw new Error(
                "Chi duoc tich diem cho giao dich da hoan tat"
            );
        }

        const IdempotencyKey =
            createEarnIdempotencyKey(MaGD);

        let ledger = await BienDongDiem.findOne({ IdempotencyKey });

        if (ledger) {
            if (
                ledger.MaKH !== transaction.MaKH ||
                ledger.MaGD !== transaction.MaGD ||
                ledger.Loai !== "EARN"
            ) {
                throw new Error(
                    "IdempotencyKey da ton tai nhung khong khop giao dich/khach hang. Can doi soat"
                );
            }

            const priorResult = getEarnProcessingResult(ledger);
            if (priorResult) return priorResult;
        }

        const customer = await KhachHang.findOne({
            MaKH: transaction.MaKH,
            TrangThai: "ACTIVE"
        });

        if (!customer) {
            throw createEarnReconciliationError("EARN_CUSTOMER_UNAVAILABLE", "Khach hang khong ton tai hoac khong hoat dong; can doi soat");
        }

        const tier = await HangThanhVien.findOne({
            MaHang: customer.MaHangHienTai,
            TrangThai: "ACTIVE"
        }).lean();
        if (!tier) {
            throw createEarnReconciliationError("EARN_TIER_UNAVAILABLE", "Hang hien tai khong ton tai hoac khong hoat dong; can doi soat");
        }

        let amounts;
        let calculatedPoints;
        if (!ledger) {
            amounts = getEligiblePointAmounts(transaction);
            calculatedPoints = calculateTierPoints({
                ...amounts,
                VNDPerPoint: getVndPerPoint(),
                TyLeTichDiemVe: tier.TyLeTichDiemVe,
                TyLeTichDiemBapNuoc: tier.TyLeTichDiemBapNuoc
            }).totalPoints;

            if (calculatedPoints <= 0) {
                return {
                    success: true,
                    alreadyProcessed: false,
                    pointsEarned: 0,
                    message: "Giao dich khong du dieu kien nhan diem",
                    skippedProductLineCount: amounts.SkippedProductLineCount,
                    skippedProductReason: amounts.SkippedProductReason
                };
            }
        } else {
            // Ledger PENDING da ton tai la so diem duoc chot tu lan xu ly truoc.
            calculatedPoints = ledger.SoDiem;
            if (!Number.isSafeInteger(calculatedPoints) || calculatedPoints <= 0) {
                throw createEarnReconciliationError(
                    "EARN_LEDGER_POINTS_INVALID",
                    "SoDiem trong ledger PENDING khong hop le; can doi soat"
                );
            }
        }

        if (!ledger) {
            try {
                ledger = await BienDongDiem.create({
                    MaLedger: createCode("LD"),
                    MaKH: transaction.MaKH,
                    MaGD: transaction.MaGD,
                    MaDoi: null,
                    Loai: "EARN",
                    SoDiem: calculatedPoints,
                    NgayPhatSinh: new Date(),
                    NgayHetHan: null,
                    LyDo: amounts?.SkippedProductLineCount
                        ? `Tich diem tu giao dich ${MaGD}; bo qua ${amounts.SkippedProductLineCount} dong san pham do khong co snapshot LoaiSP`
                        : `Tich diem tu giao dich ${MaGD}`,
                    TrangThai: "PENDING",
                    IdempotencyKey
                });
            } catch (createError) {
                if (!isDuplicateIdempotencyKeyError(createError)) {
                    throw createError;
                }

                // Unique index la arbitration giua cac process. Chi tiep tuc
                // voi ledger da duoc process khac tao cho dung idempotency key.
                ledger = await BienDongDiem.findOne({ IdempotencyKey });
                if (!ledger) throw createError;

                if (
                    ledger.MaKH !== transaction.MaKH ||
                    ledger.MaGD !== transaction.MaGD ||
                    ledger.Loai !== "EARN"
                ) {
                    throw new Error(
                        "Duplicate IdempotencyKey khong khop giao dich/khach hang. Can doi soat"
                    );
                }

                const priorResult = getEarnProcessingResult(ledger);
                if (priorResult) return priorResult;
            }
        }

        // Chi process nao claim duoc PENDING -> PROCESSING moi co quyen cong.
        // Claim tren mot document la atomic va duoc unique ledger bao ve giua
        // nhieu Node process; Map lock ben tren chi la toi uu trong process.
        const claimedLedger = await BienDongDiem.findOneAndUpdate(
            {
                IdempotencyKey,
                TrangThai: "PENDING"
            },
            {
                $set: { TrangThai: "PROCESSING" }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!claimedLedger) {
            const latestLedger = await BienDongDiem.findOne({ IdempotencyKey });
            const priorResult = getEarnProcessingResult(latestLedger);
            if (priorResult) return priorResult;

            throw new Error(
                "Khong the claim ledger tich diem. Can doi soat"
            );
        }

        const points = claimedLedger.SoDiem;
        let updatedCustomer;

        try {
            updatedCustomer = await KhachHang.findOneAndUpdate(
                {
                    MaKH: transaction.MaKH,
                    TrangThai: "ACTIVE"
                },
                {
                    $inc: {
                        DiemHienTai: points,
                        TongDiemTichLuy: points
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );
        } catch (customerUpdateError) {
            // Khong rollback tu dong: loi ket noi co the xay ra sau khi Mongo
            // da ghi. PROCESSING se chan cong lai va bao hieu doi soat.
            throw markEarnReconciliationRequired(
                customerUpdateError,
                MaGD,
                IdempotencyKey
            );
        }

        if (!updatedCustomer) {
            // findOneAndUpdate tra null xac nhan khong co tai khoan ACTIVE nao
            // duoc cap nhat; cho phep retry sau khi du lieu/tai khoan duoc sua.
            try {
                await BienDongDiem.updateOne(
                    { IdempotencyKey, TrangThai: "PROCESSING" },
                    { $set: { TrangThai: "PENDING" } }
                );
            } catch (resetError) {
                throw markEarnReconciliationRequired(
                    resetError,
                    MaGD,
                    IdempotencyKey
                );
            }

            throw new Error("Khong the cap nhat diem khach hang hoat dong");
        }

        let postedLedger;
        try {
            postedLedger = await BienDongDiem.findOneAndUpdate(
                { IdempotencyKey, TrangThai: "PROCESSING" },
                { $set: { TrangThai: "POSTED" } },
                { new: true, runValidators: true }
            );
        } catch (postError) {
            throw markEarnReconciliationRequired(postError, MaGD, IdempotencyKey);
        }

        if (!postedLedger) {
            throw markEarnReconciliationRequired(
                new Error("Khong the chuyen ledger sang POSTED sau khi cong diem"),
                MaGD,
                IdempotencyKey
            );
        }

        return {
            success: true,
            alreadyProcessed: false,
            pointsEarned: points,
            message: "Tich diem thanh cong",
            data: {
                MaGD,
                MaKH: transaction.MaKH,
                DiemCong: points,
                DiemHienTai: updatedCustomer.DiemHienTai,
                TongDiemTichLuy: updatedCustomer.TongDiemTichLuy,
                MaLedger: postedLedger.MaLedger
            },
            skippedProductLineCount: amounts?.SkippedProductLineCount || 0,
            skippedProductReason: amounts?.SkippedProductReason || null
        };
    });
};

// ==========================================
// 5.2 - LICH SU BIEN DONG DIEM
// ==========================================

// 5.2.1 - Xem lich su bien dong diem

const getPointSummary = async (MaKH) => {
    if (!MaKH) {
        throw new Error("MaKH khong duoc de trong");
    }

    const summary = await KhachHang.findOne({ MaKH })
        .select("MaKH DiemHienTai TongDiemTichLuy -_id")
        .lean();

    if (!summary) {
        throw new Error("Khong tim thay khach hang");
    }

    return summary;
};

const parseHistoryDate = (value, fieldName) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`${fieldName} khong hop le`);
    }

    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

        if (
            date.getUTCFullYear() !== Number(year) ||
            date.getUTCMonth() !== Number(month) - 1 ||
            date.getUTCDate() !== Number(day)
        ) {
            throw new Error(`${fieldName} khong hop le`);
        }

        return { date, dateOnly: true };
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${fieldName} khong hop le`);
    }

    return { date, dateOnly: false };
};

const parsePositiveInteger = (value, defaultValue, fieldName) => {
    if (value === undefined) return defaultValue;

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
        throw new Error(`${fieldName} phai la so nguyen lon hon 0`);
    }

    return parsed;
};

const getPointHistory = async (MaKH, filters = {}) => {
    if (!MaKH) {
        throw new Error("MaKH khong duoc de trong");
    }

    const query = { MaKH };

    const allowedTypes = [
        "EARN",
        "REDEEM",
        "BONUS",
        "EXPIRE",
        "ADJUST",
        "REVERSE"
    ];

    // Ledger dang xu ly khong phai bien dong diem da ghi nhan.
    query.TrangThai = { $in: ["POSTED", "REVERSED"] };

    if (filters.Loai) {
        const types = Array.isArray(filters.Loai)
            ? filters.Loai
            : [filters.Loai];

        if (
            types.length === 0 ||
            types.some((type) => !allowedTypes.includes(type))
        ) {
            throw new Error("Loai bien dong khong hop le");
        }

        query.Loai = types.length === 1 ? types[0] : { $in: types };
    }

    if (filters.TuNgay || filters.DenNgay) {
        const dateFilter = {};
        let fromDate;
        let toDate;

        if (filters.TuNgay) {
            fromDate = parseHistoryDate(filters.TuNgay, "fromDate");
            dateFilter.$gte = fromDate.date;
        }

        if (filters.DenNgay) {
            toDate = parseHistoryDate(filters.DenNgay, "toDate");
        }

        if (fromDate && toDate && fromDate.date > toDate.date) {
            throw new Error("fromDate khong duoc sau toDate");
        }

        if (toDate) {
            if (toDate.dateOnly) {
                const nextDay = new Date(toDate.date);
                nextDay.setUTCDate(nextDay.getUTCDate() + 1);
                dateFilter.$lt = nextDay;
            } else {
                dateFilter.$lte = toDate.date;
            }
        }

        query.NgayPhatSinh = dateFilter;
    }

    const page = parsePositiveInteger(filters.page, 1, "page");
    const requestedLimit = parsePositiveInteger(filters.limit, 10, "limit");
    const limit = Math.min(100, requestedLimit);

    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip)) {
        throw new Error("page vuot qua gioi han");
    }

    const [history, total] = await Promise.all([
        BienDongDiem.find(query)
            .select("Loai SoDiem LyDo NgayPhatSinh TrangThai -_id")
            .sort({ NgayPhatSinh: -1, MaLedger: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        BienDongDiem.countDocuments(query)
    ]);

    return {
        MaKH,
        data: history,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// Ham cu duoc giu lai de khong anh huong code 5.1 dang su dung

const getEarnHistory = async (MaKH, filters = {}) => {
    const allowedEarnTypes = ["EARN", "BONUS"];
    if (
        filters.Loai &&
        !allowedEarnTypes.includes(filters.Loai)
    ) {
        throw new Error("Loai lich su tich diem chi ho tro EARN hoac BONUS");
    }

    return getPointHistory(MaKH, {
        ...filters,
        Loai: filters.Loai || allowedEarnTypes
    });
};

const getRedeemHistory = async (MaKH, filters = {}) => {
    if (filters.Loai && filters.Loai !== "REDEEM") {
        throw new Error("Loai lich su su dung diem chi ho tro REDEEM");
    }

    return getPointHistory(MaKH, {
        ...filters,
        Loai: "REDEEM"
    });
};

// ==========================================
// 5.3 - DOI DIEM LAY PHAN THUONG
// ==========================================

// 5.3.1 - Xem danh sach phan thuong co the doi

const getAvailableRewards = async () => {
    const now = new Date();

    return PhanThuong.find({
        TrangThai: "ACTIVE",
        SoLuongTon: { $gt: 0 },
        DiemCan: { $gt: 0 },
        NgayBatDau: { $lte: now },
        NgayKetThuc: { $gte: now }
    })
        .select(
            "MaQua TenQua LoaiQua DiemCan MoTa GiaTriGiam SoLuongTon NgayBatDau NgayKetThuc"
        )
        .sort({
            DiemCan: 1,
            MaQua: 1
        })
        .lean();
};

// ==========================================
// 5.4 - DOI SOAT LOYALTY (READ-ONLY)
// ==========================================

const parseReconciliationPagination = (filters = {}) => {
    const parse = (value, fallback, name) => {
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^\d+$/.test(value)) {
            throw new Error(`${name} phai la so nguyen duong`);
        }
        const number = Number(value);
        if (!Number.isSafeInteger(number) || number < 1) {
            throw new Error(`${name} phai la so nguyen duong`);
        }
        return number;
    };

    const page = parse(filters.page, 1, "page");
    const limit = Math.min(parse(filters.limit, 20, "limit"), 100);
    const olderThanHours = parse(filters.olderThanHours, 24, "olderThanHours");
    if (olderThanHours > 8760) {
        throw new Error("olderThanHours vuot qua gioi han 8760");
    }
    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip)) throw new Error("page vuot qua gioi han");

    return {
        page,
        limit,
        skip,
        olderThanHours,
        cutoff: new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    };
};

const validateReconciliationEnum = (value, allowed, name) => {
    if (value !== undefined && !allowed.includes(value)) {
        throw new Error(`${name} khong hop le`);
    }
};

const runPagedAggregate = async (model, pipeline, { page, limit, skip }) => {
    const result = await model.aggregate([
        ...pipeline,
        {
            $facet: {
                items: [{ $sort: { NgayPhatSinh: -1, MaLedger: 1, MaDoi: 1 } }, { $skip: skip }, { $limit: limit }],
                metadata: [{ $count: "total" }]
            }
        }
    ]);
    const facet = result[0] || { items: [], metadata: [] };
    const total = facet.metadata[0]?.total || 0;
    return {
        items: facet.items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
};

const getReconciliationSummary = async (filters = {}) => {
    const options = parseReconciliationPagination(filters);
    const cutoff = options.cutoff;

    const [stalePendingLedger, staleProcessingLedger, stalePendingRedemption,
        postedRedeemPending, completedWithoutPostedLedger, cancelledRedemptions,
        rewardCount, ledgerLinks] = await Promise.all([
        BienDongDiem.countDocuments({ TrangThai: "PENDING", NgayPhatSinh: { $lte: cutoff } }),
        BienDongDiem.countDocuments({ TrangThai: "PROCESSING", NgayPhatSinh: { $lte: cutoff } }),
        DoiThuong.countDocuments({ TrangThai: "PENDING", NgayDoi: { $lte: cutoff } }),
        BienDongDiem.aggregate([
                { $match: { Loai: "REDEEM", TrangThai: "POSTED", MaDoi: { $ne: null } } },
                { $lookup: { from: "doi_thuong", localField: "MaDoi", foreignField: "MaDoi", as: "redemption" } },
                { $match: { "redemption.TrangThai": "PENDING" } },
                { $count: "total" }
            ]).then((rows) => rows[0]?.total || 0),
        DoiThuong.aggregate([
            { $match: { TrangThai: "COMPLETED" } },
            { $lookup: { from: "bien_dong_diem", let: { maDoi: "$MaDoi", maKH: "$MaKH", points: "$DiemSuDung" }, pipeline: [
                { $match: { $expr: { $and: [ { $eq: ["$MaDoi", "$$maDoi"] }, { $eq: ["$MaKH", "$$maKH"] }, { $eq: ["$Loai", "REDEEM"] }, { $eq: ["$SoDiem", { $multiply: ["$$points", -1] }] }, { $eq: ["$TrangThai", "POSTED"] } ] } } },
                { $limit: 1 }
            ], as: "ledger" } },
            { $match: { $expr: { $eq: [{ $size: "$ledger" }, 0] } } },
            { $count: "total" }
        ]).then((rows) => rows[0]?.total || 0),
        DoiThuong.countDocuments({ TrangThai: "CANCELLED" }),
        PhanThuong.countDocuments({}),
        BienDongDiem.aggregate([
            { $match: { $or: [ { Loai: "EARN", MaGD: { $ne: null } }, { Loai: "REDEEM", MaDoi: { $ne: null } } ] } },
            { $group: { _id: { Loai: "$Loai", Link: { $cond: [ { $eq: ["$Loai", "EARN"] }, "$MaGD", "$MaDoi"] }, MaKH: "$MaKH" }, count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $count: "duplicateLogicalLinks" }
        ])
    ]);

    return {
        readOnly: true,
        staleThresholdHours: options.olderThanHours,
        asOf: new Date(),
        counts: {
            stalePendingLedger,
            staleProcessingLedger,
            stalePendingRedemption,
            postedRedeemPending,
            completedWithoutPostedLedger,
            cancelledRedemptionsRequiringReview: cancelledRedemptions,
            rewardRecords: rewardCount,
            duplicateLogicalLinks: ledgerLinks[0]?.duplicateLogicalLinks || 0
        },
        balanceMethod: "DiemHienTai doi chieu voi tong SoDiem cua ledger POSTED; REVERSED bi loai khoi so du. Loai REVERSE POSTED duoc tinh theo dau SoDiem.",
        cumulativePointsNote: "TongDiemTichLuy hien chi duoc earnPoints cap nhat. Chua co quy tac ghi BONUS/ADJUST/REVERSE day du de suy ra gia tri nay chi tu ledger."
    };
};

const getPointReconciliation = async (filters = {}) => {
    const options = parseReconciliationPagination(filters);
    const customerQuery = filters.MaKH ? { MaKH: filters.MaKH } : {};
    const [customers, total] = await Promise.all([
        KhachHang.find(customerQuery)
            .select("MaKH DiemHienTai TongDiemTichLuy -_id")
            .sort({ MaKH: 1 }).skip(options.skip).limit(options.limit).lean(),
        KhachHang.countDocuments(customerQuery)
    ]);
    const customerIds = customers.map((customer) => customer.MaKH);
    const ledgerGroups = customerIds.length ? await BienDongDiem.aggregate([
        { $match: { MaKH: { $in: customerIds } } },
        { $group: { _id: { MaKH: "$MaKH", Loai: "$Loai", TrangThai: "$TrangThai" }, points: { $sum: "$SoDiem" }, count: { $sum: 1 } } }
    ]) : [];

    const byCustomer = new Map();
    for (const group of ledgerGroups) {
        const rows = byCustomer.get(group._id.MaKH) || {};
        rows[group._id.Loai] ||= {};
        rows[group._id.Loai][group._id.TrangThai] = { SoDiem: group.points, SoBanGhi: group.count };
        byCustomer.set(group._id.MaKH, rows);
    }

    const items = customers.map((customer) => {
        const breakdown = byCustomer.get(customer.MaKH) || {};
        const balanceFromLedger = Object.values(breakdown).reduce(
            (sum, statuses) => sum + (statuses.POSTED?.SoDiem || 0), 0
        );
        const earnedFromLedger = breakdown.EARN?.POSTED?.SoDiem || 0;
        const unsettled = Object.values(breakdown).some(
            (statuses) => (statuses.PENDING?.SoBanGhi || 0) + (statuses.PROCESSING?.SoBanGhi || 0) > 0
        );
        const hasReversed = Object.values(breakdown).some((statuses) => (statuses.REVERSED?.SoBanGhi || 0) > 0);
        const reasons = [];
        if (customer.DiemHienTai !== balanceFromLedger) reasons.push("So du khac tong SoDiem cua ledger POSTED");
        if (unsettled) reasons.push("Co ledger PENDING/PROCESSING chua duoc tinh vao so du");
        if (hasReversed) reasons.push("Co ledger REVERSED; khong tinh vao so du POSTED");
        if (customer.TongDiemTichLuy !== earnedFromLedger) reasons.push("TongDiemTichLuy khac tong EARN POSTED; can xac minh BONUS/ADJUST va lich su cu");
        return {
            MaKH: customer.MaKH,
            DiemHienTai: customer.DiemHienTai,
            DiemTinhTuLedger: balanceFromLedger,
            ChenhLechDiemHienTai: customer.DiemHienTai - balanceFromLedger,
            TongDiemTichLuy: customer.TongDiemTichLuy,
            TongEARNPostedTuLedger: earnedFromLedger,
            ChenhLechTongTichLuySoVoiEARN: customer.TongDiemTichLuy - earnedFromLedger,
            ledgerTheoLoai: breakdown,
            nguyenNhanCanXemXet: reasons,
            ghiChuTongTichLuy: "So sanh chi voi EARN POSTED; BONUS/ADJUST va cac quy tac lich su khac chua duoc xac nhan."
        };
    });

    return {
        items,
        pagination: { page: options.page, limit: options.limit, total, totalPages: Math.ceil(total / options.limit) },
        readOnly: true
    };
};

const getRedemptionReconciliation = async (filters = {}) => {
    const options = parseReconciliationPagination(filters);
    const pipeline = [
        { $lookup: { from: "bien_dong_diem", let: { maDoi: "$MaDoi", maKH: "$MaKH", points: "$DiemSuDung" }, pipeline: [
            { $match: { $expr: { $and: [ { $eq: ["$MaDoi", "$$maDoi"] }, { $eq: ["$MaKH", "$$maKH"] }, { $eq: ["$Loai", "REDEEM"] } ] } } },
            { $project: { _id: 0, MaLedger: 1, SoDiem: 1, TrangThai: 1 } }
        ], as: "redeemLedgers" } },
        { $lookup: { from: "khach_hang", localField: "MaKH", foreignField: "MaKH", pipeline: [ { $project: { _id: 0, DiemHienTai: 1 } } ], as: "customerSnapshot" } },
        { $lookup: { from: "phan_thuong", localField: "MaQua", foreignField: "MaQua", pipeline: [ { $project: { _id: 0, SoLuongTon: 1, TrangThai: 1 } } ], as: "rewardSnapshot" } },
        { $addFields: {
            hasPostedMatchingLedger: { $gt: [ { $size: { $filter: { input: "$redeemLedgers", as: "l", cond: { $and: [ { $eq: ["$$l.TrangThai", "POSTED"] }, { $eq: ["$$l.SoDiem", { $multiply: ["$DiemSuDung", -1] }] } ] } } } }, 0] },
            DiemHienTaiHienTai: { $arrayElemAt: ["$customerSnapshot.DiemHienTai", 0] },
            SoLuongTonHienTai: { $arrayElemAt: ["$rewardSnapshot.SoLuongTon", 0] },
            TrangThaiQuaHienTai: { $arrayElemAt: ["$rewardSnapshot.TrangThai", 0] }
        } },
        { $match: { $or: [
            { TrangThai: "PENDING", NgayDoi: { $lte: options.cutoff } },
            { TrangThai: "PENDING", hasPostedMatchingLedger: true },
            { TrangThai: "COMPLETED", hasPostedMatchingLedger: false },
            { TrangThai: "CANCELLED" }
        ] } },
        { $addFields: { lyDoDoiSoat: { $switch: {
            branches: [
                { case: { $eq: ["$TrangThai", "CANCELLED"] }, then: "CAN_XAC_MINH_HOAN_DIEM_VA_TON_KHO; KHONG_THE_KET_LUAN_TU_SCHEMA" },
                { case: { $eq: ["$TrangThai", "COMPLETED"] }, then: "COMPLETED_NHUNG_THIEU_LEDGER_REDEEM_POSTED_KHOP_MAKH_MADOI_SODIEM" },
                { case: { $eq: ["$hasPostedMatchingLedger", true] }, then: "LEDGER_POSTED_NHUNG_DOITHUONG_PENDING" }
            ],
            default: "DOITHUONG_PENDING_QUA_NGUONG_THOI_GIAN"
        } } } },
        { $addFields: { NgayPhatSinh: "$NgayDoi" } },
        { $project: { MaDoi: 1, MaKH: 1, MaQua: 1, SoLuong: 1, DiemSuDung: 1, NgayDoi: 1, HanSuDung: 1, TrangThai: 1, redeemLedgers: 1, DiemHienTaiHienTai: 1, SoLuongTonHienTai: 1, TrangThaiQuaHienTai: 1, lyDoDoiSoat: 1 } }
    ];
    const result = await runPagedAggregate(DoiThuong, pipeline, options);
    return { ...result, readOnly: true, note: "Khong the suy ra chac chan hoan diem/tang ton kho tu cac schema hien co; CANCELLED duoc dua vao danh sach can xem xet thu cong." };
};

const getLedgerReconciliation = async (filters = {}) => {
    const options = parseReconciliationPagination(filters);
    const allowedTypes = ["EARN", "REDEEM", "BONUS", "EXPIRE", "ADJUST", "REVERSE"];
    const allowedStatuses = ["PENDING", "PROCESSING", "POSTED", "REVERSED"];
    validateReconciliationEnum(filters.type, allowedTypes, "type");
    validateReconciliationEnum(filters.status, allowedStatuses, "status");

    const match = {};
    if (filters.type) match.Loai = filters.type;
    if (filters.status) match.TrangThai = filters.status;
    const pipeline = [
        { $match: match },
        { $lookup: { from: "giao_dich", localField: "MaGD", foreignField: "MaGD", as: "transaction" } },
        { $lookup: { from: "doi_thuong", localField: "MaDoi", foreignField: "MaDoi", as: "redemption" } },
        { $lookup: { from: "bien_dong_diem", let: { loai: "$Loai", maGD: "$MaGD", maDoi: "$MaDoi", maLedger: "$MaLedger" }, pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ["$Loai", "$$loai"] },
                { $ne: ["$MaLedger", "$$maLedger"] },
                { $or: [
                    { $and: [ { $eq: ["$$loai", "EARN"] }, { $eq: ["$MaGD", "$$maGD"] }, { $ne: ["$$maGD", null] } ] },
                    { $and: [ { $eq: ["$$loai", "REDEEM"] }, { $eq: ["$MaDoi", "$$maDoi"] }, { $ne: ["$$maDoi", null] } ] }
                ] }
            ] } } },
            { $limit: 1 }
        ], as: "duplicateLogicalLink" } },
        { $lookup: { from: "bien_dong_diem", let: { maLedger: "$MaLedger", idempotencyKey: "$IdempotencyKey" }, pipeline: [
            { $match: { $expr: { $and: [
                { $ne: ["$MaLedger", "$$maLedger"] },
                { $or: [ { $eq: ["$MaLedger", "$$maLedger"] }, { $eq: ["$IdempotencyKey", "$$idempotencyKey"] } ] }
            ] } } },
            { $limit: 1 }
        ], as: "duplicateLedgerKey" } },
        { $addFields: {
            linkedTransaction: { $arrayElemAt: ["$transaction", 0] },
            linkedRedemption: { $arrayElemAt: ["$redemption", 0] }
        } },
        { $addFields: {
            anomalyReasons: { $concatArrays: [
                { $cond: [ { $and: [ { $in: ["$TrangThai", ["PENDING", "PROCESSING"]] }, { $lte: ["$NgayPhatSinh", options.cutoff] } ] }, ["LEDGER_STALE_PENDING_OR_PROCESSING"], [] ] },
                { $cond: [ { $and: [ { $eq: ["$Loai", "EARN"] }, { $or: [ { $eq: ["$MaGD", null] }, { $eq: [{ $size: "$transaction" }, 0] } ] } ] }, ["EARN_MISSING_TRANSACTION"], [] ] },
                { $cond: [ { $and: [ { $eq: ["$Loai", "EARN"] }, { $gt: [{ $size: "$transaction" }, 0] }, { $ne: ["$linkedTransaction.MaKH", "$MaKH"] } ] }, ["EARN_CUSTOMER_MISMATCH"], [] ] },
                { $cond: [ { $and: [ { $eq: ["$Loai", "REDEEM"] }, { $or: [ { $eq: ["$MaDoi", null] }, { $eq: [{ $size: "$redemption" }, 0] } ] } ] }, ["REDEEM_MISSING_REDEMPTION"], [] ] },
                { $cond: [ { $and: [ { $eq: ["$Loai", "REDEEM"] }, { $gt: [{ $size: "$redemption" }, 0] }, { $ne: ["$linkedRedemption.MaKH", "$MaKH"] } ] }, ["REDEEM_CUSTOMER_MISMATCH"], [] ] },
                { $cond: [ { $and: [ { $eq: ["$Loai", "REDEEM"] }, { $gt: [{ $size: "$redemption" }, 0] }, { $ne: ["$SoDiem", { $multiply: ["$linkedRedemption.DiemSuDung", -1] }] } ] }, ["REDEEM_POINTS_MISMATCH"], [] ] },
                { $cond: [ { $and: [ { $eq: ["$Loai", "REDEEM"] }, { $eq: ["$TrangThai", "POSTED"] }, { $eq: ["$linkedRedemption.TrangThai", "PENDING"] } ] }, ["POSTED_REDEEM_REDEMPTION_PENDING"], [] ] },
                { $cond: [ { $gt: [{ $size: "$duplicateLogicalLink" }, 0] }, ["DUPLICATE_LOGICAL_BUSINESS_LINK"], [] ] },
                { $cond: [ { $gt: [{ $size: "$duplicateLedgerKey" }, 0] }, ["DUPLICATE_LEDGER_KEY"], [] ] }
            ] }
        } },
        { $match: { anomalyReasons: { $ne: [] } } },
        { $project: { MaLedger: 1, MaKH: 1, MaGD: 1, MaDoi: 1, Loai: 1, SoDiem: 1, NgayPhatSinh: 1, TrangThai: 1, anomalyReasons: 1 } }
    ];
    const result = await runPagedAggregate(BienDongDiem, pipeline, options);
    return { ...result, readOnly: true, staleThresholdHours: options.olderThanHours };
};

const getInventoryReconciliation = async (filters = {}) => {
    const options = parseReconciliationPagination(filters);
    const [total, rewards] = await Promise.all([
        PhanThuong.countDocuments({}),
        PhanThuong.find({}).select("MaQua TenQua SoLuongTon TrangThai -_id")
            .sort({ MaQua: 1 }).skip(options.skip).limit(options.limit).lean()
    ]);
    const ids = rewards.map((reward) => reward.MaQua);
    const sums = ids.length ? await DoiThuong.aggregate([
        { $match: { MaQua: { $in: ids } } },
        { $group: { _id: { MaQua: "$MaQua", TrangThai: "$TrangThai" }, soLuongDoi: { $sum: "$SoLuong" }, soLanDoi: { $sum: 1 } } }
    ]) : [];
    const summary = new Map();
    for (const row of sums) {
        const item = summary.get(row._id.MaQua) || {};
        item[row._id.TrangThai] = { SoLuongDoi: row.soLuongDoi, SoLanDoi: row.soLanDoi };
        summary.set(row._id.MaQua, item);
    }

    return {
        items: rewards.map((reward) => ({
            ...reward,
            doiThuongTheoTrangThai: summary.get(reward.MaQua) || {},
            ketLuan: "Chi bao cao tong so luong doi theo trang thai; khong the tinh chenh lech ton kho khi khong co so ton dau ky/nhat ky nhap xuat."
        })),
        pagination: { page: options.page, limit: options.limit, total, totalPages: Math.ceil(total / options.limit) },
        readOnly: true
    };
};

// 5.3.2 - Doi diem lay phan thuong

const createRedeemIdentity = (MaKH, clientKey) => {
    const digest = crypto
        .createHash("sha256")
        .update(`${MaKH}:${clientKey}`)
        .digest("hex")
        .toUpperCase();

    return {
        MaDoi: `DOI_${digest}`,
        IdempotencyKey: `REDEEM:${digest}`
    };
};

const createRedeemError = (message, statusCode = 400, requiresReconciliation = false) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.requiresReconciliation = requiresReconciliation;
    return error;
};

const isDuplicateKeyFor = (error, field, indexName) => {
    if (error?.code !== 11000) return false;

    return Boolean(
        error.keyPattern?.[field] ||
        error.keyValue?.[field] ||
        String(error.message || "").includes(indexName)
    );
};

const assertSameRedemptionPayload = (redemption, MaKH, MaQua, quantity) => {
    if (
        redemption.MaKH !== MaKH ||
        redemption.MaQua !== MaQua ||
        redemption.SoLuong !== quantity
    ) {
        throw createRedeemError(
            "IdempotencyKey da duoc dung voi noi dung doi thuong khac",
            409
        );
    }
};

const requireReconciliation = (MaDoi, message, cause = null) => {
    console.error(
        "Doi thuong can doi soat:",
        MaDoi,
        cause?.message || message
    );

    return createRedeemError(message, 409, true);
};

const finishRedemption = async (redemption, ledger, alreadyProcessed) => {
    let completed = redemption;

    if (redemption.TrangThai === "PENDING") {
        completed = await DoiThuong.findOneAndUpdate(
            { MaDoi: redemption.MaDoi, TrangThai: "PENDING" },
            { $set: { TrangThai: "COMPLETED" } },
            { new: true, runValidators: true }
        );

        if (!completed) {
            completed = await DoiThuong.findOne({ MaDoi: redemption.MaDoi });
        }
    }

    if (completed?.TrangThai !== "COMPLETED") {
        throw requireReconciliation(
            redemption.MaDoi,
            "Ledger REDEEM da POSTED nhung khong the hoan tat DoiThuong"
        );
    }

    const [customer, reward] = await Promise.all([
        KhachHang.findOne({ MaKH: redemption.MaKH })
            .select("DiemHienTai -_id")
            .lean(),
        PhanThuong.findOne({ MaQua: redemption.MaQua })
            .select("TenQua -_id")
            .lean()
    ]);

    return {
        success: true,
        alreadyProcessed,
        message: alreadyProcessed
            ? "Yeu cau doi thuong da duoc xu ly truoc do"
            : "Doi thuong thanh cong",
        data: {
            MaDoi: completed.MaDoi,
            MaQua: completed.MaQua,
            TenQua: reward?.TenQua || null,
            SoLuong: completed.SoLuong,
            DiemSuDung: completed.DiemSuDung,
            DiemHienTai: customer?.DiemHienTai ?? null,
            MaVoucher: completed.MaVoucher,
            MaLedger: ledger.MaLedger,
            TrangThai: completed.TrangThai
        }
    };
};

const markRedemptionCancelled = async (redemption, ledger, reason) => {
    let reversedLedger;
    try {
        reversedLedger = await BienDongDiem.findOneAndUpdate(
            {
                IdempotencyKey: ledger.IdempotencyKey,
                TrangThai: "PROCESSING"
            },
            { $set: { TrangThai: "REVERSED" } },
            { new: true, runValidators: true }
        );
    } catch (error) {
        throw requireReconciliation(
            redemption.MaDoi,
            "Khong the ghi nhan huy ledger REDEEM",
            error
        );
    }

    if (!reversedLedger) {
        reversedLedger = await BienDongDiem.findOne({
            IdempotencyKey: ledger.IdempotencyKey
        });
    }

    if (reversedLedger?.TrangThai !== "REVERSED") {
        throw requireReconciliation(
            redemption.MaDoi,
            "Khong xac nhan duoc trang thai REVERSED cua ledger"
        );
    }

    let cancelled = await DoiThuong.findOneAndUpdate(
        { MaDoi: redemption.MaDoi, TrangThai: "PENDING" },
        { $set: { TrangThai: "CANCELLED" } },
        { new: true, runValidators: true }
    );

    if (!cancelled) {
        cancelled = await DoiThuong.findOne({ MaDoi: redemption.MaDoi });
    }

    if (cancelled?.TrangThai !== "CANCELLED") {
        throw requireReconciliation(
            redemption.MaDoi,
            "Ledger da REVERSED nhung khong the huy DoiThuong"
        );
    }

    throw createRedeemError(reason, 409);
};

const redeemReward = async (MaKH, MaQua, SoLuong = 1, clientKey) => {
    if (!MaKH || typeof MaKH !== "string") {
        throw createRedeemError("MaKH khong hop le", 401);
    }

    if (typeof MaQua !== "string" || !MaQua.trim()) {
        throw createRedeemError("MaQua khong duoc de trong");
    }

    if (
        typeof SoLuong !== "number" ||
        !Number.isSafeInteger(SoLuong) ||
        SoLuong < 1 ||
        SoLuong > 100
    ) {
        throw createRedeemError("SoLuong phai la so nguyen tu 1 den 100");
    }

    if (
        typeof clientKey !== "string" ||
        !/^[A-Za-z0-9._:-]{8,128}$/.test(clientKey.trim())
    ) {
        throw createRedeemError(
            "IdempotencyKey phai dai 8-128 ky tu va chi gom chu, so, ., _, :, -"
        );
    }

    MaQua = MaQua.trim();
    clientKey = clientKey.trim();
    const identity = createRedeemIdentity(MaKH, clientKey);

    return withTransactionLock(`KH:${MaKH}`, async () => {
        let redemption = await DoiThuong.findOne({ MaDoi: identity.MaDoi });
        let ledger = await BienDongDiem.findOne({
            IdempotencyKey: identity.IdempotencyKey
        });

        if (!redemption && ledger) {
            throw requireReconciliation(
                identity.MaDoi,
                "Co ledger REDEEM nhung thieu DoiThuong tuong ung"
            );
        }

        if (redemption) {
            assertSameRedemptionPayload(redemption, MaKH, MaQua, SoLuong);

            if (ledger && (
                ledger.MaDoi !== redemption.MaDoi ||
                ledger.MaKH !== MaKH ||
                ledger.Loai !== "REDEEM" ||
                ledger.SoDiem !== -redemption.DiemSuDung
            )) {
                throw requireReconciliation(
                    redemption.MaDoi,
                    "Ledger REDEEM khong khop DoiThuong"
                );
            }

            if (redemption.TrangThai === "COMPLETED") {
                if (ledger?.TrangThai === "POSTED") {
                    return finishRedemption(redemption, ledger, true);
                }

                throw requireReconciliation(
                    redemption.MaDoi,
                    "DoiThuong COMPLETED nhung ledger khong POSTED"
                );
            }

            if (
                redemption.TrangThai === "CANCELLED" ||
                redemption.TrangThai === "EXPIRED"
            ) {
                if (ledger?.TrangThai !== "REVERSED") {
                    throw requireReconciliation(
                        redemption.MaDoi,
                        "DoiThuong da ket thuc nhung ledger khong REVERSED"
                    );
                }

                throw createRedeemError(
                    "Yeu cau doi thuong da ket thuc; hay tao IdempotencyKey moi",
                    409
                );
            }

            if (ledger?.TrangThai === "POSTED") {
                return finishRedemption(
                    redemption,
                    ledger,
                    redemption.TrangThai === "COMPLETED"
                );
            }

            if (ledger?.TrangThai === "REVERSED") {
                if (redemption.TrangThai === "PENDING") {
                    await DoiThuong.updateOne(
                        { MaDoi: redemption.MaDoi, TrangThai: "PENDING" },
                        { $set: { TrangThai: "CANCELLED" } }
                    );
                }

                throw createRedeemError(
                    "Yeu cau doi thuong nay da bi huy; hay tao IdempotencyKey moi cho lan thu lai",
                    409
                );
            }

            if (ledger?.TrangThai === "PROCESSING") {
                throw requireReconciliation(
                    redemption.MaDoi,
                    "Yeu cau doi thuong dang PROCESSING; can doi soat truoc khi thu lai"
                );
            }

            if (redemption.TrangThai !== "PENDING" && !ledger) {
                throw requireReconciliation(
                    redemption.MaDoi,
                    "DoiThuong da ket thuc nhung khong co ledger tuong ung"
                );
            }

        } else {
            const [customer, reward] = await Promise.all([
                KhachHang.findOne({ MaKH, TrangThai: "ACTIVE" })
                    .select("DiemHienTai -_id")
                    .lean(),
                PhanThuong.findOne({ MaQua, TrangThai: "ACTIVE" }).lean()
            ]);

            if (!customer) {
                throw createRedeemError("Khong tim thay khach hang hoat dong", 404);
            }

            if (!reward) {
                throw createRedeemError(
                    "Phan thuong khong ton tai hoac khong hoat dong",
                    404
                );
            }

            const now = new Date();
            if (reward.NgayBatDau > now) {
                throw createRedeemError("Phan thuong chua den thoi gian ap dung", 409);
            }
            if (reward.NgayKetThuc < now) {
                throw createRedeemError("Phan thuong da het han", 409);
            }
            if (reward.SoLuongTon < SoLuong) {
                throw createRedeemError("Phan thuong khong du so luong ton", 409);
            }

            const pointsRequired = Number(reward.DiemCan);
            if (!Number.isSafeInteger(pointsRequired) || pointsRequired <= 0) {
                throw createRedeemError("DiemCan cua phan thuong khong hop le", 500);
            }

            const totalPoints = pointsRequired * SoLuong;
            if (!Number.isSafeInteger(totalPoints)) {
                throw createRedeemError("Tong diem doi vuot gioi han", 400);
            }
            if (toNumber(customer.DiemHienTai) < totalPoints) {
                throw createRedeemError("Khach hang khong du diem de doi thuong", 409);
            }

            try {
                redemption = await DoiThuong.create({
                    MaDoi: identity.MaDoi,
                    MaKH,
                    MaQua,
                    SoLuong,
                    DiemSuDung: totalPoints,
                    MaVoucher: null,
                    NgayDoi: now,
                    HanSuDung: reward.NgayKetThuc,
                    TrangThai: "PENDING"
                });
            } catch (error) {
                if (!isDuplicateKeyFor(error, "MaDoi", "MaDoi_1")) throw error;

                redemption = await DoiThuong.findOne({ MaDoi: identity.MaDoi });
                if (!redemption) throw error;
                assertSameRedemptionPayload(redemption, MaKH, MaQua, SoLuong);
            }
        }

        // DoiThuong duoc tao truoc de co khoa MaDoi unique va co the tiep tuc
        // neu process dung truoc khi tao ledger. Ledger la claim durable.
        if (!ledger) {
            try {
                ledger = await BienDongDiem.create({
                    MaLedger: createCode("LD"),
                    MaKH,
                    MaGD: null,
                    MaDoi: redemption.MaDoi,
                    Loai: "REDEEM",
                    SoDiem: -redemption.DiemSuDung,
                    NgayPhatSinh: new Date(),
                    NgayHetHan: null,
                    LyDo: `Doi ${redemption.SoLuong} phan thuong ${redemption.MaQua}`,
                    TrangThai: "PENDING",
                    IdempotencyKey: identity.IdempotencyKey
                });
            } catch (error) {
                if (!isDuplicateIdempotencyKeyError(error)) throw error;

                ledger = await BienDongDiem.findOne({
                    IdempotencyKey: identity.IdempotencyKey
                });
                if (!ledger) throw error;
                if (
                    ledger.MaDoi !== redemption.MaDoi ||
                    ledger.MaKH !== MaKH ||
                    ledger.Loai !== "REDEEM" ||
                    ledger.SoDiem !== -redemption.DiemSuDung
                ) {
                    throw requireReconciliation(
                        redemption.MaDoi,
                        "IdempotencyKey REDEEM bi trung voi payload khac"
                    );
                }
            }
        }

        if (ledger.TrangThai === "POSTED") {
            return finishRedemption(
                redemption,
                ledger,
                redemption.TrangThai === "COMPLETED"
            );
        }

        if (ledger.TrangThai === "PROCESSING") {
            throw requireReconciliation(
                redemption.MaDoi,
                "Yeu cau doi thuong dang PROCESSING; can doi soat truoc khi thu lai"
            );
        }

        if (ledger.TrangThai === "REVERSED") {
            throw createRedeemError("Yeu cau doi thuong da bi huy", 409);
        }

        const claimedLedger = await BienDongDiem.findOneAndUpdate(
            {
                IdempotencyKey: identity.IdempotencyKey,
                TrangThai: "PENDING"
            },
            { $set: { TrangThai: "PROCESSING" } },
            { new: true, runValidators: true }
        );

        if (!claimedLedger) {
            const latestLedger = await BienDongDiem.findOne({
                IdempotencyKey: identity.IdempotencyKey
            });

            if (latestLedger?.TrangThai === "POSTED") {
                return finishRedemption(redemption, latestLedger, true);
            }
            if (latestLedger?.TrangThai === "PROCESSING") {
                throw requireReconciliation(
                    redemption.MaDoi,
                    "Yeu cau doi thuong dang duoc xu ly; can doi soat neu van PENDING"
                );
            }

            throw requireReconciliation(
                redemption.MaDoi,
                "Khong the claim ledger REDEEM"
            );
        }

        const pointsRequired = redemption.DiemSuDung / redemption.SoLuong;
        const now = new Date();
        const [customer, reward] = await Promise.all([
            KhachHang.findOne({ MaKH, TrangThai: "ACTIVE" })
                .select("DiemHienTai -_id")
                .lean(),
            PhanThuong.findOne({ MaQua: redemption.MaQua }).lean()
        ]);

        if (!customer) {
            await markRedemptionCancelled(
                redemption,
                claimedLedger,
                "Khach hang khong ton tai hoac khong hoat dong"
            );
        }
        if (!reward || reward.TrangThai !== "ACTIVE") {
            await markRedemptionCancelled(
                redemption,
                claimedLedger,
                "Phan thuong khong con hoat dong"
            );
        }
        if (reward.NgayBatDau > now || reward.NgayKetThuc < now) {
            await markRedemptionCancelled(
                redemption,
                claimedLedger,
                "Phan thuong nam ngoai thoi gian ap dung"
            );
        }
        if (reward.DiemCan !== pointsRequired) {
            await markRedemptionCancelled(
                redemption,
                claimedLedger,
                "DiemCan cua phan thuong da thay doi; yeu cau cu da bi huy"
            );
        }
        if (reward.SoLuongTon < redemption.SoLuong) {
            await markRedemptionCancelled(
                redemption,
                claimedLedger,
                "Phan thuong khong du so luong ton"
            );
        }
        if (toNumber(customer.DiemHienTai) < redemption.DiemSuDung) {
            await markRedemptionCancelled(
                redemption,
                claimedLedger,
                "Khach hang khong du diem de doi thuong"
            );
        }

        let debitedCustomer;
        try {
            debitedCustomer = await KhachHang.findOneAndUpdate(
                {
                    MaKH,
                    TrangThai: "ACTIVE",
                    DiemHienTai: { $gte: redemption.DiemSuDung }
                },
                { $inc: { DiemHienTai: -redemption.DiemSuDung } },
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw requireReconciliation(
                redemption.MaDoi,
                "Khong xac dinh duoc ket qua tru diem; khong tu dong thu lai",
                error
            );
        }

        if (!debitedCustomer) {
            await markRedemptionCancelled(
                redemption,
                claimedLedger,
                "So du diem khong du hoac tai khoan khong con hop le"
            );
        }

        let updatedReward;
        try {
            updatedReward = await PhanThuong.findOneAndUpdate(
                {
                    MaQua: redemption.MaQua,
                    TrangThai: "ACTIVE",
                    DiemCan: pointsRequired,
                    NgayBatDau: { $lte: now },
                    NgayKetThuc: { $gte: now },
                    SoLuongTon: { $gte: redemption.SoLuong }
                },
                { $inc: { SoLuongTon: -redemption.SoLuong } },
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw requireReconciliation(
                redemption.MaDoi,
                "Khong xac dinh duoc ket qua tru ton kho; khong tu dong hoan diem",
                error
            );
        }

        if (!updatedReward) {
            // Khong co document stock nao duoc cap nhat. Hoan diem mot lan;
            // neu ket qua hoan diem khong chac chan, giu PROCESSING de doi soat.
            let refundedCustomer;
            try {
                refundedCustomer = await KhachHang.findOneAndUpdate(
                    { MaKH },
                    { $inc: { DiemHienTai: redemption.DiemSuDung } },
                    { new: true, runValidators: true }
                );
            } catch (error) {
                throw requireReconciliation(
                    redemption.MaDoi,
                    "Khong xac dinh duoc ket qua hoan diem; khong tu dong thu lai",
                    error
                );
            }

            if (!refundedCustomer) {
                throw requireReconciliation(
                    redemption.MaDoi,
                    "Khong hoan tac duoc diem sau khi het ton kho"
                );
            }

            await markRedemptionCancelled(
                redemption,
                claimedLedger,
                "Phan thuong vua het ton kho; diem da duoc hoan lai"
            );
        }

        let postedLedger;
        try {
            postedLedger = await BienDongDiem.findOneAndUpdate(
                {
                    IdempotencyKey: identity.IdempotencyKey,
                    TrangThai: "PROCESSING"
                },
                { $set: { TrangThai: "POSTED" } },
                { new: true, runValidators: true }
            );
        } catch (error) {
            postedLedger = await BienDongDiem.findOne({
                IdempotencyKey: identity.IdempotencyKey
            });
            if (postedLedger?.TrangThai !== "POSTED") {
                throw requireReconciliation(
                    redemption.MaDoi,
                    "Da tru diem va ton kho nhung ledger chua duoc xac nhan POSTED",
                    error
                );
            }
        }

        if (!postedLedger) {
            postedLedger = await BienDongDiem.findOne({
                IdempotencyKey: identity.IdempotencyKey
            });
            if (postedLedger?.TrangThai !== "POSTED") {
                throw requireReconciliation(
                    redemption.MaDoi,
                    "Da tru diem va ton kho nhung khong chuyen duoc ledger sang POSTED"
                );
            }
        }

        const completed = await DoiThuong.findOneAndUpdate(
            { MaDoi: redemption.MaDoi, TrangThai: "PENDING" },
            { $set: { TrangThai: "COMPLETED" } },
            { new: true, runValidators: true }
        );

        if (!completed) {
            const latestRedemption = await DoiThuong.findOne({
                MaDoi: redemption.MaDoi
            });
            if (latestRedemption?.TrangThai !== "COMPLETED") {
                throw requireReconciliation(
                    redemption.MaDoi,
                    "Ledger REDEEM da POSTED nhung DoiThuong chua COMPLETED"
                );
            }
        }

        return finishRedemption(
            completed || await DoiThuong.findOne({ MaDoi: redemption.MaDoi }),
            postedLedger,
            false
        );
    });
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    // 5.1 - Tich diem
    // Pure helpers are exported for isolated unit tests and consistent previews.
    calculateTierPoints,
    getEligiblePointAmounts,
    previewPoints,
    earnPoints,

    // 5.2 - Lich su bien dong diem
    getPointSummary,
    getPointHistory,
    getEarnHistory,
    getRedeemHistory,

    // 5.3 - Doi diem
    getAvailableRewards,
    redeemReward,

    // 5.4 - Doi soat read-only
    getReconciliationSummary,
    getPointReconciliation,
    getRedemptionReconciliation,
    getLedgerReconciliation,
    getInventoryReconciliation
};
