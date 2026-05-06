/**
 * Google Workspace API Integration
 * - Alert Center API: Find messageId and rfc2822MessageId for phishing alerts
 * - Gmail API (Domain-Wide Delegation): Fetch raw email content
 * - Admin SDK Directory API: List all users for domain-wide purge
 */

import { google } from "googleapis";

export interface EmailData {
  googleMessageId: string;
  rfc2822MessageId: string;
  headers: Record<string, string>;
  bodyText: string;
  bodyHtml: string;
  extractedLinks: string[];
  senderIp: string | null;
  senderDomain: string;
}

export interface AlertCenterResult {
  googleMessageId: string;
  rfc2822MessageId: string;
}

function getGoogleAuth(subject?: string) {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google credentials: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY");
  }

  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/admin.directory.user.readonly",
    "https://www.googleapis.com/auth/apps.alerts",
  ];

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes,
    subject: subject ?? process.env.GOOGLE_SUBJECT_EMAIL,
  });
}

/**
 * Queries Google Workspace Alert Center API to find exact messageId and rfc2822MessageId
 * for a phishing alert based on sender email and activity date.
 */
export async function findAlertByActor(
  actorEmail: string,
  activityDate: Date | null
): Promise<AlertCenterResult | null> {
  const auth = getGoogleAuth(process.env.GOOGLE_ADMIN_EMAIL);
  const alertCenter = google.alertcenter({ version: "v1beta1", auth });

  try {
    const filter = `type = "USER_REPORTED_PHISHING"`;
    const response = await alertCenter.alerts.list({
      filter,
      pageSize: 50,
    });

    const alerts = response.data.alerts ?? [];

    for (const alert of alerts) {
      const alertData = alert.data as Record<string, unknown> | undefined;
      if (!alertData) continue;

      // Check if this alert matches our actor
      const messages = alertData.messages as Array<Record<string, unknown>> | undefined;
      if (!messages) continue;

      for (const msg of messages) {
        const id = msg.messageId as string | undefined;
        const rfc = msg.rfc2822MessageId as string | undefined;

        if (id && rfc) {
          // Match by actor email in the alert metadata
          const md = alertData.metadata as Record<string, unknown> | undefined;
          const actor = (md?.actor ?? alertData.actor) as string | undefined;

          if (actor && actor.toLowerCase() === actorEmail.toLowerCase()) {
            return { googleMessageId: id, rfc2822MessageId: rfc };
          }
        }
      }
    }

    // Fallback: try to find by date proximity if no actor match
    return null;
  } catch (error) {
    console.error("Alert Center API error:", error);
    throw new Error("Alert Center API failed");
  }
}

/**
 * Fetches full raw email data from Gmail API using the message ID.
 * Uses Domain-Wide Delegation to impersonate the reported user.
 */
export async function fetchEmailData(
  googleMessageId: string,
  userEmail: string
): Promise<EmailData> {
  const auth = getGoogleAuth(userEmail);
  const gmail = google.gmail({ version: "v1", auth });

  try {
    const response = await gmail.users.messages.get({
      userId: "me",
      id: googleMessageId,
      format: "full",
    });

    const message = response.data;
    const payload = message.payload;

    if (!payload) {
      throw new Error("No payload in Gmail message");
    }

    // Extract headers
    const headers: Record<string, string> = {};
    for (const header of payload.headers ?? []) {
      if (header.name && header.value) {
        headers[header.name] = header.value;
      }
    }

    // Extract rfc2822MessageId from headers
    const rfc2822MessageId = headers["Message-ID"] ?? headers["Message-Id"] ?? googleMessageId;

    // Extract body
    const { text: bodyText, html: bodyHtml } = extractBody(payload);

    // Extract links from body
    const extractedLinks = extractLinks(bodyText + " " + bodyHtml);

    // Extract sender domain
    const fromHeader = headers["From"] ?? "";
    const senderEmailMatch = fromHeader.match(/<([^>]+)>/) ?? fromHeader.match(/([^\s]+@[^\s]+)/);
    const senderEmail = senderEmailMatch?.[1] ?? fromHeader;
    const senderDomain = senderEmail.split("@")[1] ?? "";

    // Try to extract sender IP from Received headers
    const receivedHeaders = Object.entries(headers)
      .filter(([k]) => k.toLowerCase() === "received")
      .map(([, v]) => v);
    const senderIp = extractSenderIp(receivedHeaders);

    return {
      googleMessageId,
      rfc2822MessageId,
      headers,
      bodyText,
      bodyHtml,
      extractedLinks,
      senderIp,
      senderDomain,
    };
  } catch (error) {
    console.error("Gmail API error:", error);
    throw new Error(`Gmail API failed: ${String(error)}`);
  }
}

