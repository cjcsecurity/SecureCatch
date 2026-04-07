/**
 * Shared TypeScript types for the SecureCatch frontend.
 */

export type AlertStatus =
  | "PENDING"
  | "INGESTED"
  | "ANALYZING"
  | "AWAITING_REVIEW"
  | "REMEDIATED"
  | "CLOSED";

export type AIClassification = "Phishing" | "Spam" | "Safe";

export type AnalystAction = "REMEDIATE" | "CLOSE";

export interface VTScore {
  harmless: number;
  malicious: number;
  suspicious: number;
  undetected: number;
  timeout: number;
  total: number;
  reputation?: number;
  lastAnalysisDate?: string;
}

export interface VTUrlResult {
  url: string;
  score: VTScore | null;
  error?: string;
}

export interface AlertSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  jiraTicketKey: string;
  jiraTicketUrl: string | null;
  jiraSummary: string;
  actorEmail: string;
  reportedByEmail: string;
  activityDate: string | null;
  googleMessageId: string | null;
  rfc2822MessageId: string | null;
  aiClassification: AIClassification | null;
  aiConfidenceScore: number | null;
  status: AlertStatus;
  analystAction: AnalystAction | null;
  analystNote: string | null;
  remediatedAt: string | null;
  closedAt: string | null;
}

export interface AlertDetail extends AlertSummary {
  rawEmailHeaders: Record<string, string> | null;
  rawEmailBody: string | null;
  extractedLinks: string[];
  vtSenderDomain: string | null;
  vtSenderDomainScore: VTScore | null;
  vtSenderIp: string | null;
  vtSenderIpScore: VTScore | null;
  vtUrlScores: VTUrlResult[];
  aiReasoning: string | null;
  purgeResults: {
    usersSearched: number;
    usersAffected: string[];
  } | null;
}
