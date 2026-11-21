require("dotenv").config();
const mongoose = require("mongoose");

const requiredDbName = "CinemaLoyaltyDB";
const requiredCollections = ["khach_hang", "hang_thanh_vien", "lich_su_hang", "giao_dich", "thanh_toan"];

const hasKey = (index, key) => JSON.stringify(index.key) === JSON.stringify(key);

const preflightIndex = async (collection, key, uniqueRequired) => {
    const indexes = await collection.indexes();
    const sameKey = indexes.find((index) => hasKey(index, key));
    if (sameKey && uniqueRequired && (sameKey.unique !== true || sameKey.sparse === true || sameKey.partialFilterExpression)) {
        throw new Error(`Index ${sameKey.name} exists without required uniqueness`);
    }
    if (sameKey) return;
    if (uniqueRequired) {
        const duplicate = await collection.aggregate([
            { $group: { _id: `$${Object.keys(key)[0]}`, count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $limit: 1 }
        ]).toArray();
        if (duplicate.length) throw new Error(`Duplicate values exist for ${Object.keys(key)[0]}; migration made no changes`);
    }
};

const ensureIndex = async (collection, key, options) => {
    const indexes = await collection.indexes();
    const sameKey = indexes.find((index) => hasKey(index, key));
    if (sameKey) {
        if (options.unique && (sameKey.unique !== true || sameKey.sparse === true || sameKey.partialFilterExpression)) {
            throw new Error(`Index ${sameKey.name} exists without required uniqueness`);
        }
        return `verified:${sameKey.name}`;
    }

    if (options.unique) {
        const duplicate = await collection.aggregate([
            { $group: { _id: `$${Object.keys(key)[0]}`, count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $limit: 1 }
        ]).toArray();
        if (duplicate.length) {
            throw new Error(`Duplicate values exist for ${Object.keys(key)[0]}; no index created`);
        }
    }

    return `created:${await collection.createIndex(key, options)}`;
};

(async () => {
    if (process.env.E4_2_MIGRATION_APPROVED !== "YES") {
        throw new Error("Set E4_2_MIGRATION_APPROVED=YES only after backup and explicit migration approval");
    }
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
    await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, serverSelectionTimeoutMS: 5000 });
    if (mongoose.connection.name !== requiredDbName) throw new Error("Connected database is not CinemaLoyaltyDB");

    const db = mongoose.connection.db;
    const names = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name));
    const missing = requiredCollections.filter((name) => !names.has(name));
    if (missing.length) throw new Error(`Required existing collections missing: ${missing.join(", ")}`);

    // Complete all checks against existing data/indexes before any DDL operation.
    await preflightIndex(db.collection("lich_su_hang"), { MaLichSu: 1 }, true);
    if (names.has("ghi_nhan_chi_tieu")) {
        await preflightIndex(db.collection("ghi_nhan_chi_tieu"), { IdempotencyKey: 1 }, true);
        await preflightIndex(db.collection("ghi_nhan_chi_tieu"), { MaKH: 1, NamChiTieu: 1, TrangThai: 1 }, false);
        await preflightIndex(db.collection("ghi_nhan_chi_tieu"), { TrangThai: 1, DaXacMinh: 1, CanDoiSoatRefund: 1, RefundCheckedAt: 1, NgayTao: 1 }, false);
    }

    if (!names.has("ghi_nhan_chi_tieu")) {
        await db.createCollection("ghi_nhan_chi_tieu");
    }

    const outcomes = [];
    outcomes.push(await ensureIndex(db.collection("ghi_nhan_chi_tieu"), { IdempotencyKey: 1 }, {
        unique: true, name: "uq_chi_tieu_idempotency"
    }));
    outcomes.push(await ensureIndex(db.collection("ghi_nhan_chi_tieu"), { MaKH: 1, NamChiTieu: 1, TrangThai: 1 }, {
        name: "ix_chi_tieu_customer_year_status"
    }));
    outcomes.push(await ensureIndex(db.collection("ghi_nhan_chi_tieu"), { TrangThai: 1, DaXacMinh: 1, CanDoiSoatRefund: 1, RefundCheckedAt: 1, NgayTao: 1 }, {
        name: "ix_chi_tieu_recovery_scan"
    }));
    outcomes.push(await ensureIndex(db.collection("lich_su_hang"), { MaLichSu: 1 }, {
        unique: true, name: "uq_lich_su_hang_ma_lich_su"
    }));
    console.log(JSON.stringify({ database: mongoose.connection.name, outcomes }));
})().catch((error) => {
    console.error(`E4.2 migration stopped safely: ${error.message}`);
    process.exitCode = 1;
}).finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
});
