
const crypto = require("crypto");

const KhachHang = require("../models/KhachHang");
const SuatChieu = require("../models/SuatChieu");
const GiaoDich = require("../models/GiaoDich");
const SanPham = require("../models/SanPham");
const KhuyenMai = require("../models/KhuyenMai");
const mongoose = require("mongoose");

// Thoi gian giu ghe: 10 phut
const HOLD_MINUTES = 10;

// Chuyen gia tri Decimal128/Number/String thanh chuoi
const toDecimalString = (value) => {
    if (value === undefined || value === null) {
        throw new Error("Gia tri tien khong hop le");
    }

    return value.toString();
};

// Cong hai so thap phan, khong su dung Number de tranh sai lech tien
const addDecimalStrings = (value1, value2) => {
    const a = toDecimalString(value1);
    const b = toDecimalString(value2);

    const parseDecimal = (value) => {
        if (!/^-?\d+(\.\d+)?$/.test(value)) {
            throw new Error("Dinh dang tien khong hop le");
        }

        const negative = value.startsWith("-");
        const unsigned = negative ? value.slice(1) : value;
        const [integer, fraction = ""] = unsigned.split(".");

        return {
            negative,
            integer,
            fraction
        };
    };

    const x = parseDecimal(a);
    const y = parseDecimal(b);

    const scale = Math.max(x.fraction.length, y.fraction.length);

    const toBigInt = (item) => {
        const fraction = item.fraction.padEnd(scale, "0");
        const result = BigInt(item.integer + fraction);

        return item.negative ? -result : result;
    };

    const sum = toBigInt(x) + toBigInt(y);
    const negative = sum < 0n;
    const absolute = negative ? -sum : sum;

    let result = absolute.toString().padStart(scale + 1, "0");

    if (scale > 0) {
        result =
            result.slice(0, -scale) +
            "." +
            result.slice(-scale);
    }

    return (negative ? "-" : "") + result;
};

// Cong danh sach gia ve
const calculateTotal = (seats) => {
    return seats.reduce((total, seat) => {
        const seatPrice = addDecimalStrings(
            seat.GiaVeCoBan,
            seat.GiaPhuThu
        );

        return addDecimalStrings(total, seatPrice);
    }, "0");
};

const compareDecimalStrings = (left, right) => {
    const parse = (value) => {
        const string = toDecimalString(value);
        if (!/^\d+(\.\d+)?$/.test(string)) throw new Error("Gia tri tien khong hop le");
        const [integer, fraction = ""] = string.split(".");
        return { integer: integer.replace(/^0+(?=\d)/, ""), fraction };
    };
    const a = parse(left);
    const b = parse(right);
    const scale = Math.max(a.fraction.length, b.fraction.length);
    const aValue = BigInt(a.integer + a.fraction.padEnd(scale, "0"));
    const bValue = BigInt(b.integer + b.fraction.padEnd(scale, "0"));
    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
};

const minimumDecimalString = (left, right) =>
    compareDecimalStrings(left, right) <= 0 ? toDecimalString(left) : toDecimalString(right);

const decimalUnits = (value, scale) => {
    const string = toDecimalString(value);
    if (!/^\d+(\.\d+)?$/.test(string)) throw new Error("Gia tri tien khong hop le");
    const [integer, fraction = ""] = string.split(".");
    return BigInt(integer + fraction.padEnd(scale, "0"));
};

const decimalScale = (...values) => Math.max(...values.map((value) => {
    const string = toDecimalString(value);
    if (!/^\d+(\.\d+)?$/.test(string)) throw new Error("Gia tri tien khong hop le");
    return (string.split(".")[1] || "").length;
}));

const formatDecimalUnits = (units, scale) => {
    const factor = 10n ** BigInt(scale);
    const whole = (units / factor).toString();
    const remainder = (units % factor).toString().padStart(scale, "0").replace(/0+$/, "");
    return remainder ? `${whole}.${remainder}` : whole;
};

const allocatePromotionDiscount = ({ type, discount, ticketSubtotal, productSubtotal }) => {
    if (type === "GIA_VE") return { SoTienGiamVe: discount, SoTienGiamSanPham: "0" };
    if (type !== "GIAM_GIA") throw new Error("Loai khuyen mai khong ho tro phan bo giam gia");
    const scale = decimalScale(discount, ticketSubtotal, productSubtotal);
    const discountUnits = decimalUnits(discount, scale);
    const ticketUnits = decimalUnits(ticketSubtotal, scale);
    const productUnits = decimalUnits(productSubtotal, scale);
    const totalUnits = ticketUnits + productUnits;
    if (discountUnits > totalUnits) throw new Error("So tien giam vuot qua gia tri giao dich");
    if (totalUnits === 0n) return { SoTienGiamVe: "0", SoTienGiamSanPham: "0" };
    // Round the proportional ticket share to the nearest currency subunit;
    // assign the exact remainder to products so the allocation always sums to discount.
    const ticketDiscount = (discountUnits * ticketUnits + totalUnits / 2n) / totalUnits;
    return {
        SoTienGiamVe: formatDecimalUnits(ticketDiscount, scale),
        SoTienGiamSanPham: formatDecimalUnits(discountUnits - ticketDiscount, scale)
    };
};

