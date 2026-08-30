import { Preferences } from "@capacitor/preferences";
import { getTenantId, getToken } from "./config";

/**
 * Durable queue of writes made while the device could not reach the server.
 *
 * Stored in Capacitor Preferences, which on Android maps to SharedPreferences:
 * it survives a WebView storage wipe and the OTA bundle swaps done by
 * @capgo/capacitor-updater. This holds data the farmer typed that exists
 * nowhere else yet, so it gets the most durable store available. On web the
 * plugin falls back to localStorage.
 *
 * Ops carry their own `tenantId`: a record typed in farm A must be sent as
 * farm A even if the user switched to farm B before regaining signal.
 */

const STORAGE_KEY = "lf_outbox_v1";

export type OutboxKind =
  | "production.create"
  | "production.bulk"
  | "delivery.create";

export type OutboxStatus =
  /** Waiting to be sent (or waiting out a backoff). */
  | "pending"
  /** The server already has a different record for this animal/day/shift. */
  | "conflict"
  /** The server rejected it for a reason retrying will not fix. */
  | "failed";

export interface OutboxError {
  at: string;
  status?: number;
  message: string;
  /** Conflict rows as returned by the API, for the resolution screen. */
  conflicts?: Array<{
    animal_id: string;
    date: string;
    shift: string;
    input_quantity: string;
    existing_date_time?: string;
    existing_volume_l?: string;
  }>;
}

/** What the UI needs to describe an op without hitting the network. */
export interface OutboxMeta {
  /** Business date (YYYY-MM-DD) for productions. */
  date?: string;
  shift?: "AM" | "PM";
  /** Per-animal breakdown, so pending rows can be merged into today's list. */
  entries?: Array<{
    animalId: string;
    inputQuantity: number;
    volumeL: number;
  }>;
  totalVolumeL?: number;
  buyerId?: string | null;
}

export interface OutboxOp {
  /** Generated on the device; doubles as the server idempotency key. */
  id: string;
  kind: OutboxKind;
  tenantId: string;
  userId: string;
  /** Exact API body, ready to POST. */
  payload: Record<string, unknown>;
  meta: OutboxMeta;
  /** When the farmer pressed save, not when we managed to send it. */
  createdAt: string;
  attempts: number;
  /** Epoch ms; `null` means "eligible now". */
  nextAttemptAt: number | null;
  status: OutboxStatus;
  lastError?: OutboxError;
}

// --- In-memory mirror -------------------------------------------------------
// Preferences is async but the UI reads this on every render, so we keep a
// synchronous mirror and treat the store as the write-behind.

let ops: OutboxOp[] = [];
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<(ops: OutboxOp[]) => void>();

function emit() {
  listeners.forEach((l) => l(ops));
}

async function persist(): Promise<void> {
  try {
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(ops) });
  } catch (err) {
    console.error("Outbox: no se pudo persistir la cola", err);
  }
}

export function initOutbox(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      const parsed = value ? JSON.parse(value) : [];
      ops = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Outbox: cola ilegible, se empieza vacía", err);
      ops = [];
    } finally {
      hydrated = true;
      hydrating = null;
      emit();
    }
  })();
  return hydrating;
}

