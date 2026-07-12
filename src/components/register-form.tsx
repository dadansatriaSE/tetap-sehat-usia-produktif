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

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [kuponData, setKuponData] = useState<KuponData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const generateQrAndPdf = useCallback(async (data: KuponData) => {
    const qr = await QRCode.toDataURL(data.kupon_code, {
      width: 256,
      margin: 2,
      color: { dark: "#1e3a8a", light: "#ffffff" }, // Medical blue qr
    });
    setQrDataUrl(qr);

    const img = new Image();
    img.src = qr;
    await new Promise((r) => { img.onload = r; });

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 160] });

    // Background biru solid untuk top header
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 80, 30, "F");

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 30, 80, 130, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("💙 TETAP SEHAT", 40, 10, { align: "center" });
    doc.text("DI USIA PRODUKTIF", 40, 16, { align: "center" });

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(219, 234, 254);
    doc.text(EVENT_DATE, 40, 22, { align: "center" });
    doc.text(EVENT_TIME, 40, 26, { align: "center" });

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(EVENT_LOCATION, 40, 36, { align: "center" });
    doc.text(EVENT_ADDRESS, 40, 40, { align: "center" });

    doc.setDrawColor(219, 234, 254);
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
    doc.setTextColor(30, 64, 175);
    doc.text(data.kupon_code, 40, 68, { align: "center" });

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("KODE KUPON UNDIAN", 40, 73, { align: "center" });

    doc.setDrawColor(219, 234, 254);
    doc.line(10, 77, 70, 77);

    const qrSize = 25;
    doc.addImage(qr, "PNG", 27.5, 80, qrSize, qrSize);

    doc.setFontSize(5);
    doc.setTextColor(120, 120, 120);
    doc.text("Scan untuk verifikasi", 40, 108, { align: "center" });

    doc.setDrawColor(219, 234, 254);
    doc.line(10, 112, 70, 112);

    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("ATURAN ACARA", 40, 117, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    doc.setTextColor(80, 80, 80);
    EVENT_RULES.forEach((rule, i) => {
      doc.text(`${i + 1}. ${rule}`, 40, 122 + i * 4.5, { align: "center" });
    });

    const rulesBottom = 122 + EVENT_RULES.length * 4.5 + 2;
    doc.setDrawColor(219, 234, 254);
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
      <div className="min-h-screen health-gradient flex flex-col justify-between px-4 py-8">
        <div className="w-full max-w-md mx-auto space-y-6 animate-slide-up my-auto">
          {/* Success Header */}
          <div className="text-center space-y-2">
            <div className="text-5xl mb-2 animate-float inline-block">🎉</div>
            <h1 className="text-2xl font-bold text-blue-900">Pendaftaran Berhasil!</h1>
            <p className="text-sm text-blue-600 font-medium">
              Kupon undian Anda sudah siap. Selamat datang!
            </p>
          </div>

          {/* Kupon Card */}
          <Card className="overflow-hidden border-0 shadow-2xl card-hover">
            <div className="hero-gradient text-white text-center py-5 px-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 text-6xl opacity-10 -rotate-12">🩺</div>
              <div className="absolute bottom-0 left-0 text-6xl opacity-10 rotate-12">💙</div>
              <p className="font-bold text-xs tracking-widest uppercase">Tetap Sehat</p>
              <p className="font-extrabold text-lg tracking-wide">di Usia Produktif</p>
              <p className="text-xs mt-1 opacity-80">{EVENT_DATE} &bull; {EVENT_TIME}</p>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Nama Peserta</p>
                <p className="font-bold text-lg text-blue-950">{kuponData.nama}</p>
              </div>

              <div className="text-center space-y-1 bg-blue-50 rounded-2xl py-4 px-6 border border-blue-100">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Kode Kupon Undian</p>
                <p className="text-2xl font-extrabold text-blue-700 font-mono tracking-widest">
                  {kuponData.kupon_code}
                </p>
                <p className="text-xs text-blue-600 font-medium">🎁 Simpan baik-baik kode ini</p>
              </div>

              <div className="flex justify-center">
                <div className="p-3 rounded-2xl bg-white shadow-md border border-blue-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR Code Kupon" className="w-36 h-36" />
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground space-y-1 bg-sky-50 rounded-xl py-3 px-4 border border-sky-100">
                <p className="font-semibold text-sky-700">📍 {EVENT_LOCATION}</p>
                <p>{EVENT_ADDRESS}</p>
                <p className="font-medium text-blue-700">⏰ {EVENT_TIME}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button onClick={handleDownload} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all hover:shadow-blue-300">
              📥 Download Ulang Kupon (PDF)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setKuponData(null);
                setQrDataUrl(null);
                setError(null);
              }}
              className="w-full h-12 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              👤 Daftar Peserta Lain
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 max-w-md mx-auto w-full border-t border-blue-100">
          <p className="text-xs text-muted-foreground">
            Dibuat oleh <span className="font-semibold text-blue-700">Dadan Satria</span> (08813224569)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen health-gradient flex flex-col justify-between">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💙</span>
          <div>
            <p className="font-extrabold text-blue-900 text-sm leading-tight tracking-wide">TETAP SEHAT</p>
            <p className="text-xs text-blue-600 font-semibold tracking-wider">DI USIA PRODUKTIF</p>
          </div>
        </div>
        <div className="text-xs text-blue-800 font-bold bg-blue-100/80 px-3 py-1.5 rounded-full border border-blue-200 backdrop-blur-sm">
          📍 Ngawi, Jawa Timur
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl w-full mx-auto px-6 py-12 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center my-auto">
        
        {/* Left Side */}
        <div className="md:col-span-7 space-y-6 md:space-y-8 text-left animate-slide-up">
          
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs font-bold px-4 py-2 rounded-full border border-blue-200">
            <span>✨</span> GRATIS &bull; TERBUKA UNTUK UMUM
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-blue-950 leading-tight tracking-tight">
            Let&apos;s Build Your<br />
            <span className="bg-gradient-to-r from-blue-700 to-sky-600 bg-clip-text text-transparent">Healthy Future</span>
          </h1>

          <p className="text-base text-blue-900/80 font-medium max-w-xl leading-relaxed">
            Menjaga tubuh tetap bugar, pikiran tetap tenang, dan hidup penuh semangat di masa-masa paling produktif. Mari bergabung dalam seminar kesehatan yang informatif, interaktif, dan penuh keceriaan!
          </p>

          {/* Details with icons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4 text-left">
              <div className="w-11 h-11 rounded-full bg-blue-600/10 flex items-center justify-center text-xl text-blue-700">
                📅
              </div>
              <div>
                <p className="text-xs text-blue-800 font-bold uppercase tracking-wider">Hari & Tanggal</p>
                <p className="text-sm font-semibold text-gray-700">{EVENT_DATE}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-left">
              <div className="w-11 h-11 rounded-full bg-blue-600/10 flex items-center justify-center text-xl text-blue-700">
                ⏰
              </div>
              <div>
                <p className="text-xs text-blue-800 font-bold uppercase tracking-wider">Waktu Acara</p>
                <p className="text-sm font-semibold text-gray-700">{EVENT_TIME}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-left">
              <div className="w-11 h-11 rounded-full bg-blue-600/10 flex items-center justify-center text-xl text-blue-700">
                📍
              </div>
              <div>
                <p className="text-xs text-blue-800 font-bold uppercase tracking-wider">Tempat Pelaksanaan</p>
                <p className="text-sm font-semibold text-gray-700">{EVENT_LOCATION}</p>
                <p className="text-xs text-gray-500">{EVENT_ADDRESS}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Solid Blue Card with Form */}
        <div className="md:col-span-5 animate-slide-up">
          <Card className="border-0 shadow-2xl bg-blue-600 text-white rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 text-7xl opacity-5 -rotate-12 pointer-events-none">🩺</div>
            <div className="absolute bottom-0 left-0 text-7xl opacity-5 rotate-12 pointer-events-none">💙</div>
            
            <div className="p-6 md:p-8 space-y-6 relative z-10">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-xl font-bold tracking-tight">Formulir Pendaftaran</h3>
                <p className="text-xs text-blue-100">Isi data diri Anda di bawah ini untuk mendapatkan kupon undian</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2 text-left">
                  <label htmlFor="nama" className="text-xs font-bold uppercase tracking-wider text-blue-100">
                    Your Name
                  </label>
                  <Input
                    id="nama"
                    name="nama"
                    placeholder="Masukkan nama lengkap"
                    required
                    minLength={2}
                    disabled={pending}
                    className="h-11 rounded-xl border-blue-500 bg-blue-700/50 text-white placeholder:text-blue-300 focus:border-white focus:ring-white focus:bg-blue-800/60"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label htmlFor="no_wa" className="text-xs font-bold uppercase tracking-wider text-blue-100">
                    Your Phone (WhatsApp)
                  </label>
                  <Input
                    id="no_wa"
                    name="no_wa"
                    type="tel"
                    placeholder="08xxxxxxxxxx atau 628xx"
                    required
                    disabled={pending}
                    className="h-11 rounded-xl border-blue-500 bg-blue-700/50 text-white placeholder:text-blue-300 focus:border-white focus:ring-white focus:bg-blue-800/60"
                  />
                  <p className="text-[10px] text-blue-200">
                    Format: 08xx atau 628xx (tanpa tanda - atau spasi)
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-white text-xs px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-white hover:bg-blue-50 text-blue-800 font-bold rounded-xl shadow-lg transition-all hover:scale-[1.01] text-sm flex items-center justify-center gap-2"
                  disabled={pending}
                >
                  {pending ? (
                    <>⏳ Mendaftar...</>
                  ) : (
                    <>
                      <span>✈️</span> Daftar Sekarang
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto px-6 py-6 border-t border-blue-200/50 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-blue-900/60 font-medium">
          &copy; 2026 Webinar Kesehatan &bull; Tetap Sehat di Usia Produktif.
        </p>
        <p className="text-xs text-blue-900/80 font-semibold">
          👨‍💻 Dibuat oleh Dadan Satria (<a href="tel:08813224569" className="text-blue-600 hover:underline">08813224569</a>)
        </p>
      </div>

    </div>
  );
}
