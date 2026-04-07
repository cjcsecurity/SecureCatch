"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, ClassificationBadge } from "@/components/status-badge";
import type { AlertSummary } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface AlertQueueProps {
  refreshKey: number;
}

export function AlertQueue({ refreshKey }: AlertQueueProps) {
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { alerts: AlertSummary[] };
      setAlerts(data.alerts);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p className="font-medium">Failed to load alerts</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">No alerts found</p>
        <p className="text-sm mt-2">
          Click <strong>Run Ingestion</strong> to fetch phishing alerts from Jira.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-32">Ticket</TableHead>
            <TableHead>Suspect Sender</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead className="w-40">Classification</TableHead>
            <TableHead className="w-36">Status</TableHead>
            <TableHead className="w-36">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow
              key={alert.id}
              className="cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => router.push(`/alerts/${alert.id}`)}
            >
              <TableCell className="font-mono text-sm">
                <a
                  href={alert.jiraTicketUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  {alert.jiraTicketKey}
                </a>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-foreground">{alert.actorEmail}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{alert.reportedByEmail}</span>
              </TableCell>
              <TableCell>
                <ClassificationBadge
                  classification={alert.aiClassification}
                  score={alert.aiConfidenceScore}
                />
              </TableCell>
              <TableCell>
                <StatusBadge status={alert.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
