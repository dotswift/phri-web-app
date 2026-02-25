import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { ConsentPage } from "../ConsentPage";

// Mock auth context
const mockRefreshUserState = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    refreshUserState: mockRefreshUserState,
  }),
}));

// Mock API
const mockPost = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <BrowserRouter>
      <ConsentPage />
    </BrowserRouter>,
  );
}

describe("ConsentPage", () => {
  it("renders all 3 checkboxes unchecked", () => {
    renderPage();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    checkboxes.forEach((cb) => {
      expect(cb).not.toBeChecked();
    });
  });

  it("submit button is disabled until all boxes checked", async () => {
    const user = userEvent.setup();
    renderPage();

    const submitButton = screen.getByRole("button", {
      name: /i agree/i,
    });
    expect(submitButton).toBeDisabled();

    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      await user.click(cb);
    }

    expect(submitButton).toBeEnabled();
  });

  it("calls API on submit", async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValue({ id: "consent-id" });
    mockRefreshUserState.mockResolvedValue(undefined);

    renderPage();

    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      await user.click(cb);
    }

    const submitButton = screen.getByRole("button", {
      name: /i agree/i,
    });
    await user.click(submitButton);

    expect(mockPost).toHaveBeenCalledWith("/api/consent", {
      dataUsage: true,
      llmDataFlow: true,
      deletionRights: true,
    });
  });
});
