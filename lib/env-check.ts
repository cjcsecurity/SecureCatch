export const REQUIRED_ENV_VARS = ["SECURECATCH_API_TOKEN"] as const;

export const OPTIONAL_ENV_VARS = [
  "JIRA_HOST",
  "JIRA_EMAIL",
  "JIRA_API_TOKEN",
  "JIRA_SECOPS_PROJECT_KEY",
  "JIRA_CSIRT_EMAIL",
  "GOOGLE_CLIENT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_SUBJECT_EMAIL",
  "GOOGLE_ADMIN_EMAIL",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "VIRUSTOTAL_API_KEY",
  "DATABASE_URL",
] as const;

const MIN_API_TOKEN_LENGTH = 32;

let hasValidated = false;

function isUnset(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

export function validateEnv(): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return;
  }

  if (hasValidated) {
    return;
  }

  hasValidated = true;

  const apiToken = process.env.SECURECATCH_API_TOKEN?.trim();

  if (!apiToken) {
    console.error(
      "SecureCatch startup failed: SECURECATCH_API_TOKEN is required and must be at least 32 characters long.",
    );
    process.exit(1);
    return;
  }

  if (apiToken.length < MIN_API_TOKEN_LENGTH) {
    console.error(
      `SecureCatch startup failed: SECURECATCH_API_TOKEN must be at least ${MIN_API_TOKEN_LENGTH} characters long.`,
    );
    process.exit(1);
    return;
  }

  const missingOptionalVars = OPTIONAL_ENV_VARS.filter((name) =>
    isUnset(process.env[name]),
  );

  if (missingOptionalVars.length > 0) {
    console.warn(
      [
        "SecureCatch startup warning: optional environment variables are unset. Related features may be unavailable:",
        ...missingOptionalVars.map((name) => `- ${name}`),
      ].join("\n"),
    );
  }
}
