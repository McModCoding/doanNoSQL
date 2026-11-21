const crypto = require("crypto");
const mongoose = require("mongoose");
const GiaoDich = require("../models/GiaoDich");
const ThanhToan = require("../models/ThanhToan");
const KhachHang = require("../models/KhachHang");
const HangThanhVien = require("../models/HangThanhVien");
const LichSuHang = require("../models/LichSuHang");
const GhiNhanChiTieu = require("../models/GhiNhanChiTieu");

const CLAIM_MS = 5 * 60 * 1000;
const MAX_CAS_ATTEMPTS = 8;
const makeError = (code, message) => {
    const error = new Error(message);
    error.code = code;
    error.requiresReconciliation = true;
    return error;
};

const toSafeVnd = (value) => {
    if (value === null || value === undefined) return NaN;
    const text = value.toString();
    if (!/^\d+(?:\.0+)?$/.test(text)) return NaN;
    const amount = Number(text.split(".")[0]);
    return Number.isSafeInteger(amount) ? amount : NaN;
};

const yearInVietnam = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric"
    }).formatToParts(date);
    return Number(parts.find((part) => part.type === "year")?.value) || null;
};

const validateSpendSnapshot = (transaction, payment) => {
    if (transaction?.TrangThai === "REFUNDED") {
        return { valid: false, requiresReconciliation: true, reason: "REFUND_DETAILS_MISSING" };
    }
    if (transaction?.TrangThai !== "COMPLETED") {
        return { valid: false, skipped: true, reason: "TRANSACTION_NOT_COMPLETED" };
    }
    const year = yearInVietnam(transaction.NgayHoanTat);
    const paid = toSafeVnd(transaction.TongTien);
    const subtotal = toSafeVnd(transaction.TamTinh);
    const discount = toSafeVnd(transaction.SoTienGiam);
    const consistent = year !== null && paid >= 0 && subtotal >= 0 && discount >= 0 && subtotal - discount === paid;
    const paymentMatches = Boolean(payment && payment.MaGD === transaction.MaGD && payment.MaKH === transaction.MaKH && payment.TrangThai === "SUCCESS" && toSafeVnd(payment.SoTien) === paid);
    if (!consistent || !paymentMatches) {
        return { valid: false, requiresReconciliation: true, reason: "SPEND_SNAPSHOT_UNVERIFIED" };
    }
    return { valid: true, year, amount: paid };
};

const makeHistoryCode = (idempotencyKey) => `LS${crypto.createHash("sha256").update(idempotencyKey).digest("hex").toUpperCase()}`;

const verifyRequiredIndexes = async () => {
    const spendIndexes = await GhiNhanChiTieu.collection.indexes();
    const historyIndexes = await LichSuHang.collection.indexes();
    const spendUnique = spendIndexes.some((index) =>
        index.unique === true && index.sparse !== true && !index.partialFilterExpression &&
        index.key?.IdempotencyKey === 1 && Object.keys(index.key).length === 1
    );
    const historyUnique = historyIndexes.some((index) =>
        index.unique === true && index.sparse !== true && !index.partialFilterExpression &&
        index.key?.MaLichSu === 1 && Object.keys(index.key).length === 1
    );
    if (!spendUnique || !historyUnique) {
        throw makeError(
            "EARN_SPEND_INDEXES_NOT_READY",
            "Thieu unique index E4.2; chay migration sau khi backup va kiem tra du lieu"
        );
    }
};

