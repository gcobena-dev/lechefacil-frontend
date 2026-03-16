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

export type SyncMethod = "usb" | "wifi";

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
  const trimmed =
    merged.length > MAX_IMPORTED
      ? merged.slice(merged.length - MAX_IMPORTED)
      : merged;
  setPref(IMPORTED_KEY, trimmed, { session: false });
}

// --- Platform checks ---

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isWebSerialSupported(): boolean {
  return "serial" in navigator;
}

export function isUsbSyncAvailable(): boolean {
  return isNative() || isWebSerialSupported();
}

export function isWifiSyncAvailable(): boolean {
  return isNative();
}

export function isDeviceSyncAvailable(): boolean {
  return isUsbSyncAvailable() || isWifiSyncAvailable();
}

export function getAvailableSyncMethods(): SyncMethod[] {
  const methods: SyncMethod[] = [];
  if (isUsbSyncAvailable()) methods.push("usb");
  if (isWifiSyncAvailable()) methods.push("wifi");
  return methods;
}

// --- Shared helpers ---

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

function parseDeviceResponse(text: string): DeviceSyncResult {
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

// --- USB Serial: Native (Android) ---

async function fetchViaUsbNative(timeoutMs: number): Promise<DeviceSyncResult> {
  const { SerialPort } = await import("@leonardojc/capacitor-serial-port");

  // List available ports and find the ESP32
  const { ports } = await SerialPort.listPorts();
  if (ports.length === 0) {
    return {
      ok: false,
      error:
        "No se detectó ningún dispositivo USB. Verifica la conexión por cable.",
      errorType: "network",
    };
  }

  const port = ports[0];

  try {
    // Setup permissions and open port
    await SerialPort.setupPermissions({ portPath: port.path });
    const openResult = await SerialPort.openPort({
      path: port.path,
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
      parity: "none",
    });

    if (!openResult.success) {
      return {
        ok: false,
        error: openResult.message || "No se pudo abrir el puerto serial",
        errorType: "network",
      };
    }

    // Send DATA command
    await SerialPort.writeData({ data: "DATA\n" });

    // Read response with retries (ESP32 may need time to respond)
    let text = "";
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 150));
      const readRes = await SerialPort.readData();
      if (readRes.success && readRes.data) {
        text += readRes.data;
      }
      // JSON array ends with ]
      if (text.includes("]")) break;
    }

    await SerialPort.closePort();
    text = text.trim();

    if (!text) {
      return {
        ok: false,
        error: "El dispositivo no respondió",
        errorType: "network",
      };
    }

    return parseDeviceResponse(text);
  } catch (e: unknown) {
    try {
      await SerialPort.closePort();
    } catch {
      /* ignore */
    }
    const msg = String(e instanceof Error ? e.message : "").toLowerCase();
    if (msg.includes("timeout")) {
      return { ok: false, error: "timeout", errorType: "timeout" };
    }
    return { ok: false, error: msg || "Error USB", errorType: "network" };
  }
}

// --- USB Serial: Web Serial API (Chrome/Edge) ---

async function fetchViaWebSerial(timeoutMs: number): Promise<DeviceSyncResult> {
  if (!("serial" in navigator)) {
    return {
      ok: false,
      error: "Web Serial API no disponible en este navegador",
      errorType: "network",
    };
  }

  let port: SerialPort | null = null;

  try {
    // Prompt user to select the ESP32 serial device
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    const writer = port.writable?.getWriter();
    const reader = port.readable?.getReader();

    if (!writer || !reader) {
      throw new Error("No se pudo abrir lectura/escritura del puerto serial");
    }

    // Send DATA command
    const encoder = new TextEncoder();
    await writer.write(encoder.encode("DATA\n"));
    writer.releaseLock();

    // Read response with timeout
    const decoder = new TextDecoder();
    let text = "";
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const { value, done } = await promiseTimeout(
        reader.read(),
        Math.max(deadline - Date.now(), 100)
      );
      if (done) break;
      if (value) text += decoder.decode(value, { stream: true });
      // JSON array ends with ]
      if (text.includes("]")) break;
    }

    reader.releaseLock();
    await port.close();

    text = text.trim();
    if (!text) {
      return {
        ok: false,
        error: "El dispositivo no respondió",
        errorType: "network",
      };
    }

    return parseDeviceResponse(text);
  } catch (e: unknown) {
    try {
      if (port) await port.close();
    } catch {
      /* ignore */
    }
    const msg = String(e instanceof Error ? e.message : "");
    // User cancelled the port picker
    if (msg.includes("No port selected") || msg.includes("cancelled")) {
      return {
        ok: false,
        error: "No se seleccionó un puerto serial",
        errorType: "network",
      };
    }
    if (msg.toLowerCase().includes("timeout")) {
      return { ok: false, error: "timeout", errorType: "timeout" };
    }
    return { ok: false, error: msg || "Error serial", errorType: "network" };
  }
}

// --- USB: dispatch to native or web ---

export async function fetchDeviceRecordsUsb(
  timeoutMs = 10000
): Promise<DeviceSyncResult> {
  if (isNative()) {
    return fetchViaUsbNative(timeoutMs);
  }
  if (isWebSerialSupported()) {
    return fetchViaWebSerial(timeoutMs);
  }
  return {
    ok: false,
    error: "USB serial no disponible en esta plataforma",
    errorType: "network",
  };
}

// --- WiFi HTTP fetch (native only) ---

export async function fetchDeviceRecordsWifi(
  host = "http://192.168.4.1",
  timeoutMs = 10000
): Promise<DeviceSyncResult> {
  if (!isNative()) {
    return {
      ok: false,
      error: "WiFi sync solo disponible en la app móvil",
      errorType: "network",
    };
  }

  const url = `${host.replace(/\/+$/, "")}/data`;

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
    let text =
      typeof data === "object" ? JSON.stringify(data) : String(data ?? "");
    text = text.trim();

    if (res.status < 200 || res.status >= 300 || !text) {
      return {
        ok: false,
        error: "No se pudo conectar con la balanza",
        errorType: "network",
      };
    }

    return parseDeviceResponse(text);
  } catch (e: unknown) {
    const msg = String(e instanceof Error ? e.message : "").toLowerCase();
    if (msg.includes("timeout") || msg.includes("abort")) {
      return { ok: false, error: "timeout", errorType: "timeout" };
    }
    return {
      ok: false,
      error: msg || "No se pudo conectar con la balanza",
      errorType: "network",
    };
  }
}

// --- Unified fetch by method ---

export async function fetchDeviceRecords(
  method: SyncMethod = "usb",
  timeoutMs = 10000
): Promise<DeviceSyncResult> {
  if (method === "usb") {
    return fetchDeviceRecordsUsb(timeoutMs);
  }
  return fetchDeviceRecordsWifi(undefined, timeoutMs);
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

  const fresh = records.filter((r) => {
    if (importedIds.has(makeUid(r))) {
      duplicates++;
      return false;
    }
    return true;
  });

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
