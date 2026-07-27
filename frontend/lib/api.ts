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

async function parseErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
    // Needed so the browser's cached Basic Auth login (see backend
    // BASIC_AUTH_USERNAME/PASSWORD) is sent even when the frontend and
    // backend are on different domains in a cloud deployment.
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Upload failed"));
  }
  return res.json();
}

export async function sendChat(fileId: string, question: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, question }),
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Chat request failed"));
  }
  return res.json();
}
