const SESSION_VERSION = 1;
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export const SESSION_COOKIE_NAME = "securecatch_session";

interface SessionPayload {
  version: number;
  issuedAt: number;
  expiresAt: number;
}

function sessionSecret(): string {
  const secret = process.env.SECURECATCH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SECURECATCH_SESSION_SECRET must be at least 32 characters");
  }
  return secret;
}

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function decodeBase64Url(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (
      parsed.version !== SESSION_VERSION ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(nowMs = Date.now()): Promise<string> {
  const issuedAt = Math.floor(nowMs / 1000);
  const payload = encodePayload({
    version: SESSION_VERSION,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS,
  });
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    new TextEncoder().encode(payload)
  );
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined, nowMs = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [payloadPart, signaturePart, extra] = token.split(".");
  if (!payloadPart || !signaturePart || extra) return false;

  const payload = decodePayload(payloadPart);
  const now = Math.floor(nowMs / 1000);
  if (!payload || payload.issuedAt > now + 60 || payload.expiresAt <= now) return false;

  try {
    const signature = decodeBase64Url(signaturePart);
    if (signature.length !== 32 || encodeBase64Url(signature) !== signaturePart) return false;
    return await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      asArrayBuffer(signature),
      new TextEncoder().encode(payloadPart)
    );
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
