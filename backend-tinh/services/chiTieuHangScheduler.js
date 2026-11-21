const chiTieuHangService = require("./chiTieuHangService");

const INTERVAL_MS = 60 * 1000;
let timer = null;
let running = false;

const runRecovery = async () => {
    if (running) return;
    running = true;
    try {
        const result = await chiTieuHangService.recoverPendingSpendEvents(25);
        if (result.scanned || result.failed || result.refundReviews) console.log("Phuc hoi chi tieu/xet hang:", result);
    } catch (error) {
        console.error("Khong the chay phuc hoi chi tieu/xet hang:", error.message);
    } finally {
        running = false;
    }
};

const startChiTieuHangScheduler = () => {
    if (timer) return;
    void runRecovery();
    timer = setInterval(runRecovery, INTERVAL_MS);
    timer.unref?.();
};

module.exports = { startChiTieuHangScheduler };
