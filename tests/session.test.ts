import { beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "../lib/session";

describe("signed sessions", () => {
  beforeEach(() => {
    process.env.SECURECATCH_SESSION_SECRET = "test-session-secret-with-at-least-32-characters";
  });

  it("accepts a valid unexpired token", async () => {
    const now = Date.UTC(2026, 8, 17, 12);
    const token = await createSessionToken(now);
    await expect(verifySessionToken(token, now + 60_000)).resolves.toBe(true);
  });

  it("rejects a modified signature", async () => {
    const token = await createSessionToken();
    const [payload, signature] = token.split(".");
    const replacement = signature.endsWith("A") ? "B" : "A";
    await expect(verifySessionToken(`${payload}.${signature.slice(0, -1)}${replacement}`)).resolves.toBe(false);
  });

  it("rejects an expired token", async () => {
    const now = Date.UTC(2026, 8, 17, 12);
    const token = await createSessionToken(now);
    await expect(verifySessionToken(token, now + 9 * 60 * 60 * 1000)).resolves.toBe(false);
  });
});
