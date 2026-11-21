
const jwt = require("jsonwebtoken");
const KhachHang = require("../models/KhachHang");

const unauthorized = (res) => res.status(401).json({
    success: false,
    message: "Token khong hop le hoac tai khoan khong duoc phep truy cap"
});

const protect = async (req, res, next) => {
    let decoded;
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Vui long dang nhap de tiep tuc"
            });
        }

        const token = authHeader.split(" ")[1];
        if (!token || authHeader.split(" ").length !== 2) return unauthorized(res);
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
        return unauthorized(res);
    }

    if (!decoded || typeof decoded.MaKH !== "string" || !decoded.MaKH.trim()) {
        return unauthorized(res);
    }

    let account;
    try {
        account = await KhachHang.findOne({
            MaKH: decoded.MaKH,
            TrangThai: "ACTIVE"
        }).select("MaKH VaiTro TrangThai -_id").lean();
    } catch (_) {
        return res.status(503).json({
            success: false,
            message: "Khong the xac minh tai khoan luc nay"
        });
    }

    if (
        !account ||
        typeof account.MaKH !== "string" ||
        account.TrangThai !== "ACTIVE" ||
        !["KHACHHANG", "ADMIN"].includes(account.VaiTro)
    ) return unauthorized(res);

    // MaKH and role come from the active account, not potentially stale JWT claims.
    req.user = { MaKH: account.MaKH, VaiTro: account.VaiTro };
    return next();
};

module.exports = {
    protect
};
