
const authService = require("../services/authService");

// Dang ky
const register = async (req, res) => {
    try {
        const {
            HoTen,
            SDT,
            Email,
            MatKhau,
            NgaySinh,
            GioiTinh
        } = req.body;

        if (!HoTen || !SDT || !Email || !MatKhau) {
            return res.status(400).json({
                success: false,
                message: "Vui long nhap day du HoTen, SDT, Email va MatKhau"
            });
        }

        if (MatKhau.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Mat khau phai co it nhat 8 ky tu"
            });
        }

        const result = await authService.register({
            HoTen,
            SDT,
            Email,
            MatKhau,
            NgaySinh,
            GioiTinh
        });

        return res.status(201).json({
            success: true,
            message: "Dang ky tai khoan thanh cong",
            data: result
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email, SDT hoac ma thanh vien da ton tai"
            });
        }

        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

// Dang nhap
const login = async (req, res) => {
    try {
        const { identifier, MatKhau } = req.body;

        if (!identifier || !MatKhau) {
            return res.status(400).json({
                success: false,
                message: "Vui long nhap Email/SDT va MatKhau"
            });
        }

        const result = await authService.login(
            identifier,
            MatKhau
        );

        return res.status(200).json({
            success: true,
            message: "Dang nhap thanh cong",
            data: result
        });

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// Lay thong tin nguoi dung hien tai
const getMe = async (req, res) => {
    try {
        const customer = await authService.getMe(req.user.MaKH);

        return res.status(200).json({
            success: true,
            data: customer
        });

    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

// Doi mat khau
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Vui long nhap mat khau cu va mat khau moi"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Mat khau moi phai co it nhat 8 ky tu"
            });
        }

        const result = await authService.changePassword(
            req.user.MaKH,
            oldPassword,
            newPassword
        );

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Dang xuat (JWT stateless: Client xoa token)
const logout = (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Dang xuat thanh cong. Vui long xoa token tai Client."
    });
};

module.exports = {
    register,
    login,
    getMe,
    changePassword,
    logout
};
