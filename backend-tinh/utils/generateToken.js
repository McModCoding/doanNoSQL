
const jwt = require("jsonwebtoken");

const generateToken = (customer) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET chua duoc cau hinh trong .env");
    }

    return jwt.sign(
        {
            MaKH: customer.MaKH,
            Email: customer.Email,
            VaiTro: customer.VaiTro || "KHACHHANG"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        }
    );
};

module.exports = generateToken;
