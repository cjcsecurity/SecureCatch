import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export function requireApiToken(req: NextRequest): NextResponse | null {
  const expected = process.env.SECURECATCH_API_TOKEN;
  if (!expected) return NextResponse.json({error: "server misconfigured"}, {status: 503});
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return NextResponse.json({error: "unauthorized"}, {status: 401});
  const token = header.slice(7);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({error: "unauthorized"}, {status: 401});
  return null;
}
