-- ============================================================
-- 002_test_peserta_constraints.sql
-- Query test manual untuk verifikasi constraint
-- ============================================================

-- -------------------------------------------------------
-- TEST 1: Insert normal → harus berhasil + kupon auto-generate
-- -------------------------------------------------------
INSERT INTO peserta (nama, no_wa)
VALUES ('Budi Santoso', '081234560001');

INSERT INTO peserta (nama, no_wa)
VALUES ('Siti Rahayu', '081234560002');

INSERT INTO peserta (nama, no_wa)
VALUES ('Andi Wijaya', '081234560003');

-- Cek hasil
SELECT nama, no_wa, kupon_code, status
FROM peserta
ORDER BY created_at;

-- Expected:
-- | nama         | no_wa        | kupon_code       | status     |
-- |------------- |------------- |----------------- |----------- |
-- | Budi Santoso | 081234560001 | TSP-2026-0001   | terdaftar  |
-- | Siti Rahayu  | 081234560002 | TSP-2026-0002   | terdaftar  |
-- | Andi Wijaya  | 081234560003 | TSP-2026-0003   | terdaftar  |


-- -------------------------------------------------------
-- TEST 2: Duplikat no_wa → harus GAGAL (constraint unique)
-- -------------------------------------------------------
-- Uncomment baris di bawah untuk test:
-- INSERT INTO peserta (nama, no_wa)
-- VALUES ('Hacker', '081234560001');
-- Error: duplicate key value violates unique constraint "peserta_no_wa_key"


-- -------------------------------------------------------
-- TEST 3: Duplikat kupon_code → harus GAGAL
--   (Seharusnya tidak mungkin terjadi karena sequence otomatis,
--    tapi test ini memastikan UNIQUE constraint aktif)
-- -------------------------------------------------------
-- Uncomment baris di bawah untuk test:
-- INSERT INTO peserta (nama, no_wa, kupon_code)
-- VALUES ('Hacker 2', '081234560099', 'TSP-2026-0001');
-- Error: duplicate key value violates unique constraint "peserta_kupon_code_key"


-- -------------------------------------------------------
-- TEST 4: Status invalid → harus GAGAL (CHECK constraint)
-- -------------------------------------------------------
-- Uncomment baris di bawah untuk test:
-- INSERT INTO peserta (nama, no_wa, status)
-- VALUES ('Hacker 3', '081234560098', 'banned');
-- Error: new row violates check constraint "peserta_status_check"


-- -------------------------------------------------------
-- TEST 5: Sequence continue setelah delete
-- -------------------------------------------------------
DELETE FROM peserta WHERE no_wa = '081234560002';

INSERT INTO peserta (nama, no_wa)
VALUES ('Dewi Lestari', '081234560004');

SELECT nama, no_wa, kupon_code
FROM peserta
WHERE no_wa = '081234560004';

-- Expected: TSP-2026-0004 (BUKAN 0002, sequence lanjut terus)
-- Ini membuktikan sequence tidak terpengaruh oleh delete


-- -------------------------------------------------------
-- CLEANUP (opsional, jalankan setelah test selesai)
-- -------------------------------------------------------
-- DELETE FROM peserta;
-- ALTER SEQUENCE kupon_seq RESTART WITH 1;