const loadValidTiers = async () => {
    const tiers = await HangThanhVien.find({ TrangThai: "ACTIVE" }).lean();
    if (!tiers.length) throw makeError("EARN_TIER_CONFIG_EMPTY", "Khong co hang ACTIVE de xet hang");

    const normalized = tiers.map((tier) => {
        const minimum = toSafeVnd(tier.MucChiTieuToiThieu);
        const maximum = tier.MucChiTieuToiDa == null ? null : toSafeVnd(tier.MucChiTieuToiDa);
        if (!Number.isSafeInteger(minimum) || minimum < 0 || (maximum !== null && (!Number.isSafeInteger(maximum) || maximum < minimum))) {
            throw makeError("EARN_TIER_CONFIG_INVALID", `Nguong chi tieu cua hang ${tier.MaHang} khong hop le`);
        }
        return { ...tier, _minimum: minimum, _maximum: maximum };
    }).sort((a, b) => a._minimum - b._minimum);

    if (new Set(normalized.map((tier) => tier.MaHang)).size !== normalized.length) {
        throw makeError("EARN_TIER_CONFIG_DUPLICATE", "MaHang ACTIVE bi trung; can doi soat cau hinh");
    }
    for (let index = 1; index < normalized.length; index += 1) {
        const previous = normalized[index - 1];
        const current = normalized[index];
        if (previous._maximum === null || current._minimum <= previous._maximum) {
            throw makeError("EARN_TIER_CONFIG_OVERLAP", "Nguong chi tieu cac hang ACTIVE bi chong lan");
        }
        if (current._minimum > previous._maximum + 1) {
            throw makeError("EARN_TIER_CONFIG_GAP", "Nguong chi tieu cac hang ACTIVE co khoang trong");
        }
    }
    return normalized;
};

const selectTier = (tiers, spend) => {
    const matching = tiers.filter((tier) => spend >= tier._minimum && (tier._maximum === null || spend <= tier._maximum));
    if (!matching.length) throw makeError("EARN_TIER_NO_MATCH", "Tong chi tieu nam khong thuoc nguong hang ACTIVE nao");
    return matching.reduce((best, tier) => tier._minimum > best._minimum ? tier : best);
};

const markReview = async (event, message, extra = {}) => {
    await GhiNhanChiTieu.updateOne(
        { IdempotencyKey: event.IdempotencyKey, TrangThai: { $ne: "POSTED" } },
        { $set: { TrangThai: "RECONCILIATION_REQUIRED", LyDoDoiSoat: message, LockToken: null, LockUntil: null, NgayCapNhat: new Date(), ...extra } }
    );
    return { success: false, requiresReconciliation: true, MaGD: event.MaGD, message };
};

const createOrReadEvent = async (doc) => {
    try {
        return await GhiNhanChiTieu.create(doc);
    } catch (error) {
        if (error.code !== 11000) throw error;
        const existing = await GhiNhanChiTieu.findOne({ IdempotencyKey: doc.IdempotencyKey });
        if (!existing) throw error;
        if (existing.MaGD !== doc.MaGD || existing.MaKH !== doc.MaKH || existing.LoaiSuKien !== doc.LoaiSuKien) {
            throw makeError("EARN_SPEND_IDEMPOTENCY_CONFLICT", "IdempotencyKey chi tieu da duoc dung cho du lieu khac");
        }
        return existing;
    }
};

const getYearSpend = async (MaKH, year) => {
    const [summary] = await GhiNhanChiTieu.aggregate([
        { $match: { MaKH, NamChiTieu: year, LoaiSuKien: "SPEND", DaXacMinh: true } },
        { $group: { _id: null, total: { $sum: "$SoTien" } } }
    ]);
    const amount = summary ? toSafeVnd(summary.total) : 0;
    if (!Number.isSafeInteger(amount) || amount < 0) throw makeError("EARN_SPEND_TOTAL_INVALID", "Tong chi tieu nam khong hop le");
    return amount;
};

