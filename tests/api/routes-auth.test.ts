/**
 * Integration-lite contract tests for protected API routes.
 *
 * Goal: prove that the bearer-token gate is actually wired into each
 * route handler. If someone removes `requireApiToken(...)` from a route,
 * these tests must fail.
 *
 * We import the route handlers directly (no HTTP server) and call them
 * with synthetic `NextRequest` objects. We mock `@/lib/db` because the
 * Prisma client is generated at build time and is not present in CI/test
 * runs — importing the route would otherwise blow up at module load on
 * `import { db } from "@/lib/db"`. The mock returns benign empty data so
 * the handlers reach their normal happy paths once auth passes; auth
 * failure cases never touch the mock at all.
 *
 * `lib/google.ts` and `lib/jira.ts` only throw when their functions are
 * *called*, so they don't need mocking for the auth-only assertions.
 * The remediate-route happy-path test uses a non-existent alert id so
 * the handler returns a 404 from the mocked DB before any external API
 * is invoked.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock the Prisma client BEFORE importing the route handlers. Vitest
// hoists vi.mock calls, but we keep the import below for clarity.
vi.mock("@/lib/db", () => ({
  db: {
    phishingAlert: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
      update: vi.fn(async () => ({})),
    },
  },
}));

// Import after the mock is registered.
import { GET as alertsGET } from "@/app/api/alerts/route";
import { POST as remediatePOST } from "@/app/api/remediate/[id]/route";

const TOKEN_ENV = "SECURECATCH_API_TOKEN";
const VALID_TOKEN = "test-token-1234567890";

function makeGet(url: string, authHeader?: string): NextRequest {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return new NextRequest(new Request(url, { method: "GET", headers }));
}

function makePost(url: string, body: unknown, authHeader?: string): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  if (authHeader) headers.set("authorization", authHeader);
  return new NextRequest(
    new Request(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );
}

describe("protected API routes — auth contract", () => {
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

  describe("GET /api/alerts", () => {
    it("returns 401 when no bearer token is provided", async () => {
      process.env[TOKEN_ENV] = VALID_TOKEN;

      const res = await alertsGET(makeGet("http://localhost/api/alerts"));

      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "unauthorized" });
    });

    it("returns 503 when bearer is provided but SECURECATCH_API_TOKEN is unset", async () => {
      delete process.env[TOKEN_ENV];

      const res = await alertsGET(
        makeGet("http://localhost/api/alerts", `Bearer ${VALID_TOKEN}`),
      );

      expect(res.status).toBe(503);
      await expect(res.json()).resolves.toEqual({ error: "server misconfigured" });
    });

    it("passes auth and reaches business logic with a valid bearer token", async () => {
      process.env[TOKEN_ENV] = VALID_TOKEN;

      const res = await alertsGET(
        makeGet("http://localhost/api/alerts", `Bearer ${VALID_TOKEN}`),
      );

      // Crucially NOT 401 / 503 — the gate let us through.
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(503);
      // The mocked DB returns []; the handler should serialize that.
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ alerts: [] });
    });

    it("returns 401 when bearer token is the wrong value", async () => {
      process.env[TOKEN_ENV] = VALID_TOKEN;
      const wrong = "x".repeat(VALID_TOKEN.length);

      const res = await alertsGET(
        makeGet("http://localhost/api/alerts", `Bearer ${wrong}`),
      );

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/remediate/[id]", () => {
    const params = Promise.resolve({ id: "nonexistent-id" });

    it("returns 401 when no bearer token is provided", async () => {
      process.env[TOKEN_ENV] = VALID_TOKEN;

      const res = await remediatePOST(
        makePost("http://localhost/api/remediate/abc", { action: "CLOSE" }),
        { params },
      );

      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "unauthorized" });
    });

    it("returns 503 when bearer is provided but SECURECATCH_API_TOKEN is unset", async () => {
      delete process.env[TOKEN_ENV];

      const res = await remediatePOST(
        makePost(
          "http://localhost/api/remediate/abc",
          { action: "CLOSE" },
          `Bearer ${VALID_TOKEN}`,
        ),
        { params },
      );

      expect(res.status).toBe(503);
      await expect(res.json()).resolves.toEqual({ error: "server misconfigured" });
    });

    it("passes auth with a valid bearer (reaches the handler past the gate)", async () => {
      process.env[TOKEN_ENV] = VALID_TOKEN;

      const res = await remediatePOST(
        makePost(
          "http://localhost/api/remediate/abc",
          { action: "CLOSE" },
          `Bearer ${VALID_TOKEN}`,
        ),
        { params },
      );

      // The gate let us through, so the response should NOT be the auth
      // 401 / config 503. Our mocked findUnique returns null, so the
      // handler should respond with a 404 ("Alert not found"). What
      // matters is that we got past the gate.
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(503);
      expect(res.status).toBe(404);
    });

    it("returns 401 when bearer token is the wrong value", async () => {
      process.env[TOKEN_ENV] = VALID_TOKEN;
      const wrong = "x".repeat(VALID_TOKEN.length);

      const res = await remediatePOST(
        makePost(
          "http://localhost/api/remediate/abc",
          { action: "CLOSE" },
          `Bearer ${wrong}`,
        ),
        { params },
      );

      expect(res.status).toBe(401);
    });
  });
});
