const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const KhachHang = require("../models/KhachHang");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const originals = new Map();
const replace = (target, key, value) => {
    const alreadySaved = [...originals.values()].some(([savedTarget, savedKey]) => savedTarget === target && savedKey === key);
    if (!alreadySaved) originals.set(Symbol(), [target, key, target[key]]);
    target[key] = value;
};
const restore = () => {
    for (const [target, key, original] of originals.values()) target[key] = original;
    originals.clear();
};

const request = () => ({ headers: { authorization: "Bearer test-token" } });
const response = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
});
const accountQuery = (account) => ({
    select(fields) { this.fields = fields; return this; },
    async lean() { return account; }
});

test.afterEach(restore);

test("valid JWT uses current ACTIVE account and database role", async () => {
    replace(jwt, "verify", () => ({ MaKH: "KH1", VaiTro: "KHACHHANG" }));
    replace(KhachHang, "findOne", (query) => {
        assert.deepEqual(query, { MaKH: "KH1", TrangThai: "ACTIVE" });
        return accountQuery({ MaKH: "KH1", VaiTro: "ADMIN", TrangThai: "ACTIVE" });
    });
    const req = request();
    const res = response();
    let nextCalls = 0;

    await protect(req, res, () => { nextCalls += 1; });

    assert.equal(nextCalls, 1);
    assert.deepEqual(req.user, { MaKH: "KH1", VaiTro: "ADMIN" });
    assert.equal(res.statusCode, 200);
});

test("expired and bad-signature JWTs are rejected by jsonwebtoken", async () => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "unit-test-secret-only";
    try {
        for (const token of [
            jwt.sign({ MaKH: "KH1" }, process.env.JWT_SECRET, { expiresIn: -1 }),
            jwt.sign({ MaKH: "KH1" }, "different-test-secret")
        ]) {
            const res = response();
            await protect({ headers: { authorization: `Bearer ${token}` } }, res, () => assert.fail("next must not run"));
            assert.equal(res.statusCode, 401);
            assert.equal(JSON.stringify(res.body).includes("secret"), false);
        }
    } finally {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    }
});

test("missing account and inactive account tokens are rejected", async () => {
    replace(jwt, "verify", () => ({ MaKH: "KH1", VaiTro: "ADMIN" }));
    replace(KhachHang, "findOne", () => accountQuery(null));
    const res = response();
    await protect(request(), res, () => assert.fail("next must not run"));
    assert.equal(res.statusCode, 401);

    replace(KhachHang, "findOne", () => accountQuery({ MaKH: "KH1", VaiTro: "ADMIN", TrangThai: "BLOCKED" }));
    const blocked = response();
    await protect(request(), blocked, () => assert.fail("next must not run"));
    assert.equal(blocked.statusCode, 401);
});

test("a downgraded ADMIN token receives the current customer role", async () => {
    replace(jwt, "verify", () => ({ MaKH: "KH1", VaiTro: "ADMIN" }));
    replace(KhachHang, "findOne", () => accountQuery({ MaKH: "KH1", VaiTro: "KHACHHANG", TrangThai: "ACTIVE" }));
    const req = request();
    await protect(req, response(), () => {});
    const res = response();
    allowRoles("ADMIN")(req, res, () => assert.fail("customer role must not pass"));
    assert.equal(res.statusCode, 403);
});

test("current ADMIN passes ADMIN authorization and invalid role is rejected", async () => {
    replace(jwt, "verify", () => ({ MaKH: "KH1" }));
    replace(KhachHang, "findOne", () => accountQuery({ MaKH: "KH1", VaiTro: "ADMIN", TrangThai: "ACTIVE" }));
    const req = request();
    await protect(req, response(), () => {});
    let nextCalls = 0;
    allowRoles("ADMIN")(req, response(), () => { nextCalls += 1; });
    assert.equal(nextCalls, 1);

    replace(KhachHang, "findOne", () => accountQuery({ MaKH: "KH1", VaiTro: "SUPERADMIN", TrangThai: "ACTIVE" }));
    const invalid = response();
    await protect(request(), invalid, () => assert.fail("invalid role must not pass"));
    assert.equal(invalid.statusCode, 401);
});

test("database verification failure denies access without exposing internals", async () => {
    replace(jwt, "verify", () => ({ MaKH: "KH1" }));
    replace(KhachHang, "findOne", () => ({
        select() { return this; },
        async lean() { throw new Error("private connection details"); }
    }));
    const res = response();
    await protect(request(), res, () => assert.fail("next must not run"));
    assert.equal(res.statusCode, 503);
    assert.equal(JSON.stringify(res.body).includes("private connection details"), false);
});
