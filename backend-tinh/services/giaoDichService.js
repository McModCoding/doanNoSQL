
const GiaoDich = require("../models/GiaoDich");
const SuatChieu = require("../models/SuatChieu");
const ThanhToan = require("../models/ThanhToan");
const thanhToanService = require("./thanhToanService");

// Thoi gian giu ghe: 10 phut
const HOLD_MINUTES = 10;

// Chuyen keyword thanh regex an toan
const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Lay danh sach giao dich
const getAllTransactions = async (filters = {}) => {
    const query = {};

    if (filters.MaKH) {
        query.MaKH = filters.MaKH;
    }

    if (filters.TrangThai) {
        query.TrangThai = filters.TrangThai;
    }

    if (filters.LoaiGiaoDich) {
        query.LoaiGiaoDich = filters.LoaiGiaoDich;
    }

    if (filters.MaGD) {
        query.MaGD = filters.MaGD;
    }

    if (filters.keyword) {
        const keyword = new RegExp(
            escapeRegex(filters.keyword),
            "i"
        );

        query.$or = [
            { MaGD: keyword },
            { MaKH: keyword }
        ];
    }

    // Loc theo khoang thoi gian tao
    if (filters.TuNgay || filters.DenNgay) {
        query.NgayTao = {};

        if (filters.TuNgay) {
            const fromDate = new Date(filters.TuNgay);

            if (Number.isNaN(fromDate.getTime())) {
                throw new Error("TuNgay khong hop le");
            }

            query.NgayTao.$gte = fromDate;
        }

        if (filters.DenNgay) {
            const toDate = new Date(filters.DenNgay);

            if (Number.isNaN(toDate.getTime())) {
                throw new Error("DenNgay khong hop le");
            }

            // Lay het du lieu trong ngay DenNgay
            toDate.setDate(toDate.getDate() + 1);
            query.NgayTao.$lt = toDate;
        }
    }

    return GiaoDich.find(query).sort({
        NgayTao: -1
    });
};

// Lay chi tiet giao dich
const getTransactionById = async (MaGD) => {
    return GiaoDich.findOne({ MaGD });
};

// Lay lich su giao dich cua khach hang
const getTransactionsByCustomer = async (MaKH, filters = {}) => {
    if (!MaKH) {
        throw new Error("MaKH khong duoc de trong");
    }

    const query = { MaKH };

    if (filters.TrangThai) {
        query.TrangThai = filters.TrangThai;
    }

    if (filters.LoaiGiaoDich) {
        query.LoaiGiaoDich = filters.LoaiGiaoDich;
    }

    return GiaoDich.find(query).sort({
        NgayTao: -1
    });
};

// Giai phong ghe do giao dich dang giu
const releaseSeatsForTransaction = async (
    transaction,
    { onlyExpiredAt = null } = {}
) => {
    if (!transaction || !transaction.ChiTietVe) {
        return 0;
    }

    // Gom cac ghe theo tung suat chieu
    const seatsByShowtime = {};
    let releasedSeatCount = 0;

    for (const ticket of transaction.ChiTietVe) {
        if (!ticket.MaSuat || !ticket.MaGhe) {
            continue;
        }

        if (!seatsByShowtime[ticket.MaSuat]) {
            seatsByShowtime[ticket.MaSuat] = [];
        }

        seatsByShowtime[ticket.MaSuat].push(ticket.MaGhe);
    }

    // Chi giai phong ghe dang HELD boi dung giao dich nay
    for (const [MaSuat, MaGhes] of Object.entries(seatsByShowtime)) {
        const seatFilter = {
            "g.MaGhe": { $in: MaGhes },
            "g.TrangThai": "HELD",
            "g.MaGDGiuCho": transaction.MaGD
        };

        if (onlyExpiredAt) {
            seatFilter["g.ThoiGianGiuCho"] = { $lte: onlyExpiredAt };
        }

        const result = await SuatChieu.updateOne(
            { MaSuat },
            {
                $set: {
                    "DanhSachGhe.$[g].TrangThai": "AVAILABLE",
                    "DanhSachGhe.$[g].MaGDGiuCho": null,
                    "DanhSachGhe.$[g].ThoiGianGiuCho": null
                }
            },
            {
                arrayFilters: [
                    seatFilter
                ]
            }
        );

        releasedSeatCount += result.modifiedCount || 0;
    }

    return releasedSeatCount;
};

