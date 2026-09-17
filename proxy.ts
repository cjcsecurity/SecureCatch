import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login"]);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let authenticated = false;
  let configured = true;

  try {
    authenticated = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  } catch {
    configured = false;
  }

  if (PUBLIC_PATHS.has(pathname)) {
    if (pathname === "/login" && authenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!configured && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
  }
  if (!authenticated && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!authenticated) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
