-- ============================================================
-- 003_add_catatan_transfer.sql
-- Tambah kolom catatan_transfer ke tabel peserta
-- ============================================================

ALTER TABLE peserta ADD COLUMN catatan_transfer TEXT;
