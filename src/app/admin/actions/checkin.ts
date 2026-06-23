"use server";

import { createClientServer } from "@/lib/supabase/server";

export type Peserta = {
  id: string;
  nama: string;
  no_wa: string;
  kupon_code: string;
  status: string;
  checked_in_at: string | null;
  created_at: string;
};

export type CheckInResult =
  | { success: true }
  | { success: false; error: string };

export async function fetchAllPeserta(): Promise<Peserta[]> {
  const supabase = createClientServer();
  const { data, error } = await supabase
    .from("peserta")
    .select("id, nama, no_wa, kupon_code, status, checked_in_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function searchByKupon(
  kuponCode: string
): Promise<{ data: Peserta | null; error: string | null }> {
  const supabase = createClientServer();
  const { data, error } = await supabase
    .from("peserta")
    .select("id, nama, no_wa, kupon_code, status, checked_in_at, created_at")
    .eq("kupon_code", kuponCode)
    .single();

  if (error || !data) {
    return { data: null, error: "Kupon tidak ditemukan." };
  }

  if (data.status === "hadir") {
    return { data, error: "Peserta ini sudah berstatus hadir sebelumnya." };
  }

  return { data, error: null };
}

export async function checkInByKupon(kuponCode: string): Promise<CheckInResult> {
  const supabase = createClientServer();

  const { data, error } = await supabase
    .from("peserta")
    .update({ status: "hadir", checked_in_at: new Date().toISOString() })
    .eq("kupon_code", kuponCode)
    .eq("status", "terdaftar")
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "Gagal melakukan check-in." };
  }

  if (!data) {
    return {
      success: false,
      error: "Peserta tidak ditemukan atau sudah hadir.",
    };
  }

  return { success: true };
}

export async function quickCheckIn(id: string): Promise<CheckInResult> {
  const supabase = createClientServer();

  const { data, error } = await supabase
    .from("peserta")
    .update({ status: "hadir", checked_in_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "terdaftar")
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "Gagal melakukan check-in." };
  }

  if (!data) {
    return {
      success: false,
      error: "Peserta tidak ditemukan atau sudah hadir.",
    };
  }

  return { success: true };
}
