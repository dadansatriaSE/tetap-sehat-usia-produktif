"use server";

import { createClientServer } from "@/lib/supabase/server";

export type Pemenang = {
  id: string;
  nama: string;
  no_wa: string;
  kupon_code: string;
  saldo_status: string;
  catatan_transfer: string | null;
  menang_at: string;
};

export type TransferResult =
  | { success: true }
  | { success: false; error: string };

export async function fetchPemenang(): Promise<Pemenang[]> {
  const supabase = createClientServer();
  const { data, error } = await supabase
    .from("peserta")
    .select(
      "id, nama, no_wa, kupon_code, saldo_status, catatan_transfer, menang_at"
    )
    .eq("is_pemenang", true)
    .order("menang_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function confirmTransfer(
  id: string,
  catatan: string
): Promise<TransferResult> {
  const supabase = createClientServer();

  const { data, error } = await supabase
    .from("peserta")
    .update({
      saldo_status: "sudah",
      transferred_at: new Date().toISOString(),
      catatan_transfer: catatan || null,
    })
    .eq("id", id)
    .eq("saldo_status", "belum")
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "Gagal mengkonfirmasi transfer." };
  }

  if (!data) {
    return {
      success: false,
      error: "Transfer sudah dikonfirmasi sebelumnya.",
    };
  }

  return { success: true };
}