const calculatePromotionDiscount = ({ promotion, customer, ticketSubtotal, transactionSubtotal, now = new Date() }) => {
    if (!promotion) throw new Error("Khuyen mai khong ton tai");
    if (promotion.TrangThai !== "ACTIVE") throw new Error("Khuyen mai khong hoat dong");
    if (!(new Date(promotion.NgayBatDau).getTime() <= now.getTime()) ||
        !(new Date(promotion.NgayKetThuc).getTime() >= now.getTime())) {
        throw new Error("Khuyen mai chua den thoi gian hieu luc hoac da het han");
    }
    if (!["GIAM_GIA", "GIA_VE", "TANG_DIEM"].includes(promotion.LoaiKM)) {
        throw new Error("Loai khuyen mai khong hop le");
    }
    if (promotion.LoaiKM === "TANG_DIEM") {
        throw new Error("Khuyen mai TANG_DIEM chua duoc ap dung trong giao dich");
    }
    if (promotion.DieuKienApDung !== undefined && promotion.DieuKienApDung !== null) {
        throw new Error("Khuyen mai co DieuKienApDung chua duoc ho tro");
    }
    if (promotion.HangApDung !== undefined && !Array.isArray(promotion.HangApDung)) {
        throw new Error("Cau hinh HangApDung khong hop le");
    }
    if (promotion.HangApDung?.length && !promotion.HangApDung.includes(customer?.MaHangHienTai)) {
        throw new Error("Hang thanh vien khong du dieu kien ap dung khuyen mai");
    }
    const value = toDecimalString(promotion.GiaTriKM);
    if (!/^\d+(\.\d+)?$/.test(value)) throw new Error("GiaTriKM khong hop le");
    const eligibleAmount = promotion.LoaiKM === "GIA_VE" ? ticketSubtotal : transactionSubtotal;
    return minimumDecimalString(value, eligibleAmount);
};

const calculateTransactionAmounts = ({ ticketSubtotal, productSubtotal, promotion = null, customer = null, now = new Date() }) => {
    const TamTinh = addDecimalStrings(ticketSubtotal, productSubtotal);
    const SoTienGiam = promotion ? calculatePromotionDiscount({
        promotion, customer, ticketSubtotal, transactionSubtotal: TamTinh, now
    }) : "0";
    const allocation = promotion
        ? allocatePromotionDiscount({ type: promotion.LoaiKM, discount: SoTienGiam, ticketSubtotal, productSubtotal })
        : { SoTienGiamVe: "0", SoTienGiamSanPham: "0" };
    const TongTien = addDecimalStrings(TamTinh, `-${SoTienGiam}`);
    if (compareDecimalStrings(TongTien, "0") < 0) throw new Error("TongTien khong duoc am");
    return { TamTinh, SoTienGiam, TongTien, ...allocation };
};

// Nhan tien decimal voi so nguyen bang BigInt, khong dua qua Number.
const multiplyDecimalStringByInteger = (value, multiplier) => {
    if (!Number.isSafeInteger(multiplier) || multiplier < 0) {
        throw new Error("So luong san pham khong hop le");
    }
    const source = toDecimalString(value);
    if (!/^-?\d+(\.\d+)?$/.test(source)) throw new Error("Dinh dang tien khong hop le");
    const negative = source.startsWith("-");
    const unsigned = negative ? source.slice(1) : source;
    const [integer, fraction = ""] = unsigned.split(".");
    const amount = BigInt(integer + fraction) * BigInt(multiplier);
    const digits = (negative ? -amount : amount).toString();
    const isNegative = digits.startsWith("-");
    const absolute = isNegative ? digits.slice(1) : digits;
    let result = absolute.padStart(fraction.length + 1, "0");
    if (fraction.length) result = `${result.slice(0, -fraction.length)}.${result.slice(-fraction.length)}`;
    return `${isNegative ? "-" : ""}${result}`;
};

const validateQuantity = (value) => Number.isSafeInteger(value) && value > 0;

