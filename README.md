# Webinar - Tetap Sehat di Usia Produktif

Landing page pendaftaran + sistem kupon undian + dashboard admin.

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Supabase (database + realtime)
- Deploy: Vercel

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (keep secret, server-only)
- `ADMIN_PASSWORD` — Password for admin dashboard access
- `DRAW_SECRET_TOKEN` — Token to protect the lucky draw endpoint

3. Run Supabase migrations in order:

```bash
supabase db push
```

Or paste SQL from `supabase/migrations/` into Supabase SQL Editor manually.

4. Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Akses | Keterangan |
|---|---|---|
| `/` | Publik | Landing page pendaftaran peserta |
| `/login` | Publik | Halaman login admin |
| `/admin` | Admin login | Dashboard admin — tabel peserta, check-in, counter |
| `/admin/pemenang` | Admin login | Daftar pemenang, konfirmasi transfer saldo |
| `/admin/draw/[token]` | Admin login + token tersembunyi | Halaman roda acak undian — tidak terlihat di navigasi, robots noindex |

## Database

Tabel `peserta`:

```sql
CREATE TABLE peserta (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            TEXT NOT NULL,
  no_wa           TEXT NOT NULL UNIQUE,
  kupon_code      TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'terdaftar'
                  CHECK (status IN ('terdaftar', 'hadir')),
  is_pemenang     BOOLEAN NOT NULL DEFAULT false,
  saldo_status    TEXT NOT NULL DEFAULT 'belum'
                  CHECK (saldo_status IN ('belum', 'sudah')),
  checked_in_at   TIMESTAMPTZ,
  menang_at       TIMESTAMPTZ,
  transferred_at  TIMESTAMPTZ,
  catatan_transfer TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Lihat file di `supabase/migrations/` untuk detail lengkap.
