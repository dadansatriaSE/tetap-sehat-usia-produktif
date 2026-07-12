"use server";

import { sql } from "@/lib/db";

export type Peserta = {
  id: string;
  nama: string;
  no_wa: string;
  kupon_code: string;
  status: string;
  checked_in_at: string | null;
  created_at: string;
};

type PesertaDbRow = {
  id: string;
  nama: string;
  no_wa: string;
  kupon_code: string;
  status: string;
  checked_in_at: string | Date | null;
  created_at: string | Date;
};

export type CheckInResult =
  | { success: true }
  | { success: false; error: string };

export async function fetchAllPeserta(): Promise<Peserta[]> {
  const rows = await sql`SELECT id, nama, no_wa, kupon_code, status, checked_in_at, created_at FROM peserta ORDER BY created_at DESC`;
  const dbRows = rows as unknown as PesertaDbRow[];
  return dbRows.map((r) => ({
    id: r.id,
    nama: r.nama,
    no_wa: r.no_wa,
    kupon_code: r.kupon_code,
    status: r.status,
    checked_in_at: r.checked_in_at ? new Date(r.checked_in_at).toISOString() : null,
    created_at: new Date(r.created_at).toISOString(),
  }));
}

export async function searchByKupon(
  kuponCode: string
): Promise<{ data: Peserta | null; error: string | null }> {
  try {
    const data = await sql`SELECT id, nama, no_wa, kupon_code, status, checked_in_at, created_at FROM peserta WHERE kupon_code = ${kuponCode} LIMIT 1`;

    if (!data || data.length === 0) {
      return { data: null, error: "Kupon tidak ditemukan." };
    }

    const row = data[0] as unknown as PesertaDbRow;
    const peserta: Peserta = {
      id: row.id,
      nama: row.nama,
      no_wa: row.no_wa,
      kupon_code: row.kupon_code,
      status: row.status,
      checked_in_at: row.checked_in_at ? new Date(row.checked_in_at).toISOString() : null,
      created_at: new Date(row.created_at).toISOString(),
    };

    if (peserta.status === "hadir") {
      return { data: peserta, error: "Peserta ini sudah berstatus hadir sebelumnya." };
    }

    return { data: peserta, error: null };
  } catch (err: unknown) {
    const errorObj = err as Error;
    return { data: null, error: `Gagal mencari kupon: ${errorObj.message}` };
  }
}

export async function checkInByKupon(kuponCode: string): Promise<CheckInResult> {
  try {
    const data = await sql`UPDATE peserta SET status = 'hadir', checked_in_at = NOW() WHERE kupon_code = ${kuponCode} AND status = 'terdaftar' RETURNING id`;

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Kupon tidak ditemukan atau sudah pernah hadir.",
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorObj = err as Error;
    return {
      success: false,
      error: `Gagal check-in: ${errorObj.message}`,
    };
  }
}

export async function quickCheckIn(id: string): Promise<CheckInResult> {
  try {
    const data = await sql`UPDATE peserta SET status = 'hadir', checked_in_at = NOW() WHERE id = ${id} AND status = 'terdaftar' RETURNING id`;

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Peserta tidak ditemukan atau sudah hadir.",
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorObj = err as Error;
    return {
      success: false,
      error: `Gagal check-in: ${errorObj.message}`,
    };
  }
}

export async function deletePeserta(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await sql`DELETE FROM peserta WHERE id = ${id} RETURNING id`;
    if (!data || data.length === 0) {
      return { success: false, error: "Peserta tidak ditemukan." };
    }
    return { success: true };
  } catch (err: unknown) {
    const errorObj = err as Error;
    return { success: false, error: `Gagal menghapus peserta: ${errorObj.message}` };
  }
}
