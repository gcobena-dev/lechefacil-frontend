import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Clock,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOutbox } from "@/hooks/useOutbox";
import { useConnectivity } from "@/hooks/useConnectivity";
import { useTranslation } from "@/hooks/useTranslation";
import { listAnimals } from "@/services/animals";
import { formatLocalDateShort, formatLocalTime } from "@/utils/dateUtils";
import type { OutboxOp } from "@/services/outbox";

/**
 * Everything the device is still holding: what is waiting for signal, what the
 * server refused, and what clashes with a record it already has. Nothing here
 * disappears on its own — discarding is always an explicit choice.
 */
export default function PendingSync() {
  const { t } = useTranslation();
  const { online } = useConnectivity();
  const { ops, pending, needsAttention, syncNow, retry, discard } = useOutbox();
  const [syncing, setSyncing] = useState(false);
  const [toDiscard, setToDiscard] = useState<OutboxOp | null>(null);

  // Names for the rows. Cached, so this still reads correctly with no signal.
  const { data: animalsData } = useQuery({
    queryKey: ["animals-list-all"],
    queryFn: () => listAnimals({ limit: 500 }),
  });
  const animalName = (id: string) => {
    const a = animalsData?.items?.find((x) => x.id === id);
    return a ? `${a.name ?? ""} (${a.tag ?? ""})`.trim() : id.slice(0, 8);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncNow();
    } finally {
      setSyncing(false);
    }
  };

  const kindLabel = (op: OutboxOp) => {
    if (op.kind === "delivery.create") return t("milk.delivery");
    const count = op.meta.entries?.length ?? 1;
    return count > 1
      ? `${t("milk.production")} · ${count} ${t("milk.animals")}`
      : t("milk.production");
  };

  const statusBadge = (op: OutboxOp) => {
    if (op.status === "conflict")
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t("offline.statusConflict")}
        </Badge>
      );
    if (op.status === "failed")
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t("offline.statusFailed")}
        </Badge>
      );
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        {t("offline.statusPending")}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mb-4">
          <CloudOff className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {t("offline.pendingTitle")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("offline.pendingSubtitle")}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-muted-foreground">
          {online ? t("offline.connected") : t("offline.noConnection")}
          {pending > 0 && ` · ${t("offline.pendingCount", { count: pending })}`}
          {needsAttention > 0 &&
            ` · ${t("offline.needsAttention", { count: needsAttention })}`}
        </div>
        <Button onClick={handleSync} disabled={syncing || ops.length === 0}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {t("offline.syncNow")}
        </Button>
      </div>

      {ops.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
            <p className="font-medium">{t("offline.allSynced")}</p>
            <p className="text-sm text-muted-foreground">
              {t("offline.allSyncedDesc")}
            </p>
          </CardContent>
        </Card>
      )}

      {ops.map((op) => (
        <Card key={op.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <CardTitle className="text-base">{kindLabel(op)}</CardTitle>
              {statusBadge(op)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("offline.typedAt")}: {formatLocalDateShort(op.createdAt)}{" "}
              {formatLocalTime(op.createdAt)}
              {op.meta.date && ` · ${op.meta.date} ${op.meta.shift ?? ""}`}
              {op.attempts > 0 &&
                ` · ${t("offline.attempts", { count: op.attempts })}`}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {op.meta.totalVolumeL !== undefined && (
              <div className="text-sm">
                <span className="text-muted-foreground">
                  {t("milk.totalLiters")}:{" "}
                </span>
                <span className="font-medium">
                  {op.meta.totalVolumeL.toFixed(1)} L
                </span>
              </div>
            )}

            {op.meta.entries && op.meta.entries.length > 0 && (
              <div className="rounded-md border border-border divide-y divide-border max-h-56 overflow-y-auto">
                {op.meta.entries.map((e) => (
                  <div
                    key={e.animalId}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="truncate">{animalName(e.animalId)}</span>
                    <span className="font-mono shrink-0">
                      {e.volumeL.toFixed(1)} L
                    </span>
                  </div>
                ))}
              </div>
            )}

            {op.lastError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 space-y-2">
                <p className="text-sm text-foreground">{op.lastError.message}</p>
                {op.lastError.conflicts?.map((c, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {animalName(c.animal_id)}:{" "}
                    {t("offline.conflictLine", {
                      trying: c.input_quantity,
                      existing: c.existing_volume_l
                        ? `${parseFloat(c.existing_volume_l).toFixed(1)}L`
                        : "—",
                      when: c.existing_date_time
                        ? `${formatLocalDateShort(
                            c.existing_date_time
                          )} ${formatLocalTime(c.existing_date_time)}`
                        : `${c.shift} ${c.date}`,
                    })}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 justify-end">
              {op.status !== "pending" && (
                <Button variant="outline" size="sm" onClick={() => retry(op.id)}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  {t("offline.retry")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setToDiscard(op)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {t("offline.discard")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Discarding destroys the only copy of these records, so it is confirmed. */}
      <Dialog open={toDiscard !== null} onOpenChange={() => setToDiscard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("offline.discardTitle")}</DialogTitle>
            <DialogDescription>{t("offline.discardWarning")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToDiscard(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (toDiscard) await discard(toDiscard.id);
                setToDiscard(null);
              }}
            >
              {t("offline.discard")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
