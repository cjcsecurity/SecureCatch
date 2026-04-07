"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { AlertQueue } from "@/components/alert-queue";

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader onRefresh={handleRefresh} />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Phishing Alert Queue</h2>
          <p className="text-muted-foreground mt-1">
            Active phishing investigations pulled from Jira SECOPS board
          </p>
        </div>
        <AlertQueue refreshKey={refreshKey} />
      </main>
    </div>
  );
}
