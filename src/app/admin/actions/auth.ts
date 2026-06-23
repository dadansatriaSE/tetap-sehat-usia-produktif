"use server";

import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";
const MAX_AGE = 60 * 60 * 12; // 12 hours

export type LoginResult = { success: false; error: string } | { success: true };

export async function loginAdmin(
  _prev: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const password = formData.get("password") as string;

  if (!password) {
    return { success: false, error: "Password harus diisi." };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { success: false, error: "Konfigurasi admin tidak ditemukan." };
  }

  if (password !== adminPassword) {
    return { success: false, error: "Password salah." };
  }

  const token = crypto.randomBytes(32).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  return { success: true };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
