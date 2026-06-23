"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchAllPeserta,
  searchByKupon,
  checkInByKupon,
  quickCheckIn,
  type Peserta,
} from "./actions/checkin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminPage() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kuponSearch, setKuponSearch] = useState("");
  const [kuponResult, setKuponResult] = useState<Peserta | null>(null);
  const [kuponError, setKuponError] = useState<string | null>(null);
  const [kuponLoading, setKuponLoading] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchAllPeserta();
      setPeserta(data);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("peserta-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "peserta" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const filtered = peserta.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.nama.toLowerCase().includes(q) ||
      p.no_wa.includes(q) ||
      p.kupon_code.toLowerCase().includes(q)
    );
  });

  const total = peserta.length;
  const hadir = peserta.filter((p) => p.status === "hadir").length;
  const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

  const handleKuponSearch = async () => {
    if (!kuponSearch.trim()) return;
    setKuponLoading(true);
    setKuponError(null);
    setKuponResult(null);

    const result = await searchByKupon(kuponSearch.trim());
    if (result.error) {
      setKuponError(result.error);
    } else {
      setKuponResult(result.data);
    }
    setKuponLoading(false);
  };

  const handleConfirmCheckIn = async () => {
    if (!kuponResult) return;
    setCheckingInId(kuponResult.kupon_code);

    const result = await checkInByKupon(kuponResult.kupon_code);
    if (result.success) {
      setKuponResult(null);
      setKuponSearch("");
      setKuponError(null);
    } else {
      setKuponError(result.error);
    }
    setCheckingInId(null);
  };

  const handleQuickCheckIn = async (id: string) => {
    setCheckingInId(id);
    await quickCheckIn(id);
    setCheckingInId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Memuat data peserta...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Peserta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sudah Hadir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hadir}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Persentase Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentage}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check-in Peserta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Masukkan kode kupon (contoh: TSP-2026-0001)"
              value={kuponSearch}
              onChange={(e) => setKuponSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleKuponSearch();
              }}
            />
            <Button onClick={handleKuponSearch} disabled={kuponLoading}>
              {kuponLoading ? "Mencari..." : "Cari"}
            </Button>
          </div>

          {kuponError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
              {kuponError}
            </div>
          )}

          {kuponResult && (
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{kuponResult.nama}</p>
                <p className="text-sm text-muted-foreground">
                  {kuponResult.kupon_code}
                </p>
              </div>
              <Button
                onClick={handleConfirmCheckIn}
                disabled={checkingInId === kuponResult.kupon_code}
              >
                {checkingInId === kuponResult.kupon_code
                  ? "Memproses..."
                  : "Konfirmasi Hadir"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Input
          placeholder="Cari berdasarkan nama, no WA, atau kode kupon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No WA</TableHead>
                <TableHead>Kupon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nama}</TableCell>
                    <TableCell>{p.no_wa}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.kupon_code}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.status === "hadir" ? "default" : "secondary"}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(p.created_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.checked_in_at
                        ? new Date(p.checked_in_at).toLocaleString("id-ID")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "terdaftar" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickCheckIn(p.id)}
                          disabled={checkingInId === p.id}
                        >
                          {checkingInId === p.id ? "..." : "Check-in"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
