"use server";

import { sql } from "@/lib/db";

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
  const data = await sql`SELECT id, nama, no_wa, kupon_code FROM peserta WHERE status = 'hadir' AND is_pemenang = false`;
  return (data as EligiblePeserta[]) ?? [];
}

export async function getWinnerCount(): Promise<number> {
  const data = await sql`SELECT COUNT(id)::int as count FROM peserta WHERE is_pemenang = true`;
  return data[0]?.count ?? 0;
}

export async function confirmWinner(id: string): Promise<DrawResult> {
  try {
    const current = await sql`SELECT COUNT(id)::int as count FROM peserta WHERE is_pemenang = true`;
    const count = current[0]?.count ?? 0;

    if (count >= 5) {
      return { success: false, error: "Semua 5 pemenang sudah terkonfirmasi." };
    }

    const data = await sql`UPDATE peserta SET is_pemenang = true, menang_at = NOW() WHERE id = ${id} AND is_pemenang = false RETURNING id, nama, no_wa, kupon_code`;

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Peserta sudah dikonfirmasi sebagai pemenang.",
      };
    }

    return { success: true, winner: data[0] as EligiblePeserta };
  } catch (err: unknown) {
    const errorObj = err as Error;
    return { success: false, error: `Gagal mengkonfirmasi pemenang: ${errorObj.message}` };
  }
}