const recoverHistoryIfCustomerUpdated = async (event) => {
    if (!event.MaLichSu || !event.MaHangCu || !event.MaHangMoi || event.MaHangCu === event.MaHangMoi) return;
    await LichSuHang.updateOne(
        { MaLichSu: event.MaLichSu },
        { $setOnInsert: {
            MaLichSu: event.MaLichSu,
            MaKH: event.MaKH,
            MaHangCu: event.MaHangCu,
            MaHangMoi: event.MaHangMoi,
            NgayThayDoi: event.NgayPhatSinh,
            NamXetHang: event.NamXetHang,
            LyDo: `Xet hang tu dong theo chi tieu nam ${event.NamXetHang}; giao dich ${event.MaGD}`
        } },
        { upsert: true, runValidators: true }
    );
};

const processSpendEvent = async (event) => {
    if (event.TrangThai === "POSTED") return { success: true, alreadyProcessed: true, MaGD: event.MaGD, NamChiTieu: event.NamChiTieu, SoTien: event.SoTien };
    if (!event.DaXacMinh || event.LoaiSuKien !== "SPEND") return markReview(event, event.LyDoDoiSoat || "Su kien chi tieu chua duoc xac minh");

    const lockToken = crypto.randomUUID();
    const now = new Date();
    const claim = await GhiNhanChiTieu.findOneAndUpdate(
        { IdempotencyKey: event.IdempotencyKey, $or: [
            { TrangThai: "PENDING" },
            { TrangThai: "PROCESSING", LockUntil: { $lte: now } },
            { TrangThai: "CUSTOMER_UPDATED", LockUntil: { $lte: now } },
            { TrangThai: "RECONCILIATION_REQUIRED", MaHangCu: null, MaHangMoi: null, CanDoiSoatRefund: { $ne: true }, NgayCapNhat: { $lte: new Date(now.getTime() - 15 * 60 * 1000) } }
        ] },
        { $set: { TrangThai: "PROCESSING", LockToken: lockToken, LockUntil: new Date(now.getTime() + CLAIM_MS), NgayCapNhat: now } },
        { new: true }
    );
    if (!claim) {
        const latest = await GhiNhanChiTieu.findOne({ IdempotencyKey: event.IdempotencyKey });
        if (latest?.TrangThai === "POSTED") return { success: true, alreadyProcessed: true, MaGD: event.MaGD };
        if (latest?.TrangThai === "RECONCILIATION_REQUIRED") return { success: false, requiresReconciliation: true, MaGD: event.MaGD, message: latest.LyDoDoiSoat };
        return { success: false, inProgress: true, MaGD: event.MaGD };
    }

    try {
        const customer = await KhachHang.findOne({ MaKH: claim.MaKH }).lean();
        if (!customer) return markReview(claim, "Khong tim thay khach hang tuong ung");
        if (customer.TrangThai !== "ACTIVE") return markReview(claim, "Khach hang INACTIVE/BLOCKED; chua co quy tac cho phep tu dong xet hang");
        if (!Number.isSafeInteger(customer.NamXetHang) || !Number.isFinite(toSafeVnd(customer.TongChiTieuNam))) {
            return markReview(claim, "NamXetHang hoac TongChiTieuNam hien tai khong hop le");
        }

        // If a previous attempt persisted its plan, never replace that plan.
        // Complete it only when the customer document proves the CAS was applied;
        // otherwise leave an explicit reconciliation item.
        if (claim.MaHangCu != null && claim.MaHangMoi != null && claim.TongChiTieuSau != null && claim.NamXetHang != null) {
            const planApplied = customer.NamXetHang === claim.NamXetHang &&
                toSafeVnd(customer.TongChiTieuNam) === toSafeVnd(claim.TongChiTieuSau) &&
                customer.MaHangHienTai === claim.MaHangMoi;
            if (!planApplied) return markReview(claim, "Khong xac nhan duoc buoc cap nhat khach hang cua tac vu cu; can doi soat thu cong");
            const staged = await GhiNhanChiTieu.findOneAndUpdate(
                { IdempotencyKey: claim.IdempotencyKey, LockToken: lockToken, TrangThai: "PROCESSING" },
                { $set: { TrangThai: "CUSTOMER_UPDATED", NgayCapNhat: new Date() } },
                { new: true }
            );
            const recoveryEvent = staged || { ...claim, TrangThai: "CUSTOMER_UPDATED", LockToken: lockToken };
            await recoverHistoryIfCustomerUpdated(recoveryEvent);
            const recovered = await GhiNhanChiTieu.findOneAndUpdate(
                { IdempotencyKey: claim.IdempotencyKey, LockToken: lockToken, TrangThai: { $in: ["PROCESSING", "CUSTOMER_UPDATED"] } },
                { $set: { TrangThai: "POSTED", ChiTieuLichSu: true, LockToken: null, LockUntil: null, NgayCapNhat: new Date() } },
                { new: true }
            );
            return recovered
                ? { success: true, alreadyProcessed: true, recovered: true, MaGD: claim.MaGD }
                : { success: false, inProgress: true, MaGD: claim.MaGD };
        }

        if (claim.NamChiTieu < customer.NamXetHang) {
            await GhiNhanChiTieu.updateOne(
                { IdempotencyKey: claim.IdempotencyKey, LockToken: lockToken, TrangThai: "PROCESSING" },
                { $set: { TrangThai: "POSTED", ChiTieuCuNam: true, LockToken: null, LockUntil: null, NgayCapNhat: new Date() } }
            );
            return { success: true, historicalOnly: true, MaGD: claim.MaGD, NamChiTieu: claim.NamChiTieu, SoTien: claim.SoTien };
        }

        for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
            const current = await KhachHang.findOne({ MaKH: claim.MaKH }).lean();
            if (!current || current.TrangThai !== "ACTIVE") return markReview(claim, "Khach hang khong con ACTIVE trong luc xet hang");
            if (claim.NamChiTieu < current.NamXetHang) {
                await GhiNhanChiTieu.updateOne(
                    { IdempotencyKey: claim.IdempotencyKey, LockToken: lockToken },
                    { $set: { TrangThai: "POSTED", ChiTieuCuNam: true, LockToken: null, LockUntil: null, NgayCapNhat: new Date() } }
                );
                return { success: true, historicalOnly: true, MaGD: claim.MaGD, NamChiTieu: claim.NamChiTieu };
            }

            const yearTotal = await getYearSpend(claim.MaKH, claim.NamChiTieu);
            let nextTier;
            try {
                nextTier = selectTier(await loadValidTiers(), yearTotal);
            } catch (error) {
                if (error.requiresReconciliation) return markReview(claim, error.message);
                throw error;
            }

            const historyRequired = current.MaHangHienTai !== nextTier.MaHang;
            const historyId = historyRequired ? makeHistoryCode(claim.IdempotencyKey) : null;
            const plannedAt = claim.NgayPhatSinh || new Date();
            const planned = await GhiNhanChiTieu.findOneAndUpdate(
                { IdempotencyKey: claim.IdempotencyKey, LockToken: lockToken, TrangThai: "PROCESSING" },
                { $set: {
                    MaHangCu: current.MaHangHienTai,
                    MaHangMoi: nextTier.MaHang,
                    TongChiTieuSau: mongoose.Types.Decimal128.fromString(String(yearTotal)),
                    NamXetHang: claim.NamChiTieu,
                    MaLichSu: historyId,
                    ChiTieuLichSu: false,
                    NgayCapNhat: new Date()
                } },
                { new: true }
            );
            if (!planned) return { success: false, inProgress: true, MaGD: claim.MaGD };

            const currentSpend = mongoose.Types.Decimal128.fromString(String(toSafeVnd(current.TongChiTieuNam)));
            const updated = await KhachHang.findOneAndUpdate(
                {
                    MaKH: claim.MaKH,
                    TrangThai: "ACTIVE",
                    MaHangHienTai: current.MaHangHienTai,
                    NamXetHang: current.NamXetHang,
                    TongChiTieuNam: currentSpend
                },
                { $set: {
                    NamXetHang: claim.NamChiTieu,
                    TongChiTieuNam: mongoose.Types.Decimal128.fromString(String(yearTotal)),
                    MaHangHienTai: nextTier.MaHang
                } },
                { new: true, runValidators: true }
            );

            if (!updated) {
                const latest = await KhachHang.findOne({ MaKH: claim.MaKH }).lean();
                const alreadyApplied = latest?.NamXetHang === claim.NamChiTieu &&
                    toSafeVnd(latest.TongChiTieuNam) === yearTotal &&
                    latest.MaHangHienTai === nextTier.MaHang;
                if (!alreadyApplied) continue;
            }

            const staged = await GhiNhanChiTieu.findOneAndUpdate(
                { IdempotencyKey: claim.IdempotencyKey, LockToken: lockToken, TrangThai: "PROCESSING" },
                { $set: { TrangThai: "CUSTOMER_UPDATED", NgayCapNhat: new Date() } },
                { new: true }
            );
            if (!staged) return { success: false, inProgress: true, MaGD: claim.MaGD };

            await recoverHistoryIfCustomerUpdated(staged);
            const completed = await GhiNhanChiTieu.findOneAndUpdate(
                { IdempotencyKey: claim.IdempotencyKey, LockToken: lockToken, TrangThai: "CUSTOMER_UPDATED" },
                { $set: { TrangThai: "POSTED", ChiTieuLichSu: true, LockToken: null, LockUntil: null, NgayCapNhat: new Date() } },
                { new: true }
            );
            if (!completed) return { success: false, inProgress: true, MaGD: claim.MaGD };
            return {
                success: true,
                alreadyProcessed: false,
                MaGD: claim.MaGD,
                MaKH: claim.MaKH,
                NamChiTieu: claim.NamChiTieu,
                TongChiTieuNam: yearTotal,
                MaHangCu: current.MaHangHienTai,
                MaHangMoi: nextTier.MaHang,
                historyWritten: historyRequired
            };
        }
        return markReview(claim, "CAS xet hang vuot qua so lan thu lai; can doi soat");
    } catch (error) {
        console.error("Loi ghi nhan chi tieu/xet hang:", claim.MaGD, error.message);
        if (error.requiresReconciliation) return markReview(claim, error.message, { LockToken: null, LockUntil: null });
        // Keep the durable state and lease for safe retry/reconciliation.
        throw error;
    }
};

