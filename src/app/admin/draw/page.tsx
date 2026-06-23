"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getEligiblePeserta,
  confirmWinner,
  getWinnerCount,
  type EligiblePeserta,
} from "./[token]/actions/draw";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_WINNERS = 5;
const COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F59E0B",
  "#6366F1",
  "#10B981",
  "#F43F5E",
];

function secureRandomIndex(length: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % length;
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  names: string[],
  rotation: number,
  winnerIndex: number | null,
  size: number
) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 10;
  const sliceAngle = (2 * Math.PI) / names.length;

  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  names.forEach((name, i) => {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.min(14, radius / names.length)}px sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.fillText(name, radius * 0.6, 4);
    ctx.restore();
  });

  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 15);
  ctx.lineTo(cx - 12, cy - radius - 35);
  ctx.lineTo(cx + 12, cy - radius - 35);
  ctx.closePath();
  ctx.fillStyle = "#1F2937";
  ctx.fill();
}

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [eligible, setEligible] = useState<EligiblePeserta[]>([]);
  const [winnerCount, setWinnerCount] = useState(0);
  const [winners, setWinners] = useState<EligiblePeserta[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<EligiblePeserta | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);

  const isComplete = winnerCount >= MAX_WINNERS;

  const refreshData = useCallback(async () => {
    const [newEligible, newCount] = await Promise.all([
      getEligiblePeserta(),
      getWinnerCount(),
    ]);
    setEligible(newEligible);
    setWinnerCount(newCount);
  }, []);

  useEffect(() => {
    refreshData().finally(() => setLoading(false));
  }, [refreshData]);

  useEffect(() => {
    if (canvasRef.current && eligible.length > 0) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        drawWheel(
          ctx,
          eligible.map((p) => p.nama),
          0,
          null,
          350
        );
      }
    }
  }, [eligible]);

  const spinWheel = useCallback(() => {
    if (eligible.length < 2 || spinning) return;

    setSpinning(true);
    setShowResult(false);
    setCurrentWinner(null);

    const winnerIdx = secureRandomIndex(eligible.length);
    const winner = eligible[winnerIdx];
    const sliceAngle = (2 * Math.PI) / eligible.length;
    const targetAngle =
      -winnerIdx * sliceAngle - sliceAngle / 2 - Math.PI / 2;
    const totalRotation = targetAngle + 360 * (5 + Math.random());
    const startTime = performance.now();
    const duration = 4000;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(eligible.length > 0 ? elapsed / duration : 1, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = (totalRotation * eased * Math.PI) / 180;

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        drawWheel(
          ctx,
          eligible.map((p) => p.nama),
          currentRotation,
          null,
          350
        );
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setCurrentWinner(winner);
        setShowResult(true);

        const ctx2 = canvasRef.current?.getContext("2d");
        if (ctx2) {
          drawWheel(
            ctx2,
            eligible.map((p) => p.nama),
            (totalRotation * Math.PI) / 180,
            winnerIdx,
            350
          );
        }
      }
    };

    requestAnimationFrame(animate);
  }, [eligible, spinning]);

  const handleConfirm = async () => {
    if (!currentWinner || confirming) return;
    setConfirming(true);

    const result = await confirmWinner(currentWinner.id);
    if (result.success) {
      setWinners((prev) => [...prev, result.winner]);
      setShowResult(false);
      setCurrentWinner(null);
      await refreshData();
    }

    setConfirming(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="text-xl font-bold">Undian Selesai!</h1>
          <p className="text-muted-foreground mt-1">
            Semua {MAX_WINNERS} pemenang sudah terkonfirmasi.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pemenang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {winners.map((w, i) => (
                <div
                  key={w.id}
                  className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                >
                  <span className="text-2xl font-bold text-muted-foreground w-8">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{w.nama}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {w.kupon_code}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">Roda Undian</h1>
        <p className="text-muted-foreground">
          Pemenang ke-{winnerCount + 1} dari {MAX_WINNERS}
        </p>
        <p className="text-sm text-muted-foreground">
          Peserta eligible: {eligible.length}
        </p>
      </div>

      {eligible.length < 2 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4 text-center">
            <p className="text-yellow-800 font-medium">
              Minimal 2 peserta hadir diperlukan untuk undian.
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              Saat ini hanya {eligible.length} peserta eligible.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={350}
          height={350}
          className="rounded-full shadow-lg"
        />
      </div>

      <div className="flex justify-center">
        {!showResult ? (
          <Button
            size="lg"
            onClick={spinWheel}
            disabled={spinning || eligible.length < 2}
          >
            {spinning ? "Memutar..." : "Putar Roda!"}
          </Button>
        ) : (
          currentWinner && (
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-center text-lg">
                  Pemenang!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentWinner.nama}</p>
                  <p className="text-muted-foreground font-mono text-sm">
                    {currentWinner.kupon_code}
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button onClick={handleConfirm} disabled={confirming}>
                    {confirming ? "Memproses..." : "Konfirmasi Pemenang"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {winners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pemenang Sejauh Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {winners.map((w, i) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 p-2 bg-muted rounded"
                >
                  <span className="font-bold text-muted-foreground w-6">
                    {i + 1}
                  </span>
                  <span className="font-medium">{w.nama}</span>
                  <span className="text-xs text-muted-foreground font-mono ml-auto">
                    {w.kupon_code}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
