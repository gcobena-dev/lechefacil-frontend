declare global {
  interface Window {
    __APP_CONFIG__?: Record<string, string | undefined>;
  }
}

// Prefer runtime-provided config (env.js), fallback to vite build-time vars
const RUNTIME_API_URL = (typeof window !== 'undefined' && window.__APP_CONFIG__?.VITE_API_URL) as string | undefined;
const RUNTIME_TENANT_HEADER = (typeof window !== 'undefined' && window.__APP_CONFIG__?.VITE_TENANT_HEADER) as string | undefined;

export const API_URL = RUNTIME_API_URL ?? (import.meta.env.VITE_API_URL as string | undefined);
// Función para validar y sanitizar el nombre del header
function getValidTenantHeader(): string {
  const envHeader = RUNTIME_TENANT_HEADER ?? (import.meta.env.VITE_TENANT_HEADER as string | undefined);

  // Si no hay header configurado, usar el default
  if (!envHeader) {
    return "X-Tenant-ID";
  }

  // Sanitizar: remover espacios y caracteres inválidos
  const sanitized = envHeader.trim();

  // Validar que el header tenga un formato válido
  // Los headers HTTP solo pueden contener letras, números, guiones y algunos símbolos
  const validHeaderRegex = /^[a-zA-Z0-9\-_]+$/;

  if (!validHeaderRegex.test(sanitized)) {
    console.warn(`Invalid TENANT_HEADER "${sanitized}", using default "X-Tenant-ID"`);
    return "X-Tenant-ID";
  }

  return sanitized;
}

export const TENANT_HEADER = getValidTenantHeader();

const TOKEN_KEY = "lf_token";
const TENANT_ID_KEY = "lf_tenant_id";
const MUST_CHANGE_PASSWORD_KEY = "lf_must_change_password";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  // Notify listeners in this tab about token changes
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('lf_token_changed'));
    } catch (_e) {
      // no-op
    }
  }
}

export function getTenantId(): string | null {
  return localStorage.getItem(TENANT_ID_KEY);
}

export function setTenantId(tenantId: string | null) {
  if (tenantId) localStorage.setItem(TENANT_ID_KEY, tenantId);
  else localStorage.removeItem(TENANT_ID_KEY);
}

export function requireApiUrl(): string {
  if (!API_URL) {
    throw new Error("VITE_API_URL no está configurado");
  }
  return API_URL;
}

export function getMustChangePassword(): boolean {
  return localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === 'true';
}

export function setMustChangePassword(mustChange: boolean) {
  if (mustChange) {
    localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, 'true');
  } else {
    localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
  }
}

export function logout() {
  setToken(null);
  setTenantId(null);
  setMustChangePassword(false);
}