// Resolves server-owned product snapshots and flattened component requirements.
const prepareProductOrder = async (items, getProduct) => {
    if (items === undefined) items = [];
    if (!Array.isArray(items)) throw new Error("DanhSachSanPham phai la mang");

    const quantities = new Map();
    for (const item of items) {
        if (!item || typeof item !== "object" || Array.isArray(item) ||
            Object.keys(item).some((key) => !["MaSP", "SoLuong"].includes(key))) {
            throw new Error("Moi san pham chi duoc gui MaSP va SoLuong");
        }
        if (typeof item.MaSP !== "string" || !item.MaSP.trim() || !validateQuantity(item.SoLuong)) {
            throw new Error("MaSP hoac SoLuong san pham khong hop le");
        }
        const MaSP = item.MaSP.trim();
        const total = (quantities.get(MaSP) || 0) + item.SoLuong;
        if (!Number.isSafeInteger(total)) throw new Error("Tong so luong san pham khong hop le");
        quantities.set(MaSP, total);
    }

    const cache = new Map();
    const loadActiveProduct = async (MaSP) => {
        if (!cache.has(MaSP)) cache.set(MaSP, await getProduct(MaSP));
        const product = cache.get(MaSP);
        if (!product) throw new Error(`San pham ${MaSP} khong ton tai`);
        if (product.TrangThai !== "ACTIVE") throw new Error(`San pham ${MaSP} khong hoat dong`);
        if (!["BAP", "NUOC", "SNACK", "COMBO"].includes(product.LoaiSP)) {
            throw new Error(`Loai san pham ${MaSP} khong hop le`);
        }
        if (!product.TenSP || product.GiaBan === undefined || product.GiaBan === null) {
            throw new Error(`Thong tin san pham ${MaSP} khong day du`);
        }
        if (toDecimalString(product.GiaBan).startsWith("-")) {
            throw new Error(`Gia san pham ${MaSP} khong hop le`);
        }
        return product;
    };

    const resolveLeaves = async (MaSP, quantity, path = new Set()) => {
        const product = await loadActiveProduct(MaSP);
        if (product.LoaiSP !== "COMBO") return [{ product, SoLuong: quantity }];
        if (path.has(MaSP)) throw new Error(`Thanh phan combo bi lap vong tai ${MaSP}`);
        if (!Array.isArray(product.ThanhPhan) || product.ThanhPhan.length === 0) {
            throw new Error(`Combo ${MaSP} chua co thanh phan hop le`);
        }
        const nextPath = new Set(path);
        nextPath.add(MaSP);
        const leaves = [];
        for (const component of product.ThanhPhan) {
            if (!component || typeof component.MaSP !== "string" || !component.MaSP.trim() ||
                !validateQuantity(component.SoLuong)) {
                throw new Error(`Thanh phan combo ${MaSP} khong hop le`);
            }
            const required = component.SoLuong * quantity;
            if (!Number.isSafeInteger(required)) throw new Error("So luong thanh phan combo khong hop le");
            leaves.push(...await resolveLeaves(component.MaSP.trim(), required, nextPath));
        }
        return leaves;
    };

    const lines = [];
    const stockRequirements = new Map();
    for (const [MaSP, SoLuong] of quantities) {
        const product = await loadActiveProduct(MaSP);
        const DonGia = toDecimalString(product.GiaBan);
        const ThanhTien = multiplyDecimalStringByInteger(DonGia, SoLuong);
        const components = product.LoaiSP === "COMBO"
            ? await resolveLeaves(MaSP, 1).then((leaves) => leaves.map(({ product: leaf, SoLuong: count }) => ({
                MaSP: leaf.MaSP,
                TenSP: leaf.TenSP,
                LoaiSP: leaf.LoaiSP,
                SoLuong: count
            })))
            : [];
        const stockLeaves = product.LoaiSP === "COMBO"
            ? await resolveLeaves(MaSP, SoLuong)
            : [{ product, SoLuong }];
        for (const leaf of stockLeaves) {
            const existing = stockRequirements.get(leaf.product.MaSP);
            const required = (existing?.SoLuong || 0) + leaf.SoLuong;
            if (!Number.isSafeInteger(required)) throw new Error("Tong so luong ton can thiet khong hop le");
            stockRequirements.set(leaf.product.MaSP, { product: leaf.product, SoLuong: required });
        }
        lines.push({
            MaSP: product.MaSP,
            TenSP: product.TenSP,
            LoaiSP: product.LoaiSP,
            SoLuong,
            DonGia,
            ThanhTien,
            ThanhPhan: components
        });
    }

    for (const { product, SoLuong } of stockRequirements.values()) {
        if (!Number.isSafeInteger(product.SoLuongTon) || product.SoLuongTon < 0) {
            throw new Error(`Ton kho san pham ${product.MaSP} khong hop le`);
        }
        if (product.SoLuongTon < SoLuong) throw new Error(`San pham ${product.MaSP} khong du ton kho`);
    }

    const subtotal = lines.reduce((sum, line) => addDecimalStrings(sum, line.ThanhTien), "0");
    return { lines, subtotal };
};

