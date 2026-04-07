"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";

interface RemediateDialogProps {
  alertId: string;
  action: "REMEDIATE" | "CLOSE" | null;
  onClose: () => void;
}

export function RemediateDialog({ alertId, action, onClose }: RemediateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const router = useRouter();

  const isRemediate = action === "REMEDIATE";

  async function handleConfirm() {
    if (!action) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/remediate/${alertId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note || undefined }),
      });

      const data = await res.json() as { message?: string; error?: string; purgeResults?: { usersSearched: number; usersAffected: string[] } };

      if (!res.ok) {
        toast.error(data.error ?? "Action failed");
        return;
      }

      if (isRemediate) {
        const { purgeResults } = data;
        toast.success("Domain-wide purge complete", {
          description: `Trashed from ${purgeResults?.usersAffected?.length ?? 0} inbox(es) out of ${purgeResults?.usersSearched ?? 0} users searched.`,
        });
      } else {
        toast.success("Alert closed as false positive");
      }

      onClose();
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(`Network error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={action !== null} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRemediate ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Approve & Remediate
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 text-green-400" />
                Mark as Safe / Close
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isRemediate
              ? "This will execute a domain-wide purge — searching every user inbox and trashing the malicious email. This action cannot be undone."
              : "This will close the ticket as a false positive. No remediation actions will be taken."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="text-muted-foreground">Analyst note (optional)</span>
            <textarea
              className="mt-1.5 w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
              placeholder="Add any relevant notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
            />
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={
              isRemediate
                ? "bg-red-700 hover:bg-red-600 text-white"
                : "bg-green-700 hover:bg-green-600 text-white"
            }
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                {isRemediate ? "Executing purge..." : "Closing..."}
              </>
            ) : isRemediate ? (
              "Confirm Purge"
            ) : (
              "Close as Safe"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
