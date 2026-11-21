const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const express = require("express");
const mongoose = require("mongoose");

test("importing server only creates the Express app; it does not connect, schedule, or listen", () => {
    const serverPath = require.resolve("../server");
    delete require.cache[serverPath];
    const originalConnect = mongoose.connect;
    const originalListen = express.application.listen;
    const originalLoad = Module._load;
    let connections = 0;
    let listens = 0;
    let schedulerImports = 0;
    mongoose.connect = async () => { connections += 1; };
    express.application.listen = function () { listens += 1; throw new Error("unexpected listen"); };
    Module._load = function (request, parent, isMain) {
        if (request.includes("Scheduler")) schedulerImports += 1;
        return originalLoad.call(this, request, parent, isMain);
    };

    try {
        const app = require("../server");
        assert.equal(typeof app, "function");
        assert.equal(connections, 0);
        assert.equal(schedulerImports, 0);
        assert.equal(listens, 0);
        assert.equal(mongoose.connection.readyState, 0);
    } finally {
        mongoose.connect = originalConnect;
        express.application.listen = originalListen;
        Module._load = originalLoad;
        delete require.cache[serverPath];
    }
});

test("runtime startup connects first, then starts schedulers and opens HTTP", async () => {
    const { startServer } = require("../index");
    const sequence = [];
    const app = {};
    const server = { marker: "listener" };
    const result = await startServer({
        connectDatabase: async () => { sequence.push("database"); },
        startSchedulers: [
            () => sequence.push("expiry-scheduler"),
            () => sequence.push("loyalty-scheduler")
        ],
        httpApp: app,
        port: 5151,
        listen: (actualApp, port, callback) => {
            sequence.push("listen");
            assert.equal(actualApp, app);
            assert.equal(port, 5151);
            callback();
            return server;
        },
        log: (message) => sequence.push(message)
    });
    assert.equal(result, server);
    assert.deepEqual(sequence, [
        "database", "expiry-scheduler", "loyalty-scheduler", "listen",
        "Server running at http://localhost:5151"
    ]);
});

test("failed database startup does not start schedulers or listen", async () => {
    const { startServer } = require("../index");
    let schedulerStarts = 0;
    let listens = 0;
    await assert.rejects(startServer({
        connectDatabase: async () => { throw new Error("connection failed"); },
        startSchedulers: [() => { schedulerStarts += 1; }],
        listen: () => { listens += 1; }
    }), /connection failed/);
    assert.equal(schedulerStarts, 0);
    assert.equal(listens, 0);
});
