import { NextRequest, NextResponse } from "next/server";
import { isSameOriginMutation, verifyAdminPassword } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let valid = false;
  try {
    valid = await verifyAdminPassword(password);
  } catch (error) {
    console.error("Login configuration error", error);
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
  }

  if (!valid) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(), sessionCookieOptions);
  return response;
}
