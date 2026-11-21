// Tạo CSDL cho backend của Tính bằng database/setup_all.js, chạy qua mongosh (MongoDB Shell).
// Dùng:
//   npm run tao-csdl                  tạo CSDL nếu CSDL đang trống, có dữ liệu thì dừng
//   npm run tao-csdl -- --neu-trong   như trên nhưng CSDL đã có dữ liệu thì bỏ qua, không báo lỗi
//                                     (CHAY-BACKEND-TINH.bat dùng cách này)
//   npm run tao-csdl -- --lam-lai     XÓA CSDL trong MONGODB_URI rồi tạo lại từ đầu
//                                     (TAO-CSDL-TINH.bat dùng cách này)
// Tên CSDL lấy từ MONGODB_URI trong .env (mặc định CinemaLoyaltyDB_Tinh) và truyền cho
// setup_all.js qua biến môi trường TEN_CSDL. Không bao giờ tạo hay xóa CSDL demo CinemaLoyaltyDB.
require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");

const URI_MAC_DINH = "mongodb://127.0.0.1:27017/CinemaLoyaltyDB_Tinh";
const CSDL_CAM = ["CinemaLoyaltyDB", "admin", "local", "config"];
const FILE_SETUP = path.join(__dirname, "..", "database", "setup_all.js");

const thamSo = new Set(process.argv.slice(2));
const neuTrong = thamSo.has("--neu-trong");
const lamLai = thamSo.has("--lam-lai");

const dung = (thongBao, ma = 1) => {
    console.error(`[tao-csdl] ${thongBao}`);
    process.exit(ma);
};

const uri = process.env.MONGODB_URI || URI_MAC_DINH;
const khop = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/.exec(uri);
const tenCsdl = khop ? decodeURIComponent(khop[1]) : "";
if (!tenCsdl) {
    dung("MONGODB_URI trong .env phải có tên CSDL, ví dụ mongodb://127.0.0.1:27017/CinemaLoyaltyDB_Tinh");
}

// Tìm mongosh: biến MONGOSH, thư mục cài mặc định trên Windows, rồi tới PATH.
const timMongosh = () => {
    const ungVien = [];
    if (process.env.MONGOSH) ungVien.push(process.env.MONGOSH);
    if (process.platform === "win32") {
        const pf = process.env.ProgramFiles || "C:\\Program Files";
        ungVien.push(path.join(pf, "mongosh", "mongosh.exe"), path.join(pf, "mongosh", "bin", "mongosh.exe"));
        if (process.env.LOCALAPPDATA) {
            ungVien.push(path.join(process.env.LOCALAPPDATA, "Programs", "mongosh", "mongosh.exe"));
        }
        for (const goc of [path.join(pf, "MongoDB"), path.join(pf, "MongoDB", "Server")]) {
            if (!fs.existsSync(goc)) continue;
            const con = fs.readdirSync(goc).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
            for (const c of con) ungVien.push(path.join(goc, c, "bin", "mongosh.exe"));
        }
    }
    const coSan = ungVien.find((p) => fs.existsSync(p));
    if (coSan) return coSan;
    const thu = spawnSync("mongosh", ["--version"], { stdio: "ignore" });
    return thu.status === 0 ? "mongosh" : null;
};

const HUONG_DAN_KHONG_CO_MONGOSH = [
    "Không tìm thấy mongosh (MongoDB Shell). Chọn một trong hai cách:",
    "  1. Cài MongoDB Shell: https://www.mongodb.com/try/download/shell rồi chạy lại.",
    "     Cài vào chỗ khác thì đặt biến MONGOSH trỏ tới file mongosh.exe.",
    "  2. Mở Studio 3T, kết nối localhost:27017, mở IntelliShell, dán toàn bộ",
    "     backend-tinh/database/setup_all.js rồi bấm chạy. Script tạo CSDL CinemaLoyaltyDB_Tinh.",
].join("\n");

const main = async () => {
    if (CSDL_CAM.includes(tenCsdl)) {
        dung(`Không tạo hay xóa CSDL ${tenCsdl} bằng script này: đó là CSDL demo của backend chính hoặc CSDL hệ thống. Đổi MONGODB_URI trong backend-tinh/.env sang CSDL riêng, ví dụ ${URI_MAC_DINH}.`);
    }

    try {
        await mongoose.connect(uri, { autoIndex: false, serverSelectionTimeoutMS: 5000 });
    } catch (loi) {
        dung(`Không kết nối được MongoDB (${loi.message}). Hãy bật MongoDB Community Server rồi chạy lại.`);
    }

    let mongosh;
    try {
        const db = mongoose.connection.db;
        const soCollection = (await db.listCollections({}, { nameOnly: true }).toArray()).length;

        if (soCollection > 0 && !lamLai) {
            if (neuTrong) {
                console.log(`[tao-csdl] CSDL ${tenCsdl} đã có ${soCollection} collection, bỏ qua bước tạo. Muốn tạo lại từ đầu: chạy TAO-CSDL-TINH.bat.`);
                return;
            }
            dung(`CSDL ${tenCsdl} đã có ${soCollection} collection. setup_all.js chỉ chạy trên CSDL trống. Muốn tạo lại từ đầu: npm run tao-csdl -- --lam-lai (hoặc TAO-CSDL-TINH.bat).`);
        }

        // Tìm mongosh trước khi xóa gì, để máy thiếu mongosh không bị mất CSDL cũ.
        mongosh = timMongosh();
        if (!mongosh) dung(HUONG_DAN_KHONG_CO_MONGOSH, 2);

        if (soCollection > 0) {
            await db.dropDatabase();
            console.log(`[tao-csdl] Đã xóa CSDL ${tenCsdl} cũ (${soCollection} collection).`);
        }
    } finally {
        await mongoose.disconnect();
    }

    console.log(`[tao-csdl] Chạy database/setup_all.js trên CSDL ${tenCsdl} bằng ${mongosh}`);
    const ketQua = spawnSync(mongosh, [uri, "--quiet", "--file", FILE_SETUP], {
        stdio: "inherit",
        env: { ...process.env, TEN_CSDL: tenCsdl },
    });
    if (ketQua.error) dung(`Không chạy được mongosh: ${ketQua.error.message}`);
    if (ketQua.status !== 0) {
        dung("setup_all.js báo lỗi ở trên. Nếu lỗi xảy ra giữa chừng, chạy TAO-CSDL-TINH.bat để xóa và tạo lại từ đầu.");
    }

    console.log("");
    console.log(`[tao-csdl] Xong: CSDL ${tenCsdl} có 17 collection, validator, index và dữ liệu mẫu.`);
    console.log("[tao-csdl] Tài khoản thử: admin@cinemaloyalty.test / AdminDemo!2026 (ADMIN),");
    console.log("[tao-csdl]                member1@cinemaloyalty.test / MemberDemo!2026 (khách hàng).");
};

main().catch((loi) => dung(loi.message));
