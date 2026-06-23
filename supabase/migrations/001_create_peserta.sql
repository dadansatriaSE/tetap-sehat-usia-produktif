-- ============================================================
-- 001_create_peserta.sql
-- Tabel peserta + sequence kupon_code + trigger auto-generate
-- ============================================================

-- 1. Sequence untuk nomor kupon (aman dari race condition)
CREATE SEQUENCE IF NOT EXISTS kupon_seq
  START WITH 1
  INCREMENT BY 1
  NO MAXVALUE
  NO CYCLE;

-- 2. Function: generate kupon_code dari sequence
CREATE OR REPLACE FUNCTION generate_kupon_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kupon_code IS NULL OR NEW.kupon_code = '' THEN
    NEW.kupon_code := 'TSP-2026-' || LPAD(nextval('kupon_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Tabel peserta
CREATE TABLE peserta (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama          TEXT NOT NULL,
  no_wa         TEXT NOT NULL UNIQUE,
  kupon_code    TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'terdaftar'
                CHECK (status IN ('terdaftar', 'hadir')),
  is_pemenang   BOOLEAN NOT NULL DEFAULT false,
  saldo_status  TEXT NOT NULL DEFAULT 'belum'
                CHECK (saldo_status IN ('belum', 'sudah')),
  checked_in_at TIMESTAMPTZ,
  menang_at     TIMESTAMPTZ,
  transferred_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Trigger: auto-generate kupon_code sebelum insert
CREATE TRIGGER trg_generate_kupon
  BEFORE INSERT ON peserta
  FOR EACH ROW
  EXECUTE FUNCTION generate_kupon_code();

-- 5. RLS: aktifkan, tapi TANPA policy
--    Semua akses hanya lewat service role key (server-side)
ALTER TABLE peserta ENABLE ROW LEVEL SECURITY;

-- 6. Index untuk pencarian cepat
CREATE INDEX idx_peserta_no_wa ON peserta (no_wa);
CREATE INDEX idx_peserta_kupon ON peserta (kupon_code);
CREATE INDEX idx_peserta_status ON peserta (status);
