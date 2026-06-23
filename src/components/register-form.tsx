"use client";

import { useState, useCallback } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { registerPeserta } from "@/app/actions/register";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type KuponData = { nama: string; no_wa: string; kupon_code: string };

const EVENT_DATE = "Minggu, 29 Juni 2026";
const EVENT_TIME = "08:00 WIB – Selesai";
const EVENT_LOCATION = "Masjid Jami' Sosrohadisewoyo";
const EVENT_ADDRESS = "Pelem II, Pelem, Kec. Ngawi";
const EVENT_RULES = [
  "Kupon berlaku untuk 1 orang, tidak dapat dipindahtangankan.",
  "Tunjukkan kupon ini saat registrasi di lokasi.",
  "Hadir tepat waktu sesuai jadwal yang tertera.",
  "Kehilangan kupon bukan tanggung jawab panitia.",
  "Keputusan panitia bersifat mutlak.",
];

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [kuponData, setKuponData] = useState<KuponData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const generateQrAndPdf = useCallback(async (data: KuponData) => {
    const qr = await QRCode.toDataURL(data.kupon_code, {
      width: 256,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    setQrDataUrl(qr);

    const img = new Image();
    img.src = qr;
    await new Promise((r) => { img.onload = r; });

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 160] });

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 80, 160, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("TETAP SEHAT", 40, 10, { align: "center" });
    doc.text("DI USIA PRODUKTIF", 40, 15, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.line(10, 19, 70, 19);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(EVENT_DATE, 40, 24, { align: "center" });
    doc.text(EVENT_TIME, 40, 28, { align: "center" });

    doc.setFontSize(6);
    doc.text(EVENT_LOCATION, 40, 33, { align: "center" });
    doc.text(EVENT_ADDRESS, 40, 36.5, { align: "center" });

    doc.line(10, 40, 70, 40);

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("NAMA PESERTA", 40, 46, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(data.nama, 40, 51, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 100, 60);
    doc.text(data.kupon_code, 40, 63, { align: "center" });

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("KODE KUPON UNDIAN", 40, 68, { align: "center" });

    doc.line(10, 72, 70, 72);

    const qrSize = 25;
    doc.addImage(qr, "PNG", 27.5, 74, qrSize, qrSize);

    doc.setFontSize(5);
    doc.setTextColor(120, 120, 120);
    doc.text("Scan untuk verifikasi", 40, 103, { align: "center" });

    doc.line(10, 107, 70, 107);

    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("ATURAN ACARA", 40, 112, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    doc.setTextColor(80, 80, 80);
    EVENT_RULES.forEach((rule, i) => {
      doc.text(`${i + 1}. ${rule}`, 40, 117 + i * 4.5, { align: "center" });
    });

    const rulesBottom = 117 + EVENT_RULES.length * 4.5 + 2;
    doc.line(10, rulesBottom, 70, rulesBottom);

    doc.setFontSize(4.5);
    doc.setTextColor(120, 120, 120);
    doc.text("Simpan kupon ini dan tunjukkan saat acara.", 40, rulesBottom + 5, { align: "center" });

    doc.save(`kupon-${data.kupon_code}.pdf`);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await registerPeserta(null, formData);

    if (result.success) {
      setKuponData(result.data);
      generateQrAndPdf(result.data);
    } else {
      setError(result.error);
    }

    setPending(false);
  };

  const handleDownload = () => {
    if (kuponData) generateQrAndPdf(kuponData);
  };

  if (kuponData && qrDataUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-emerald-800">Pendaftaran Berhasil!</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kupon undian Anda sudah siap
            </p>
          </div>

          <Card className="overflow-hidden border-emerald-200 shadow-lg">
            <div className="bg-emerald-700 text-white text-center py-3">
              <p className="font-bold text-sm tracking-wide">TETAP SEHAT DI USIA PRODUKTIF</p>
              <p className="text-xs opacity-80">{EVENT_DATE}</p>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Nama Peserta</p>
                <p className="font-semibold">{kuponData.nama}</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Kode Kupon Undian</p>
                <p className="text-2xl font-bold text-emerald-700 font-mono tracking-wider">
                  {kuponData.kupon_code}
                </p>
              </div>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code Kupon" className="w-40 h-40" />
              </div>
              <div className="text-center text-xs text-muted-foreground space-y-0.5">
                <p>{EVENT_LOCATION}</p>
                <p>{EVENT_ADDRESS}</p>
                <p className="pt-1">{EVENT_TIME}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={handleDownload} className="w-full bg-emerald-700 hover:bg-emerald-800">
              Download Ulang Kupon (PDF)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setKuponData(null);
                setQrDataUrl(null);
                setError(null);
              }}
              className="w-full"
            >
              Daftar Peserta Lain
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Simpan kupon ini dan tunjukkan saat hari acara.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
            GRATIS
          </div>
          <h1 className="text-2xl font-bold text-emerald-800">
            Tetap Sehat di Usia Produktif
          </h1>
          <p className="text-sm text-muted-foreground">
            Daftar sekarang dan dapatkan kupon undian hadiah menarik!
          </p>
        </div>

        <Card className="border-emerald-100">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nama" className="text-sm font-medium">
                  Nama Lengkap
                </label>
                <Input
                  id="nama"
                  name="nama"
                  placeholder="Masukkan nama lengkap"
                  required
                  minLength={2}
                  disabled={pending}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="no_wa" className="text-sm font-medium">
                  Nomor WhatsApp
                </label>
                <Input
                  id="no_wa"
                  name="no_wa"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  required
                  disabled={pending}
                />
                <p className="text-xs text-muted-foreground">
                  Format: 08xx atau 628xx
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800"
                disabled={pending}
              >
                {pending ? "Mendaftar..." : "Daftar Sekarang"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>{EVENT_DATE} &bull; {EVENT_TIME}</p>
          <p>{EVENT_LOCATION}, {EVENT_ADDRESS}</p>
        </div>
      </div>
    </div>
  );
}
