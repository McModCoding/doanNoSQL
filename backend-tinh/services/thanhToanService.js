const crypto = require("crypto");

const ThanhToan = require("../models/ThanhToan");
const GiaoDich = require("../models/GiaoDich");
const SuatChieu = require("../models/SuatChieu");
const veService = require("./veService");
const tichDiemService = require("./tichDiemService");
const chiTieuHangService = require("./chiTieuHangService");
const tonKhoService = require("./tonKhoService");

const getMomoCreateEndpoint = () => process.env.MOMO_ENDPOINT ||
    "https://test-payment.momo.vn/v2/gateway/api/create";

const HOLD_MINUTES = 10;

const MOMO_PENDING_CODES = new Set([1000, 7000, 7002]);
const MOMO_FINAL_FAILURE_CODES = new Set([
    1001, 1002, 1003, 1004, 1005, 1006, 1007, 1017, 1026, 4001, 4002, 4100
]);

const classifyMomoResultCode = (value) => {
    const resultCode = Number(value);
    if (resultCode === 0) return "SUCCESS";
    if (MOMO_PENDING_CODES.has(resultCode)) return "PENDING";
    if (resultCode === 9000) return "AUTHORIZED_REVIEW";
    if (MOMO_FINAL_FAILURE_CODES.has(resultCode)) return "FAILED";
    return "UNKNOWN";
};

// ============================================
// 1. CAU HINH MOMO
// ============================================

const getMomoConfig = () => {
    const {
        MOMO_PARTNER_CODE,
        MOMO_ACCESS_KEY,
        MOMO_SECRET_KEY,
        MOMO_REDIRECT_URL,
        MOMO_IPN_URL
    } = process.env;

    if (
        !MOMO_PARTNER_CODE ||
        !MOMO_ACCESS_KEY ||
        !MOMO_SECRET_KEY ||
        !MOMO_REDIRECT_URL ||
        !MOMO_IPN_URL
    ) {
        throw new Error(
            "Chua cau hinh day du thong tin MoMo Sandbox"
        );
    }

    return {
        partnerCode: MOMO_PARTNER_CODE,
        accessKey: MOMO_ACCESS_KEY,
        secretKey: MOMO_SECRET_KEY,
        redirectUrl: MOMO_REDIRECT_URL,
        ipnUrl: MOMO_IPN_URL
    };
};

// ============================================
// 2. HAM CHU KY
// ============================================

const createSignature = (rawData, secretKey) => {
    return crypto
        .createHmac("sha256", secretKey)
        .update(rawData, "utf8")
        .digest("hex");
};

const verifySignature = (rawData, signature, secretKey) => {
    if (
        typeof signature !== "string" ||
        !/^[a-fA-F0-9]{64}$/.test(signature)
    ) {
        return false;
    }

    const expected = Buffer.from(
        createSignature(rawData, secretKey),
        "hex"
    );

    const received = Buffer.from(signature, "hex");

    return (
        expected.length === received.length &&
        crypto.timingSafeEqual(expected, received)
    );
};

// ============================================
// 3. XU LY SO TIEN
// ============================================

const toVndAmount = (value) => {
    if (value === undefined || value === null) {
        throw new Error("So tien giao dich khong hop le");
    }

    const amountString = value.toString();

    if (!/^\d+(\.0+)?$/.test(amountString)) {
        throw new Error("So tien VND phai la so nguyen");
    }

    const amount = BigInt(amountString.split(".")[0]);

    if (amount < 1000n || amount > 50000000n) {
        throw new Error(
            "So tien thanh toan MoMo phai tu 1.000 den 50.000.000 VND"
        );
    }

    return Number(amount);
};

const toValidResponseDate = (responseTime) => {
    const timestamp = Number(responseTime);

    if (!Number.isFinite(timestamp) || timestamp <= 0) {
        throw new Error("Thoi gian phan hoi MoMo khong hop le");
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        throw new Error("Khong the chuyen doi thoi gian thanh toan");
    }

    return date;
};

// ============================================
// 4. TAO CHU KY THANH TOAN
// ============================================

const createPaymentSignature = (data, accessKey, secretKey) => {
    const rawData = [
        `accessKey=${accessKey}`,
        `amount=${data.amount}`,
        `extraData=${data.extraData}`,
        `ipnUrl=${data.ipnUrl}`,
        `orderId=${data.orderId}`,
        `orderInfo=${data.orderInfo}`,
        `partnerCode=${data.partnerCode}`,
        `redirectUrl=${data.redirectUrl}`,
        `requestId=${data.requestId}`,
        `requestType=${data.requestType}`
    ].join("&");

    return createSignature(rawData, secretKey);
};

// ============================================
// 5. TAO CHU KY IPN
// ============================================

const createIPNSignature = (data, accessKey) => {
    return [
        `accessKey=${accessKey}`,
        `amount=${data.amount}`,
        `extraData=${data.extraData || ""}`,
        `message=${data.message}`,
        `orderId=${data.orderId}`,
        `orderInfo=${data.orderInfo}`,
        `orderType=${data.orderType}`,
        `partnerCode=${data.partnerCode}`,
        `payType=${data.payType}`,
        `requestId=${data.requestId}`,
        `responseTime=${data.responseTime}`,
        `resultCode=${data.resultCode}`,
        `transId=${data.transId}`
    ].join("&");
};

