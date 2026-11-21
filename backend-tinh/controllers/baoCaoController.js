const baoCaoService = require("../services/baoCaoService");

const report = (method, successMessage) => async (req, res) => {
    try {
        const result = await baoCaoService[method](req.query || {});
        return res.status(200).json({ success: true, message: successMessage, data: result });
    } catch (error) {
        const status = error.statusCode || 500;
        if (status >= 500) console.error("Bao cao error:", error.message);
        return res.status(status).json({
            success: false,
            message: status >= 500 ? "Khong the tao bao cao" : error.message
        });
    }
};

module.exports = {
    getRevenueReport: report("getRevenueReport", "Lay bao cao doanh thu thanh cong"),
    getFilmReport: report("getFilmReport", "Lay bao cao phim thanh cong"),
    getTicketReport: report("getTicketReport", "Lay bao cao ve thanh cong"),
    getProductReport: report("getProductReport", "Lay bao cao san pham thanh cong"),
    getCustomerReport: report("getCustomerReport", "Lay bao cao khach hang thanh cong")
};
