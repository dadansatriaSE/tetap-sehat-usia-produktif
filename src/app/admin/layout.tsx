"use client";

import { logoutAdmin } from "./actions/auth";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/scan", label: "Scan", icon: "📷" },
  { href: "/admin/draw", label: "Roda", icon: "🎡" },
  { href: "/admin/pemenang", label: "Pemenang", icon: "🏆" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutAdmin();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💙</span>
              <div>
                <p className="font-bold text-blue-800 text-sm leading-tight">Tetap Sehat</p>
                <p className="text-xs text-blue-600 leading-tight">di Usia Produktif</p>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all font-medium ${
                    pathname === link.href
                      ? "bg-blue-100 text-blue-800 shadow-sm"
                      : "text-gray-500 hover:text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs font-medium text-blue-700">Admin</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg"
            >
              🚪 Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-blue-100 bg-white/50 py-3 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Panel Admin &bull; Tetap Sehat di Usia Produktif &bull; Dibuat oleh{" "}
            <span className="font-semibold text-blue-700">Dadan Satria</span>
            {" "}·{" "}
            <a href="tel:08813224569" className="text-blue-600 hover:underline">08813224569</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
