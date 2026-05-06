export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { validateEnv } = await import("./lib/env-check");
  validateEnv();
}