// Huy giao dich dang cho thanh toan
const cancelTransaction = async (MaGD, MaKH = null) => {
    const activePayment = await ThanhToan.exists({
        MaGD,
        $or: [
            { TrangThai: { $in: ["PENDING", "SUCCESS"] } },
            { CanDoiSoat: true }
        ]
    });
    if (activePayment) throw new Error("Khong the huy khi thanh toan dang xu ly hoac can doi soat");

    const query = {
        MaGD,
        TrangThai: "PENDING_PAYMENT"
    };

    // Neu co MaKH, chi cho phep khach hang huy giao dich cua minh
    if (MaKH) {
        query.MaKH = MaKH;
    }

    // Chuyen trang thai truoc de tranh callback thanh toan
    // hoan tat giao dich sau khi giao dich da bi huy
    const transaction = await GiaoDich.findOneAndUpdate(
        query,
        {
            $set: {
                TrangThai: "CANCELLED"
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!transaction) {
        const existing = await GiaoDich.findOne({ MaGD });

        if (!existing) {
            throw new Error("Giao dich khong ton tai");
        }

        if (MaKH && existing.MaKH !== MaKH) {
            throw new Error("Ban khong co quyen huy giao dich nay");
        }

        throw new Error(
            "Chi duoc huy giao dich dang cho thanh toan"
        );
    }

    // Recheck after the transaction CAS to close a payment-creation race.
    const racedPayment = await ThanhToan.exists({
        MaGD,
        $or: [
            { TrangThai: { $in: ["PENDING", "SUCCESS"] } },
            { CanDoiSoat: true }
        ]
    });
    if (racedPayment) {
        await GiaoDich.updateOne(
            { MaGD, TrangThai: "CANCELLED" },
            { $set: { TrangThai: "PENDING_PAYMENT" } }
        );
        throw new Error("Khong the huy khi thanh toan dang xu ly hoac can doi soat");
    }

    // Giai phong ghe sau khi huy giao dich
    try {
        await releaseSeatsForTransaction(transaction);
    } catch (error) {
        console.error(
            "Giao dich da huy nhung giai phong ghe that bai:",
            MaGD,
            error.message
        );

        throw new Error(
            "Giao dich da huy nhung chua giai phong duoc ghe. Can kiem tra lai"
        );
    }

    return transaction;
};

// Tu dong huy giao dich het han giu ghe
const expirePendingTransactions = async () => {
    const now = new Date();
    const expirationTime = new Date(
        now.getTime() - HOLD_MINUTES * 60 * 1000
    );

    const pendingExpiredTransactions = await GiaoDich.find({
        TrangThai: "PENDING_PAYMENT",
        NgayTao: { $lte: expirationTime }
    }).lean();

    // Retry giao dich da CANCELLED nhung ghe het han con HELD, khong quet
    // toan bo lich su giao dich huy moi lan scheduler chay.
    const expiredHeldOwners = await SuatChieu.distinct(
        "DanhSachGhe.MaGDGiuCho",
        {
            TrangThai: "SCHEDULED",
            DanhSachGhe: {
                $elemMatch: {
                    TrangThai: "HELD",
                    ThoiGianGiuCho: { $lte: now },
                    MaGDGiuCho: { $ne: null }
                }
            }
        }
    );

    const cancelledWithExpiredSeats = expiredHeldOwners.length
        ? await GiaoDich.find({
            MaGD: { $in: expiredHeldOwners },
            TrangThai: "CANCELLED",
            NgayTao: { $lte: expirationTime }
        }).lean()
        : [];

    const expiredTransactions = [
        ...pendingExpiredTransactions,
        ...cancelledWithExpiredSeats
    ];

    let cancelledCount = 0;
    let releasedSeatCount = 0;
    let deferredPaymentCount = 0;
    let failedCount = 0;

    for (const item of expiredTransactions) {
        try {
            let payment = await ThanhToan.findOne({ MaGD: item.MaGD })
                .sort({ ThoiGianTao: -1 }).lean();

            if (payment?.TrangThai === "SUCCESS") {
                try {
                    await thanhToanService.processSuccessfulPayment(item.MaGD);
                } catch (error) {
                    console.error("Thanh toan SUCCESS can doi soat:", item.MaGD, error.message);
                }
                deferredPaymentCount++;
                continue;
            }

            if (payment?.TrangThai === "PENDING" && payment.PhuongThuc === "MOMO") {
                const resolution = await thanhToanService.reconcilePendingMomoPayment(item.MaGD);
                if (resolution.status === "SUCCESS") {
                    deferredPaymentCount++;
                    continue;
                }
                if (resolution.status !== "FAILED") {
                    deferredPaymentCount++;
                    continue;
                }
                payment = await ThanhToan.findOne({ MaThanhToan: payment.MaThanhToan }).lean();
            } else if (payment?.TrangThai === "PENDING") {
                await ThanhToan.updateOne(
                    { MaThanhToan: payment.MaThanhToan, TrangThai: "PENDING" },
                    { $set: {
                        CanDoiSoat: true,
                        LyDoDoiSoat: "Payment PENDING khong co co che truy van tu nha cung cap",
                        NgayKiemTraTrangThaiMoMo: new Date()
                    } }
                );
                deferredPaymentCount++;
                continue;
            }

            if (payment?.CanDoiSoat) {
                deferredPaymentCount++;
                continue;
            }

            if (payment?.TrangThai === "SUCCESS") {
                deferredPaymentCount++;
                continue;
            }

            let transaction = item;

            if (item.TrangThai === "PENDING_PAYMENT") {
                // CAS tren giao dich: chi mot worker duoc phep chuyen trang
                // thai; worker khac khong giai phong neu claim khong thanh cong.
                transaction = await GiaoDich.findOneAndUpdate(
                    {
                        MaGD: item.MaGD,
                        TrangThai: "PENDING_PAYMENT",
                        NgayTao: { $lte: expirationTime }
                    },
                    {
                        $set: { TrangThai: "CANCELLED" }
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

                if (!transaction) continue;
                cancelledCount++;

                // A payment callback can win the race with the expiry CAS.
                // Recheck before releasing seats; paid or uncertain payments
                // retain their reservation for issuance/reconciliation.
                const paymentAfterCancel = await ThanhToan.findOne({ MaGD: item.MaGD })
                    .sort({ ThoiGianTao: -1 }).lean();
                if (paymentAfterCancel?.TrangThai === "SUCCESS" ||
                    paymentAfterCancel?.TrangThai === "PENDING" ||
                    paymentAfterCancel?.CanDoiSoat) {
                    await GiaoDich.updateOne(
                        { MaGD: item.MaGD, TrangThai: "CANCELLED" },
                        { $set: { TrangThai: "PENDING_PAYMENT" } }
                    );
                    cancelledCount--;
                    if (paymentAfterCancel.TrangThai === "SUCCESS") {
                        try {
                            await thanhToanService.processSuccessfulPayment(item.MaGD);
                        } catch (error) {
                            console.error("Thanh toan SUCCESS can doi soat:", item.MaGD, error.message);
                        }
                    }
                    deferredPaymentCount++;
                    continue;
                }
            }

            // Idempotent retry cho giao dich CANCELLED: chi giai phong ghe
            // HELD boi giao dich nay va ghe da het han theo timestamp ghe.
            const releasedForTransaction = await releaseSeatsForTransaction(transaction, { onlyExpiredAt: now });

            releasedSeatCount += releasedForTransaction;
        } catch (error) {
            failedCount++;

            console.error(
                "Loi xu ly giao dich het han:",
                item.MaGD,
                error.message
            );
        }
    }

    return {
        totalExpired: expiredTransactions.length,
        cancelledCount,
        releasedSeatCount,
        deferredPaymentCount,
        failedCount
    };
};

module.exports = {
    getAllTransactions,
    getTransactionById,
    getTransactionsByCustomer,
    releaseSeatsForTransaction,
    cancelTransaction,
    expirePendingTransactions
};