const recordCompletedSpend = async (MaGD) => {
    if (!MaGD) throw new Error("MaGD khong duoc de trong");
    await verifyRequiredIndexes();
    const transaction = await GiaoDich.findOne({ MaGD }).lean();
    if (!transaction) throw makeError("SPEND_TRANSACTION_NOT_FOUND", "Khong tim thay giao dich chi tieu");

    const idempotencyKey = `SPEND:${MaGD}`;
    const existing = await GhiNhanChiTieu.findOne({ IdempotencyKey: idempotencyKey });
    if (transaction.TrangThai === "REFUNDED") {
        if (existing) {
            await GhiNhanChiTieu.updateOne(
                { IdempotencyKey: idempotencyKey },
                { $set: { CanDoiSoatRefund: true, LyDoDoiSoat: "Giao dich REFUNDED nhung khong co so tien/ma yeu cau hoan dang tin cay; khong tu dong tru chi tieu", NgayCapNhat: new Date() } }
            );
            return { success: false, requiresReconciliation: true, MaGD, message: "Giao dich hoan tien can doi soat" };
        }
        const event = await createOrReadEvent({
            IdempotencyKey: idempotencyKey, MaGD, MaThanhToan: null, MaKH: transaction.MaKH,
            NamChiTieu: yearInVietnam(transaction.NgayHoanTat) || 0,
            SoTien: mongoose.Types.Decimal128.fromString("0"), LoaiSuKien: "REFUND_REVIEW",
            TrangThai: "RECONCILIATION_REQUIRED", DaXacMinh: false,
            CanDoiSoatRefund: true, LyDoDoiSoat: "Khong co so tien hoan va ma yeu cau hoan de doi soat an toan",
            NgayPhatSinh: transaction.NgayHoanTat || new Date(0), NgayTao: new Date(), NgayCapNhat: new Date()
        });
        return { success: false, requiresReconciliation: true, MaGD, message: event.LyDoDoiSoat };
    }
    if (transaction.TrangThai !== "COMPLETED") {
        return { success: false, skipped: true, MaGD, message: "Chi ghi nhan giao dich COMPLETED" };
    }

    const completedAt = transaction.NgayHoanTat;
    const payment = await ThanhToan.findOne({
        MaGD, MaKH: transaction.MaKH, TrangThai: "SUCCESS", SoTien: transaction.TongTien
    }).lean();
    const snapshot = validateSpendSnapshot(transaction, payment);
    const validated = snapshot.valid;

    const event = await createOrReadEvent({
        IdempotencyKey: idempotencyKey,
        MaGD,
        MaThanhToan: payment?.MaThanhToan || null,
        MaKH: transaction.MaKH,
        NamChiTieu: snapshot.year || 0,
        SoTien: mongoose.Types.Decimal128.fromString(String(validated ? snapshot.amount : 0)),
        LoaiSuKien: "SPEND",
        TrangThai: validated ? "PENDING" : "RECONCILIATION_REQUIRED",
        DaXacMinh: validated,
        LyDoDoiSoat: validated ? null : "Thieu NgayHoanTat, so tien hop le, tong tien khop giam gia hoac thanh toan SUCCESS khop giao dich",
        NgayPhatSinh: completedAt || new Date(0),
        NgayTao: new Date(),
        NgayCapNhat: new Date()
    });
    if (!event.DaXacMinh) return { success: false, requiresReconciliation: true, MaGD, message: event.LyDoDoiSoat };
    return processSpendEvent(event);
};

