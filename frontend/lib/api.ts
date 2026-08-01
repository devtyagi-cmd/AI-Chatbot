import {
  buildBasicToken,
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from "./auth-storage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

export interface ColumnInfo {
  name: string;
  dtype: string;
}

export interface FileProfile {
  row_count: number;
  column_count: number;
  columns: ColumnInfo[];
  missing_values: Record<string, number>;
  preview: Record<string, unknown>[];
  removed_summary_rows?: number;
}

export interface UploadResponse {
  file_id: string;
  filename: string;
  profile: FileProfile;
}

export interface TableResult {
  columns: string[];
  rows: Record<string, unknown>[];
  truncated: boolean;
}

export interface ChartResult {
  type: "bar" | "line" | "pie";
  x: string;
  y: string;
  title: string;
  data: Record<string, unknown>[];
}

export interface ChatResponse {
  answer: string;
  sql: string | null;
  table: TableResult | null;
  chart: ChartResult | null;
}

function authHeaders(): Record<string, string> {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Basic ${token}` } : {};
}

async function parseErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body.detail || fallback;
  } catch {
    return fallback;
  }
}

// --- Auth ---

/** Silent check on app load: is there already a valid session (or is the
 * backend's login gate disabled entirely, e.g. local dev)? */
export async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      headers: authHeaders(),
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Attempts a login with the given credentials. Stores the token on
 * success so subsequent requests are authenticated. */
export async function login(username: string, password: string): Promise<boolean> {
  const token = buildBasicToken(username, password);
  try {
    const res = await fetch(`${API_BASE}/login`, {
      headers: { Authorization: `Basic ${token}` },
      credentials: "include",
    });
    if (res.ok) {
      setStoredAuthToken(token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function logout(): void {
  clearStoredAuthToken();
}

// --- App data ---

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
    credentials: "include",
  });

  if (res.status === 401) {
    clearStoredAuthToken();
  }
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Upload failed"));
  }
  return res.json();
}

export async function sendChat(fileId: string, question: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ file_id: fileId, question }),
    credentials: "include",
  });

  if (res.status === 401) {
    clearStoredAuthToken();
  }
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Chat request failed"));
  }
  return res.json();
}
