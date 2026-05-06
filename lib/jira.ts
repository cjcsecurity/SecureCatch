/**
 * Jira API Integration
 * Fetches phishing alert tickets from the SECOPS board and parses them.
 */

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  url: string;
}

export interface ParsedTicketData {
  actorEmail: string;
  reportedByEmail: string;
  activityDate: Date | null;
}

function getJiraConfig() {
  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_SECOPS_PROJECT_KEY ?? "SECOPS";

  if (!host || !email || !token) {
    throw new Error("Missing Jira configuration: JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN");
  }

  return { host, email, token, projectKey };
}

function getAuthHeader(email: string, token: string): string {
  return `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
}

/**
 * Fetches all open phishing alert tickets from the SECOPS Jira board.
 * Filter: Reporter = csirt@snapdocs.com OR Summary contains "User-reported phishing"
 */
export async function fetchPhishingTickets(): Promise<JiraTicket[]> {
  const { host, email, token, projectKey } = getJiraConfig();
  const auth = getAuthHeader(email, token);

  const csirtEmail = process.env.JIRA_CSIRT_EMAIL;
  if (!csirtEmail) {
    throw new Error("Missing required environment variable: JIRA_CSIRT_EMAIL");
  }

  const jql = encodeURIComponent(
    `project = "${projectKey}" AND (reporter = "${csirtEmail}" OR summary ~ "User-reported phishing") AND status != Done ORDER BY created DESC`
  );

  const url = `https://${host}/rest/api/3/search?jql=${jql}&maxResults=50&fields=id,key,summary,description,status`;

  const response = await fetch(url, {
    headers: {
      Authorization: auth,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jira API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const issues = data.issues ?? [];

  return issues.map((issue: Record<string, unknown>) => {
    const fields = issue.fields as Record<string, unknown>;
    const status = fields.status as Record<string, unknown>;
    const statusCategory = status?.statusCategory as Record<string, unknown>;
    return {
      id: issue.id as string,
      key: issue.key as string,
      summary: (fields.summary as string) ?? "",
      description: extractDescriptionText(fields.description),
      status: (statusCategory?.name as string) ?? (status?.name as string) ?? "Unknown",
      url: `https://${host}/browse/${issue.key}`,
    };
  });
}

/**
 * Extracts plain text from Jira's Atlassian Document Format (ADF) description.
 */
function extractDescriptionText(description: unknown): string {
  if (!description) return "";

  // If it's already a string, return it directly
  if (typeof description === "string") return description;

  // Handle Atlassian Document Format (ADF)
  if (typeof description === "object") {
    const adf = description as Record<string, unknown>;
    if (adf.type === "doc" && Array.isArray(adf.content)) {
      return extractTextFromADFNodes(adf.content as Record<string, unknown>[]);
    }
  }

  return JSON.stringify(description);
}

function extractTextFromADFNodes(nodes: Record<string, unknown>[]): string {
  let text = "";
  for (const node of nodes) {
    if (node.type === "text") {
      text += (node.text as string) ?? "";
    } else if (Array.isArray(node.content)) {
      text += extractTextFromADFNodes(node.content as Record<string, unknown>[]);
    }
    if (node.type === "paragraph" || node.type === "heading") {
      text += "\n";
    }
  }
  return text;
}

/**
 * Parses the Jira ticket description to extract:
 * - Actor (sender email)
 * - Reported by (reporter email)
 * - Activity date
 *
 * Expected format:
 *   Activity date: Wednesday, Dec 10, 2025, 9:01:48 PM (UTC)
 *   Actor: docusign.prod.pa@snapdocs.com
 *   Reported by: bob.jones@snapdocs.com
 */
export function parseTicketDescription(description: string): ParsedTicketData {
  const actorMatch = description.match(/Actor:\s*([^\s\n]+@[^\s\n]+)/i);
  const reportedByMatch = description.match(/Reported by:\s*([^\s\n]+@[^\s\n]+)/i);
  const dateMatch = description.match(/Activity date:\s*(.+?)(?:\n|$)/i);

  const actorEmail = actorMatch?.[1]?.trim() ?? "";
  const reportedByEmail = reportedByMatch?.[1]?.trim() ?? "";

  let activityDate: Date | null = null;
  if (dateMatch?.[1]) {
    const dateStr = dateMatch[1].trim().replace(/\s*\(UTC\)\s*$/, "");
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      activityDate = parsed;
    }
  }

  return { actorEmail, reportedByEmail, activityDate };
}

/**
 * Posts a comment to a Jira ticket.
 */
export async function postJiraComment(ticketKey: string, comment: string): Promise<void> {
  const { host, email, token } = getJiraConfig();
  const auth = getAuthHeader(email, token);

  const url = `https://${host}/rest/api/3/issue/${ticketKey}/comment`;

  const body = {
    body: {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: comment }],
        },
      ],
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to post Jira comment ${response.status}: ${errorText}`);
  }
}

/**
 * Transitions a Jira ticket to "Done" / "Closed" status.
 */
export async function closeJiraTicket(ticketKey: string): Promise<void> {
  const { host, email, token } = getJiraConfig();
  const auth = getAuthHeader(email, token);

  // First, get available transitions
  const transitionsUrl = `https://${host}/rest/api/3/issue/${ticketKey}/transitions`;
  const transitionsResponse = await fetch(transitionsUrl, {
    headers: { Authorization: auth, Accept: "application/json" },
  });

  if (!transitionsResponse.ok) {
    throw new Error(`Failed to fetch Jira transitions: ${transitionsResponse.status}`);
  }

  const transitionsData = await transitionsResponse.json();
  const transitions = transitionsData.transitions as Array<{ id: string; name: string }>;

  // Find a "Done" or "Closed" transition
  const closeTransition = transitions.find((t) =>
    ["done", "closed", "close"].includes(t.name.toLowerCase())
  );

  if (!closeTransition) {
    console.warn(
      `No close transition found for ${ticketKey}. Available: ${transitions.map((t) => t.name).join(", ")}`
    );
    return;
  }

  // Apply the transition
  const response = await fetch(transitionsUrl, {
    method: "POST",
    headers: {
      Authorization: auth,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transition: { id: closeTransition.id } }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to close Jira ticket ${response.status}: ${errorText}`);
  }
}
