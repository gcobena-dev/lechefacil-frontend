import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { initOutbox, getSyncableOps, subscribeOutbox } from "@/services/outbox";
import { syncOutbox } from "@/services/outboxSync";
import { subscribeConnectivity } from "@/services/connectivity";

/** How often to retry while something is still queued. */
const TICK_MS = 60 * 1000;

/**
 * Drives the outbox from the app root. Sync is attempted when there is a real
 * reason to believe it will work — regaining connectivity, coming back to the
 * foreground, logging in — plus a slow tick as a safety net for the cases none
 * of those fire.
 */
export function useOutboxAutoSync(): void {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    let disposed = false;
    const cleanups: Array<() => void> = [];

    const run = async () => {
      if (disposed) return;
      const summary = await syncOutbox();
      // Anything that landed on the server should show up as a server record
      // now, so the pending badge disappears instead of double-rendering.
      if (summary.synced > 0) {
        queryClient.invalidateQueries({ queryKey: ["milk-productions"] });
        queryClient.invalidateQueries({ queryKey: ["milk-deliveries"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
      if (disposed) return;

      // Say what happened. A queued batch the server had already recorded would
      // otherwise just vanish from the screen with no explanation.
      if (summary.synced > 0) {
        toast({
          title: t("offline.syncDone"),
          description:
            summary.skipped > 0
              ? t("offline.syncDoneWithSkips", {
                  sent: summary.synced,
                  skipped: summary.skipped,
                })
              : t("offline.syncDoneCount", { count: summary.synced }),
        });
      }
      if (summary.conflicts > 0 || summary.failed > 0) {
        toast({
          title: t("offline.syncNeedsAttention"),
          description: t("offline.needsAttention", {
            count: summary.conflicts + summary.failed,
          }),
          variant: "destructive",
        });
      }
    };

    void initOutbox().then(run);

    let wasOnline: boolean | null = null;
    cleanups.push(
      subscribeConnectivity((state) => {
        const cameBack = wasOnline === false && state.online;
        wasOnline = state.online;
        if (cameBack) void run();
      })
    );

    // A fresh token can unpause a queue that stopped on a dead session.
    const onTokenChanged = () => void run();
    window.addEventListener("lf_token_changed", onTokenChanged);
    cleanups.push(() =>
      window.removeEventListener("lf_token_changed", onTokenChanged)
    );

    if (Capacitor.isNativePlatform()) {
      void import("@capacitor/app")
        .then(({ App }) =>
          App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) void run();
          })
        )
        .then((handle) => cleanups.push(() => void handle.remove()))
        .catch(() => {
          // App plugin unavailable: the tick below still covers us.
        });
    }

    const timer = window.setInterval(() => {
      if (getSyncableOps().some((o) => o.status === "pending")) void run();
    }, TICK_MS);
    cleanups.push(() => window.clearInterval(timer));

    // Re-run as soon as something is queued, so an entry typed with signal back
    // is sent immediately rather than on the next tick.
    let hadPending = false;
    cleanups.push(
      subscribeOutbox((ops) => {
        const hasPending = ops.some((o) => o.status === "pending");
        if (hasPending && !hadPending) void run();
        hadPending = hasPending;
      })
    );

    return () => {
      disposed = true;
      cleanups.forEach((c) => c());
    };
  }, [queryClient, toast, t]);
}
