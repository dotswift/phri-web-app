import { supabase } from "./supabase";
import type { UploadSSEEvent } from "../types/api";

// In dev, use relative URLs so requests go through the Vite proxy (avoids CORS).
// In production, hit the backend directly (CORS_ORIGINS configured on backend).
const API_URL = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL;

export async function getToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return session.access_token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, body.error ?? "Unknown error");
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

/**
 * Read an SSE stream body line-by-line and dispatch parsed events.
 */
async function readSSEStream(
  res: Response,
  onEvent: (event: UploadSSEEvent) => void,
): Promise<void> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const event: UploadSSEEvent = JSON.parse(line.slice(6));
            onEvent(event);
            if (event.type === "complete" || event.type === "error") return;
          } catch {
            // Skip malformed lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function streamUpload(
  file: File,
  patientInfo: { firstName: string; lastName: string; dob: string },
  onEvent: (event: UploadSSEEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = await getToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("firstName", patientInfo.firstName);
  formData.append("lastName", patientInfo.lastName);
  formData.append("dob", patientInfo.dob);

  const res = await fetch(`${API_URL}/api/upload/document`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  await readSSEStream(res, onEvent);
}

/**
 * Resume a partially-completed upload from last checkpoint.
 * SSE stream — same event format as streamUpload.
 */
export async function streamResume(
  uploadId: string,
  onEvent: (event: UploadSSEEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = await getToken();

  const res = await fetch(`${API_URL}/api/upload/${uploadId}/resume`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  await readSSEStream(res, onEvent);
}
