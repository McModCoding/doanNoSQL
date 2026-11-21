const requiredDbName = "CinemaLoyaltyDB";
const collectionName = "bien_dong_diem";
const indexKey = { IdempotencyKey: 1 };
const indexOptions = {
    unique: true,
    name: "uq_bien_dong_diem_idempotency"
};

const hasSameKey = (index) =>
    index?.key?.IdempotencyKey === 1 && Object.keys(index.key).length === 1;

const assertCompatible = (index) => {
    if (index && (
        index.unique !== true ||
        index.sparse === true ||
        index.partialFilterExpression
    )) {
        throw new Error(`Existing index ${index.name} is incompatible; no index was changed`);
    }
};

const runMigration = async () => {
    require("dotenv").config();
    const mongoose = require("mongoose");

    if (process.env.FA2_LOYALTY_INDEX_APPROVED !== "YES") {
        throw new Error("Set FA2_LOYALTY_INDEX_APPROVED=YES only after backup and explicit migration approval");
    }
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");

    await mongoose.connect(process.env.MONGODB_URI, {
        autoIndex: false,
        serverSelectionTimeoutMS: 5000
    });

    try {
        if (mongoose.connection.name !== requiredDbName) {
            throw new Error(`Connected database is not ${requiredDbName}`);
        }

        const db = mongoose.connection.db;
        const exists = await db.listCollections(
            { name: collectionName },
            { nameOnly: true }
        ).hasNext();
        if (!exists) throw new Error(`Required collection ${collectionName} does not exist; migration made no changes`);

        const collection = db.collection(collectionName);
        const indexes = await collection.indexes();
        const existing = indexes.find(hasSameKey);
        assertCompatible(existing);
        if (existing) {
            console.log(`Verified compatible index ${existing.name}; no index created`);
            return;
        }

        const missingKeys = await collection.countDocuments({
            $or: [
                { IdempotencyKey: { $exists: false } },
                { IdempotencyKey: null },
                { IdempotencyKey: "" }
            ]
        });
        if (missingKeys > 0) {
            throw new Error(`${missingKeys} documents have missing/empty IdempotencyKey; resolve before migration`);
        }

        const duplicates = await collection.aggregate([
            { $group: { _id: "$IdempotencyKey", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $limit: 1 }
        ]).toArray();
        if (duplicates.length) throw new Error("Duplicate IdempotencyKey values exist; migration made no changes");

        const name = await collection.createIndex(indexKey, indexOptions);
        console.log(`Created index ${name} on ${requiredDbName}.${collectionName}`);
    } finally {
        await mongoose.disconnect();
    }
};

if (require.main === module) {
    runMigration().catch((error) => {
        console.error(`FA2 migration stopped: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { hasSameKey, assertCompatible, runMigration };
