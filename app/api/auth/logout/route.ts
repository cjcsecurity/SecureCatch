import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(request: NextRequest) {
  const denied = await authorizeApiRequest(request, { mutation: true });
  if (denied) return denied;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
