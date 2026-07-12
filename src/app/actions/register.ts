"use server";

import { sql } from "@/lib/db";
import { normalizePhone, isValidIndonesianPhone } from "@/lib/phone";

export type RegisterResult =
  | { success: true; data: { nama: string; no_wa: string; kupon_code: string } }
  | { success: false; error: string };

export async function registerPeserta(
  _prev: RegisterResult | null,
  formData: FormData
): Promise<RegisterResult> {
  try {
    const nama = (formData.get("nama") as string)?.trim();
    const no_wa_raw = (formData.get("no_wa") as string)?.trim();

    if (!nama || nama.length < 2) {
      return { success: false, error: "Nama harus diisi minimal 2 karakter." };
    }

    if (!no_wa_raw) {
      return { success: false, error: "Nomor WhatsApp harus diisi." };
    }

    const no_wa = normalizePhone(no_wa_raw);

    if (!isValidIndonesianPhone(no_wa)) {
      return {
        success: false,
        error: "Format nomor WhatsApp tidak valid. Gunakan format 08xx atau 628xx.",
      };
    }

    // Check if phone number is already registered
    const existing = await sql`SELECT id FROM peserta WHERE no_wa = ${no_wa} LIMIT 1`;

    if (existing && existing.length > 0) {
      return {
        success: false,
        error: "Nomor WhatsApp ini sudah terdaftar, satu nomor hanya bisa daftar sekali.",
      };
    }

    // Insert new registration
    const inserted = await sql`INSERT INTO peserta (nama, no_wa) VALUES (${nama}, ${no_wa}) RETURNING nama, no_wa, kupon_code`;

    if (!inserted || inserted.length === 0) {
      return { success: false, error: "Gagal mendaftar. Silakan coba lagi." };
    }

    const data = inserted[0] as unknown as { nama: string; no_wa: string; kupon_code: string };

    return { success: true, data };
  } catch (e: unknown) {
    const errorObj = e as { code?: string; message?: string };
    const msg = errorObj.message || String(e);
    console.error("[register] Unexpected error:", msg);
    
    // Check for PostgreSQL unique constraint violation (code 23505)
    if (errorObj.code === "23505" || msg.includes("23505")) {
      return {
        success: false,
        error: "Nomor WhatsApp ini sudah terdaftar, satu nomor hanya bisa daftar sekali.",
      };
    }
    
    if (msg.includes("fetch failed") || msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED")) {
      return {
        success: false,
        error: "Tidak dapat terhubung ke database. Periksa koneksi internet Anda lalu coba lagi.",
      };
    }
    return { success: false, error: `Terjadi kesalahan. Silakan coba lagi. (${msg})` };
  }
}