const getSanPham = async (MaSP) => SanPham.findOne({ MaSP }).lean();
const getKhuyenMai = async (MaKM) => KhuyenMai.findOne({ MaKM }).lean();

// Giai phong cac ghe do giao dich dang giu
const releaseHeldSeats = async (MaSuat, MaGD) => {
    await SuatChieu.updateOne(
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
                { "g.MaGDGiuCho": MaGD }
            ]
        }
    );
};

// Dat ve va giu ghe
const createBooking = async (data) => {
    const { MaKH, MaSuat, DanhSachGhe, DanhSachSanPham = [], MaKM = null } = data;

    // Kiem tra du lieu dau vao
    if (
        !MaKH ||
        !MaSuat ||
        !Array.isArray(DanhSachGhe) ||
        DanhSachGhe.length === 0
    ) {
        throw new Error("Vui long cung cap MaKH, MaSuat va danh sach ghe");
    }

    // Moi ma ghe chi duoc xuat hien mot lan
    if (
        DanhSachGhe.some(
            (MaGhe) => typeof MaGhe !== "string" || !MaGhe.trim()
        )
    ) {
        throw new Error("Ma ghe khong hop le");
    }

    const uniqueSeats = [...new Set(DanhSachGhe)];

    if (uniqueSeats.length !== DanhSachGhe.length) {
        throw new Error("Danh sach co ma ghe bi trung");
    }

    // Kiem tra khach hang
    const customer = await KhachHang.findOne({
        MaKH,
        TrangThai: "ACTIVE"
    });

    if (!customer) {
        throw new Error("Khach hang khong ton tai hoac khong hoat dong");
    }

    // Kiem tra suat chieu
    const showtime = await SuatChieu.findOne({
        MaSuat,
        TrangThai: "SCHEDULED"
    });

    if (!showtime) {
        throw new Error("Suat chieu khong ton tai hoac khong con hoat dong");
    }

    if (MaKM !== null && (typeof MaKM !== "string" || !MaKM.trim())) {
        throw new Error("MaKM khong hop le");
    }
    const promotion = MaKM ? await getKhuyenMai(MaKM.trim()) : null;
    if (MaKM) {
        // Validate prior to holding seats; discount amount is recalculated from server snapshots below.
        calculatePromotionDiscount({
            promotion,
            customer,
            ticketSubtotal: "0",
            transactionSubtotal: "0"
        });
    }

    // Kiem tra truoc khi giu ghe; recheck snapshot truoc khi tao giao dich.
    await prepareProductOrder(DanhSachSanPham, getSanPham);

    // Kiem tra cac ghe co ton tai trong suat chieu
    const selectedSeats = uniqueSeats.map((MaGhe) => {
        const seat = showtime.DanhSachGhe.find(
            (item) => item.MaGhe === MaGhe
        );

        if (!seat) {
            throw new Error(`Ghe ${MaGhe} khong ton tai trong suat chieu`);
        }

        return seat;
    });

    // Tao ma giao dich duy nhat
    const MaGD = `GD_${crypto.randomUUID()}`;

    const now = new Date();
    const holdUntil = new Date(
        now.getTime() + HOLD_MINUTES * 60 * 1000
    );

    const heldSeats = [];

    try {
        // Giu tung ghe bang thao tac cap nhat co dieu kien.
        // Moi thao tac tren mot document SuatChieu duoc MongoDB xu ly atomic.
        for (const MaGhe of uniqueSeats) {
            const result = await SuatChieu.updateOne(
                {
                    MaSuat,
                    TrangThai: "SCHEDULED",
                    DanhSachGhe: {
                        $elemMatch: {
                            MaGhe,
                            $or: [
                                { TrangThai: "AVAILABLE" },
                                {
                                    TrangThai: "HELD",
                                    ThoiGianGiuCho: { $lte: now }
                                }
                            ]
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
                    // Boc trong $and: Mongoose chi ep kieu dung $or/$and khi no dung dau
                    // bo loc. De "g.MaGhe" dung truoc $or thi Mongoose bien $or thanh
                    // document mac dinh, MongoDB bao "Error parsing array filter" va
                    // khong dat ve nao thanh cong.
                    arrayFilters: [
                        {
                            $and: [
                                { "g.MaGhe": MaGhe },
                                {
                                    $or: [
                                        { "g.TrangThai": "AVAILABLE" },
                                        {
                                            "g.TrangThai": "HELD",
                                            "g.ThoiGianGiuCho": { $lte: now }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            );

            if (result.modifiedCount !== 1) {
                throw new Error(
                    `Ghe ${MaGhe} da duoc giu hoac khong con kha dung`
                );
            }

            heldSeats.push(MaGhe);
        }

        // Tao chi tiet ve trong giao dich
        const ChiTietVe = selectedSeats.map((seat) => ({
            MaSuat,
            MaGhe: seat.MaGhe,
            LoaiGhe: seat.LoaiGhe,
            GiaVe: mongoose.Types.Decimal128.fromString(
                addDecimalStrings(
                    showtime.GiaVeCoBan,
                    seat.GiaPhuThu
                )
            )
        }));

        // Re-read product info immediately before persisting the order snapshot.
        const productOrder = await prepareProductOrder(DanhSachSanPham, getSanPham);

        // Tinh tien ve + san pham bang decimal string.
        const TongTienVe = calculateTotal(
            selectedSeats.map((seat) => ({
                GiaVeCoBan: showtime.GiaVeCoBan,
                GiaPhuThu: seat.GiaPhuThu
            }))
        );
        const currentPromotion = MaKM ? await getKhuyenMai(MaKM.trim()) : null;
        if (MaKM) calculatePromotionDiscount({
            promotion: currentPromotion,
            customer,
            ticketSubtotal: TongTienVe,
            transactionSubtotal: addDecimalStrings(TongTienVe, productOrder.subtotal)
        });
        const totals = calculateTransactionAmounts({
            ticketSubtotal: TongTienVe,
            productSubtotal: productOrder.subtotal,
            promotion: currentPromotion,
            customer
        });
        const { TamTinh, SoTienGiam, TongTien, SoTienGiamVe, SoTienGiamSanPham } = totals;
        const loaiGiaoDich = selectedSeats.length && productOrder.lines.length
            ? "HON_HOP"
            : productOrder.lines.length ? "MUA_COMBO" : "DAT_VE";

        // Tao giao dich cho thanh toan
        const transaction = await GiaoDich.create({
            MaGD,
            MaKH,
            LoaiGiaoDich: loaiGiaoDich,
            ChiTietVe,
            ChiTietCombo: productOrder.lines.map((line) => ({
                ...line,
                DonGia: mongoose.Types.Decimal128.fromString(line.DonGia),
                ThanhTien: mongoose.Types.Decimal128.fromString(line.ThanhTien)
            })),
            TamTinh: mongoose.Types.Decimal128.fromString(TamTinh),
            SoTienGiam: mongoose.Types.Decimal128.fromString(SoTienGiam),
            TongTien: mongoose.Types.Decimal128.fromString(TongTien),
            MaKM: currentPromotion ? currentPromotion.MaKM : null,
            SoTienGiamVe: mongoose.Types.Decimal128.fromString(SoTienGiamVe),
            SoTienGiamSanPham: mongoose.Types.Decimal128.fromString(SoTienGiamSanPham),
            DiemDuKien: 0,
            TrangThai: "PENDING_PAYMENT",
            NgayTao: now,
            NgayHoanTat: null
        });

        return {
            MaGD: transaction.MaGD,
            MaKH: transaction.MaKH,
            MaSuat,
            DanhSachGhe: uniqueSeats,
            ChiTietCombo: transaction.ChiTietCombo,
            MaKM: transaction.MaKM,
            TamTinh: transaction.TamTinh,
            SoTienGiam: transaction.SoTienGiam,
            SoTienGiamVe: transaction.SoTienGiamVe,
            SoTienGiamSanPham: transaction.SoTienGiamSanPham,
            TongTien: transaction.TongTien,
            TrangThai: transaction.TrangThai,
            ThoiGianGiuCho: holdUntil
        };

    } catch (error) {
        // Neu tao giao dich that bai, giai phong cac ghe da giu
        if (heldSeats.length > 0) {
            try {
                await releaseHeldSeats(MaSuat, MaGD);
            } catch (releaseError) {
                console.error(
                    "Khong the tu dong giai phong ghe:",
                    releaseError.message
                );
            }
        }

        throw error;
    }
};

module.exports = {
    createBooking,
    releaseHeldSeats,
    addDecimalStrings,
    multiplyDecimalStringByInteger,
    prepareProductOrder,
    compareDecimalStrings,
    calculatePromotionDiscount,
    allocatePromotionDiscount,
    calculateTransactionAmounts
};
