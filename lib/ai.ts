/**
 * OpenRouter AI Analysis Module
 * Sends email data + OSINT to OpenRouter for LLM-based phishing classification.
 */

import OpenAI from "openai";
import type { OSINTResults } from "./virustotal";

export interface AIAnalysisResult {
  classification: "Phishing" | "Spam" | "Safe";
  confidence_score: number;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are a Level 1 SOC Analyst specializing in email security and phishing detection.

Your task is to analyze email data and OSINT threat intelligence to classify phishing alerts.

You MUST respond with ONLY valid JSON in the following format (no markdown, no extra text):
{
  "classification": "Phishing" | "Spam" | "Safe",
  "confidence_score": <integer 0-100>,
  "reasoning": "<detailed explanation of your analysis>"
}

Classification guidelines:
- "Phishing": The email is a malicious attempt to steal credentials, install malware, or deceive the user for financial gain. High confidence malicious indicators.
- "Spam": Unsolicited bulk email that is not directly malicious (marketing, promotions) but unwanted.
- "Safe": The email appears legitimate and benign — likely a false positive report.

Consider:
1. Email headers (SPF/DKIM/DMARC failures, spoofed sender domains, suspicious routing)
2. Email content (urgency language, credential requests, suspicious links, impersonation)
3. VirusTotal scores (malicious/suspicious detections for domain, IP, and URLs)
4. Sender reputation and domain age
5. Technical indicators of compromise (IOCs)`;

function getOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://securecatch.internal",
      "X-Title": "SecureCatch SOAR",
    },
  });
}

function formatOSINTForPrompt(osint: OSINTResults): string {
  const lines: string[] = ["=== VIRUSTOTAL OSINT ==="];

  lines.push(`Sender Domain: ${osint.senderDomain}`);
  if (osint.senderDomainScore) {
    const s = osint.senderDomainScore;
    lines.push(
      `  Domain Score: ${s.malicious} malicious, ${s.suspicious} suspicious, ${s.harmless} harmless (of ${s.total} engines)`
    );
    if (s.reputation !== undefined) lines.push(`  Reputation: ${s.reputation}`);
  } else {
    lines.push("  Domain Score: Not available");
  }

  if (osint.senderIp) {
    lines.push(`Sender IP: ${osint.senderIp}`);
    if (osint.senderIpScore) {
      const s = osint.senderIpScore;
      lines.push(
        `  IP Score: ${s.malicious} malicious, ${s.suspicious} suspicious, ${s.harmless} harmless (of ${s.total} engines)`
      );
    } else {
      lines.push("  IP Score: Not available");
    }
  }

  if (osint.urlResults.length > 0) {
    lines.push("Extracted URLs:");
    for (const result of osint.urlResults) {
      lines.push(`  URL: ${result.url}`);
      if (result.score) {
        const s = result.score;
        lines.push(
          `    Score: ${s.malicious} malicious, ${s.suspicious} suspicious, ${s.harmless} harmless`
        );
      } else if (result.error) {
        lines.push(`    Error: ${result.error}`);
      } else {
        lines.push("    Score: Not available");
      }
    }
  }

  return lines.join("\n");
}

/**
 * Analyzes email data and OSINT using the configured OpenRouter LLM.
 * Returns a structured classification result.
 */
export async function analyzeEmail(params: {
  headers: Record<string, string>;
  bodyText: string;
  bodyHtml: string;
  extractedLinks: string[];
  osint: OSINTResults;
}): Promise<AIAnalysisResult> {
  const client = getOpenRouterClient();
  const model = process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet";

  const { headers, bodyText, extractedLinks, osint } = params;

  // Build the analysis prompt
  const keyHeaders = [
    "From",
    "To",
    "Subject",
    "Date",
    "Return-Path",
    "Reply-To",
    "X-Originating-IP",
    "Received-SPF",
    "DKIM-Signature",
    "Authentication-Results",
  ];

  const filteredHeaders = Object.entries(headers)
    .filter(([key]) => keyHeaders.some((k) => key.toLowerCase().includes(k.toLowerCase())))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const userPrompt = `Please analyze this phishing alert and classify it:

=== EMAIL HEADERS ===
${filteredHeaders}

=== EMAIL BODY (TEXT) ===
${bodyText.slice(0, 2000)}

=== EXTRACTED LINKS ===
${extractedLinks.slice(0, 10).join("\n") || "None found"}

${formatOSINTForPrompt(osint)}

Classify this email and provide your detailed reasoning.`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content ?? "";

  // Parse JSON response
  try {
    // Strip any markdown code fences if present
    const jsonStr = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonStr) as AIAnalysisResult;

    // Validate the response structure
    if (
      !["Phishing", "Spam", "Safe"].includes(parsed.classification) ||
      typeof parsed.confidence_score !== "number" ||
      typeof parsed.reasoning !== "string"
    ) {
      throw new Error("Invalid AI response structure");
    }

    return {
      classification: parsed.classification,
      confidence_score: Math.min(100, Math.max(0, Math.round(parsed.confidence_score))),
      reasoning: parsed.reasoning,
    };
  } catch {
    console.error("Failed to parse AI response:", content);
    // Return a fallback response
    return {
      classification: "Spam",
      confidence_score: 0,
      reasoning: `AI analysis failed to parse response. Raw output: ${content.slice(0, 500)}`,
    };
  }
}
