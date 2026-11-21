const tonKhoService = require("../services/tonKhoService");

const getReconciliation = async (req, res) => {
    try {
        const result = await tonKhoService.listReconciliation(req.query || {});
        return res.status(200).json({
            success: true,
            message: "Lay danh sach tru kho can doi soat thanh cong",
            data: result.items,
            pagination: result.pagination
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : "Khong the lay danh sach tru kho can doi soat"
        });
    }
};

module.exports = { getReconciliation };
