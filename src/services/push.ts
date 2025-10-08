import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PermissionStatus } from '@capacitor/push-notifications';
import { requireApiUrl, getToken, getTenantId, TENANT_HEADER } from './config';

const DEVICE_TOKEN_KEY = 'lf_device_push_token';

export function getSavedDeviceToken(): string | null {
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setSavedDeviceToken(token: string | null) {
  try {
    if (token) localStorage.setItem(DEVICE_TOKEN_KEY, token);
    else localStorage.removeItem(DEVICE_TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function registerTokenWithBackend(token: string) {
  const api = requireApiUrl();
  const access = getToken();
  const tenant = getTenantId();
  if (!access || !tenant) return;
  const url = new URL('/api/v1/devices/tokens', api).toString();
  const payload = { platform: Capacitor.getPlatform(), token } as const;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access}`,
    [TENANT_HEADER]: tenant,
  };
  console.log('[Push] POST /devices/tokens', {
    url,
    headers: { ...headers, Authorization: 'Bearer *****' },
    body: { ...payload, token: (token?.slice(0, 10) || '') + '...' },
  });
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('[Push] register token failed', res.status, text);
  } else {
    console.log('[Push] register token OK');
  }
}

async function unregisterTokenFromBackend(token: string) {
  const api = requireApiUrl();
  const access = getToken();
  const tenant = getTenantId();
  if (!access || !tenant) return;
  const url = new URL('/api/v1/devices/tokens', api).toString();
  const payload = { token } as const;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access}`,
    [TENANT_HEADER]: tenant,
  };
  console.log('[Push] DELETE /devices/tokens', {
    url,
    headers: { ...headers, Authorization: 'Bearer *****' },
    body: { token: (token?.slice(0, 10) || '') + '...' },
  });
  const res = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('[Push] unregister token failed', res.status, text);
  } else {
    console.log('[Push] unregister token OK');
  }
}

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  let status: PermissionStatus;
  try {
    status = await PushNotifications.checkPermissions();
    console.log('[Push] checkPermissions:', status);
    if (status.receive !== 'granted') {
      status = await PushNotifications.requestPermissions();
      console.log('[Push] requestPermissions:', status);
    }
  } catch (e) {
    console.warn('Push permissions error', e);
    return;
  }
  if (status.receive !== 'granted') return;

  // Register will trigger the 'registration' event with token
  await PushNotifications.register();
  console.log('[Push] register called');

  // Listen for registration
  PushNotifications.addListener('registration', async (token: Token) => {
    const t = token.value;
    console.log('[Push] registration token:', t?.slice(0, 12) + '...');
    setSavedDeviceToken(t);
    try {
      await registerTokenWithBackend(t);
      console.log('[Push] token sent to backend');
    } catch (e) {
      console.warn('Failed to register device token in backend', e);
    }
  });

  // Foreground reception (optional: could show a toast or local notification)
  PushNotifications.addListener('pushNotificationReceived', (_notification) => {
    console.log('[Push] pushNotificationReceived (foreground)', _notification);
  });
}

export async function unregisterPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  const saved = getSavedDeviceToken();
  if (saved) {
    try {
      await unregisterTokenFromBackend(saved);
      console.log('[Push] token unregistered from backend');
    } catch (e) {
      console.warn('Failed to unregister device token in backend', e);
    }
  }
  setSavedDeviceToken(null);
}

export async function requestPushPermissionsManually() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const status = await PushNotifications.requestPermissions();
    console.log('[Push] manual requestPermissions:', status);
    if (status.receive === 'granted') {
      await PushNotifications.register();
      console.log('[Push] manual register called');
    }
  } catch (e) {
    console.warn('[Push] manual permission error', e);
  }
}
