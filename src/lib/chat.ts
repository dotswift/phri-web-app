import { supabase } from "./supabase";
import type { ChatSSEEvent } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL;

export type { ChatSSEEvent };

export interface ChatCitation {
  index: number;
  resourceType: string;
  fhirResourceId: string;
  excerpt: string;
  date: string | null;
}

export async function streamChat(
  message: string,
  sessionId: string | undefined,
  onEvent: (event: ChatSSEEvent) => void,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const json = line.slice(6);
        try {
          const event: ChatSSEEvent = JSON.parse(json);
          onEvent(event);

          if (event.type === "done" || event.type === "error") {
            return;
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  }
}
