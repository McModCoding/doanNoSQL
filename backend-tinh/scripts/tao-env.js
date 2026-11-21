// Tạo file .env từ .env.example nếu chưa có, kèm JWT_SECRET ngẫu nhiên cho riêng máy này.
// Dùng: npm run tao-env   (CHAY-BACKEND-TINH.bat tự gọi)
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const thuMuc = path.join(__dirname, "..");
const fileEnv = path.join(thuMuc, ".env");
const fileMau = path.join(thuMuc, ".env.example");

if (fs.existsSync(fileEnv)) {
    console.log("[tao-env] Đã có file .env, giữ nguyên.");
    process.exit(0);
}

const mau = fs.readFileSync(fileMau, "utf8");
const biMat = crypto.randomBytes(32).toString("hex");
const noiDung = mau.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${biMat}`);
if (noiDung === mau) {
    console.error("[tao-env] .env.example không có dòng JWT_SECRET=, không tạo được .env");
    process.exit(1);
}
fs.writeFileSync(fileEnv, noiDung);
console.log("[tao-env] Đã tạo file .env từ .env.example, JWT_SECRET ngẫu nhiên.");
