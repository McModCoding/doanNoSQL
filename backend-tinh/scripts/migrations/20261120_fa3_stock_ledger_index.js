const databaseName = "CinemaLoyaltyDB";
const collectionName = "lich_su_ton_kho";
const key = { MaGD: 1 };
const options = { unique: true, name: "uq_lich_su_ton_kho_magd" };

const sameKey = (index) => index?.key?.MaGD === 1 && Object.keys(index.key).length === 1;

const runMigration = async () => {
    require("dotenv").config();
    const mongoose = require("mongoose");
    if (process.env.FA3_STOCK_INDEX_APPROVED !== "YES") {
        throw new Error("Set FA3_STOCK_INDEX_APPROVED=YES only after backup and explicit migration approval");
    }
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");

    await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, serverSelectionTimeoutMS: 5000 });
    try {
        if (mongoose.connection.name !== databaseName) throw new Error(`Connected database is not ${databaseName}`);
        const db = mongoose.connection.db;
        const collection = db.collection(collectionName);
        const existingCollections = await db.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
        const exists = existingCollections.length > 0;
        if (!exists) await db.createCollection(collectionName);

        const indexes = await collection.indexes();
        const existing = indexes.find(sameKey);
        if (existing) {
            if (existing.unique !== true || existing.sparse === true || existing.partialFilterExpression) {
                throw new Error(`Existing index ${existing.name} is incompatible; no index was changed`);
            }
            console.log(`Verified compatible index ${existing.name}; no index created`);
            return;
        }

        const duplicates = await collection.aggregate([
            { $group: { _id: "$MaGD", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $limit: 1 }
        ]).toArray();
        if (duplicates.length) throw new Error("Duplicate MaGD values exist; no index created");
        const name = await collection.createIndex(key, options);
        console.log(`Created ${name} on ${databaseName}.${collectionName}`);
    } finally {
        await mongoose.disconnect();
    }
};

if (require.main === module) {
    runMigration().catch((error) => {
        console.error(`FA3 migration stopped: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { sameKey, runMigration };
