"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Play,
  AlertTriangle,
  ShieldCheck,
  Mail,
  Globe,
  Server,
  Link2,
  Brain,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, ClassificationBadge } from "@/components/status-badge";
import { VTScoreCard } from "@/components/vt-score-card";
import { RemediateDialog } from "@/components/remediate-dialog";
import type { AlertDetail } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AlertDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<"REMEDIATE" | "CLOSE" | null>(null);
  const router = useRouter();

  async function fetchAlert() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/alerts/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { alert: AlertDetail };
      setAlert(data.alert);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAlert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/analyze/${id}`, { method: "POST" });
      const data = await res.json() as { message?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Analysis failed");
        return;
      }
      toast.success("Analysis complete");
      await fetchAlert();
    } catch (err) {
      toast.error(`Network error: ${String(err)}`);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Failed to load alert</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isActionable =
    alert.status === "AWAITING_REVIEW" || alert.status === "INGESTED" || alert.status === "ANALYZING";
  const isCompleted = alert.status === "REMEDIATED" || alert.status === "CLOSED";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {alert.jiraTicketKey}
                </span>
                <StatusBadge status={alert.status} />
              </div>
              <h1 className="text-base font-semibold truncate max-w-lg">{alert.jiraSummary}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alert.jiraTicketUrl && (() => {
              let safeHref: string | null = null;
              try {
                const parsed = new URL(alert.jiraTicketUrl);
                if (parsed.protocol === "https:") safeHref = alert.jiraTicketUrl;
              } catch {}
              return safeHref ? (
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Jira
                </a>
              ) : null;
            })()}
            {!isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={runAnalysis}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1.5" />
                    Run Analysis
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Alert Details + Actions */}
        <div className="space-y-6">
          {/* Alert Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Alert Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Suspect Sender</p>
                <p className="font-medium break-all mt-0.5">{alert.actorEmail}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs">Reported By</p>
                <p className="mt-0.5 break-all">{alert.reportedByEmail}</p>
              </div>
              <Separator />
              {alert.activityDate && (
                <>
                  <div>
                    <p className="text-muted-foreground text-xs">Activity Date</p>
                    <p className="mt-0.5">
                      {format(new Date(alert.activityDate), "MMM d, yyyy HH:mm")} UTC
                    </p>
                  </div>
                  <Separator />
                </>
              )}
              {alert.rfc2822MessageId && (
                <div>
                  <p className="text-muted-foreground text-xs">RFC 2822 Message-ID</p>
                  <p className="mt-0.5 font-mono text-xs break-all text-muted-foreground">
                    {alert.rfc2822MessageId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alert.aiClassification ? (
                <>
                  <div className="flex items-center justify-between">
                    <ClassificationBadge
                      classification={alert.aiClassification}
                      score={alert.aiConfidenceScore}
                    />
                    <span className="text-xs text-muted-foreground">
                      {alert.aiConfidenceScore}% confidence
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        alert.aiClassification === "Phishing"
                          ? "bg-red-500"
                          : alert.aiClassification === "Spam"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${alert.aiConfidenceScore ?? 0}%` }}
                    />
                  </div>
                  {alert.aiReasoning && (
                    <div className="bg-muted/20 border border-border rounded p-3">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Reasoning</p>
                      <p className="text-sm leading-relaxed">{alert.aiReasoning}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No AI analysis yet</p>
                  <p className="text-xs mt-1">Click Run Analysis to classify this alert</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {!isCompleted && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                  Available Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-red-700 hover:bg-red-600 text-white"
                  onClick={() => setDialogAction("REMEDIATE")}
                  disabled={!isActionable}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Approve &amp; Remediate
                </Button>
                <Button
                  className="w-full bg-green-800 hover:bg-green-700 text-white"
                  onClick={() => setDialogAction("CLOSE")}
                  disabled={!isActionable}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Mark as Safe / Close
                </Button>
                {!isActionable && (
                  <p className="text-xs text-muted-foreground text-center">
                    Run Analysis first to enable actions
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Completed State */}
          {isCompleted && (
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  {alert.status === "REMEDIATED" ? (
                    <>
                      <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
                      <p className="font-medium">Domain-Wide Purge Executed</p>
                      {alert.purgeResults && (
                        <p className="text-sm text-muted-foreground">
                          Trashed from {alert.purgeResults.usersAffected.length} inbox(es) out of{" "}
                          {alert.purgeResults.usersSearched} users searched
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-8 w-8 text-green-400 mx-auto" />
                      <p className="font-medium">Closed as False Positive</p>
                    </>
                  )}
                  {alert.analystNote && (
                    <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
                      &ldquo;{alert.analystNote}&rdquo;
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Email + OSINT Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* OSINT Scores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                OSINT Data (VirusTotal)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alert.vtSenderDomain || alert.vtSenderIp || alert.vtUrlScores.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {alert.vtSenderDomain && (
                      <VTScoreCard
                        label="Sender Domain"
                        value={alert.vtSenderDomain}
                        score={alert.vtSenderDomainScore}
                      />
                    )}
                    {alert.vtSenderIp && (
                      <VTScoreCard
                        label="Sender IP"
                        value={alert.vtSenderIp}
                        score={alert.vtSenderIpScore}
                      />
                    )}
                  </div>
                  {alert.vtUrlScores.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                        <Link2 className="h-3 w-3" />
                        URL Scores
                      </p>
                      <div className="space-y-2">
                        {alert.vtUrlScores.map((result, i) => (
                          <VTScoreCard
                            key={i}
                            label={`URL ${i + 1}`}
                            value={result.url}
                            score={result.score}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No OSINT data yet</p>
                  <p className="text-xs mt-1">Run Analysis to enrich with VirusTotal data</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Raw Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alert.rawEmailHeaders || alert.rawEmailBody ? (
                <Tabs defaultValue="headers">
                  <TabsList className="mb-4">
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="links">
                      Links
                      {alert.extractedLinks.length > 0 && (
                        <Badge variant="secondary" className="ml-1.5 text-xs">
                          {alert.extractedLinks.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="headers">
                    <div className="bg-muted/20 border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                      {alert.rawEmailHeaders ? (
                        <table className="w-full text-xs font-mono">
                          <tbody>
                            {Object.entries(alert.rawEmailHeaders).map(([key, value]) => (
                              <tr key={key} className="border-b border-border/50 last:border-0">
                                <td className="py-1.5 pr-4 text-muted-foreground font-medium whitespace-nowrap align-top w-1/3">
                                  {key}:
                                </td>
                                <td className="py-1.5 break-all">{value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-muted-foreground text-sm">No header data available</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="body">
                    <div className="bg-muted/20 border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                      {alert.rawEmailBody ? (
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                          {alert.rawEmailBody}
                        </pre>
                      ) : (
                        <p className="text-muted-foreground text-sm">No body content available</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="links">
                    {alert.extractedLinks.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {alert.extractedLinks.map((link, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 bg-muted/20 border border-border rounded p-3"
                          >
                            <Server className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-mono break-all">{link}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No links extracted
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No email data available</p>
                  <p className="text-xs mt-1">
                    Email data is fetched during ingestion via the Gmail API
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RemediateDialog
        alertId={id}
        action={dialogAction}
        onClose={() => setDialogAction(null)}
      />
    </div>
  );
}