const getSpendReconciliation = async ({ page = "1", limit = "20" } = {}) => {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    if (!Number.isSafeInteger(parsedPage) || parsedPage < 1 || !Number.isSafeInteger(parsedLimit) || parsedLimit < 1) {
        throw new Error("page va limit phai la so nguyen duong");
    }
    const boundedLimit = Math.min(parsedLimit, 100);
    const filter = { $or: [
        { TrangThai: "RECONCILIATION_REQUIRED" },
        { TrangThai: { $in: ["PROCESSING", "CUSTOMER_UPDATED"] }, LockUntil: { $lte: new Date() } },
        { CanDoiSoatRefund: true }
    ] };
    const [items, total] = await Promise.all([
        GhiNhanChiTieu.find(filter).select("MaGD MaKH NamChiTieu SoTien LoaiSuKien TrangThai MaHangCu MaHangMoi CanDoiSoatRefund LyDoDoiSoat NgayPhatSinh -_id")
            .sort({ NgayCapNhat: 1, IdempotencyKey: 1 }).skip((parsedPage - 1) * boundedLimit).limit(boundedLimit).lean(),
        GhiNhanChiTieu.countDocuments(filter)
    ]);
    return { items, pagination: { page: parsedPage, limit: boundedLimit, total, totalPages: Math.ceil(total / boundedLimit) } };
};

