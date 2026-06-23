"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { checkInByKupon, type Peserta } from "../actions/checkin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ScanResult =
  | { type: "success"; peserta: Peserta }
  | { type: "error"; message: string }
  | null;

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [manualCode, setManualCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const processKupon = useCallback(
    async (kuponCode: string) => {
      if (checking || !kuponCode.trim()) return;
      setChecking(true);
      setScanResult(null);

      const result = await checkInByKupon(kuponCode.trim());

      if (result.success) {
        setScanResult({
          type: "success",
          peserta: {
            id: "",
            nama: "",
            no_wa: "",
            kupon_code: kuponCode.trim(),
            status: "hadir",
            checked_in_at: new Date().toISOString(),
            created_at: "",
          },
        });
      } else {
        setScanResult({ type: "error", message: result.error });
      }

      setChecking(false);
    },
    [checking]
  );

  const startCamera = useCallback(async () => {
    if (cameraActive) return;

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 5,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          await processKupon(decodedText);
          try {
            await scanner.stop();
          } catch {
            /* ignore */
          }
          setCameraActive(false);
        },
        () => {
          /* ignore scan failures */
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setScanResult({
        type: "error",
        message:
          "Gagal mengakses kamera. Pastikan izin kamera diberikan, atau gunakan input manual.",
      });
    }
  }, [cameraActive, processKupon]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* ignore */
      }
      setCameraActive(false);
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const handleManualSubmit = async () => {
    await processKupon(manualCode);
    setManualCode("");
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <h1 className="text-xl font-bold">Scan Kupon</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scan QR code kupon atau masukkan kode secara manual
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan via Kamera</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            id="qr-reader"
            ref={containerRef}
            className="w-full rounded-lg overflow-hidden"
          />
          <div className="flex gap-2 justify-center">
            {!cameraActive ? (
              <Button onClick={startCamera}>Aktifkan Kamera</Button>
            ) : (
              <Button variant="outline" onClick={stopCamera}>
                Matikan Kamera
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Input Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Masukkan kode kupon (contoh: TSP-2026-0001)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleManualSubmit();
              }}
            />
            <Button onClick={handleManualSubmit} disabled={checking || !manualCode.trim()}>
              {checking ? "..." : "Proses"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {scanResult && (
        <Card
          className={
            scanResult.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardContent className="py-4">
            {scanResult.type === "success" ? (
              <div className="text-center">
                <p className="text-green-700 font-bold text-lg">✓ Berhasil Check-in</p>
                <p className="text-green-600 font-mono mt-1">
                  {scanResult.peserta.kupon_code}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-red-700 font-medium">✗ Gagal</p>
                <p className="text-red-600 text-sm mt-1">{scanResult.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
