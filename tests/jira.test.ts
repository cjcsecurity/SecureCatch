import { describe, expect, it } from "vitest";
import { buildPhishingJql, parseTicketDescription } from "../lib/jira";

describe("Jira ingestion configuration", () => {
  it("uses a portable default query", () => {
    const jql = buildPhishingJql("SECOPS");
    expect(jql).toContain('project = "SECOPS"');
    expect(jql).toContain('summary ~ "User-reported phishing"');
    expect(jql).toContain("statusCategory != Done");
  });

  it("accepts an explicit workflow query", () => {
    expect(buildPhishingJql("SECOPS", " labels = phishing-intake ")).toBe(
      "labels = phishing-intake"
    );
  });

  it("parses the expected report fields", () => {
    const parsed = parseTicketDescription(
      "Activity date: Wednesday, Dec 10, 2025, 9:01:48 PM (UTC)\n" +
        "Actor: sender@example.net\n" +
        "Reported by: analyst@example.com"
    );
    expect(parsed.actorEmail).toBe("sender@example.net");
    expect(parsed.reportedByEmail).toBe("analyst@example.com");
    expect(parsed.activityDate).toBeInstanceOf(Date);
  });
});