// ============================================
// 6. KIEM TRA GHE DANG DUOC GIU
// ============================================

const validateHeldSeats = async (transaction) => {
    if (
        !Array.isArray(transaction.ChiTietVe) ||
        transaction.ChiTietVe.length === 0
    ) {
        throw new Error("Giao dich khong co chi tiet ve");
    }

    const groupedSeats = {};

    for (const ticket of transaction.ChiTietVe) {
        if (!ticket.MaSuat || !ticket.MaGhe) {
            throw new Error("Chi tiet ve thieu MaSuat hoac MaGhe");
        }

        if (!groupedSeats[ticket.MaSuat]) {
            groupedSeats[ticket.MaSuat] = [];
        }

        if (groupedSeats[ticket.MaSuat].includes(ticket.MaGhe)) {
            throw new Error(`Ghe ${ticket.MaGhe} bi trung trong giao dich`);
        }

        groupedSeats[ticket.MaSuat].push(ticket.MaGhe);
    }

    const now = Date.now();

    for (const [MaSuat, MaGhes] of Object.entries(groupedSeats)) {
        const showtime = await SuatChieu.findOne({
            MaSuat,
            TrangThai: "SCHEDULED"
        });

        if (!showtime) {
            throw new Error(`Suat chieu ${MaSuat} khong con hoat dong`);
        }

        for (const MaGhe of MaGhes) {
            const seat = showtime.DanhSachGhe.find(
                (item) => item.MaGhe === MaGhe
            );

            if (
                !seat ||
                seat.TrangThai !== "HELD" ||
                seat.MaGDGiuCho !== transaction.MaGD ||
                !seat.ThoiGianGiuCho ||
                new Date(seat.ThoiGianGiuCho).getTime() <= now
            ) {
                throw new Error(
                    `Ghe ${MaGhe} khong con duoc giao dich giu hop le`
                );
            }
        }
    }
};

// ============================================
// 7. KIEM TRA THOI HAN GIAO DICH
// ============================================

const validateTransactionTime = (transaction) => {
    const createdAt = new Date(transaction.NgayTao).getTime();

    if (!Number.isFinite(createdAt)) {
        throw new Error("Ngay tao giao dich khong hop le");
    }

    const expirationTime =
        createdAt + HOLD_MINUTES * 60 * 1000;

    if (Date.now() >= expirationTime) {
        throw new Error("Giao dich da het thoi gian giu ghe");
    }
};

// ============================================
// 8. TAO YEU CAU THANH TOAN MOMO
// ============================================

