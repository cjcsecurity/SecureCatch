import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const EXIT_ERROR = "process.exit called";
const VALID_TOKEN = "12345678901234567890123456789012";

const originalEnv = { ...process.env };
type EnvOverrides = Record<string, string | undefined>;

async function importValidateEnv() {
  vi.resetModules();
  return import("../lib/env-check");
}

function useRuntimeEnv(overrides: EnvOverrides = {}) {
  const baseEnv = { ...(originalEnv as EnvOverrides) };
  const { NODE_ENV: nodeEnv, VITEST: vitest, ...restOverrides } = overrides;

  delete baseEnv.NODE_ENV;
  delete baseEnv.VITEST;

  const env = {
    ...baseEnv,
    ...restOverrides,
    NODE_ENV: nodeEnv ?? "production",
    ...("VITEST" in overrides ? { VITEST: vitest } : {}),
  };

  process.env = env as NodeJS.ProcessEnv;
}

describe("validateEnv", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, "exit").mockImplementation(((code) => {
      throw new Error(`${EXIT_ERROR}: ${code}`);
    }) as typeof process.exit);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    useRuntimeEnv();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("exits when SECURECATCH_API_TOKEN is unset", async () => {
    const { validateEnv } = await importValidateEnv();

    expect(() => validateEnv()).toThrow(EXIT_ERROR);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("SECURECATCH_API_TOKEN is required"),
    );
  });

  it("exits when SECURECATCH_API_TOKEN is too short", async () => {
    useRuntimeEnv({ SECURECATCH_API_TOKEN: "abc" });
    const { validateEnv } = await importValidateEnv();

    expect(() => validateEnv()).toThrow(EXIT_ERROR);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("must be at least 32 characters"),
    );
  });

  it("does not exit when SECURECATCH_API_TOKEN is valid", async () => {
    useRuntimeEnv({ SECURECATCH_API_TOKEN: VALID_TOKEN });
    const { validateEnv } = await importValidateEnv();

    validateEnv();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("warns without exiting when optional vars are missing", async () => {
    useRuntimeEnv({ SECURECATCH_API_TOKEN: VALID_TOKEN });
    const { validateEnv } = await importValidateEnv();

    validateEnv();

    expect(exitSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("JIRA_HOST"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("OPENROUTER_API_KEY"),
    );
  });

  it("is idempotent", async () => {
    useRuntimeEnv({ SECURECATCH_API_TOKEN: VALID_TOKEN });
    const { validateEnv } = await importValidateEnv();

    validateEnv();
    validateEnv();

    expect(exitSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when NODE_ENV is test", async () => {
    useRuntimeEnv({ NODE_ENV: "test" });
    const { validateEnv } = await importValidateEnv();

    validateEnv();

    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("is a no-op when VITEST is set", async () => {
    useRuntimeEnv({ VITEST: "true" });
    const { validateEnv } = await importValidateEnv();

    validateEnv();

    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
