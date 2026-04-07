"use client";

import { Badge } from "@/components/ui/badge";
import type { AlertStatus, AIClassification } from "@/lib/types";

const statusConfig: Record<AlertStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "outline" },
  INGESTED: { label: "Ingested", variant: "secondary" },
  ANALYZING: { label: "Analyzing", variant: "secondary" },
  AWAITING_REVIEW: { label: "Awaiting Review", variant: "default" },
  REMEDIATED: { label: "Remediated", variant: "destructive" },
  CLOSED: { label: "Closed (Safe)", variant: "outline" },
};

const classificationConfig: Record<AIClassification, { label: string; className: string }> = {
  Phishing: { label: "Phishing", className: "bg-red-900/50 text-red-300 border-red-700" },
  Spam: { label: "Spam", className: "bg-yellow-900/50 text-yellow-300 border-yellow-700" },
  Safe: { label: "Safe", className: "bg-green-900/50 text-green-300 border-green-700" },
};

export function StatusBadge({ status }: { status: AlertStatus }) {
  const config = statusConfig[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function ClassificationBadge({
  classification,
  score,
}: {
  classification: AIClassification | null;
  score: number | null;
}) {
  if (!classification) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const config = classificationConfig[classification];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium ${config.className}`}>
      {config.label}
      {score !== null && <span className="opacity-75">{score}%</span>}
    </span>
  );
}
