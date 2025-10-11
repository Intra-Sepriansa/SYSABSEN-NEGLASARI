const STORAGE_KEY = 'absentech.kiosk.cfg';

async function getKeyMaterial(secret: string) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
}

async function deriveAesKey(secret: string) {
  const keyMaterial = await getKeyMaterial(secret);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('absentech-kiosk'),
      iterations: 100_000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface PersistedConfig<T> {
  data: T;
  iv: string;
}

export async function saveSecure<T>(data: T, secret: string) {
  try {
    if (!window.crypto?.subtle) {
      const encoded = btoa(JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fallback: true, payload: encoded }));
      return;
    }
    const aesKey = await deriveAesKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const payload = new TextEncoder().encode(JSON.stringify(data));
    const buffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, payload);
    const raw = new Uint8Array(buffer);
    const combined = `${btoa(String.fromCharCode(...raw))}.${btoa(String.fromCharCode(...iv))}`;
    localStorage.setItem(STORAGE_KEY, combined);
  } catch (error) {
    console.warn('secureStore fallback', error);
    const encoded = btoa(JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fallback: true, payload: encoded }));
  }
}

export async function loadSecure<T>(secret: string) {
  const value = localStorage.getItem(STORAGE_KEY);
  if (!value) {
    return null;
  }
  try {
    if (value.startsWith('{')) {
      const parsed = JSON.parse(value);
      if (parsed.fallback) {
        return JSON.parse(atob(parsed.payload)) as T;
      }
    }
    if (!window.crypto?.subtle) {
      return null;
    }
    const [payloadB64, ivB64] = value.split('.');
    const payload = Uint8Array.from(atob(payloadB64), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const aesKey = await deriveAesKey(secret);
    const buffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, payload);
    const decoded = new TextDecoder().decode(buffer);
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.warn('Failed to decrypt config, clearing', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearSecure() {
  localStorage.removeItem(STORAGE_KEY);
}
