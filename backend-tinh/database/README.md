# CinemaLoyalty database scripts

> **Ghi chú khi gộp vào repo nhóm (21/11/2026).** Tên CSDL đổi từ `CinemaLoyaltyDB` sang `CinemaLoyaltyDB_Tinh`, khai báo một chỗ ở đầu `setup_all.js` (biến `TEN_CSDL_DICH`; chạy bằng mongosh thì đổi được qua biến môi trường `TEN_CSDL`). Lý do: `CinemaLoyaltyDB` là CSDL demo của backend chính (`backend/`) và bản sao lưu chuẩn, có cấu trúc document khác. Hai bên dùng chung một CSDL sẽ đè nhau. Ba file trong `scripts/migrations/` vẫn kiểm tra tên `CinemaLoyaltyDB` vì chỉ dùng để nâng cấp CSDL cũ trên máy Tính; CSDL tạo mới bằng `setup_all.js` đã có sẵn các index đó. Cách chạy nhanh: xem `backend-tinh/README.md`.

These Studio 3T IntelliShell scripts target the database named in `TEN_CSDL_DICH` at the top of `setup_all.js`: **`CinemaLoyaltyDB_Tinh`** by default in the team repository (see the note below). The scripts do not connect by themselves; before running any write script, manually confirm that IntelliShell is connected to the intended non-production server and that this database is the new database being prepared. The fixed database name cannot distinguish a development server from a production server.

## Safety and execution order

Run the six JavaScript files in this order:

1. `01_create_collections.js` — create any of the 17 model collections that are absent. It does not drop or clear collections.
2. `02_create_validators.js` — install strict/error JSON Schema validators. This step requires all 17 collections to exist and be empty; it refuses to replace a different existing validator.
3. `03_create_indexes.js` — preflight required unique values and active-seat/provider-id duplicates, verify same-key existing indexes for compatibility, then create missing indexes. It never drops or replaces an index.
4. `04_seed_reference_data.js` — insert the 12 reference documents. It requires all 17 collections to be empty.
5. `05_seed_business_data.js` — insert the 22 business documents, then apply the sample seat, stock, and reward changes. It requires the expected reference IDs/counts, empty business collections, required indexes, and expected opening stock/seat state. If it errors after starting inserts or stock changes, **do not rerun blindly**; inspect the database and resolve it manually. MongoDB Standalone does not make these multi-collection seed writes atomic.
6. `06_verify_database.js` — read-only checks for collections, validators, indexes, references, payment mode, snapshots, balances, spend, and stock.

Every script selects the database name in `TEN_CSDL_DICH` and checks it before acting. Seed scripts do not run on import in Node: they are IntelliShell scripts that must be deliberately executed. Never run them through a production connection. These scripts do not create or modify `.env`, application models, or application code.

Step 02 sets strict/error validators. Mongoose `Number` fields accept BSON `int` and `double` in the validators so application writes and shell literals are compatible; Decimal128 money fields remain BSON `decimal`. Step 03 declares **50 custom indexes** in addition to MongoDB's built-in `_id_` indexes. If a preflight fails, stop and resolve the incompatibility; do not weaken or delete constraints to force the scripts through. The partial unique index on `ve` covers `VALID` and `USED` seats; the partial unique payment index covers string `MaGiaoDichMoMo` values, allowing multiple null/missing values. MongoDB's current manual documents `$or` as supported in partial filters, but confirm the actual server version before execution.

## Demo logins

The seed uses bcrypt hashes compatible with the project's `authService` bcrypt comparison:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@cinemaloyalty.test` | `AdminDemo!2026` |
| KHACHHANG | `member1@cinemaloyalty.test` | `MemberDemo!2026` |

Other seeded customer accounts use `member2@cinemaloyalty.test` and `member3@cinemaloyalty.test`; their password is also `MemberDemo!2026`.

## Fixture inventory

The 17 collections are `bien_dong_diem`, `cum_rap`, `doi_thuong`, `ghi_nhan_chi_tieu`, `giao_dich`, `hang_thanh_vien`, `khach_hang`, `khuyen_mai`, `lich_su_hang`, `lich_su_ton_kho`, `phan_thuong`, `phim`, `phong_chieu`, `san_pham`, `suat_chieu`, `thanh_toan`, and `ve`.

| Collection | Reference seed | Business seed | Total after step 05 |
|---|---:|---:|---:|
| `hang_thanh_vien` | 3 | 0 | 3 |
| `cum_rap` | 1 | 0 | 1 |
| `phong_chieu` | 1 | 0 | 1 |
| `phim` | 1 | 0 | 1 |
| `suat_chieu` | 1 | 0 | 1 |
| `san_pham` | 3 | 0 | 3 |
| `khuyen_mai` | 1 | 0 | 1 |
| `phan_thuong` | 1 | 0 | 1 |
| `khach_hang` | 0 | 4 | 4 |
| `giao_dich` | 0 | 3 | 3 |
| `thanh_toan` | 0 | 3 | 3 |
| `ve` | 0 | 1 | 1 |
| `bien_dong_diem` | 0 | 2 | 2 |
| `doi_thuong` | 0 | 1 | 1 |
| `lich_su_hang` | 0 | 2 | 2 |
| `ghi_nhan_chi_tieu` | 0 | 3 | 3 |
| `lich_su_ton_kho` | 0 | 3 | 3 |
| **Total** | **12** | **22** | **34** |

The demo payment records use `DEV_MOCK` only; no MoMo request is made. The E3 fixture uses the inspected `VND_PER_POINT=10000` and records 12 earned points for the eligible ticket amount. Product/combo snapshots, the G2 ticket discount allocation, E4 spend/tier history, and FA3 stock ledger are connected to their corresponding demo transactions. Fixtures are synthetic and intended only for the new, empty target database.

## Verification and limits

`06_verify_database.js` only calls read operations (`getCollectionNames`, `getCollectionInfos`, `getIndexes`, `find`, `findOne`, `countDocuments`, and aggregation). It does not repair or update anything. It reports expected demo counts and checks index names, uniqueness, and the two critical partial-filter shapes. Step 03 performs the stricter same-key compatibility comparison before index creation. Successful output is not a substitute for application-level runtime tests.

Optional chaining and other ES2020-only syntax were removed from the scripts after the IntelliShell parser error. The remaining arrow functions, `const`/`let`, destructuring, template literals, and default parameters are ES2015 syntax; Studio 3T added wider ES6 editor parsing in 2021.10, and IntelliShell can use either its legacy `mongo` shell or `mongosh`. The exact installed Studio 3T/shell version has not been supplied, so use a current Studio 3T IntelliShell session configured for `mongosh` if the legacy shell rejects ES2015 syntax.

The scripts were statically reviewed and JavaScript syntax-checked without running them. MongoDB connectivity, actual server/shell versions, validator acceptance, index creation, bcrypt login, and application API behavior have not been runtime-verified. No MongoDB connection, collection/index operation, seed, migration, or scheduler was run as part of preparing these files.
