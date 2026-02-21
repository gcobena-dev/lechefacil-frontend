export function getPref<T>(
  key: string,
  defaultValue: T,
  options?: { session?: boolean }
): T {
  try {
    const useSession = options?.session ?? true;
    const storage = useSession ? window.sessionStorage : window.localStorage;
    const raw = storage.getItem(key);
    if (raw == null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function setPref<T>(
  key: string,
  value: T,
  options?: { session?: boolean }
): void {
  try {
    const useSession = options?.session ?? true;
    const storage = useSession ? window.sessionStorage : window.localStorage;
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors
  }
}
