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

/** Advance past the inform step to the select step */
async function goToSelectStep(user: ReturnType<typeof userEvent.setup>) {
  const continueButton = screen.getByRole("button", {
    name: /i understand — continue/i,
  });
  await user.click(continueButton);
}

describe("ConsentPage", () => {
  it("renders inform step first, then checkboxes on select step", async () => {
    const user = userEvent.setup();
    renderPage();

    // Step 1: Inform — no checkboxes yet
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(
      screen.getByText(/fetches health records from connected provider/i),
    ).toBeInTheDocument();

    // Advance to select step
    await goToSelectStep(user);

    // Step 2: Select — all 3 checkboxes unchecked
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    checkboxes.forEach((cb) => {
      expect(cb).not.toBeChecked();
    });
  });

  it("review button is disabled until all boxes checked", async () => {
    const user = userEvent.setup();
    renderPage();
    await goToSelectStep(user);

    const reviewButton = screen.getByRole("button", {
      name: /review & confirm/i,
    });
    expect(reviewButton).toBeDisabled();

    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      await user.click(cb);
    }

    expect(reviewButton).toBeEnabled();
  });

  it("calls API on final confirm step", async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValue({ id: "consent-id" });
    mockRefreshUserState.mockResolvedValue(undefined);

    renderPage();

    // Step 1 → Step 2
    await goToSelectStep(user);

    // Check all boxes
    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      await user.click(cb);
    }

    // Step 2 → Step 3
    const reviewButton = screen.getByRole("button", {
      name: /review & confirm/i,
    });
    await user.click(reviewButton);

    // Step 3: Confirm — submit
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