const createPayment = async (MaGD, MaKH) => {
    const config = getMomoConfig();

    if (!MaGD || !MaKH) {
        throw new Error("Thieu MaGD hoac MaKH");
    }

    // Tim giao dich cua khach hang
    const transaction = await GiaoDich.findOne({
        MaGD,
        MaKH,
        TrangThai: "PENDING_PAYMENT"
    });

    if (!transaction) {
        throw new Error(
            "Giao dich khong ton tai hoac khong con cho thanh toan"
        );
    }

    // Kiem tra thoi gian
    validateTransactionTime(transaction);

    // Kiem tra ghe
    await validateHeldSeats(transaction);

    // Lay so tien tu MongoDB
    const amount = toVndAmount(transaction.TongTien);

    // Khong tao yeu cau moi neu da co thanh toan dang cho
    const pendingPayment = await ThanhToan.findOne({
        MaGD,
        TrangThai: "PENDING"
    });

    if (pendingPayment) {
        throw new Error(
            "Giao dich da co yeu cau thanh toan dang cho xu ly"
        );
    }

    // Khong tao MoMo neu giao dich da duoc thanh toan bang phuong thuc khac
    const successfulPayment = await ThanhToan.findOne({
        MaGD,
        TrangThai: "SUCCESS"
    });

    if (successfulPayment) {
        throw new Error("Giao dich da duoc thanh toan thanh cong");
    }

    const requestId = crypto.randomUUID().replace(/-/g, "");

    const orderInfo = `Thanh toan ve CinemaLoyalty ${MaGD}`;
    const extraData = "";

    const requestData = {
        partnerCode: config.partnerCode,
        requestId,
        orderId: MaGD,
        amount,
        orderInfo,
        redirectUrl: config.redirectUrl,
        ipnUrl: config.ipnUrl,
        requestType: "payWithMethod",
        extraData,
        lang: "vi",
        orderExpireTime: HOLD_MINUTES
    };

    requestData.signature = createPaymentSignature(
        requestData,
        config.accessKey,
        config.secretKey
    );

    // Luu yeu cau truoc khi goi MoMo
    const payment = await ThanhToan.create({
        MaThanhToan: requestId,
        MaGD,
        MaKH,
        PhuongThuc: "MOMO",
        SoTien: transaction.TongTien,
        // Index unique khong sparse khong cho nhieu document cung gia tri null.
        // Dung marker rieng theo MaThanhToan cho den khi IPN tra transId that.
        MaGiaoDichMoMo: `PENDING_${requestId}`,
        TrangThai: "PENDING",
        ThoiGianTao: new Date(),
        ThoiGianThanhToan: null,
        NoiDung: orderInfo
    });

    try {
        // Giao dich co the da het han trong luc tao ban ghi thanh toan.
        // Khong gui lenh thanh toan moi neu transaction khong con cho tien.
        const stillPendingTransaction = await GiaoDich.exists({
            MaGD,
            MaKH,
            TrangThai: "PENDING_PAYMENT"
        });

        if (!stillPendingTransaction) {
            await ThanhToan.updateOne(
                {
                    MaThanhToan: requestId,
                    TrangThai: "PENDING"
                },
                {
                    $set: {
                        TrangThai: "CANCELLED",
                        NoiDung: "Giao dich het han truoc khi gui yeu cau thanh toan"
                    }
                }
            );

            throw new Error("Giao dich khong con cho thanh toan");
        }

        const response = await fetch(getMomoCreateEndpoint(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify(requestData),
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            throw new Error(`MoMo HTTP error: ${response.status}`);
        }

        const result = await response.json();

        if (
            Number(result.resultCode) !== 0 ||
            !result.payUrl
        ) {
            await ThanhToan.updateOne(
                {
                    MaThanhToan: requestId,
                    TrangThai: "PENDING"
                },
                {
                    $set: {
                        TrangThai: "FAILED",
                        NoiDung: result.message ||
                            "MoMo tao thanh toan that bai"
                    }
                }
            );

            throw new Error(
                result.message ||
                "MoMo khong tao duoc lien ket thanh toan"
            );
        }

        return {
            MaThanhToan: payment.MaThanhToan,
            MaGD,
            SoTien: payment.SoTien,
            TrangThai: payment.TrangThai,
            payUrl: result.payUrl,
            shortLink: result.shortLink || null
        };

    } catch (error) {
        // Timeout hoac loi mang khong dong nghia voi thanh toan that bai.
        // Giu PENDING de doi IPN hoac doi soat.
        const isTimeout =
            error.name === "AbortError" ||
            error.name === "TimeoutError";

        const isMoMoRejected =
            error.message &&
            error.message.includes("MoMo khong tao duoc");

        if (!isTimeout && !isMoMoRejected) {
            console.error("MoMo connection error:", error.message);

            await ThanhToan.updateOne(
                {
                    MaThanhToan: requestId,
                    TrangThai: "PENDING"
                },
                {
                    $set: {
                        NoiDung: "Chua xac dinh ket qua yeu cau MoMo"
                    }
                }
            );
        }

        throw error;
    }
};

// ============================================
// 9. PHAT HANH VE SAU KHI THANH TOAN
// ============================================

// Xu ly tich diem sau khi giao dich hoan tat
const processEarnPoints = async (MaGD) => {
    try {
        return await tichDiemService.earnPoints(MaGD);

    } catch (error) {
        console.error(
            "Loi tich diem giao dich:",
            MaGD,
            error.message
        );

        return {
            success: false,
            requiresRetry: !error.requiresReconciliation,
            requiresReconciliation: Boolean(error.requiresReconciliation),
            code: error.code || null,
            message: error.message
        };
    }
};

const processCompletedSpend = async (MaGD) => {
    try {
        return await chiTieuHangService.recordCompletedSpend(MaGD);
    } catch (error) {
        console.error("Loi ghi nhan chi tieu giao dich:", MaGD, error.message);
        return {
            success: false,
            requiresRetry: !error.requiresReconciliation,
            requiresReconciliation: Boolean(error.requiresReconciliation),
            code: error.code || null,
            message: error.message
        };
    }
};

const issuePaidTransaction = async (MaGD) => {
    const transaction = await GiaoDich.findOne({ MaGD });

    if (!transaction) {
        throw new Error("Giao dich khong ton tai");
    }

    if (
        transaction.TrangThai !== "PENDING_PAYMENT" &&
        transaction.TrangThai !== "COMPLETED"
    ) {
        return {
            ticketIssued: false,
            pointsProcessed: false,
            requiresReview: true,
            message: "Giao dich khong con o trang thai cho thanh toan",
            TrangThaiGiaoDich: transaction.TrangThai
        };
    }

    // Phat hanh ve hoac lay lai ve da phat hanh
    const tickets = await veService.issueTickets(MaGD);

    // Inventory is an independent projection after ticket issuance. A stock
    // problem must be visible for reconciliation and must not undo paid tickets.
    let stockResult;
    try {
        stockResult = await tonKhoService.deductForPaidTransaction(MaGD);
    } catch (error) {
        console.error("Tru kho can doi soat:", MaGD, error.message);
        stockResult = {
            success: false,
            requiresReconciliation: true,
            message: "Khong xac dinh duoc ket qua tru kho; can doi soat"
        };
    }

    // Tich diem sau khi giao dich hoan tat
    const pointsResult = await processEarnPoints(MaGD);
    // Ghi nhận chi tiêu là projection độc lập; lỗi không đảo ngược vé/thanh toán.
    const spendResult = await processCompletedSpend(MaGD);

    return {
        ticketIssued: true,
        ticketCount: tickets.length,
        stockProcessed: stockResult.success === true,
        stock: stockResult,
        ...(stockResult.requiresReconciliation ? { requiresReview: true } : {}),
        pointsProcessed: pointsResult.success === true,
        points: pointsResult,
        spendingProcessed: spendResult.success === true,
        spending: spendResult,
        TrangThaiGiaoDich: "COMPLETED"
    };
};

const markPaymentForReview = async (MaThanhToan, reason) => {
    await ThanhToan.updateOne(
        { MaThanhToan },
        { $set: {
            CanDoiSoat: true,
            LyDoDoiSoat: reason,
            NgayKiemTraTrangThaiMoMo: new Date()
        } }
    );
};

const getMomoQueryEndpoint = () => {
    const endpoint = new URL(getMomoCreateEndpoint());
    if (endpoint.protocol !== "https:") throw new Error("MoMo endpoint phai su dung HTTPS");
    if (!/\/create\/?$/.test(endpoint.pathname)) {
        throw new Error("Khong xac dinh duoc endpoint query tu MOMO_ENDPOINT");
    }
    endpoint.pathname = endpoint.pathname.replace(/\/create\/?$/, "/query");
    endpoint.search = "";
    endpoint.hash = "";
    return endpoint.toString();
};

const queryMomoTransaction = async ({ transaction, payment, config = getMomoConfig(), fetchImpl = fetch }) => {
    const requestId = crypto.randomUUID().replace(/-/g, "");
    const requestData = {
        partnerCode: config.partnerCode,
        requestId,
        orderId: transaction.MaGD,
        lang: "vi"
    };
    const rawData = [
        `accessKey=${config.accessKey}`,
        `orderId=${requestData.orderId}`,
        `partnerCode=${requestData.partnerCode}`,
        `requestId=${requestData.requestId}`
    ].join("&");
    requestData.signature = createSignature(rawData, config.secretKey);

    const response = await fetchImpl(getMomoQueryEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error(`MoMo query HTTP error: ${response.status}`);
    const result = await response.json();
    const expectedAmount = toVndAmount(transaction.TongTien);
    if (
        result.partnerCode !== config.partnerCode ||
        result.orderId !== transaction.MaGD ||
        result.requestId !== requestId ||
        Number(result.amount) !== expectedAmount ||
        toVndAmount(payment.SoTien) !== expectedAmount
    ) {
        throw new Error("Phan hoi query MoMo khong khop ma giao dich/yeu cau/so tien");
    }
    if (!Number.isInteger(Number(result.resultCode))) {
        throw new Error("MoMo query tra ma ket qua khong hop le");
    }
    if (Number(result.resultCode) === 0) {
        if (result.transId === undefined || result.transId === null || String(result.transId).trim() === "") {
            throw new Error("MoMo query SUCCESS thieu transId");
        }
        toValidResponseDate(result.responseTime);
    }
    return { result, requestId };
};

const processSuccessfulPayment = async (MaGD) => {
    const transaction = await GiaoDich.findOne({ MaGD }).lean();
    if (!transaction) throw new Error("Giao dich khong ton tai");
    const payment = await ThanhToan.findOne({
        MaGD,
        MaKH: transaction.MaKH,
        SoTien: transaction.TongTien,
        TrangThai: "SUCCESS",
        PhuongThuc: { $in: ["MOMO", "DEV_MOCK"] }
    }).lean();
    if (!payment) throw new Error("Khong co payment SUCCESS khop giao dich");

    const result = await issuePaidTransaction(MaGD);
    if (result.requiresReview || result.ticketIssued !== true) {
        await markPaymentForReview(payment.MaThanhToan, result.message || "Thanh toan SUCCESS nhung chua hoan tat phat hanh ve");
    }
    return result;
};

const listPaymentReconciliation = async ({ page = 1, limit = 20 } = {}) => {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedLimit) || parsedLimit < 1) {
        const error = new Error("page va limit phai la so nguyen duong");
        error.statusCode = 400;
        throw error;
    }
    const boundedLimit = Math.min(parsedLimit, 100);
    const query = { CanDoiSoat: true };
    const [items, total] = await Promise.all([
        ThanhToan.find(query)
            .select("MaThanhToan MaGD MaKH PhuongThuc SoTien MaGiaoDichMoMo TrangThai ThoiGianTao ThoiGianThanhToan NgayKiemTraTrangThaiMoMo LyDoDoiSoat -_id")
            .sort({ NgayKiemTraTrangThaiMoMo: 1, ThoiGianTao: 1 })
            .skip((parsedPage - 1) * boundedLimit).limit(boundedLimit).lean(),
        ThanhToan.countDocuments(query)
    ]);
    return { items, pagination: { page: parsedPage, limit: boundedLimit, total, totalPages: Math.ceil(total / boundedLimit) } };
};

