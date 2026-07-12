"use server";

import { sql } from "@/lib/db";

export type Pemenang = {
  id: string;
  nama: string;
  no_wa: string;
  kupon_code: string;
  saldo_status: string;
  catatan_transfer: string | null;
  menang_at: string;
};

type PemenangDbRow = {
  id: string;
  nama: string;
  no_wa: string;
  kupon_code: string;
  saldo_status: string;
  catatan_transfer: string | null;
  menang_at: string | Date;
};

export type TransferResult =
  | { success: true }
  | { success: false; error: string };

export async function fetchPemenang(): Promise<Pemenang[]> {
  const rows = await sql`SELECT id, nama, no_wa, kupon_code, saldo_status, catatan_transfer, menang_at FROM peserta WHERE is_pemenang = true ORDER BY menang_at ASC`;
  const dbRows = rows as unknown as PemenangDbRow[];
  return dbRows.map((r) => ({
    id: r.id,
    nama: r.nama,
    no_wa: r.no_wa,
    kupon_code: r.kupon_code,
    saldo_status: r.saldo_status,
    catatan_transfer: r.catatan_transfer,
    menang_at: new Date(r.menang_at).toISOString(),
  }));
}

export async function confirmTransfer(
  id: string,
  catatan: string
): Promise<TransferResult> {
  try {
    const data = await sql`UPDATE peserta SET saldo_status = 'sudah', transferred_at = NOW(), catatan_transfer = ${catatan || null} WHERE id = ${id} AND saldo_status = 'belum' RETURNING id`;

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Transfer sudah dikonfirmasi sebelumnya atau peserta tidak ditemukan.",
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorObj = err as Error;
    return { success: false, error: `Gagal mengkonfirmasi transfer: ${errorObj.message}` };
  }
}
