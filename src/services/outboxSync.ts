import { isNetworkError, type ApiError } from "./client";
import {
  createMilkProduction,
  createMilkProductionsBulk,
  type MilkProductionSkipped,
} from "./milkProductions";
import { createMilkDelivery } from "./milkDeliveries";
import { checkConnectivity, getConnectivityState } from "./connectivity";
import {
  getSyncableOps,
  removeOp,
  updateOp,
  initOutbox,
  type OutboxOp,
  type OutboxError,
} from "./outbox";

/**
 * Replays queued writes, one at a time, in the order they were typed.
 *
 * The rules that matter:
 *  - Nothing is ever dropped because of a transient problem. Only a 2xx (or
 *    proof the server already has the record) removes an op.
 *  - A dead session pauses the queue instead of failing it: the data waits for
 *    the next login.
 *  - Ops are sent with the farm they were created in, not the one on screen.
 */

const MAX_BACKOFF_MS = 30 * 60 * 1000; // 30 min
const BASE_BACKOFF_MS = 60 * 1000; // 1 min

export interface SyncSummary {
  /** Ops removed because the server now has them. */
  synced: number;
  /** Rows the server already had (same animal/day/shift or same request id). */
  skipped: number;
  /** Ops parked for a human to resolve. */
  conflicts: number;
  /** Ops rejected for a reason retrying will not fix. */
  failed: number;
  /** Ops still waiting (no connection, or backing off). */
  pending: number;
  /** True when the run stopped early because the session is gone. */
  paused: boolean;
}

const EMPTY: SyncSummary = {
  synced: 0,
  skipped: 0,
  conflicts: 0,
  failed: 0,
  pending: 0,
  paused: false,
};

let running: Promise<SyncSummary> | null = null;
const listeners = new Set<(s: SyncSummary) => void>();

export function subscribeSyncResults(l: (s: SyncSummary) => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function backoffFor(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}

function toOutboxError(err: unknown): OutboxError {
  const e = err as ApiError & {
    details?: { message?: string; details?: { conflicts?: unknown } };
  };
  return {
    at: new Date().toISOString(),
    status: e?.status,
    message: e?.details?.message || e?.message || "Error desconocido",
    conflicts: (e?.details?.details?.conflicts as OutboxError["conflicts"]) ?? undefined,
  };
}

/** A 422 carrying a `conflicts` list: the server has a different record already. */
function conflictsFrom(err: unknown): OutboxError["conflicts"] | null {
  const e = err as ApiError & {
    details?: { code?: string; details?: { conflicts?: unknown } };
  };
  const conflicts = e?.details?.details?.conflicts;
  return Array.isArray(conflicts)
    ? (conflicts as OutboxError["conflicts"])
    : null;
}

/**
 * A replayed single production whose conflict shows the *same* volume we were
 * trying to send is proof our first attempt actually landed — the response just
 * never made it back. Dropping it is correct; anything else is a real clash.
 */
function conflictIsOurOwnRecord(op: OutboxOp, conflicts: OutboxError["conflicts"]): boolean {
  if (!conflicts || conflicts.length !== 1) return false;
  const entries = op.meta.entries ?? [];
  if (entries.length !== 1) return false;
  const existing = conflicts[0].existing_volume_l;
  if (existing == null) return false;
  return Math.abs(parseFloat(existing) - entries[0].volumeL) < 0.011;
}

async function sendOp(op: OutboxOp): Promise<{ skipped: MilkProductionSkipped[] }> {
  const scope = { tenantId: op.tenantId };
  switch (op.kind) {
    case "production.create":
      await createMilkProduction(op.payload as never, scope);
      return { skipped: [] };
    case "production.bulk": {
      const res = await createMilkProductionsBulk(op.payload as never, scope);
      return { skipped: res?.skipped ?? [] };
    }
    case "delivery.create":
      await createMilkDelivery(op.payload as never, scope);
      return { skipped: [] };
    default:
      throw new Error(`Tipo de operación desconocido: ${op.kind}`);
  }
}

async function runSync(force: boolean): Promise<SyncSummary> {
  await initOutbox();
  const summary: SyncSummary = { ...EMPTY };

  const candidates = getSyncableOps().filter((o) => o.status === "pending");
  if (candidates.length === 0) return summary;

  // One probe for the whole batch instead of letting 20 ops each discover
  // there is no signal.
  const reachable = force
    ? await checkConnectivity(true)
    : getConnectivityState().online;
  if (!reachable) {
    summary.pending = candidates.length;
    return summary;
  }

  const now = Date.now();
  for (const op of candidates) {
    if (!force && op.nextAttemptAt !== null && op.nextAttemptAt > now) {
      summary.pending += 1;
      continue;
    }

    try {
      const { skipped } = await sendOp(op);
      summary.synced += 1;
      summary.skipped += skipped.length;
      await removeOp(op.id);
    } catch (err) {
      const attempts = op.attempts + 1;

      if (isNetworkError(err)) {
        // Signal died mid-batch. Stop: the rest would just burn the same wait.
        await updateOp(op.id, {
          attempts,
          nextAttemptAt: Date.now() + backoffFor(attempts),
          lastError: toOutboxError(err),
        });
        summary.pending += candidates.length - summary.synced;
        break;
      }

      const status = (err as ApiError)?.status;

      if (status === 401 || status === 403) {
        // The session is gone or this farm is no longer ours. Never discard the
        // data: park the queue and let the next successful login resume it.
        await updateOp(op.id, { attempts, nextAttemptAt: null });
        summary.paused = true;
        summary.pending += candidates.length - summary.synced;
        break;
      }

      const conflicts = conflictsFrom(err);
      if (conflicts) {
        if (conflictIsOurOwnRecord(op, conflicts)) {
          // Already applied on a previous attempt; the ack was what got lost.
          summary.synced += 1;
          summary.skipped += 1;
          await removeOp(op.id);
          continue;
        }
        await updateOp(op.id, {
          status: "conflict",
          attempts,
          nextAttemptAt: null,
          lastError: toOutboxError(err),
        });
        summary.conflicts += 1;
        continue;
      }

      if (!status || status >= 500) {
        // No status at all means the server never answered: a client-side
        // exception, a missing API URL, a proxy that dropped it. That is
        // transient by definition, and parking it as "failed" would strand data
        // that only needs another attempt.
        await updateOp(op.id, {
          attempts,
          nextAttemptAt: Date.now() + backoffFor(attempts),
          lastError: toOutboxError(err),
        });
        summary.pending += 1;
        continue;
      }

      // A real 4xx: the server understood the request and refused it, so
      // retrying will not change the answer. Park it visibly so the user can fix
      // or discard it — never auto-delete their data.
      await updateOp(op.id, {
        status: "failed",
        attempts,
        nextAttemptAt: null,
        lastError: toOutboxError(err),
      });
      summary.failed += 1;
    }
  }

  return summary;
}

/** Serialised entry point: concurrent callers share one run. */
export function syncOutbox(opts: { force?: boolean } = {}): Promise<SyncSummary> {
  if (running) return running;
  running = runSync(opts.force ?? false)
    .then((summary) => {
      listeners.forEach((l) => l(summary));
      return summary;
    })
    .catch((err) => {
      console.error("Outbox: fallo inesperado al sincronizar", err);
      return { ...EMPTY };
    })
    .finally(() => {
      running = null;
    });
  return running;
}
