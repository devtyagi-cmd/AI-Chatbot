// Stores the Basic Auth token in sessionStorage (cleared when the tab
// closes) rather than localStorage - reasonable middle ground for a
// shared-computer scenario without needing full session/refresh-token
// infrastructure.

const STORAGE_KEY = "aidc_auth_token";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setStoredAuthToken(token: string): void {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearStoredAuthToken(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function buildBasicToken(username: string, password: string): string {
  return btoa(`${username}:${password}`);
}
