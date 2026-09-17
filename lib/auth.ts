import "server-only";

import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

interface PasswordHashParts {
  cost: number;
  blockSize: number;
  parallelization: number;
  salt: Buffer;
  expected: Buffer;
}

function parsePasswordHash(value: string | undefined): PasswordHashParts | null {
  if (!value) return null;
  const [algorithm, cost, blockSize, parallelization, saltHex, hashHex, extra] = value.split("$");
  if (algorithm !== "scrypt" || extra) return null;
  const parsed = {
    cost: Number(cost),
    blockSize: Number(blockSize),
    parallelization: Number(parallelization),
    salt: Buffer.from(saltHex ?? "", "hex"),
    expected: Buffer.from(hashHex ?? "", "hex"),
  };
  if (
    !Number.isInteger(parsed.cost) ||
    !Number.isInteger(parsed.blockSize) ||
    !Number.isInteger(parsed.parallelization) ||
    parsed.cost < 16384 ||
    parsed.blockSize < 8 ||
    parsed.parallelization < 1 ||
    parsed.salt.length < 16 ||
    parsed.expected.length !== 64
  ) {
    return null;
  }
  return parsed;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const parts = parsePasswordHash(process.env.SECURECATCH_ADMIN_PASSWORD_HASH);
  if (!parts || password.length < 12 || password.length > 256) return false;
  const actual = await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      parts.salt,
      parts.expected.length,
      {
        N: parts.cost,
        r: parts.blockSize,
        p: parts.parallelization,
        maxmem: 128 * 1024 * 1024,
      },
      (error, derivedKey) => (error ? reject(error) : resolve(derivedKey as Buffer))
    );
  });
  return timingSafeEqual(actual, parts.expected);
}

export function isSameOriginMutation(request: NextRequest): boolean {
  if (request.headers.get("x-securecatch-request") === "1") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export async function authorizeApiRequest(
  request: NextRequest,
  options: { mutation?: boolean } = {}
): Promise<NextResponse | null> {
  let authenticated = false;
  try {
    authenticated = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  } catch (error) {
    console.error("Session configuration error", error);
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
  }
  if (!authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (options.mutation && !isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  return null;
}
