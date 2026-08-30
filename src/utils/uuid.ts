/**
 * UUID v4. `crypto.randomUUID` is available in the Capacitor WebView (served
 * from https://localhost, a secure context) and in modern browsers; the manual
 * path covers older WebViews and plain-http dev hosts.
 */
export function uuid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const b = c.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
      16,
      20
    )}-${hex.slice(20)}`;
  }
  // Last resort: still unique enough to key an outbox entry on one device.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 14)}`;
}
