const app = require("./server");
const connectDB = require("./config/database");
const { startGiaoDichExpiryScheduler } = require("./services/giaoDichExpiryScheduler");
const { startChiTieuHangScheduler } = require("./services/chiTieuHangScheduler");

const startServer = async ({
    connectDatabase = connectDB,
    startSchedulers = [startGiaoDichExpiryScheduler, startChiTieuHangScheduler],
    httpApp = app,
    port = process.env.PORT || 5000,
    listen = (targetApp, targetPort, callback) => targetApp.listen(targetPort, callback),
    log = console.log
} = {}) => {
    await connectDatabase();
    for (const startScheduler of startSchedulers) startScheduler();
    return listen(httpApp, port, () => log(`Server running at http://localhost:${port}`));
};

const runServer = () => {
    require("dotenv").config();
    return startServer().catch((error) => {
        console.error("Server startup failed:", error.message);
        process.exitCode = 1;
    });
};

module.exports = { app, startServer, runServer };

if (require.main === module) runServer();
