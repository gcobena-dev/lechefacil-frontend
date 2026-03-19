import { getPref, setPref } from "@/utils/prefs";
import { apiFetch } from "./client";

// --- Types ---

export interface DeviceRecord {
  id: string;
  device_record_id: number;
  codigo: string;
  peso: string;
  fecha: string;
  hora: string;
  turno: string;
  status: string;
  matched_animal_id: string | null;
  batch_id: string;
  created_at: string;
}

export interface ScaleDevice {
  id: string;
  tenant_id: string;
  name: string;
  api_key_masked: string;
  api_key?: string;
  pairing_pin?: string;
  pairing_pin_expires_at?: string;
  is_active: boolean;
  last_seen_at: string | null;
  firmware_version: string | null;
  wifi_ssid: string | null;
  created_at: string;
}

export interface PairingPinResponse {
  pin: string;
  expires_at: string;
}

export interface PendingRecordsResponse {
  items: DeviceRecord[];
  total: number;
}

export interface MatchedDeviceRecord {
  animalId: string;
  animalName: string;
  tag: string;
  quantity: number;
  deviceRecordId: string;
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
}

// --- Imported IDs persistence (to track what's been imported in UI) ---

const IMPORTED_KEY = "lf_device_sync_imported";
const MAX_IMPORTED = 1000;

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

// --- Scale Devices API ---

const authOpts = { withAuth: true, withTenant: true } as const;

export async function listScaleDevices(): Promise<ScaleDevice[]> {
  const res = await apiFetch<ScaleDevice[] | { items: ScaleDevice[] }>(
    "/api/v1/scale-devices/",
    authOpts
  );
  return Array.isArray(res) ? res : res.items;
}

export async function createScaleDevice(payload: {
  name: string;
  wifi_ssid?: string;
  wifi_password?: string;
}): Promise<ScaleDevice> {
  return apiFetch("/api/v1/scale-devices/", {
    ...authOpts,
    method: "POST",
    body: payload,
  });
}

export async function getScaleDevice(deviceId: string): Promise<ScaleDevice> {
  return apiFetch(`/api/v1/scale-devices/${deviceId}`, authOpts);
}

export async function updateScaleDevice(
  deviceId: string,
  payload: {
    name?: string;
    wifi_ssid?: string;
    wifi_password?: string;
    is_active?: boolean;
  }
): Promise<ScaleDevice> {
  return apiFetch(`/api/v1/scale-devices/${deviceId}`, {
    ...authOpts,
    method: "PUT",
    body: payload,
  });
}

export async function regenerateDeviceKey(
  deviceId: string
): Promise<ScaleDevice> {
  return apiFetch(`/api/v1/scale-devices/${deviceId}/regenerate-key`, {
    ...authOpts,
    method: "POST",
  });
}

export async function generatePairingPin(
  deviceId: string
): Promise<PairingPinResponse> {
  return apiFetch(`/api/v1/scale-devices/${deviceId}/generate-pin`, {
    ...authOpts,
    method: "POST",
  });
}

// --- Pending Records API ---

export async function getPendingRecords(
  deviceId: string,
  params?: { status?: string; limit?: number; offset?: number; fecha?: string }
): Promise<PendingRecordsResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  if (params?.fecha) query.set("fecha", params.fecha);
  const qs = query.toString();
  return apiFetch(
    `/api/v1/scale-devices/${deviceId}/records${qs ? `?${qs}` : ""}`,
    authOpts
  );
}

export async function fetchAllPendingRecords(fecha?: string): Promise<DeviceRecord[]> {
  // Get all devices, then all pending records
  const devices = await listScaleDevices();
  const activeDevices = devices.filter((d) => d.is_active);
  if (activeDevices.length === 0) return [];

  const allRecords: DeviceRecord[] = [];
  for (const device of activeDevices) {
    const res = await getPendingRecords(device.id, {
      status: "pending",
      limit: 200,
      fecha,
    });
    allRecords.push(...res.items);
  }
  return allRecords;
}

// --- Matching logic (code → animal) ---

interface MatchAnimal {
  id: string;
  name: string;
  tag: string;
}

export function matchDeviceRecords(
  records: DeviceRecord[],
  animals: MatchAnimal[]
): MatchResult {
  const tagMap = new Map<string, MatchAnimal>();
  for (const a of animals) {
    if (a.tag) {
      tagMap.set(a.tag.toLowerCase().trim(), a);
    }
  }

  const matchedByAnimal = new Map<string, MatchedDeviceRecord>();
  const unmatched: UnmatchedDeviceRecord[] = [];

  for (const r of records) {
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
          deviceRecordId: r.id,
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
  };
}

// --- Check if sync is available (any active devices exist) ---

export function isDeviceSyncAvailable(): boolean {
  // Always available now - it's just an API call
  return true;
}