type GmailMessagePart = {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: GmailMessagePart[] | null;
};

function extractBody(payload: GmailMessagePart): { text: string; html: string } {
  let text = "";
  let html = "";

  function decode(data: string): string {
    return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
  }

  function processPartRecursive(part: GmailMessagePart) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      text += decode(part.body.data);
    } else if (part.mimeType === "text/html" && part.body?.data) {
      html += decode(part.body.data);
    }
    if (part.parts) {
      for (const subPart of part.parts) {
        processPartRecursive(subPart);
      }
    }
  }

  processPartRecursive(payload);
  return { text, html };
}

function extractLinks(content: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>]+/g;
  const matches = content.match(urlRegex) ?? [];
  // Deduplicate and limit to 20 links
  return [...new Set(matches)].slice(0, 20);
}

function extractSenderIp(receivedHeaders: string[]): string | null {
  // Look for IP addresses in Received headers (skip internal Google IPs)
  const ipRegex = /\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/;
  const internalPrefixes = ["10.", "172.", "192.168.", "127."];

  for (const header of receivedHeaders) {
    const match = header.match(ipRegex);
    if (match?.[1]) {
      const ip = match[1];
      if (!internalPrefixes.some((prefix) => ip.startsWith(prefix))) {
        return ip;
      }
    }
  }
  return null;
}

/**
 * Lists all active users in the Google Workspace domain.
 * Uses Admin SDK Directory API.
 */
export async function listAllDomainUsers(): Promise<string[]> {
  const auth = getGoogleAuth(process.env.GOOGLE_ADMIN_EMAIL);
  const admin = google.admin({ version: "directory_v1", auth });

  const emails: string[] = [];
  let pageToken: string | undefined;

  do {
    const response = await admin.users.list({
      customer: "my_customer",
      maxResults: 500,
      orderBy: "email",
      query: "isSuspended=false",
      pageToken,
    });

    const users = response.data.users ?? [];
    for (const user of users) {
      if (user.primaryEmail) {
        emails.push(user.primaryEmail);
      }
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return emails;
}

/**
 * Searches for a message in a user's Gmail inbox by rfc2822MessageId
 * and trashes it if found.
 * Returns true if the message was found and trashed.
 */
export async function trashMessageForUser(
  userEmail: string,
  rfc2822MessageId: string
): Promise<boolean> {
  const auth = getGoogleAuth(userEmail);
  const gmail = google.gmail({ version: "v1", auth });

  try {
    // Search for the message using the RFC 2822 Message-ID header
    const cleanId = rfc2822MessageId.replace(/[<>]/g, "");
    const searchResponse = await gmail.users.messages.list({
      userId: "me",
      q: `rfc822msgid:${cleanId}`,
    });

    const messages = searchResponse.data.messages ?? [];
    if (messages.length === 0) {
      return false;
    }

    // Trash all found instances (should typically be just one)
    for (const msg of messages) {
      if (msg.id) {
        await gmail.users.messages.trash({
          userId: "me",
          id: msg.id,
        });
      }
    }

    return true;
  } catch (error) {
    // User may not have Gmail or no access — log but don't fail
    console.warn(`Failed to process ${userEmail}:`, error);
    return false;
  }
}
