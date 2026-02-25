import { test, expect, type Page } from "@playwright/test";
import { TEST_EMAIL, TEST_PASSWORD } from "./global-setup";

test.describe.serial("PHRI user journey", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Test 1: Login page renders ────────────────────────────────────
  test("login page renders", async () => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);

    await expect(page.getByText("PHRI", { exact: true })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();
    await expect(page.getByText(/don't have an account/i)).toBeVisible();
  });

  // ── Test 2: Sign up form toggle ───────────────────────────────────
  test("sign up form toggle", async () => {
    await page.getByText(/don't have an account/i).click();
    await expect(
      page.getByRole("button", { name: /sign up/i }),
    ).toBeVisible();
    await expect(page.getByText(/already have an account/i)).toBeVisible();

    // Toggle back to sign in for the next test
    await page.getByText(/already have an account/i).click();
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();
  });

  // ── Test 3: Sign in with test credentials ─────────────────────────
  test("sign in with test credentials", async () => {
    await page.locator("#email").fill(TEST_EMAIL);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // New user → should land on /consent
    await expect(page).toHaveURL(/\/consent/, { timeout: 15_000 });
  });

  // ── Test 4: Consent page ──────────────────────────────────────────
  test("consent page — check all boxes and submit", async () => {
    await expect(page.getByText("Data Consent")).toBeVisible();

    const agreeButton = page.getByRole("button", {
      name: /i agree — continue/i,
    });
    await expect(agreeButton).toBeDisabled();

    // Check all 3 consent checkboxes
    await page.locator("#dataUsage").check({ force: true });
    await page.locator("#llmDataFlow").check({ force: true });
    await page.locator("#deletionRights").check({ force: true });

    await expect(agreeButton).toBeEnabled();

    // Click and wait for the consent API call
    const consentResponse = page.waitForResponse(
      (resp) => resp.url().includes("/api/consent") && resp.request().method() === "POST",
    );
    await agreeButton.click();
    const resp = await consentResponse;
    expect(resp.status()).toBeLessThan(400);

    await expect(page).toHaveURL(/\/connect/, { timeout: 15_000 });
  });

  // ── Test 5: Connect persona ───────────────────────────────────────
  test("connect persona — select Chris Smith", async () => {
    await expect(page.getByText("Connect a Health Record")).toBeVisible();

    // 5 persona cards
    for (const name of [
      "Chris Smith",
      "Chris Smith",
      "Ollie Brown",
      "Kyla Brown",
      "Andreas Brown",
    ]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }

    const connectButton = page.getByRole("button", {
      name: /connect selected persona/i,
    });
    await expect(connectButton).toBeDisabled();

    // Select Chris Smith card
    await page.getByText("Chris Smith", { exact: true }).click();
    await expect(connectButton).toBeEnabled();

    // Click connect and wait for the API call to complete
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/patient/connect"),
    );
    await connectButton.click();
    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    await expect(page).toHaveURL(/\/progress/, { timeout: 15_000 });
  });

  // ── Test 6: Progress page — wait for data retrieval ───────────────
  test("progress page — wait for data retrieval", async () => {
    await expect(
      page.getByText(/retrieving your health records/i),
    ).toBeVisible();

    // Wait for redirect to /dashboard (data retrieval can take up to 30s)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 45_000 });
  });

  // ── Test 7: Dashboard ─────────────────────────────────────────────
  test("dashboard — persona name, cards, CTAs, recent activity", async () => {
    // Persona heading
    await expect(
      page.getByRole("heading", { name: /chris.*health record/i }),
    ).toBeVisible();

    // Summary cards — check inside the main content area (not sidebar)
    const main = page.locator("main, [class*='flex-1']").last();
    for (const label of [
      "Conditions",
      "Observations",
      "Encounters",
    ]) {
      await expect(main.getByText(label)).toBeVisible();
    }

    // CTA cards — use specific link text that's unique
    await expect(
      page.getByText("Browse all health events chronologically"),
    ).toBeVisible();
    await expect(
      page.getByText("Medication insights & analysis"),
    ).toBeVisible();
    await expect(
      page.getByText("Ask questions about your records"),
    ).toBeVisible();

    // Recent Activity section
    await expect(page.getByText("Recent Activity")).toBeVisible();
  });

  // ── Test 8: Chat ──────────────────────────────────────────────────
  test("chat — send message, verify response, new chat", async () => {
    await page.goto("/chat");
    await expect(
      page.getByText("Ask a question about your health records"),
    ).toBeVisible();

    // Send a message
    const input = page.getByPlaceholder(/ask about your health records/i);
    await input.fill("What conditions do I have?");
    await page.getByRole("button").filter({ has: page.locator("svg") }).last().click();

    // Wait for assistant response to appear
    await expect(async () => {
      const msgs = page.locator("[class*='bg-muted']");
      await expect(msgs.first()).toBeVisible();
    }).toPass({ timeout: 30_000 });

    // New Chat button should work
    const newChatButton = page.getByRole("button", { name: /new chat/i });
    await newChatButton.click();

    await expect(
      page.getByText("Ask a question about your health records"),
    ).toBeVisible();
  });

  // ── Test 9: Timeline ──────────────────────────────────────────────
  test("timeline — filters, pagination, detail drawer", async () => {
    await page.goto("/timeline");
    await expect(
      page.getByRole("heading", { name: "Timeline" }),
    ).toBeVisible();

    // Filter controls
    await expect(page.getByText("Resource Type")).toBeVisible();
    await expect(page.getByText("From", { exact: true })).toBeVisible();
    await expect(page.getByText("To", { exact: true })).toBeVisible();

    // Wait for items to load
    await expect(page.getByText(/page \d+ of \d+/i)).toBeVisible({
      timeout: 15_000,
    });

    // Pagination — click Next
    const nextButton = page.getByRole("button", { name: /next/i });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await expect(page.getByText(/page 2 of/i)).toBeVisible({
        timeout: 15_000,
      });
    }

    // Filter by Condition
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Condition" }).click();
    await expect(page.getByText(/page \d+ of \d+/i)).toBeVisible({
      timeout: 10_000,
    });

    // Click a timeline card to open detail drawer
    const cards = page.locator("[class*='cursor-pointer']");
    if ((await cards.count()) > 0) {
      await cards.first().click();
      await expect(page.getByText("Resource Detail")).toBeVisible();
      // Close drawer
      await page.keyboard.press("Escape");
    }
  });

  // ── Test 10: Medications — empty state ────────────────────────────
  test("medications — empty state", async () => {
    await page.goto("/medications");
    await expect(
      page.getByRole("heading", { name: "Medications", exact: true }),
    ).toBeVisible();

    // Should show search and status controls
    await expect(page.getByText("Status")).toBeVisible();
    await expect(
      page.getByPlaceholder(/search medications/i),
    ).toBeVisible();

    // Empty state for sandbox persona
    await expect(page.getByText(/no medications found/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ── Test 11: Immunizations ────────────────────────────────────────
  test("immunizations — search and detail drawer", async () => {
    await page.goto("/immunizations");
    await expect(
      page.getByRole("heading", { name: "Immunizations", exact: true }),
    ).toBeVisible();

    // Total count
    await expect(page.getByText(/\d+ total/)).toBeVisible({
      timeout: 10_000,
    });

    // Search
    const searchInput = page.getByPlaceholder(/search immunizations/i);
    await searchInput.fill("influenza");

    // Wait for filtered results
    await page.waitForTimeout(500); // debounce delay
    await expect(async () => {
      const items = page.locator("[class*='cursor-pointer']");
      expect(await items.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10_000 });

    // Click an item to open detail drawer
    const items = page.locator("[class*='cursor-pointer']");
    await items.first().click();
    await expect(page.getByText("Resource Detail")).toBeVisible();
    await page.keyboard.press("Escape");

    // Clear search for clean state
    await searchInput.clear();
  });

  // ── Test 12: Medication Insights ──────────────────────────────────
  test("medication insights — stat cards, methodology accordion", async () => {
    await page.goto("/medications/insights");
    await expect(
      page.getByRole("heading", { name: "Medication Insights", exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    // 3 stat cards
    await expect(page.getByText("Unique Medications")).toBeVisible();
    await expect(page.getByText("Active")).toBeVisible();
    await expect(page.getByText("Stopped")).toBeVisible();

    // Methodology accordion
    const methodologyTrigger = page.getByRole("button", {
      name: /methodology/i,
    });
    await expect(methodologyTrigger).toBeVisible();
    await methodologyTrigger.click();

    // Expanded content
    await expect(page.getByText("Steps")).toBeVisible();
    await expect(page.getByText("Limitations")).toBeVisible();
  });

  // ── Test 13: Settings ─────────────────────────────────────────────
  test("settings — AI toggle on/off, disconnect/delete sections", async () => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: "Settings" }),
    ).toBeVisible();

    // Connected Record
    await expect(page.getByText("Connected Record")).toBeVisible();

    // AI Mode toggle
    await expect(page.getByText("AI Mode")).toBeVisible();
    const aiSwitch = page.locator("#ai-mode");
    await expect(aiSwitch).toBeVisible();

    // Toggle off
    await aiSwitch.click();
    await expect(page.getByText(/ai mode disabled/i)).toBeVisible({
      timeout: 5_000,
    });

    // Toggle back on
    await aiSwitch.click();
    await expect(page.getByText(/ai mode enabled/i)).toBeVisible({
      timeout: 5_000,
    });

    // Disconnect section
    await expect(page.getByText("Disconnect Record")).toBeVisible();

    // Delete All Data section
    await expect(page.getByText("Delete All Data")).toBeVisible();
  });

  // ── Test 14: Navigation ───────────────────────────────────────────
  test("navigation — desktop sidebar and mobile hamburger", async () => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    // Desktop sidebar nav items
    for (const label of [
      "Dashboard",
      "Timeline",
      "Medications",
      "Immunizations",
      "Chat",
      "Settings",
    ]) {
      await expect(
        page.getByRole("link", { name: label, exact: true }),
      ).toBeVisible();
    }

    // Sign Out button
    await expect(
      page.getByRole("button", { name: /sign out/i }),
    ).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Hamburger menu should appear
    const hamburger = page.locator("button").filter({
      has: page.locator("[class*='lucide-menu'], svg"),
    });
    // On mobile, sidebar links should be hidden; hamburger visible
    await expect(
      page.locator("[class*='hidden'][class*='md\\:flex']"),
    ).toBeHidden();

    // Open mobile nav sheet
    const mobileMenuButton = page
      .locator("header button, [class*='md\\:hidden'] button")
      .first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      // Sheet should show nav items
      await expect(
        page.getByRole("link", { name: "Dashboard" }),
      ).toBeVisible();
    }

    // Reset viewport to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // ── Test 15: Error states — invalid route redirect ────────────────
  test("error states — invalid route redirects", async () => {
    await page.goto("/some-invalid-route");

    // Should redirect based on auth state (to /dashboard since we're logged in)
    await expect(page).toHaveURL(/\/(dashboard|login|consent|connect)/);
  });
});
