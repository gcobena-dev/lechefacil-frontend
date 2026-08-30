import { CloudOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConnectivity } from "@/hooks/useConnectivity";
import { useOutbox } from "@/hooks/useOutbox";
import { useTranslation } from "@/hooks/useTranslation";

/** Queued records can only be sent while the refresh token lives (30 days). */
const STALE_QUEUE_WARNING_DAYS = 20;

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

/**
 * One honest line about the state of the app's data: whether we are offline,
 * how much is waiting to be sent, and what needs a decision.
 * Renders nothing when there is signal and nothing is queued.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const { online } = useConnectivity();
  const { pending, needsAttention, oldestPendingAt, syncNow } = useOutbox();
  const [syncing, setSyncing] = useState(false);

  const staleQueue =
    oldestPendingAt !== null &&
    daysSince(oldestPendingAt) > STALE_QUEUE_WARNING_DAYS;

  if (online && pending === 0 && needsAttention === 0) return null;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncNow();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className={`px-4 py-2 text-sm border-b ${
        online
          ? "bg-primary/10 border-primary/20"
          : "bg-amber-500/10 border-amber-500/30"
      }`}
      role="status"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        <CloudOff
          className={`h-4 w-4 shrink-0 ${
            online ? "text-primary" : "text-amber-600 dark:text-amber-400"
          }`}
        />
        <span className="font-medium">
          {online ? t("offline.onlineWithQueue") : t("offline.noConnection")}
        </span>

        {pending > 0 && (
          <span className="text-muted-foreground">
            {t("offline.pendingCount", { count: pending })}
          </span>
        )}

        {needsAttention > 0 && (
          <Link
            to="/milk/pending"
            className="inline-flex items-center gap-1 text-destructive underline underline-offset-2"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("offline.needsAttention", { count: needsAttention })}
          </Link>
        )}

        {staleQueue && (
          <span className="text-destructive">{t("offline.staleQueue")}</span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {pending > 0 && (
            <Link
              to="/milk/pending"
              className="text-xs underline underline-offset-2 text-muted-foreground"
            >
              {t("offline.viewPending")}
            </Link>
          )}
          {pending > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1 ${syncing ? "animate-spin" : ""}`}
              />
              {t("offline.syncNow")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