const reconcilePendingMomoPayment = async (MaGD) => {
    const transaction = await GiaoDich.findOne({ MaGD }).lean();
    if (!transaction) return { status: "RECONCILIATION_REQUIRED", MaGD, message: "Giao dich khong ton tai" };
    const payment = await ThanhToan.findOne({
        MaGD,
        MaKH: transaction.MaKH,
        PhuongThuc: "MOMO",
        TrangThai: { $in: ["PENDING", "SUCCESS"] }
    }).sort({ ThoiGianTao: -1 });
    if (!payment) return { status: "NO_PENDING_PAYMENT", MaGD };
    if (payment.TrangThai === "SUCCESS") {
        const issued = await processSuccessfulPayment(MaGD);
        return { status: "SUCCESS", MaGD, ...issued };
    }

    let queryResult;
    try {
        ({ result: queryResult } = await queryMomoTransaction({ transaction, payment }));
    } catch (error) {
        await markPaymentForReview(payment.MaThanhToan, `Khong xac minh duoc trang thai MoMo: ${error.message}`);
        return { status: "RECONCILIATION_REQUIRED", MaGD, message: "Khong xac minh duoc trang thai MoMo" };
    }

    const resultCode = Number(queryResult.resultCode);
    const resultStatus = classifyMomoResultCode(resultCode);
    const checkedAt = new Date();
    if (resultStatus === "SUCCESS") {
        let paidAt;
        try {
            paidAt = toValidResponseDate(queryResult.responseTime);
        } catch (error) {
            await markPaymentForReview(payment.MaThanhToan, `MoMo query SUCCESS thieu thoi gian hop le: ${error.message}`);
            return { status: "RECONCILIATION_REQUIRED", MaGD, message: "MoMo SUCCESS nhung metadata khong hop le" };
        }
        const updated = await ThanhToan.findOneAndUpdate(
            { MaThanhToan: payment.MaThanhToan, TrangThai: { $in: ["PENDING", "FAILED", "CANCELLED"] } },
            { $set: {
                TrangThai: "SUCCESS",
                MaGiaoDichMoMo: String(queryResult.transId),
                ThoiGianThanhToan: paidAt,
                NoiDung: String(queryResult.message || "MoMo query xác nhận thành công"),
                NgayKiemTraTrangThaiMoMo: checkedAt,
                CanDoiSoat: false,
                LyDoDoiSoat: null
            } },
            { new: true, runValidators: true }
        );
        const latest = updated || await ThanhToan.findOne({ MaThanhToan: payment.MaThanhToan }).lean();
        if (latest?.TrangThai !== "SUCCESS") {
            await markPaymentForReview(payment.MaThanhToan, "MoMo query SUCCESS nhung khong cap nhat duoc payment");
            return { status: "RECONCILIATION_REQUIRED", MaGD };
        }
        try {
            const issued = await processSuccessfulPayment(MaGD);
            if (issued.requiresReview || issued.ticketIssued !== true) {
                await markPaymentForReview(payment.MaThanhToan, issued.message || "MoMo SUCCESS nhung ve can doi soat");
                return { status: "RECONCILIATION_REQUIRED", MaGD, ...issued };
            }
            return { status: "SUCCESS", MaGD, ...issued };
        } catch (error) {
            await markPaymentForReview(payment.MaThanhToan, `MoMo SUCCESS nhung xu ly ve that bai: ${error.message}`);
            return { status: "RECONCILIATION_REQUIRED", MaGD, message: "MoMo SUCCESS nhung can doi soat phat hanh ve" };
        }
    }

    if (resultStatus === "PENDING" || resultStatus === "AUTHORIZED_REVIEW") {
        await ThanhToan.updateOne(
            { MaThanhToan: payment.MaThanhToan, TrangThai: "PENDING" },
            { $set: { NgayKiemTraTrangThaiMoMo: checkedAt, CanDoiSoat: resultStatus === "AUTHORIZED_REVIEW",
                LyDoDoiSoat: resultStatus === "AUTHORIZED_REVIEW" ? "MoMo tra 9000; chua xac dinh trang thai capture trong cau hinh hien tai" : null } }
        );
        return { status: resultStatus === "AUTHORIZED_REVIEW" ? "RECONCILIATION_REQUIRED" : "PENDING", MaGD, resultCode };
    }

    if (resultStatus === "FAILED") {
        await ThanhToan.updateOne(
            { MaThanhToan: payment.MaThanhToan, TrangThai: "PENDING" },
            { $set: {
                TrangThai: "FAILED",
                NoiDung: String(queryResult.message || `MoMo xác nhận thất bại (${resultCode})`),
                NgayKiemTraTrangThaiMoMo: checkedAt,
                CanDoiSoat: false,
                LyDoDoiSoat: null
            } },
            { runValidators: true }
        );
        return { status: "FAILED", MaGD, resultCode };
    }

    await markPaymentForReview(payment.MaThanhToan, `MoMo query tra resultCode can xac minh thu cong: ${resultCode}`);
    return { status: "RECONCILIATION_REQUIRED", MaGD, resultCode };
};

