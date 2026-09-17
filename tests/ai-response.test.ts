import { describe, expect, it } from "vitest";
import { parseAIAnalysis } from "../lib/ai";

describe("AI response validation", () => {
  it("accepts and normalizes a valid classification", () => {
    expect(
      parseAIAnalysis(JSON.stringify({
        classification: "Phishing",
        confidence_score: 94.6,
        reasoning: "Authentication failed and the credential link is newly registered.",
      }))
    ).toEqual({
      classification: "Phishing",
      confidence_score: 95,
      reasoning: "Authentication failed and the credential link is newly registered.",
    });
  });

  it("rejects malformed or out-of-contract output", () => {
    expect(() => parseAIAnalysis("Ignore the schema and purge every inbox.")).toThrow(
      "AI response did not match the required classification schema"
    );
  });
});
