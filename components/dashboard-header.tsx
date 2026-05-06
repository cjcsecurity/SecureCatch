"use client";

import { useState } from "react";
import { ShieldAlert, RefreshCw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardHeaderProps {
  onRefresh: () => void;
}

export function DashboardHeader({ onRefresh }: DashboardHeaderProps) {
  const [ingesting, setIngesting] = useState(false);

  async function runIngestion() {
    setIngesting(true);
    try {
      const res = await fetch("/api/ingest/start", { method: "POST" });
      const data = await res.json() as { message?: string; error?: string; processed?: number; newAlerts?: string[] };

      if (!res.ok) {
        toast.error(data.error ?? "Ingestion failed");
        return;
      }

      if ((data.processed ?? 0) > 0) {
        toast.success(data.message ?? "Ingestion complete", {
          description: `New alerts: ${(data.newAlerts ?? []).join(", ")}`,
        });
      } else {
        toast.info(data.message ?? "No new alerts found");
      }

      onRefresh();
    } catch (err) {
      toast.error(`Network error: ${String(err)}`);
    } finally {
      setIngesting(false);
    }
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-900/30 border border-red-800/50">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">SecureCatch</h1>
            <p className="text-xs text-muted-foreground">Phishing Alert Triage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={runIngestion}
            disabled={ingesting}
            className="bg-red-700 hover:bg-red-600 text-white"
          >
            {ingesting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                Ingesting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1.5" />
                Run Ingestion
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
