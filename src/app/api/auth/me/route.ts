// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  if (!token) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const user = verifySession(token);
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  return NextResponse.json({ user });
}