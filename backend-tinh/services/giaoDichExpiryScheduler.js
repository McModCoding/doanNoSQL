const giaoDichService = require("./giaoDichService");

const EXPIRY_INTERVAL_MS = 60 * 1000;

let timer = null;
let runInProgress = false;

const runExpiry = async () => {
    if (runInProgress) return;

    runInProgress = true;

    try {
        const result = await giaoDichService.expirePendingTransactions();

        if (
            result.cancelledCount > 0 ||
            result.releasedSeatCount > 0 ||
            result.deferredPaymentCount > 0 ||
            result.failedCount > 0
        ) {
            console.log("Giao dich het han:", result);
        }
    } catch (error) {
        console.error("Khong the chay tac vu het han giao dich:", error.message);
    } finally {
        runInProgress = false;
    }
};

const startGiaoDichExpiryScheduler = () => {
    // Idempotent trong mot Node process; server chi goi sau khi DB ket noi.
    if (timer) return;

    void runExpiry();
    timer = setInterval(runExpiry, EXPIRY_INTERVAL_MS);
    timer.unref?.();
};

module.exports = { startGiaoDichExpiryScheduler };
