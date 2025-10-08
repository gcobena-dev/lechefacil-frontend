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
  await fetch(new URL('/api/v1/devices/tokens', api).toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access}`,
      [TENANT_HEADER]: tenant,
    },
    body: JSON.stringify({ platform: Capacitor.getPlatform(), token }),
    credentials: 'include',
  });
}

async function unregisterTokenFromBackend(token: string) {
  const api = requireApiUrl();
  const access = getToken();
  const tenant = getTenantId();
  if (!access || !tenant) return;
  await fetch(new URL('/api/v1/devices/tokens', api).toString(), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access}`,
      [TENANT_HEADER]: tenant,
    },
    body: JSON.stringify({ token }),
    credentials: 'include',
  });
}

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  let status: PermissionStatus;
  try {
    status = await PushNotifications.checkPermissions();
    if (status.receive !== 'granted') {
      status = await PushNotifications.requestPermissions();
    }
  } catch (e) {
    console.warn('Push permissions error', e);
    return;
  }
  if (status.receive !== 'granted') return;

  // Register will trigger the 'registration' event with token
  await PushNotifications.register();

  // Listen for registration
  PushNotifications.addListener('registration', async (token: Token) => {
    const t = token.value;
    setSavedDeviceToken(t);
    try {
      await registerTokenWithBackend(t);
    } catch (e) {
      console.warn('Failed to register device token in backend', e);
    }
  });

  // Foreground reception (optional: could show a toast or local notification)
  PushNotifications.addListener('pushNotificationReceived', (_notification) => {
    // No-op here; UI can listen if needed
  });
}

export async function unregisterPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  const saved = getSavedDeviceToken();
  if (saved) {
    try {
      await unregisterTokenFromBackend(saved);
    } catch (e) {
      console.warn('Failed to unregister device token in backend', e);
    }
  }
  setSavedDeviceToken(null);
}

