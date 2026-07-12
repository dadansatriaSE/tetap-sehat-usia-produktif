"use server";

import { createClientServer } from "@/lib/supabase/server";
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

    const supabase = createClientServer();

    const { data: existing } = await supabase
      .from("peserta")
      .select("id")
      .eq("no_wa", no_wa)
      .single();

    if (existing) {
      return {
        success: false,
        error: "Nomor WhatsApp ini sudah terdaftar, satu nomor hanya bisa daftar sekali.",
      };
    }

    const { data, error } = await supabase
      .from("peserta")
      .insert({ nama, no_wa })
      .select("nama, no_wa, kupon_code")
      .single();

    if (error) {
      console.error("[register] Supabase insert error:", error);
      if (error.code === "23505") {
        return {
          success: false,
          error: "Nomor WhatsApp ini sudah terdaftar, satu nomor hanya bisa daftar sekali.",
        };
      }
      return { success: false, error: `Gagal mendaftar. Silakan coba lagi. (${error.code ?? error.message})` };
    }

    return { success: true, data };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[register] Unexpected error:", msg);
    // Network error (ENOTFOUND, fetch failed, dll)
    if (msg.includes("fetch failed") || msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED")) {
      return {
        success: false,
        error: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.",
      };
    }
    return { success: false, error: `Terjadi kesalahan. Silakan coba lagi. (${msg})` };
  }
}
