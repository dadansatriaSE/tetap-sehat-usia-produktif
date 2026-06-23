"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchPemenang, confirmTransfer, type Pemenang } from "../actions/transfer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PemenangPage() {
  const [pemenang, setPemenang] = useState<Pemenang[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Pemenang | null>(null);
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchPemenang();
      setPemenang(data);
    } catch (err) {
      console.error("Gagal memuat data pemenang:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const total = pemenang.length;
  const sudah = pemenang.filter((p) => p.saldo_status === "sudah").length;
  const belum = total - sudah;

  const openDialog = (p: Pemenang) => {
    setSelected(p);
    setCatatan("");
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);

    const result = await confirmTransfer(selected.id, catatan);
    if (result.success) {
      setDialogOpen(false);
      setSelected(null);
      setCatatan("");
      await fetchData();
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Memuat data pemenang...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pemenang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sudah Ditransfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sudah}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Belum Ditransfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{belum}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No WA</TableHead>
                <TableHead>Kupon</TableHead>
                <TableHead>Status Transfer</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Menang</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pemenang.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    Belum ada pemenang.
                  </TableCell>
                </TableRow>
              ) : (
                pemenang.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nama}</TableCell>
                    <TableCell>{p.no_wa}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.kupon_code}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.saldo_status === "sudah" ? "success" : "secondary"
                        }
                      >
                        {p.saldo_status === "sudah"
                          ? "Sudah Ditransfer"
                          : "Belum"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {p.catatan_transfer || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.menang_at
                        ? new Date(p.menang_at).toLocaleString("id-ID")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.saldo_status === "belum" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(p)}
                        >
                          Tandai Sudah Ditransfer
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Transfer</DialogTitle>
            <DialogDescription>
              Pastikan Anda sudah mentransfer saldo ke pemenang berikut.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 space-y-1">
                <p className="font-medium">{selected.nama}</p>
                <p className="text-sm text-muted-foreground">{selected.no_wa}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {selected.kupon_code}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="catatan" className="text-sm font-medium">
                  Catatan Transfer (opsional)
                </label>
                <Input
                  id="catatan"
                  placeholder="Ditransfer via DANA ke 08xx, 30 Juni 2026"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleConfirm} disabled={submitting}>
              {submitting ? "Memproses..." : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
