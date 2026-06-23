"use client";

import { logoutAdmin } from "./actions/auth";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm">Admin Panel</span>
          <nav className="flex items-center gap-2">
            <Link
              href="/admin"
              className={`text-sm px-2 py-1 rounded ${
                pathname === "/admin"
                  ? "bg-gray-100 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/pemenang"
              className={`text-sm px-2 py-1 rounded ${
                pathname === "/admin/pemenang"
                  ? "bg-gray-100 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pemenang
            </Link>
          </nav>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
