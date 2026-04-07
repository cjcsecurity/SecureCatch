"use client";

import type { VTScore } from "@/lib/types";

interface VTScoreCardProps {
  label: string;
  value: string;
  score: VTScore | null;
}

function RiskBar({ score }: { score: VTScore }) {
  const maliciousPercent = score.total > 0 ? (score.malicious / score.total) * 100 : 0;
  const suspiciousPercent = score.total > 0 ? (score.suspicious / score.total) * 100 : 0;

  const riskLevel =
    score.malicious > 3
      ? "High Risk"
      : score.malicious > 0 || score.suspicious > 3
        ? "Medium Risk"
        : "Low Risk";

  const riskColor =
    score.malicious > 3
      ? "text-red-400"
      : score.malicious > 0 || score.suspicious > 3
        ? "text-yellow-400"
        : "text-green-400";

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${riskColor}`}>{riskLevel}</span>
        <span className="text-muted-foreground">{score.total} engines</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
        <div
          className="h-full bg-red-500 transition-all"
          style={{ width: `${maliciousPercent}%` }}
        />
        <div
          className="h-full bg-yellow-500 transition-all"
          style={{ width: `${suspiciousPercent}%` }}
        />
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="text-red-400">{score.malicious} malicious</span>
        <span className="text-yellow-400">{score.suspicious} suspicious</span>
        <span className="text-green-400">{score.harmless} harmless</span>
      </div>
    </div>
  );
}

export function VTScoreCard({ label, value, score }: VTScoreCardProps) {
  return (
    <div className="bg-muted/20 border border-border rounded-lg p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <p className="mt-1 text-sm font-mono break-all">{value}</p>
      {score ? (
        <RiskBar score={score} />
      ) : (
        <p className="mt-2 text-xs text-muted-foreground italic">No VT data available</p>
      )}
    </div>
  );
}
