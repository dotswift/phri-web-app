import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

type AuthCallback = (event: string, session: unknown) => void;

// Capture the auth state change listener
let authChangeCallback: AuthCallback | null = null;

const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signInWithPassword: (args: unknown) => mockSignInWithPassword(args),
      onAuthStateChange: (cb: AuthCallback) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signOut: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  authChangeCallback = null;
  mockGetSession.mockResolvedValue({ data: { session: null } });
});

function apiResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

describe("Happy path: login -> consent -> connect -> dashboard", () => {
  it("redirects unauthenticated user to login", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("PHRI")).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows consent page after login via auth state change", async () => {
    const user = userEvent.setup();

    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    // Set up API mocks before triggering auth change
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/consent")) {
        return Promise.resolve(apiResponse(null));
      }
      if (url.includes("/api/patient")) {
        return Promise.resolve(apiResponse(null));
      }
      return Promise.resolve(apiResponse({}));
    });

    const session = {
      access_token: "test-token",
      user: { id: "u1", email: "test@example.com" },
    };

    // Update getSession return value for when AuthContext refetches
    mockGetSession.mockResolvedValue({ data: { session } });

    // Click sign in
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Trigger the auth state change listener (simulates what Supabase does after login)
    if (authChangeCallback) {
      authChangeCallback("SIGNED_IN", session);
    }

    // Should eventually show the consent page
    await waitFor(
      () => {
        expect(screen.getByText(/data consent/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
