import { useCallback, useSyncExternalStore } from "react";
import {
  countNeedingAttention,
  countPending,
  getOldestPendingAt,
  getOpsForCurrentTenant,
  getOutboxSnapshot,
  removeOp,
  retryOp,
  subscribeOutbox,
  type OutboxOp,
} from "@/services/outbox";
import { syncOutbox, type SyncSummary } from "@/services/outboxSync";

export interface UseOutboxResult {
  /** Ops belonging to the farm currently on screen. */
  ops: OutboxOp[];
  pending: number;
  needsAttention: number;
  /** ISO timestamp of the oldest unsent record, for the stale-queue warning. */
  oldestPendingAt: string | null;
  syncNow: () => Promise<SyncSummary>;
  retry: (id: string) => Promise<void>;
  discard: (id: string) => Promise<void>;
}

export function useOutbox(): UseOutboxResult {
  // Subscribe to the whole queue, but expose only the current farm's slice:
  // an op added under another tenant must still re-render the counters.
  useSyncExternalStore(subscribeOutbox, getOutboxSnapshot, getOutboxSnapshot);
  const ops = getOpsForCurrentTenant();

  const syncNow = useCallback(() => syncOutbox({ force: true }), []);
  const retry = useCallback(async (id: string) => {
    await retryOp(id);
    await syncOutbox({ force: true });
  }, []);
  const discard = useCallback((id: string) => removeOp(id), []);

  return {
    ops,
    pending: countPending(ops),
    needsAttention: countNeedingAttention(ops),
    oldestPendingAt: getOldestPendingAt(),
    syncNow,
    retry,
    discard,
  };
}