export function subscribeOutbox(listener: (ops: OutboxOp[]) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Synchronous snapshot for `useSyncExternalStore`. */
export function getOutboxSnapshot(): OutboxOp[] {
  return ops;
}

// --- Identity ---------------------------------------------------------------

/** `sub` claim of the access token; ops are only replayed by their own author. */
export function getCurrentUserId(): string {
  const token = getToken();
  if (!token) return "anon";
  try {
    const payload = token.split(".")[1];
    if (!payload) return "anon";
    return (
      (JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
        ?.sub as string) ?? "anon"
    );
  } catch {
    return "anon";
  }
}

// --- Mutations --------------------------------------------------------------

export async function enqueue(input: {
  id: string;
  kind: OutboxKind;
  payload: Record<string, unknown>;
  meta: OutboxMeta;
  tenantId?: string;
}): Promise<OutboxOp> {
  await initOutbox();
  const op: OutboxOp = {
    id: input.id,
    kind: input.kind,
    tenantId: input.tenantId ?? getTenantId() ?? "",
    userId: getCurrentUserId(),
    payload: input.payload,
    meta: input.meta,
    createdAt: new Date().toISOString(),
    attempts: 0,
    nextAttemptAt: null,
    status: "pending",
  };
  ops = [...ops, op];
  emit();
  await persist();
  return op;
}

export async function updateOp(
  id: string,
  patch: Partial<Omit<OutboxOp, "id">>
): Promise<void> {
  await initOutbox();
  ops = ops.map((o) => (o.id === id ? { ...o, ...patch } : o));
  emit();
  await persist();
}

export async function removeOp(id: string): Promise<void> {
  await initOutbox();
  ops = ops.filter((o) => o.id !== id);
  emit();
  await persist();
}

/** Puts a conflicted/failed op back in line, e.g. after the user retries. */
export async function retryOp(id: string): Promise<void> {
  await updateOp(id, {
    status: "pending",
    nextAttemptAt: null,
    attempts: 0,
    lastError: undefined,
  });
}

// --- Queries ----------------------------------------------------------------

/** Ops this session is allowed to replay (same user, any of their farms). */
export function getSyncableOps(): OutboxOp[] {
  const userId = getCurrentUserId();
  return ops.filter((o) => o.userId === userId);
}

/** Ops belonging to the farm currently on screen. */
export function getOpsForCurrentTenant(): OutboxOp[] {
  const tenantId = getTenantId();
  const userId = getCurrentUserId();
  return ops.filter((o) => o.tenantId === tenantId && o.userId === userId);
}

export function countPending(list: OutboxOp[] = getOpsForCurrentTenant()): number {
  return list.filter((o) => o.status === "pending").length;
}

export function countNeedingAttention(
  list: OutboxOp[] = getOpsForCurrentTenant()
): number {
  return list.filter((o) => o.status === "conflict" || o.status === "failed")
    .length;
}

/**
 * Per-animal production rows still on the device for a given date/shift.
 * Used both to render them alongside the server's records and to stop the
 * farmer from registering the same cow twice while offline.
 */
export function getPendingProductionEntries(
  date: string,
  shift?: "AM" | "PM",
  /**
   * Queue snapshot to read from; defaults to the live one. Passing the value
   * returned by `useSyncExternalStore` makes the React dependency explicit
   * instead of hiding it behind this module's state.
   */
  snapshot?: OutboxOp[]
): Array<{
  opId: string;
  status: OutboxStatus;
  animalId: string;
  inputQuantity: number;
  volumeL: number;
  date: string;
  shift: "AM" | "PM";
  createdAt: string;
}> {
  const tenantId = getTenantId();
  const userId = getCurrentUserId();
  const scoped = (snapshot ?? ops).filter(
    (o) => o.tenantId === tenantId && o.userId === userId
  );
  return scoped
    .filter(
      (o) =>
        (o.kind === "production.create" || o.kind === "production.bulk") &&
        o.meta.date === date &&
        (shift === undefined || o.meta.shift === shift)
    )
    .flatMap((o) =>
      (o.meta.entries ?? []).map((e) => ({
        opId: o.id,
        status: o.status,
        animalId: e.animalId,
        inputQuantity: e.inputQuantity,
        volumeL: e.volumeL,
        date: o.meta.date as string,
        shift: (o.meta.shift ?? "AM") as "AM" | "PM",
        createdAt: o.createdAt,
      }))
    );
}

/** Oldest pending op, to warn before the 30-day refresh token expires. */
export function getOldestPendingAt(): string | null {
  const pending = getOpsForCurrentTenant().filter((o) => o.status !== "failed");
  if (pending.length === 0) return null;
  return pending.reduce(
    (oldest, o) => (o.createdAt < oldest ? o.createdAt : oldest),
    pending[0].createdAt
  );
}