const acceptLateSuccessfulIPN = async ({ payment, transaction, data }) => {
    const reason = `IPN SUCCESS den sau khi payment da ${payment.TrangThai}; giao dich can doi soat`;
    const updated = await ThanhToan.findOneAndUpdate(
        { MaThanhToan: payment.MaThanhToan, TrangThai: payment.TrangThai },
        { $set: {
            TrangThai: "SUCCESS",
            MaGiaoDichMoMo: String(data.transId),
            ThoiGianThanhToan: toValidResponseDate(data.responseTime),
            NoiDung: String(data.message),
            CanDoiSoat: true,
            LyDoDoiSoat: reason,
            NgayKiemTraTrangThaiMoMo: new Date()
        } },
        { new: true, runValidators: true }
    );
    const latest = updated || await ThanhToan.findOne({ MaThanhToan: payment.MaThanhToan }).lean();
    if (latest?.TrangThai !== "SUCCESS") {
        await markPaymentForReview(payment.MaThanhToan, "IPN SUCCESS xung dot voi cap nhat payment; can doi soat");
        return { success: true, requiresReview: true, MaGD: transaction.MaGD, TrangThaiThanhToan: latest?.TrangThai || payment.TrangThai };
    }

    // Keep a cancelled transaction cancelled. A signed late success is recorded
    // as an exception for admin review; it must not take seats from another order.
    if (transaction.TrangThai === "CANCELLED") {
        return { success: true, requiresReview: true, paymentSuccess: true, ticketIssued: false,
            MaGD: transaction.MaGD, MaThanhToan: payment.MaThanhToan,
            TrangThaiThanhToan: "SUCCESS", message: reason };
    }
    try {
        const result = await issuePaidTransaction(transaction.MaGD);
        if (result.requiresReview || result.ticketIssued !== true) {
            await markPaymentForReview(payment.MaThanhToan, result.message || reason);
        }
        return { success: true, requiresReview: true, paymentSuccess: true,
            MaGD: transaction.MaGD, MaThanhToan: payment.MaThanhToan,
            TrangThaiThanhToan: "SUCCESS", ...result };
    } catch (error) {
        await markPaymentForReview(payment.MaThanhToan, `${reason}: ${error.message}`);
        return { success: true, requiresReview: true, paymentSuccess: true, ticketIssued: false,
            MaGD: transaction.MaGD, MaThanhToan: payment.MaThanhToan,
            TrangThaiThanhToan: "SUCCESS", message: "Thanh toan thanh cong nhung can doi soat ve" };
    }
};


