import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch, ApiError } from "../api";

// Mock supabase
vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: { access_token: "test-token" },
        },
      }),
    },
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("apiFetch", () => {
  it("attaches Authorization header", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiFetch("/api/test");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("handles 4xx errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    });

    await expect(apiFetch("/api/missing")).rejects.toThrow(ApiError);
    try {
      await apiFetch("/api/missing");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
      expect((err as ApiError).message).toBe("Not found");
    }
  });

  it("handles 5xx errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Internal error" }),
    });

    await expect(apiFetch("/api/broken")).rejects.toThrow(ApiError);
  });

  it("handles 204 No Content", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await apiFetch("/api/delete-something");
    expect(result).toBeUndefined();
  });
});
