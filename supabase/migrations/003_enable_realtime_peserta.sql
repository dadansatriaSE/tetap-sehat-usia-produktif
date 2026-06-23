-- ============================================================
-- 003_enable_realtime_peserta.sql
-- Enable Supabase Realtime on peserta table
-- ============================================================

-- 1. Enable Realtime untuk tabel peserta
ALTER PUBLICATION supabase_realtime ADD TABLE peserta;

-- 2. RLS policy: allow anon read (diperlukan agar browser client bisa subscribe realtime)
CREATE POLICY "Allow read access for realtime" ON peserta
  FOR SELECT USING (true);
