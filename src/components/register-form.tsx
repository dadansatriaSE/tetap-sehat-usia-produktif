"use client";

import { useState, useCallback } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { registerPeserta } from "@/app/actions/register";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type KuponData = { nama: string; no_wa: string; kupon_code: string };

const EVENT_DATE = "Minggu, 19 Juli 2026";
const EVENT_TIME = "10:00 WIB – Selesai";
const EVENT_LOCATION = "Masjid Jami' Sosrohadisewoyo";
const EVENT_ADDRESS = "Pelem II, Pelem, Kec. Ngawi";
const EVENT_RULES = [
  "Kupon berlaku untuk 1 orang, tidak dapat dipindahtangankan.",
  "Tunjukkan kupon ini saat registrasi di lokasi.",
  "Hadir tepat waktu sesuai jadwal yang tertera.",
  "Kehilangan kupon bukan tanggung jawab panitia.",
  "Keputusan panitia bersifat mutlak.",
];

const HealthIcon = ({ icon, label }: { icon: string; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-2xl">{icon}</span>
    <span className="text-xs text-emerald-700 font-medium">{label}</span>
  </div>
);

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [kuponData, setKuponData] = useState<KuponData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const generateQrAndPdf = useCallback(async (data: KuponData) => {
    const qr = await QRCode.toDataURL(data.kupon_code, {
      width: 256,
      margin: 2,
      color: { dark: "#065f46", light: "#ffffff" },
    });
    setQrDataUrl(qr);

    const img = new Image();
    img.src = qr;
    await new Promise((r) => { img.onload = r; });

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 160] });

    // Background hijau gradient
    doc.setFillColor(6, 95, 70);
    doc.rect(0, 0, 80, 30, "F");

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 30, 80, 130, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("🌿 TETAP SEHAT", 40, 10, { align: "center" });
    doc.text("DI USIA PRODUKTIF", 40, 16, { align: "center" });

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(209, 250, 229);
    doc.text(EVENT_DATE, 40, 22, { align: "center" });
    doc.text(EVENT_TIME, 40, 26, { align: "center" });

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(EVENT_LOCATION, 40, 36, { align: "center" });
    doc.text(EVENT_ADDRESS, 40, 40, { align: "center" });

    doc.setDrawColor(209, 250, 229);
    doc.line(10, 44, 70, 44);

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text("NAMA PESERTA", 40, 50, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(data.nama, 40, 56, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(6, 95, 70);
    doc.text(data.kupon_code, 40, 68, { align: "center" });

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("KODE KUPON UNDIAN", 40, 73, { align: "center" });

    doc.setDrawColor(209, 250, 229);
    doc.line(10, 77, 70, 77);

    const qrSize = 25;
    doc.addImage(qr, "PNG", 27.5, 80, qrSize, qrSize);

    doc.setFontSize(5);
    doc.setTextColor(120, 120, 120);
    doc.text("Scan untuk verifikasi", 40, 108, { align: "center" });

    doc.setDrawColor(209, 250, 229);
    doc.line(10, 112, 70, 112);

    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(6, 95, 70);
    doc.text("ATURAN ACARA", 40, 117, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    doc.setTextColor(80, 80, 80);
    EVENT_RULES.forEach((rule, i) => {
      doc.text(`${i + 1}. ${rule}`, 40, 122 + i * 4.5, { align: "center" });
    });

    const rulesBottom = 122 + EVENT_RULES.length * 4.5 + 2;
    doc.setDrawColor(209, 250, 229);
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
      <div className="min-h-screen health-gradient flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-md space-y-6 animate-slide-up">
          {/* Success Header */}
          <div className="text-center space-y-2">
            <div className="text-5xl mb-2 animate-float inline-block">🎉</div>
            <h1 className="text-2xl font-bold text-emerald-800">Pendaftaran Berhasil!</h1>
            <p className="text-sm text-emerald-600">
              Kupon undian Anda sudah siap. Selamat datang!
            </p>
          </div>

          {/* Kupon Card */}
          <Card className="overflow-hidden border-0 shadow-2xl card-hover">
            <div className="hero-gradient text-white text-center py-5 px-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 text-6xl opacity-10 -rotate-12">🌿</div>
              <div className="absolute bottom-0 left-0 text-6xl opacity-10 rotate-12">💚</div>
              <p className="font-bold text-sm tracking-widest uppercase">Tetap Sehat</p>
              <p className="font-extrabold text-lg tracking-wide">di Usia Produktif</p>
              <p className="text-xs mt-1 opacity-80">{EVENT_DATE} &bull; {EVENT_TIME}</p>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Nama Peserta</p>
                <p className="font-bold text-lg text-emerald-900">{kuponData.nama}</p>
              </div>

              <div className="text-center space-y-1 bg-emerald-50 rounded-2xl py-4 px-6 border border-emerald-100">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Kode Kupon Undian</p>
                <p className="text-2xl font-extrabold text-emerald-700 font-mono tracking-widest">
                  {kuponData.kupon_code}
                </p>
                <p className="text-xs text-emerald-600">🎁 Simpan baik-baik kode ini</p>
              </div>

              <div className="flex justify-center">
                <div className="p-3 rounded-2xl bg-white shadow-md border border-emerald-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR Code Kupon" className="w-36 h-36" />
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground space-y-1 bg-sky-50 rounded-xl py-3 px-4 border border-sky-100">
                <p className="font-semibold text-sky-700">📍 {EVENT_LOCATION}</p>
                <p>{EVENT_ADDRESS}</p>
                <p className="font-medium text-emerald-700">⏰ {EVENT_TIME}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button onClick={handleDownload} className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300">
              📥 Download Ulang Kupon (PDF)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setKuponData(null);
                setQrDataUrl(null);
                setError(null);
              }}
              className="w-full h-12 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              👤 Daftar Peserta Lain
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            💡 Simpan kupon ini dan tunjukkan saat hari acara.
          </p>

          {/* Footer */}
          <div className="text-center pt-2 border-t border-emerald-100">
            <p className="text-xs text-muted-foreground">
              Dibuat oleh{" "}
              <span className="font-semibold text-emerald-700">Dadan Satria</span>
              {" "}·{" "}
              <a href="tel:08813224569" className="text-emerald-600 hover:underline">08813224569</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen health-gradient flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 animate-slide-up">

        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="flex justify-center gap-6 mb-4">
            <HealthIcon icon="🌿" label="Sehat" />
            <HealthIcon icon="💪" label="Bugar" />
            <HealthIcon icon="🫀" label="Kuat" />
            <HealthIcon icon="😊" label="Bahagia" />
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2 rounded-full border border-emerald-200">
            <span>✨</span> GRATIS &bull; TERBUKA UNTUK UMUM
          </div>

          <h1 className="text-3xl font-extrabold text-emerald-900 leading-tight">
            Tetap Sehat di<br />
            <span className="text-emerald-600">Usia Produktif</span>
          </h1>

          <p className="text-sm text-emerald-700 font-medium">
            Seminar Kesehatan Gratis dengan Kupon Undian Hadiah Menarik! 🎁
          </p>
        </div>

        {/* Event Info Card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center border border-emerald-100 shadow-sm">
            <p className="text-xl mb-1">📅</p>
            <p className="text-xs font-bold text-emerald-800">Tanggal</p>
            <p className="text-xs text-gray-600 mt-1">{EVENT_DATE}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center border border-emerald-100 shadow-sm">
            <p className="text-xl mb-1">⏰</p>
            <p className="text-xs font-bold text-emerald-800">Waktu</p>
            <p className="text-xs text-gray-600 mt-1">{EVENT_TIME}</p>
          </div>
          <div className="col-span-2 bg-white/80 backdrop-blur rounded-2xl p-4 text-center border border-sky-100 shadow-sm">
            <p className="text-xl mb-1">📍</p>
            <p className="text-xs font-bold text-sky-800">Lokasi</p>
            <p className="text-xs text-gray-600 mt-1">{EVENT_LOCATION}</p>
            <p className="text-xs text-gray-500">{EVENT_ADDRESS}</p>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="border-0 shadow-2xl overflow-hidden rounded-3xl">
          <div className="hero-gradient py-4 px-6 text-center">
            <p className="text-white font-bold text-sm tracking-wide">📝 Formulir Pendaftaran</p>
            <p className="text-emerald-200 text-xs mt-0.5">Daftar sekarang, gratis!</p>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nama" className="text-sm font-semibold text-emerald-900 flex items-center gap-1">
                  👤 Nama Lengkap
                </label>
                <Input
                  id="nama"
                  name="nama"
                  placeholder="Masukkan nama lengkap Anda"
                  required
                  minLength={2}
                  disabled={pending}
                  className="h-12 rounded-xl border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 bg-emerald-50/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="no_wa" className="text-sm font-semibold text-emerald-900 flex items-center gap-1">
                  📱 Nomor WhatsApp
                </label>
                <Input
                  id="no_wa"
                  name="no_wa"
                  type="tel"
                  placeholder="08xxxxxxxxxx atau 628xx"
                  required
                  disabled={pending}
                  className="h-12 rounded-xl border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 bg-emerald-50/50"
                />
                <p className="text-xs text-muted-foreground">
                  Format: 08xx atau 628xx (tanpa tanda - atau spasi)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all hover:scale-[1.01] text-base"
                disabled={pending}
              >
                {pending ? "⏳ Mendaftar..." : "🚀 Daftar Sekarang"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tips Kesehatan */}
        <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-sky-800 text-center">💡 Tips Kesehatan Hari Ini</p>
          <p className="text-xs text-sky-700 text-center italic">
            &ldquo;Kesehatan adalah investasi terbaik yang bisa Anda lakukan untuk diri sendiri.&rdquo;
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-emerald-100 space-y-1">
          <p className="text-xs text-muted-foreground">
            Dibuat dengan ❤️ oleh{" "}
            <span className="font-semibold text-emerald-700">Dadan Satria</span>
          </p>
          <a href="tel:08813224569" className="text-xs text-emerald-600 hover:underline font-medium">
            📞 08813224569
          </a>
        </div>
      </div>
    </div>
  );
}
