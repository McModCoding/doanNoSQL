
const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.VaiTro)) {
            return res.status(403).json({
                success: false,
                message: "Ban khong co quyen thuc hien chuc nang nay"
            });
        }

        next();
    };
};

module.exports = { allowRoles };
