/**
 * Unit tests for `lib/auth/api-token.ts` — the bearer-token gate
 * used by every protected API route.
 *
 * These tests exercise every branch of `requireApiToken` so that any
 * regression in the helper (or accidental relaxation of the timing-safe
 * comparison) is caught at CI time. Each case constructs a real
 * `NextRequest` rather than mocking, so we exercise the actual
 * `Headers`/`Request` machinery the route handlers see at runtime.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { requireApiToken } from "@/lib/auth/api-token";

const TOKEN_ENV = "SECURECATCH_API_TOKEN";
const VALID_TOKEN = "test-token-1234567890";

function makeRequest(authHeader?: string): NextRequest {
  const headers = new Headers();
  if (authHeader !== undefined) headers.set("authorization", authHeader);
  return new NextRequest(
    new Request("http://localhost/api/test", { method: "GET", headers }),
  );
}

describe("requireApiToken", () => {
  let originalToken: string | undefined;

  beforeEach(() => {
    originalToken = process.env[TOKEN_ENV];
  });

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env[TOKEN_ENV];
    } else {
      process.env[TOKEN_ENV] = originalToken;
    }
  });

  it("returns 503 when SECURECATCH_API_TOKEN is unset", async () => {
    delete process.env[TOKEN_ENV];

    const res = requireApiToken(makeRequest(`Bearer ${VALID_TOKEN}`));

    expect(res).not.toBeNull();
    expect(res!.status).toBe(503);
    await expect(res!.json()).resolves.toEqual({ error: "server misconfigured" });
  });

  it("returns 401 when no Authorization header is present", async () => {
    process.env[TOKEN_ENV] = VALID_TOKEN;

    const res = requireApiToken(makeRequest());

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    await expect(res!.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("returns 401 when Authorization header does not start with 'Bearer '", async () => {
    process.env[TOKEN_ENV] = VALID_TOKEN;

    const res = requireApiToken(makeRequest(`Basic ${VALID_TOKEN}`));

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    await expect(res!.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("returns 401 when bearer token has the wrong length (guards timingSafeEqual)", async () => {
    // timingSafeEqual throws synchronously if the two buffers are different
    // lengths — the length pre-check in requireApiToken is what makes a
    // wrong-length token return 401 cleanly instead of 500. If someone
    // removes the length check, this assertion will fail (the helper will
    // throw instead of returning a NextResponse).
    process.env[TOKEN_ENV] = VALID_TOKEN;

    const res = requireApiToken(makeRequest(`Bearer short`));

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    await expect(res!.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("returns 401 when bearer token is the right length but the wrong value", async () => {
    process.env[TOKEN_ENV] = VALID_TOKEN;
    const wrongSameLength = "x".repeat(VALID_TOKEN.length);
    expect(wrongSameLength.length).toBe(VALID_TOKEN.length);

    const res = requireApiToken(makeRequest(`Bearer ${wrongSameLength}`));

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    await expect(res!.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("returns null (pass-through) when the bearer token matches exactly", () => {
    process.env[TOKEN_ENV] = VALID_TOKEN;

    const res = requireApiToken(makeRequest(`Bearer ${VALID_TOKEN}`));

    expect(res).toBeNull();
  });

  it("returns 401 for empty bearer token (Bearer with no value)", async () => {
    process.env[TOKEN_ENV] = VALID_TOKEN;

    const res = requireApiToken(makeRequest("Bearer "));

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    await expect(res!.json()).resolves.toEqual({ error: "unauthorized" });
  });
});
