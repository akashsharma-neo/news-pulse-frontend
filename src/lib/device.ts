const SALT_KEY = "np_device_salt";
const FP_KEY = "np_device_fp";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

let cachedId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedId) return cachedId;

  const stored = localStorage.getItem(FP_KEY);
  if (stored) {
    cachedId = stored;
    return stored;
  }

  let salt = localStorage.getItem(SALT_KEY) ?? getCookie(SALT_KEY);

  if (!salt) {
    salt = crypto.randomUUID();
    localStorage.setItem(SALT_KEY, salt);
    setCookie(SALT_KEY, salt, 365);
  }

  const components = [
    navigator.userAgent,
    screen.width,
    screen.height,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    salt,
  ];

  const fp = await sha256(components.join("||"));
  localStorage.setItem(FP_KEY, fp);

  if (!getCookie(SALT_KEY)) {
    setCookie(SALT_KEY, salt, 365);
  }

  cachedId = fp;
  return fp;
}