const recoverPendingSpendEvents = async (limit = 25) => {
    await verifyRequiredIndexes();
    const now = new Date();
    const refundFilter = {
        LoaiSuKien: "SPEND",
        DaXacMinh: true,
        TrangThai: "POSTED",
        CanDoiSoatRefund: { $ne: true }
    };
    let candidates = await GhiNhanChiTieu.find({ ...refundFilter, RefundCheckedAt: null })
        .select("MaGD IdempotencyKey -_id").sort({ NgayTao: 1 }).limit(Math.min(Math.max(limit, 1), 100)).lean();
    if (!candidates.length) {
        candidates = await GhiNhanChiTieu.find(refundFilter)
            .select("MaGD IdempotencyKey -_id").sort({ RefundCheckedAt: 1, NgayTao: 1 }).limit(Math.min(Math.max(limit, 1), 100)).lean();
    }
    let refundReviews = 0;
    for (const candidate of candidates) {
        const [refundedTransaction, refundedPayment] = await Promise.all([
            GiaoDich.exists({ MaGD: candidate.MaGD, TrangThai: "REFUNDED" }),
            ThanhToan.exists({ MaGD: candidate.MaGD, TrangThai: "REFUNDED" })
        ]);
        if (!refundedTransaction && !refundedPayment) continue;
        await GhiNhanChiTieu.updateOne(
            { IdempotencyKey: candidate.IdempotencyKey, TrangThai: "POSTED" },
            { $set: {
                CanDoiSoatRefund: true,
                LyDoDoiSoat: "Giao dich goc REFUNDED nhung chua co amount/refund key dang tin cay; khong tu dong tru chi tieu",
                NgayCapNhat: new Date()
            } }
        );
        refundReviews += 1;
    }
    const refundCheckTime = new Date();
    if (candidates.length) {
        await GhiNhanChiTieu.updateMany(
            { IdempotencyKey: { $in: candidates.map((item) => item.IdempotencyKey) }, CanDoiSoatRefund: { $ne: true } },
            { $set: { RefundCheckedAt: refundCheckTime } }
        );
    }
    const events = await GhiNhanChiTieu.find({
        DaXacMinh: true,
        $or: [
            { TrangThai: "PENDING" },
            { TrangThai: { $in: ["PROCESSING", "CUSTOMER_UPDATED"] }, LockUntil: { $lte: now } },
            { TrangThai: "RECONCILIATION_REQUIRED", MaHangCu: null, MaHangMoi: null, CanDoiSoatRefund: { $ne: true }, NgayCapNhat: { $lte: new Date(now.getTime() - 15 * 60 * 1000) } }
        ]
    }).sort({ NgayTao: 1 }).limit(Math.min(Math.max(limit, 1), 100)).lean();
    let processed = 0;
    let failed = 0;
    for (const event of events) {
        try {
            const sourceTransaction = await GiaoDich.findOne({ MaGD: event.MaGD }).select("TrangThai -_id").lean();
            const refundedPayment = await ThanhToan.exists({ MaGD: event.MaGD, TrangThai: "REFUNDED" });
            if (sourceTransaction?.TrangThai === "REFUNDED" || refundedPayment) {
                await GhiNhanChiTieu.updateOne(
                    { IdempotencyKey: event.IdempotencyKey, TrangThai: { $ne: "POSTED" } },
                    { $set: {
                        TrangThai: "RECONCILIATION_REQUIRED",
                        CanDoiSoatRefund: true,
                        LyDoDoiSoat: "Giao dich goc da REFUNDED; thieu so tien va khoa hoan de dieu chinh an toan",
                        LockToken: null,
                        LockUntil: null,
                        NgayCapNhat: new Date()
                    } }
                );
                failed += 1;
                continue;
            }
            if (sourceTransaction?.TrangThai !== "COMPLETED") {
                await markReview(event, "Trang thai giao dich goc khong con COMPLETED; can doi soat");
                failed += 1;
                continue;
            }
            await processSpendEvent(event);
            processed += 1;
        } catch (error) {
            failed += 1;
            console.error("Khong the phuc hoi ghi nhan chi tieu:", event.MaGD, error.message);
        }
    }
    return { scanned: events.length, processed, failed, refundReviews };
};

module.exports = {
    recordCompletedSpend,
    getSpendReconciliation,
    recoverPendingSpendEvents,
    yearInVietnam,
    loadValidTiers,
    selectTier,
    toSafeVnd,
    validateSpendSnapshot
};
