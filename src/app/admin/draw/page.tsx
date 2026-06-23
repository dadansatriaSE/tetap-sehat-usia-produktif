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
const CANVAS_SIZE = 400;
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
  "#06B6D4",
  "#84CC16",
  "#A855F7",
];

function secureRandomIndex(length: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % length;
}

function createTickSound(audioCtx: AudioContext) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.value = 800 + Math.random() * 400;
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.05);
}

function createWinnerSound(audioCtx: AudioContext) {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = audioCtx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  names: string[],
  rotation: number,
  size: number
) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 12;
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
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.save();
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.min(16, Math.max(10, radius / (names.length * 0.6)))}px sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 4;
    const textRadius = radius * 0.65;
    ctx.fillText(name, textRadius, 0);
    ctx.restore();
  });

  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
  ctx.fillStyle = "#1F2937";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawPointer(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const top = 2;

  ctx.beginPath();
  ctx.moveTo(cx, top + 32);
  ctx.lineTo(cx - 16, top);
  ctx.lineTo(cx + 16, top);
  ctx.closePath();

  const grad = ctx.createLinearGradient(cx - 16, top, cx + 16, top);
  grad.addColorStop(0, "#DC2626");
  grad.addColorStop(0.5, "#EF4444");
  grad.addColorStop(1, "#DC2626");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "#991B1B";
  ctx.lineWidth = 2;
  ctx.stroke();
}

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickSliceRef = useRef(-1);
  const animFrameRef = useRef<number>(0);

  const [eligible, setEligible] = useState<EligiblePeserta[]>([]);
  const [winnerCount, setWinnerCount] = useState(0);
  const [winners, setWinners] = useState<EligiblePeserta[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupWinner, setPopupWinner] = useState<EligiblePeserta | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);

  const isComplete = winnerCount >= MAX_WINNERS;

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

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
    if (canvasRef.current && eligible.length > 0 && !spinning) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        drawWheel(ctx, eligible.map((p) => p.nama), 0, CANVAS_SIZE);
        drawPointer(ctx, CANVAS_SIZE);
      }
    }
  }, [eligible, spinning]);

  const spinWheel = useCallback(() => {
    if (eligible.length < 2 || spinning) return;

    const audioCtx = getAudioCtx();
    lastTickSliceRef.current = -1;

    setSpinning(true);
    setShowPopup(false);
    setPopupWinner(null);

    const winnerIdx = secureRandomIndex(eligible.length);
    const winner = eligible[winnerIdx];
    const sliceAngle = (2 * Math.PI) / eligible.length;

    const targetAngle =
      -(winnerIdx * sliceAngle + sliceAngle / 2) - Math.PI / 2;

    const fullRotations = 6 + Math.floor(Math.random() * 3);
    const totalDegrees =
      targetAngle * (180 / Math.PI) + 360 * fullRotations;

    const duration = 5000 + eligible.length * 200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);

      let eased: number;
      if (rawProgress < 0.3) {
        eased = rawProgress / 0.3 * 0.4;
      } else if (rawProgress < 0.7) {
        const mid = (rawProgress - 0.3) / 0.4;
        eased = 0.4 + mid * 0.35;
      } else {
        const slow = (rawProgress - 0.7) / 0.3;
        eased = 0.75 + (1 - Math.pow(1 - slow, 3)) * 0.25;
      }

      const currentDegrees = totalDegrees * eased;
      const currentRotation = (currentDegrees * Math.PI) / 180;

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        drawWheel(ctx, eligible.map((p) => p.nama), currentRotation, CANVAS_SIZE);
        drawPointer(ctx, CANVAS_SIZE);
      }

      if (rawProgress > 0.5) {
        const normalAngle =
          ((currentDegrees % 360) + 360) % 360;
        const sliceDeg = 360 / eligible.length;
        const pointingDeg = (360 - normalAngle + 90) % 360;
        const currentSlice = Math.floor(pointingDeg / sliceDeg) % eligible.length;

        if (currentSlice !== lastTickSliceRef.current) {
          lastTickSliceRef.current = currentSlice;
          createTickSound(audioCtx);
        }
      }

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        createWinnerSound(audioCtx);
        setSpinning(false);
        setPopupWinner(winner);
        setShowPopup(true);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [eligible, spinning, getAudioCtx]);

  const handleConfirm = async () => {
    if (!popupWinner || confirming) return;
    setConfirming(true);

    const result = await confirmWinner(popupWinner.id);
    if (result.success) {
      setWinners((prev) => [...prev, result.winner]);
      setShowPopup(false);
      setPopupWinner(null);
      await refreshData();
    }

    setConfirming(false);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupWinner(null);
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
          <h1 className="text-2xl font-bold">Undian Selesai!</h1>
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
        <div className="flex justify-center">
          <Button
            onClick={() =>
              (window.location.href = "/admin/pemenang")
            }
          >
            Lihat Halaman Pemenang
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Roda Undian</h1>
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
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-full shadow-2xl"
            style={{
              filter: spinning ? "brightness(1.05)" : "none",
              transition: "filter 0.3s",
            }}
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={spinWheel}
          disabled={spinning || eligible.length < 2}
          className="text-lg px-8 py-6 h-auto"
        >
          {spinning ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⟳</span> Memutar...
            </span>
          ) : (
            "Putar Roda!"
          )}
        </Button>
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

      {showPopup && popupWinner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closePopup}
        >
          <div
            className="animate-in zoom-in-95 fade-in-0 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-[360px] shadow-2xl border-0 overflow-hidden">
              <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-8 text-center text-white">
                <div className="text-5xl mb-3">🏆</div>
                <h2 className="text-3xl font-bold">PEMENANG!</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-foreground">
                    {popupWinner.nama}
                  </p>
                  <p className="text-muted-foreground font-mono">
                    {popupWinner.kupon_code}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {popupWinner.no_wa}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={closePopup}
                  >
                    Batal
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={confirming}
                  >
                    {confirming ? "Menyimpan..." : "Konfirmasi"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
