"use client";

import { useState, useCallback, useRef } from "react";
import {
  confirmWinner,
  getEligiblePeserta,
  getWinnerCount,
  type EligiblePeserta,
} from "./actions/draw";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MAX_WINNERS = 5;
const ANIMATION_DURATION = 3000;
const MIN_INTERVAL = 80;
const MAX_INTERVAL = 1000;

function secureRandomIndex(length: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % length;
}

type DrawState = "idle" | "spinning" | "result";

export default function DrawClient({
  initialEligible,
  initialWinnerCount,
}: {
  initialEligible: EligiblePeserta[];
  initialWinnerCount: number;
}) {
  const [eligible, setEligible] = useState(initialEligible);
  const [winnerCount, setWinnerCount] = useState(initialWinnerCount);
  const [winners, setWinners] = useState<EligiblePeserta[]>([]);
  const [state, setState] = useState<DrawState>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [winner, setWinner] = useState<EligiblePeserta | null>(null);
  const [confirming, setConfirming] = useState(false);
  const spinningRef = useRef(false);

  const isComplete = winnerCount >= MAX_WINNERS;

  const refreshData = useCallback(async () => {
    const [newEligible, newCount] = await Promise.all([
      getEligiblePeserta(),
      getWinnerCount(),
    ]);
    setEligible(newEligible);
    setWinnerCount(newCount);
  }, []);

  const startDraw = useCallback(() => {
    if (eligible.length === 0 || spinningRef.current) return;

    spinningRef.current = true;
    setState("spinning");
    setWinner(null);

    const winnerIndex = secureRandomIndex(eligible.length);
    const winnerId = eligible[winnerIndex].id;
    let currentDisplayIndex = secureRandomIndex(eligible.length);
    const startTime = Date.now();

    const tick = () => {
      if (!spinningRef.current) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min(eligible.length > 0 ? elapsed / ANIMATION_DURATION : 1, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const interval = MIN_INTERVAL + (MAX_INTERVAL - MIN_INTERVAL) * eased;

      currentDisplayIndex =
        (currentDisplayIndex + 1 + secureRandomIndex(Math.max(1, eligible.length - 1))) %
        eligible.length;
      setCurrentIndex(currentDisplayIndex);

      if (progress >= 1) {
        const finalIndex = eligible.findIndex((p) => p.id === winnerId);
        setCurrentIndex(finalIndex >= 0 ? finalIndex : 0);
        setWinner(eligible.find((p) => p.id === winnerId)!);
        setState("result");
        spinningRef.current = false;
        return;
      }

      setTimeout(tick, interval);
    };

    tick();
  }, [eligible]);

  const handleConfirm = async () => {
    if (!winner || confirming) return;
    setConfirming(true);

    const result = await confirmWinner(winner.id);
    if (result.success) {
      setWinners((prev) => [...prev, result.winner]);
      setWinner(null);
      setState("idle");
      await refreshData();
    }

    setConfirming(false);
  };

  const eligibleCount = eligible.length;
  const needsWarning = eligibleCount > 0 && eligibleCount < MAX_WINNERS;

  if (isComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">Undian Selesai</h2>
          <p className="text-muted-foreground mt-1">
            Semua {MAX_WINNERS} pemenang sudah terkonfirmasi.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pemenang</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kupon</TableHead>
                  <TableHead>No WA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winners.map((w, i) => (
                  <TableRow key={w.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{w.nama}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {w.kupon_code}
                    </TableCell>
                    <TableCell>{w.no_wa}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Peserta eligible:{" "}
          <span className="font-semibold text-foreground">{eligibleCount}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Pemenang ke-{winnerCount + 1} dari {MAX_WINNERS}
        </p>
      </div>

      {state === "idle" && (
        <div className="flex flex-col items-center gap-4">
          {needsWarning && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-md text-center max-w-md">
              Peringatan: hanya tersedia{" "}
              <span className="font-semibold">{eligibleCount}</span> peserta
              hadir. Undian akan memilih dari jumlah tersebut.
            </div>
          )}
          <Button
            size="lg"
            onClick={startDraw}
            disabled={eligibleCount === 0}
          >
            Mulai Undian
          </Button>
        </div>
      )}

      {state === "spinning" && eligible.length > 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-3xl font-bold animate-pulse">
                {eligible[currentIndex]?.nama}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {state === "result" && winner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg">
              Pemenang Ditemukan!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold">{winner.nama}</p>
              <p className="text-muted-foreground font-mono">
                {winner.kupon_code}
              </p>
              <p className="text-muted-foreground">{winner.no_wa}</p>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleConfirm} disabled={confirming}>
                {confirming ? "Memproses..." : "Konfirmasi Pemenang"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {winners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pemenang Sejauh Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kupon</TableHead>
                  <TableHead>No WA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winners.map((w, i) => (
                  <TableRow key={w.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{w.nama}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {w.kupon_code}
                    </TableCell>
                    <TableCell>{w.no_wa}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
