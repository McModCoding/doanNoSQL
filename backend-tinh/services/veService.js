
const crypto = require("crypto");

const Ve = require("../models/Ve");
const GiaoDich = require("../models/GiaoDich");
const ThanhToan = require("../models/ThanhToan");
const SuatChieu = require("../models/SuatChieu");

const HOLD_MINUTES = 10;

// Tao ma ve duy nhat
const generateTicketCode = () => {
    return `VE_${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;
};

// Tao ma QR duy nhat
const generateQRTicket = () => {
    return crypto.randomBytes(32).toString("hex");
};

// Lay chi tiet ve theo ma giao dich
const getTicketsByTransaction = async (MaGD) => {
    return Ve.find({ MaGD }).sort({ MaVe: 1 });
};

// Lay chi tiet mot ve
const getTicketById = async (MaVe) => {
    return Ve.findOne({ MaVe });
};

// Lay danh sach ve cua khach hang
const getTicketsByCustomer = async (MaKH, filters = {}) => {
    if (!MaKH) {
        throw new Error("MaKH khong duoc de trong");
    }

    const query = { MaKH };

    if (filters.TrangThai) {
        query.TrangThai = filters.TrangThai;
    }

    if (filters.MaSuat) {
        query.MaSuat = filters.MaSuat;
    }

    return Ve.find(query).sort({ NgayPhatHanh: -1 });
};

// Kiem tra danh sach ve da phat hanh co day du hay khong
const validateExistingTickets = (existingTickets, transaction) => {
    if (existingTickets.length !== transaction.ChiTietVe.length) {
        return false;
    }

    return transaction.ChiTietVe.every((detail) => {
        return existingTickets.some((ticket) =>
            ticket.MaSuat === detail.MaSuat &&
            ticket.MaGhe === detail.MaGhe &&
            ticket.MaGD === transaction.MaGD &&
            ticket.MaKH === transaction.MaKH
        );
    });
};

// Phat hanh ve sau khi thanh toan thanh cong
const issueTickets = async (MaGD) => {
    if (!MaGD) {
        throw new Error("MaGD khong duoc de trong");
    }

    // 1. Tim giao dich
    const transaction = await GiaoDich.findOne({ MaGD });

    if (!transaction) {
        throw new Error("Giao dich khong ton tai");
    }

    if (
        !Array.isArray(transaction.ChiTietVe) ||
        transaction.ChiTietVe.length === 0
    ) {
        throw new Error("Giao dich khong co chi tiet ve");
    }

    // 2. Kiem tra thanh toan thanh cong
    const payment = await ThanhToan.findOne({
        MaGD,
        MaKH: transaction.MaKH,
        SoTien: transaction.TongTien,
        TrangThai: "SUCCESS",
        PhuongThuc: { $in: ["MOMO", "DEV_MOCK"] }
    });

    if (!payment) {
        throw new Error("Giao dich chua duoc thanh toan thanh cong");
    }

    // 3. Xu ly goi phat hanh lap lai
    if (transaction.TrangThai === "COMPLETED") {
        const existingTickets = await Ve.find({ MaGD });

        if (
            validateExistingTickets(existingTickets, transaction) &&
            existingTickets.length > 0
        ) {
            return existingTickets.sort((a, b) =>
                a.MaVe.localeCompare(b.MaVe)
            );
        }

        throw new Error(
            "Giao dich da hoan tat nhung du lieu ve khong day du. Can doi soat"
        );
    }

    if (transaction.TrangThai !== "PENDING_PAYMENT") {
        throw new Error(
            "Giao dich khong o trang thai cho thanh toan"
        );
    }

    // 4. Kiem tra ve da ton tai
    const existingTickets = await Ve.find({ MaGD });

    if (existingTickets.length > 0) {
        throw new Error(
            "Giao dich da co ve duoc phat hanh. Can doi soat truoc khi tiep tuc"
        );
    }

    const now = new Date();

    const holdUntil = new Date(
        now.getTime() + HOLD_MINUTES * 60 * 1000
    );

    // 5. Gom ghe theo tung suat chieu
    const seatsByShowtime = {};

    for (const detail of transaction.ChiTietVe) {
        if (!detail.MaSuat || !detail.MaGhe) {
            throw new Error("Chi tiet ve thieu MaSuat hoac MaGhe");
        }

        if (!seatsByShowtime[detail.MaSuat]) {
            seatsByShowtime[detail.MaSuat] = [];
        }

        if (seatsByShowtime[detail.MaSuat].includes(detail.MaGhe)) {
            throw new Error(
                `Giao dich co ma ghe ${detail.MaGhe} bi trung`
            );
        }

        seatsByShowtime[detail.MaSuat].push(detail.MaGhe);
    }

    const showtimeMap = new Map();

    // 6. Kiem tra cac ghe van duoc giao dich giu
    for (const MaSuat of Object.keys(seatsByShowtime)) {
        const showtime = await SuatChieu.findOne({
            MaSuat,
            TrangThai: "SCHEDULED"
        });

        if (!showtime) {
            throw new Error(
                `Suat chieu ${MaSuat} khong con hoat dong`
            );
        }

        showtimeMap.set(MaSuat, showtime);

        for (const MaGhe of seatsByShowtime[MaSuat]) {
            const seat = showtime.DanhSachGhe.find(
                (item) => item.MaGhe === MaGhe
            );

            if (
                !seat ||
                seat.TrangThai !== "HELD" ||
                seat.MaGDGiuCho !== MaGD
            ) {
                throw new Error(
                    `Ghe ${MaGhe} khong con duoc giao dich giu hop le`
                );
            }
        }
    }

    const bookedSeats = [];
    const createdTicketIds = [];
    const createdTickets = [];
    let completionRecorded = false;

    try {
        // 7. Chuyen tung ghe HELD sang BOOKED
        for (const [MaSuat, MaGhes] of Object.entries(seatsByShowtime)) {
            for (const MaGhe of MaGhes) {
                const result = await SuatChieu.updateOne(
                    {
                        MaSuat,
                        TrangThai: "SCHEDULED",
                        DanhSachGhe: {
                            $elemMatch: {
                                MaGhe,
                                TrangThai: "HELD",
                                MaGDGiuCho: MaGD
                            }
                        }
                    },
                    {
                        $set: {
                            "DanhSachGhe.$[g].TrangThai": "BOOKED",

                            // Giu MaGD de co the xac dinh chu so huu
                            // neu can phuc hoi khi phat hanh that bai
                            "DanhSachGhe.$[g].MaGDGiuCho": MaGD,

                            "DanhSachGhe.$[g].ThoiGianGiuCho": null
                        }
                    },
                    {
                        arrayFilters: [
                            {
                                "g.MaGhe": MaGhe,
                                "g.TrangThai": "HELD",
                                "g.MaGDGiuCho": MaGD
                            }
                        ]
                    }
                );

                if (result.modifiedCount !== 1) {
                    throw new Error(
                        `Khong the xac nhan ghe ${MaGhe}. Ghe co the da thay doi trang thai`
                    );
                }

                bookedSeats.push({ MaSuat, MaGhe });
            }
        }

        // 8. Tao tung ve
        for (const detail of transaction.ChiTietVe) {
            const showtime = showtimeMap.get(detail.MaSuat);

            const ticket = await Ve.create({
                MaVe: generateTicketCode(),
                MaGD: transaction.MaGD,
                MaKH: transaction.MaKH,
                MaSuat: detail.MaSuat,
                MaPhim: showtime.MaPhim,
                MaRap: showtime.MaRap,
                MaPhong: showtime.MaPhong,
                MaGhe: detail.MaGhe,
                GiaVe: detail.GiaVe,
                MaQRTicket: generateQRTicket(),
                TrangThai: "VALID",
                NgayPhatHanh: now,
                NgaySuDung: null
            });

            createdTicketIds.push(ticket._id);
            createdTickets.push(ticket);
        }

        // 9. Gan MaVe vao ChiTietVe
        const updatedDetails = transaction.ChiTietVe.map((detail) => {
            const ticket = createdTickets.find(
                (item) =>
                    item.MaSuat === detail.MaSuat &&
                    item.MaGhe === detail.MaGhe
            );

            if (!ticket) {
                throw new Error(
                    `Khong tim thay ve cua ghe ${detail.MaGhe}`
                );
            }

            return {
                ...detail.toObject(),
                MaVe: ticket.MaVe
            };
        });

        // 10. Chi hoan tat neu giao dich van dang cho thanh toan
        const completedTransaction = await GiaoDich.findOneAndUpdate(
            {
                MaGD,
                TrangThai: "PENDING_PAYMENT"
            },
            {
                $set: {
                    ChiTietVe: updatedDetails,
                    TrangThai: "COMPLETED",
                    NgayHoanTat: now
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!completedTransaction) {
            throw new Error(
                "Khong the hoan tat giao dich. Can doi soat thanh toan"
            );
        }

        // Moc nay la commit logic tren document giao dich. Sau diem nay
        // khong duoc xoa ve hoac mo lai ghe da xac nhan.
        completionRecorded = true;

        // 11. Xoa thong tin chu giu ghe sau khi hoan tat.
        // Neu buoc nay loi thi khong rollback giao dich da hoan tat.
        for (const MaSuat of Object.keys(seatsByShowtime)) {
            try {
                await SuatChieu.updateOne(
                    {
                        MaSuat,
                        TrangThai: "SCHEDULED"
                    },
                    {
                        $set: {
                            "DanhSachGhe.$[g].MaGDGiuCho": null
                        }
                    },
                    {
                        arrayFilters: [
                            {
                                "g.MaGhe": {
                                    $in: seatsByShowtime[MaSuat]
                                },
                                "g.TrangThai": "BOOKED",
                                "g.MaGDGiuCho": MaGD
                            }
                        ]
                    }
                );
            } catch (cleanupError) {
                console.error(
                    "Khong the xoa thong tin giu ghe:",
                    cleanupError.message
                );
            }
        }

        // Tra ve danh sach ve da tao, khong truy van lai sau khi hoan tat
        return createdTickets;

    } catch (error) {
        if (completionRecorded) {
            console.error(
                "Loi sau khi giao dich da hoan tat; can doi soat, khong rollback ve/ghe:",
                MaGD,
                error.message
            );

            const reconciliationError = new Error(
                "Giao dich da hoan tat nhung buoc sau do gap loi. Can doi soat; du lieu ve va ghe duoc giu nguyen"
            );
            reconciliationError.code = "TICKET_ISSUANCE_POST_COMPLETION";
            reconciliationError.requiresReconciliation = true;
            throw reconciliationError;
        }

        // 12. Neu that bai truoc khi hoan tat giao dich,
        // thu xoa cac ve da tao va khoi phuc ghe.

        try {
            if (createdTicketIds.length > 0) {
                await Ve.deleteMany({
                    _id: { $in: createdTicketIds }
                });
            }
        } catch (rollbackError) {
            console.error(
                "Loi xoa ve khi rollback:",
                rollbackError.message
            );
        }

        for (const seat of bookedSeats) {
            try {
                await SuatChieu.updateOne(
                    {
                        MaSuat: seat.MaSuat,
                        DanhSachGhe: {
                            $elemMatch: {
                                MaGhe: seat.MaGhe,
                                TrangThai: "BOOKED",
                                MaGDGiuCho: MaGD
                            }
                        }
                    },
                    {
                        $set: {
                            "DanhSachGhe.$[g].TrangThai": "HELD",
                            "DanhSachGhe.$[g].MaGDGiuCho": MaGD,
                            "DanhSachGhe.$[g].ThoiGianGiuCho": holdUntil
                        }
                    },
                    {
                        arrayFilters: [
                            {
                                "g.MaGhe": seat.MaGhe,
                                "g.TrangThai": "BOOKED",
                                "g.MaGDGiuCho": MaGD
                            }
                        ]
                    }
                );
            } catch (rollbackError) {
                console.error(
                    `Loi khoi phuc ghe ${seat.MaGhe}:`,
                    rollbackError.message
                );
            }
        }

        throw error;
    }
};

// Kiem tra ve bang ma QR
const verifyTicket = async (MaQRTicket) => {
    if (!MaQRTicket) {
        throw new Error("Ma QR khong duoc de trong");
    }

    const ticket = await Ve.findOne({ MaQRTicket });

    if (!ticket) {
        throw new Error("Ve khong ton tai hoac ma QR khong hop le");
    }

    if (ticket.TrangThai !== "VALID") {
        throw new Error("Ve khong con hieu luc");
    }

    return ticket;
};

// Xac nhan khach hang da su dung ve
const useTicket = async (MaQRTicket) => {
    if (!MaQRTicket) {
        throw new Error("Ma QR khong duoc de trong");
    }

    // Chi cap nhat neu ve van VALID
    const ticket = await Ve.findOneAndUpdate(
        {
            MaQRTicket,
            TrangThai: "VALID"
        },
        {
            $set: {
                TrangThai: "USED",
                NgaySuDung: new Date()
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!ticket) {
        const existing = await Ve.findOne({ MaQRTicket });

        if (!existing) {
            throw new Error("Ve khong ton tai");
        }

        throw new Error(
            "Ve da duoc su dung, huy hoac khong con hieu luc"
        );
    }

    return ticket;
};

module.exports = {
    issueTickets,
    getTicketsByTransaction,
    getTicketById,
    getTicketsByCustomer,
    verifyTicket,
    useTicket
};
