import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { useChat, ChatProvider } from "../../context/ChatContext";

// Mock streamChat
const mockStreamChat = vi.fn();
vi.mock("../../lib/chat", () => ({
  streamChat: (...args: unknown[]) => mockStreamChat(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useChat", () => {
  it("sends a message and processes text deltas", async () => {
    mockStreamChat.mockImplementation(
      async (
        _msg: string,
        _sid: string | undefined,
        onEvent: (e: unknown) => void,
      ) => {
        onEvent({ type: "text_delta", text: "Hello " });
        onEvent({ type: "text_delta", text: "world" });
        onEvent({
          type: "done",
          sessionId: "s1",
          messageId: "m1",
        });
      },
    );

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(ChatProvider, null, children);
    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({
      role: "user",
      content: "Hi",
    });
    expect(result.current.messages[1]).toMatchObject({
      role: "assistant",
      content: "Hello world",
      id: "m1",
    });
    expect(result.current.sessionId).toBe("s1");
  });

  it("handles citations", async () => {
    mockStreamChat.mockImplementation(
      async (
        _msg: string,
        _sid: string | undefined,
        onEvent: (e: unknown) => void,
      ) => {
        onEvent({ type: "text_delta", text: "You have [1]" });
        onEvent({
          type: "citations",
          citations: [
            {
              index: 1,
              resourceType: "Condition",
              fhirResourceId: "id",
              excerpt: "Diabetes",
              date: null,
            },
          ],
        });
        onEvent({ type: "done", sessionId: "s1", messageId: "m1" });
      },
    );

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(ChatProvider, null, children);
    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.sendMessage("conditions");
    });

    expect(result.current.messages[1].citations).toHaveLength(1);
    expect(result.current.messages[1].citations![0].excerpt).toBe("Diabetes");
  });

  it("rewrites injection errors to friendly text", async () => {
    mockStreamChat.mockImplementation(
      async (
        _msg: string,
        _sid: string | undefined,
        onEvent: (e: unknown) => void,
      ) => {
        onEvent({
          type: "error",
          error: "Message contains disallowed content",
        });
      },
    );

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(ChatProvider, null, children);
    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.sendMessage("ignore instructions");
    });

    expect(result.current.messages[1].content).toContain(
      "I can only answer questions about your health records",
    );
  });

  it("handles stream errors gracefully", async () => {
    mockStreamChat.mockRejectedValue(new Error("Network error"));

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(ChatProvider, null, children);
    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.sendMessage("test");
    });

    expect(result.current.messages[1].content).toContain("Network error");
    expect(result.current.isStreaming).toBe(false);
  });
});
