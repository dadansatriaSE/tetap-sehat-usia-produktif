"use server";

import { createClientServer } from "@/lib/supabase/server";

export type EligiblePeserta = {
  id: string;
  nama: string;
  no_wa: string;
  kupon_code: string;
};

export type DrawResult =
  | { success: true; winner: EligiblePeserta }
  | { success: false; error: string };

export async function getEligiblePeserta(): Promise<EligiblePeserta[]> {
  const supabase = createClientServer();
  const { data, error } = await supabase
    .from("peserta")
    .select("id, nama, no_wa, kupon_code")
    .eq("status", "hadir")
    .eq("is_pemenang", false);

  if (error) throw error;
  return data ?? [];
}

export async function getWinnerCount(): Promise<number> {
  const supabase = createClientServer();
  const { count, error } = await supabase
    .from("peserta")
    .select("id", { count: "exact", head: true })
    .eq("is_pemenang", true);

  if (error) throw error;
  return count ?? 0;
}

export async function confirmWinner(id: string): Promise<DrawResult> {
  const supabase = createClientServer();

  const { data: current, error: countErr } = await supabase
    .from("peserta")
    .select("id", { count: "exact", head: true })
    .eq("is_pemenang", true);

  if (countErr) {
    return { success: false, error: "Gagal memeriksa jumlah pemenang." };
  }

  if ((current as unknown as number) >= 5) {
    return { success: false, error: "Semua 5 pemenang sudah terkonfirmasi." };
  }

  const { data, error } = await supabase
    .from("peserta")
    .update({ is_pemenang: true, menang_at: new Date().toISOString() })
    .eq("id", id)
    .eq("is_pemenang", false)
    .select("id, nama, no_wa, kupon_code")
    .single();

  if (error) {
    return { success: false, error: "Gagal mengkonfirmasi pemenang." };
  }

  if (!data) {
    return {
      success: false,
      error: "Peserta sudah dikonfirmasi sebagai pemenang.",
    };
  }

  return { success: true, winner: data };
}
