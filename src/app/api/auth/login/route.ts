// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signSession, type AuthUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const ok =
    (email ?? "").toLowerCase().trim() === "jo4quinvel4squez@gmail.com" &&
    (password ?? "") === "Sugus1234@@";

  if (!ok) return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });

  const user: AuthUser = {
    id: "1",
    name: "Joaquin",
    email: "jo4quinvel4squez@gmail.com",
    role: "admin",
  };

  const token = signSession(user);
  const jar = await cookies();
  jar.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return NextResponse.json({ user });
}