import { Capacitor } from "@capacitor/core";
import { getPref, setPref } from "@/utils/prefs";

// --- Types ---

export interface DeviceRecord {
  id: number;
  codigo: string;
  peso: string;
  fecha: string;
  hora: string;
  turno: string;
}

export interface DeviceSyncResult {
  ok: boolean;
  records?: DeviceRecord[];
  error?: string;
  errorType?: "network" | "parse" | "timeout" | "empty";
}

export interface MatchedDeviceRecord {
  animalId: string;
  animalName: string;
  tag: string;
  quantity: number;
  deviceRecord: DeviceRecord;
}

export interface UnmatchedDeviceRecord {
  codigo: string;
  peso: string;
  fecha: string;
  hora: string;
  turno: string;
}

export interface MatchResult {
  matched: MatchedDeviceRecord[];
  unmatched: UnmatchedDeviceRecord[];
  duplicates: number;
}

// --- Device buffer (Phase 1: raw data from balanza) ---

const BUFFER_KEY = "lf_device_sync_buffer";

export function saveDeviceBuffer(records: DeviceRecord[]): void {
  setPref(BUFFER_KEY, records, { session: false });
}

export function getDeviceBuffer(): DeviceRecord[] | null {
  const data = getPref<DeviceRecord[] | null>(BUFFER_KEY, null, {
    session: false,
  });
  return data && data.length > 0 ? data : null;
}

export function clearDeviceBuffer(): void {
  try {
    window.localStorage.removeItem(BUFFER_KEY);
  } catch {
    // ignore
  }
}

export function hasDeviceBuffer(): boolean {
  return getDeviceBuffer() !== null;
}

// --- Imported IDs persistence ---

const IMPORTED_KEY = "lf_device_sync_imported";
const MAX_IMPORTED = 1000;

function makeUid(r: DeviceRecord): string {
  return `${r.id}::${r.codigo}::${r.fecha}::${r.hora}`;
}

export function getImportedIds(): string[] {
  return getPref<string[]>(IMPORTED_KEY, [], { session: false });
}

export function markAsImported(uids: string[]): void {
  const current = getImportedIds();
  const merged = [...current, ...uids];
  // Rolling window: keep only last MAX_IMPORTED
  const trimmed =
    merged.length > MAX_IMPORTED
      ? merged.slice(merged.length - MAX_IMPORTED)
      : merged;
  setPref(IMPORTED_KEY, trimmed, { session: false });
}

// --- Platform check ---

export function isDeviceSyncAvailable(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// --- HTTP fetch from device (native only) ---

function promiseTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function fetchDeviceRecords(
  host = "http://192.168.4.1",
  timeoutMs = 10000
): Promise<DeviceSyncResult> {
  if (!isDeviceSyncAvailable()) {
    return {
      ok: false,
      error: "Esta función solo está disponible en la app móvil",
      errorType: "network",
    };
  }

  const url = `${host.replace(/\/+$/, "")}/data`;

  let text: string | undefined;

  try {
    const { CapacitorHttp } = await import("@capacitor/core");
    const res = await promiseTimeout(
      CapacitorHttp.request({
        url,
        method: "GET",
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
        headers: { Accept: "application/json, text/plain" },
      }),
      timeoutMs
    );

    const data = res.data;
    text =
      typeof data === "object" ? JSON.stringify(data) : String(data ?? "");
    text = text.trim();

    if (res.status < 200 || res.status >= 300 || !text) {
      return {
        ok: false,
        error: "No se pudo conectar con la balanza",
        errorType: "network",
      };
    }
  } catch (e: unknown) {
    const msg = String(e instanceof Error ? e.message : "").toLowerCase();
    if (msg.includes("timeout") || msg.includes("abort")) {
      return { ok: false, error: "timeout", errorType: "timeout" };
    }
    return { ok: false, error: msg || "No se pudo conectar con la balanza", errorType: "network" };
  }

  // Parse response
  try {
    const parsed = JSON.parse(text);
    const records: DeviceRecord[] = Array.isArray(parsed)
      ? parsed
      : parsed.records ?? parsed.data ?? [];
    if (records.length === 0) {
      return { ok: false, error: "empty", errorType: "empty" };
    }
    return { ok: true, records };
  } catch {
    return {
      ok: false,
      error: "Respuesta inválida del dispositivo",
      errorType: "parse",
    };
  }
}

// --- Matching logic ---

interface MatchAnimal {
  id: string;
  name: string;
  tag: string;
}

export function matchDeviceRecords(
  records: DeviceRecord[],
  animals: MatchAnimal[]
): MatchResult {
  const importedIds = new Set(getImportedIds());
  let duplicates = 0;

  // Filter already imported
  const fresh = records.filter((r) => {
    if (importedIds.has(makeUid(r))) {
      duplicates++;
      return false;
    }
    return true;
  });

  // Build tag→animal lookup (case-insensitive)
  const tagMap = new Map<string, MatchAnimal>();
  for (const a of animals) {
    if (a.tag) {
      tagMap.set(a.tag.toLowerCase().trim(), a);
    }
  }

  const matchedByAnimal = new Map<string, MatchedDeviceRecord>();
  const unmatched: UnmatchedDeviceRecord[] = [];

  for (const r of fresh) {
    const code = (r.codigo || "").toLowerCase().trim();
    const animal = tagMap.get(code);

    if (animal) {
      const peso = parseFloat(r.peso) || 0;
      const existing = matchedByAnimal.get(animal.id);
      if (existing) {
        // Sum quantities for same animal
        existing.quantity += peso;
      } else {
        matchedByAnimal.set(animal.id, {
          animalId: animal.id,
          animalName: animal.name,
          tag: animal.tag,
          quantity: peso,
          deviceRecord: r,
        });
      }
    } else {
      unmatched.push({
        codigo: r.codigo,
        peso: r.peso,
        fecha: r.fecha,
        hora: r.hora,
        turno: r.turno,
      });
    }
  }

  return {
    matched: Array.from(matchedByAnimal.values()),
    unmatched,
    duplicates,
  };
}

export function getUidsFromRecords(records: DeviceRecord[]): string[] {
  return records.map(makeUid);
}