// ============================================
// 10. XAC THUC VA XU LY IPN MOMO
// ============================================

const handleIPN = async (data) => {
    const config = getMomoConfig();

    const requiredFields = [
        "partnerCode",
        "orderId",
        "requestId",
        "amount",
        "orderInfo",
        "orderType",
        "transId",
        "message",
        "payType",
        "responseTime",
        "resultCode",
        "signature"
    ];

    // Kiem tra truong bat buoc
    for (const field of requiredFields) {
        if (
            data[field] === undefined ||
            data[field] === null
        ) {
            throw new Error(`IPN thieu truong ${field}`);
        }
    }

    // Kiem tra PartnerCode
    if (data.partnerCode !== config.partnerCode) {
        throw new Error("PartnerCode khong hop le");
    }

    // Kiem tra chu ky
    const rawData = createIPNSignature(
        data,
        config.accessKey
    );

    if (!verifySignature(
        rawData,
        data.signature,
        config.secretKey
    )) {
        throw new Error("Chu ky IPN MoMo khong hop le");
    }

    // Kiem tra ma ket qua
    const resultCode = Number(data.resultCode);

    if (!Number.isInteger(resultCode)) {
        throw new Error("Ma ket qua thanh toan khong hop le");
    }

    // Tim giao dich
    const transaction = await GiaoDich.findOne({
        MaGD: data.orderId
    });

    if (!transaction) {
        throw new Error("Giao dich khong ton tai");
    }

    // Kiem tra so tien
    const expectedAmount = toVndAmount(transaction.TongTien);

    if (Number(data.amount) !== expectedAmount) {
        throw new Error("So tien IPN khong khop voi giao dich");
    }

    // Tim yeu cau thanh toan
    const payment = await ThanhToan.findOne({
        MaThanhToan: data.requestId,
        MaGD: data.orderId,
        MaKH: transaction.MaKH,
        PhuongThuc: "MOMO"
    });

    if (!payment) {
        throw new Error("Khong tim thay yeu cau thanh toan MoMo");
    }

    if (toVndAmount(payment.SoTien) !== expectedAmount) {
        throw new Error("So tien thanh toan khong khop");
    }

    const resultStatus = classifyMomoResultCode(resultCode);
    const isPaymentSuccess = resultStatus === "SUCCESS";

    if (isPaymentSuccess) {
        if (data.transId === undefined || data.transId === null || String(data.transId).trim() === "") {
            throw new Error("IPN SUCCESS thieu transId");
        }
        toValidResponseDate(data.responseTime);
    }

    // ========================================
    // IPN GUI LAP LAI
    // ========================================

    if (payment.TrangThai === "SUCCESS") {
        if (!isPaymentSuccess) {
            await markPaymentForReview(payment.MaThanhToan, "IPN FAILED xung dot voi payment SUCCESS da ghi nhan");
            return {
                success: true,
                duplicate: true,
                requiresReview: true,
                MaGD: transaction.MaGD,
                MaThanhToan: payment.MaThanhToan,
                TrangThaiThanhToan: "SUCCESS",
                message: "Ket qua IPN xung dot; giu SUCCESS va dua vao doi soat"
            };
        }

        // Thu phat hanh lai neu truoc do gap loi
        try {
            const result = await issuePaidTransaction(data.orderId);
            if (result.requiresReview || result.ticketIssued !== true) {
                await markPaymentForReview(payment.MaThanhToan, result.message || "Payment SUCCESS nhung luong ve can doi soat");
            }

            return {
                success: true,
                duplicate: true,
                MaGD: transaction.MaGD,
                MaThanhToan: payment.MaThanhToan,
                TrangThaiThanhToan: "SUCCESS",
                ...result
            };

        } catch (error) {
            await markPaymentForReview(payment.MaThanhToan, `Payment SUCCESS nhung retry phat hanh ve that bai: ${error.message}`);
            console.error(
                "Retry ticket issuance error:",
                error.message
            );

            return {
                success: true,
                duplicate: true,
                requiresReview: true,
                ticketIssued: false,
                MaGD: transaction.MaGD,
                MaThanhToan: payment.MaThanhToan,
                TrangThaiThanhToan: "SUCCESS",
                message: error.message
            };
        }
    }

    if (payment.TrangThai === "FAILED" || payment.TrangThai === "CANCELLED") {
        if (isPaymentSuccess) return acceptLateSuccessfulIPN({ payment, transaction, data });
        return {
            success: true,
            duplicate: true,
            MaGD: transaction.MaGD,
            MaThanhToan: payment.MaThanhToan,
            TrangThaiThanhToan: payment.TrangThai,
            ticketIssued: false
        };
    }

    if (["PENDING", "AUTHORIZED_REVIEW", "UNKNOWN"].includes(resultStatus)) {
        const requiresReview = resultStatus !== "PENDING";
        await ThanhToan.updateOne(
            { MaThanhToan: payment.MaThanhToan, TrangThai: "PENDING" },
            { $set: {
                NgayKiemTraTrangThaiMoMo: new Date(),
                CanDoiSoat: requiresReview,
                LyDoDoiSoat: requiresReview ? `IPN resultCode ${resultCode} can doi soat; giu payment PENDING` : null
            } }
        );
        return {
            success: true,
            paymentSuccess: false,
            ticketIssued: false,
            requiresReview,
            MaGD: transaction.MaGD,
            MaThanhToan: payment.MaThanhToan,
            TrangThaiThanhToan: "PENDING",
            resultCode
        };
    }

    if (payment.TrangThai !== "PENDING") {
        throw new Error(
            "Yeu cau thanh toan da duoc xu ly truoc do"
        );
    }

    // ========================================
    // CAP NHAT KET QUA THANH TOAN
    // ========================================

    const paymentUpdate = {
        TrangThai: isPaymentSuccess ? "SUCCESS" : "FAILED",
        ...(isPaymentSuccess ? { MaGiaoDichMoMo: String(data.transId) } : {}),
        ThoiGianThanhToan: isPaymentSuccess
            ? toValidResponseDate(data.responseTime)
            : null,
        NoiDung: String(data.message),
        CanDoiSoat: false,
        LyDoDoiSoat: null,
        NgayKiemTraTrangThaiMoMo: new Date()
    };

    const updatedPayment = await ThanhToan.findOneAndUpdate(
        {
            MaThanhToan: data.requestId,
            MaGD: data.orderId,
            TrangThai: "PENDING"
        },
        {
            $set: paymentUpdate
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedPayment) {
        // Co the IPN khac da cap nhat truoc.
        const latestPayment = await ThanhToan.findOne({
            MaThanhToan: data.requestId
        });

        if (
            latestPayment &&
            latestPayment.TrangThai === "SUCCESS" &&
            isPaymentSuccess
        ) {
            const result = await issuePaidTransaction(data.orderId);
            if (result.requiresReview || result.ticketIssued !== true) {
                await markPaymentForReview(latestPayment.MaThanhToan, result.message || "Payment SUCCESS nhung luong ve can doi soat");
            }

            return {
                success: true,
                duplicate: true,
                MaGD: transaction.MaGD,
                MaThanhToan: latestPayment.MaThanhToan,
                TrangThaiThanhToan: "SUCCESS",
                ...result
            };
        }

        if (latestPayment && isPaymentSuccess && ["FAILED", "CANCELLED"].includes(latestPayment.TrangThai)) {
            return acceptLateSuccessfulIPN({ payment: latestPayment, transaction, data });
        }

        throw new Error("Khong the cap nhat ket qua thanh toan");
    }

    // Thanh toan that bai: khong phat hanh ve
    if (!isPaymentSuccess) {
        return {
            success: true,
            MaGD: transaction.MaGD,
            MaThanhToan: updatedPayment.MaThanhToan,
            TrangThaiThanhToan: "FAILED",
            paymentSuccess: false,
            ticketIssued: false
        };
    }

    // Thanh toan thanh cong: phat hanh ve
    try {
        const result = await issuePaidTransaction(transaction.MaGD);
        if (result.requiresReview || result.ticketIssued !== true) {
            await markPaymentForReview(updatedPayment.MaThanhToan, result.message || "Payment SUCCESS nhung luong ve can doi soat");
        }

        return {
            success: true,
            MaGD: transaction.MaGD,
            MaThanhToan: updatedPayment.MaThanhToan,
            TrangThaiThanhToan: "SUCCESS",
            paymentSuccess: true,
            ...result
        };

    } catch (error) {
        await markPaymentForReview(updatedPayment.MaThanhToan, `Payment SUCCESS nhung phat hanh ve that bai: ${error.message}`);
        // Khong doi SUCCESS thanh FAILED.
        // Giu trang thai thanh toan de doi soat/phat hanh lai.
        console.error(
            "Ticket issuance after MoMo payment failed:",
            error.message
        );

        return {
            success: true,
            requiresReview: true,
            ticketIssued: false,
            MaGD: transaction.MaGD,
            MaThanhToan: updatedPayment.MaThanhToan,
            TrangThaiThanhToan: "SUCCESS",
            message: error.message
        };
    }
};

// ============================================
// 11. MO PHONG THANH TOAN DEV_MOCK
// ============================================

const simulatePayment = async (MaGD, MaKH, outcome = "SUCCESS") => {
    // Chan mo phong tren production
    if (process.env.NODE_ENV === "production") {
        throw new Error(
            "Khong cho phep mo phong thanh toan tren production"
        );
    }

    if (process.env.DEV_PAYMENT_ENABLED !== "true") {
        throw new Error(
            "Chuc nang mo phong thanh toan chua duoc bat"
        );
    }

    if (!MaGD || !MaKH) {
        throw new Error("Thieu MaGD hoac MaKH");
    }

    if (!["SUCCESS", "FAILED"].includes(outcome)) {
        throw new Error("Ket qua mo phong khong hop le");
    }

    // Tim giao dich cua khach hang
    const transaction = await GiaoDich.findOne({
        MaGD,
        MaKH
    });

    if (!transaction) {
        throw new Error("Giao dich khong ton tai");
    }

    // Neu da hoan tat, tra ve ve hien co
    if (transaction.TrangThai === "COMPLETED") {
        const result = await issuePaidTransaction(MaGD);

        const tickets = await veService.getTicketsByTransaction(MaGD);

        return {
            success: true,
            duplicate: true,
            MaGD,
            TrangThaiGiaoDich: "COMPLETED",
            ticketIssued: tickets.length > 0,
            ticketCount: tickets.length,
            tickets,
            pointsProcessed: result.pointsProcessed,
            points: result.points
        };
    }

    if (transaction.TrangThai !== "PENDING_PAYMENT") {
        throw new Error(
            "Giao dich khong o trang thai cho thanh toan"
        );
    }

    // Kiem tra thoi gian va ghe
    validateTransactionTime(transaction);
    await validateHeldSeats(transaction);

    // Khong mo phong neu da co thanh toan thanh cong
    const successfulPayment = await ThanhToan.findOne({
        MaGD,
        TrangThai: "SUCCESS"
    });

    if (successfulPayment) {
        if (successfulPayment.PhuongThuc === "DEV_MOCK") {
            try {
                const result = await issuePaidTransaction(MaGD);

                return {
                    success: true,
                    duplicate: true,
                    MaGD,
                    MaThanhToan: successfulPayment.MaThanhToan,
                    TrangThaiThanhToan: "SUCCESS",
                    ...result
                };
            } catch (error) {
                return {
                    success: true,
                    duplicate: true,
                    requiresReview: true,
                    ticketIssued: false,
                    MaGD,
                    MaThanhToan: successfulPayment.MaThanhToan,
                    TrangThaiThanhToan: "SUCCESS",
                    message: error.message
                };
            }
        }

        throw new Error(
            "Giao dich da duoc thanh toan bang phuong thuc khac"
        );
    }

    // Khong mo phong khi dang co yeu cau MoMo cho xu ly
    const pendingPayment = await ThanhToan.findOne({
        MaGD,
        TrangThai: "PENDING"
    });

    if (pendingPayment) {
        throw new Error(
            "Giao dich dang co yeu cau thanh toan cho xu ly"
        );
    }

    // Tao ban ghi thanh toan mo phong
    const now = new Date();
    const MaThanhToan = `DEV_${crypto.randomUUID().replace(/-/g, "")}`;

    const payment = await ThanhToan.create({
        MaThanhToan,
        MaGD,
        MaKH,
        PhuongThuc: "DEV_MOCK",
        SoTien: transaction.TongTien,
        // Marker rieng tranh xung dot unique index; day khong phai MoMo transId.
        MaGiaoDichMoMo: `DEV_MOCK_${MaThanhToan}`,
        TrangThai: outcome,
        ThoiGianTao: now,
        ThoiGianThanhToan: outcome === "SUCCESS" ? now : null,
        NoiDung: outcome === "SUCCESS"
            ? "Thanh toan mo phong thanh cong"
            : "Thanh toan mo phong that bai"
    });

    // Neu that bai, khong phat hanh ve
    if (outcome === "FAILED") {
        return {
            success: true,
            MaGD,
            MaThanhToan: payment.MaThanhToan,
            PhuongThuc: "DEV_MOCK",
            TrangThaiThanhToan: "FAILED",
            ticketIssued: false
        };
    }

    // Neu thanh cong, phat hanh ve
    try {
        const result = await issuePaidTransaction(MaGD);

        return {
            success: true,
            MaGD,
            MaThanhToan: payment.MaThanhToan,
            PhuongThuc: "DEV_MOCK",
            TrangThaiThanhToan: "SUCCESS",
            ...result
        };

    } catch (error) {
        console.error(
            "DEV mock ticket issuance failed:",
            error.message
        );

        return {
            success: true,
            requiresReview: true,
            ticketIssued: false,
            MaGD,
            MaThanhToan: payment.MaThanhToan,
            PhuongThuc: "DEV_MOCK",
            TrangThaiThanhToan: "SUCCESS",
            message: error.message
        };
    }
};


// ============================================
// 12. EXPORT
// ============================================

module.exports = {
    createPayment,
    handleIPN,
    simulatePayment,
    processSuccessfulPayment,
    reconcilePendingMomoPayment,
    queryMomoTransaction,
    listPaymentReconciliation,
    classifyMomoResultCode,
    issuePaidTransaction
};
