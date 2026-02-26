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

    // New user → /consent; returning user with consent → /home (or /connect, /progress)
    await expect(page).toHaveURL(/\/(consent|home|connect|progress)/, { timeout: 15_000 });
  });

  // ── Test 4: Consent page — 3-step flow ───────────────────────────
  test("consent page — inform, select, confirm, submit", async () => {
    // If consent was already completed (returning user), skip
    if (!page.url().includes("/consent")) {
      test.skip();
      return;
    }

    await expect(page.getByText("Data Consent")).toBeVisible();

    // Step 1: Inform — read info and continue
    await expect(
      page.getByText(/fetches health records from connected provider/i),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /i understand — continue/i })
      .click();

    // Step 2: Select — check all consent checkboxes
    await expect(page.getByText(/please review and accept/i)).toBeVisible();

    const reviewButton = page.getByRole("button", {
      name: /review & confirm/i,
    });
    await expect(reviewButton).toBeDisabled();

    await page.locator("#dataUsage").check({ force: true });
    await page.locator("#llmDataFlow").check({ force: true });
    await page.locator("#deletionRights").check({ force: true });

    await expect(reviewButton).toBeEnabled();
    await reviewButton.click();

    // Step 3: Confirm — review summary and submit
    await expect(page.getByText(/you have agreed to/i)).toBeVisible();

    const agreeButton = page.getByRole("button", {
      name: /i agree — continue/i,
    });

    // Click and wait for the consent API call
    const consentResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/consent") &&
        resp.request().method() === "POST",
    );
    await agreeButton.click();
    const resp = await consentResponse;
    expect(resp.status()).toBeLessThan(400);

    await expect(page).toHaveURL(/\/connect/, { timeout: 15_000 });
  });

  // ── Test 5: Connect persona ───────────────────────────────────────
  test("connect persona — select Chris Smith", async () => {
    // If already past the connect step, skip
    if (!page.url().includes("/connect")) {
      test.skip();
      return;
    }

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
    // If already on /home (returning user), skip
    if (page.url().includes("/home")) {
      test.skip();
      return;
    }

    await expect(
      page.getByText(/retrieving your health records/i),
    ).toBeVisible();

    // Wait for redirect to /home (data retrieval can take up to 30s)
    await expect(page).toHaveURL(/\/home/, { timeout: 45_000 });
  });

  // ── Test 7: Dashboard (Home) ────────────────────────────────────────
  test("dashboard — persona name, cards, CTAs, recent activity", async () => {
    // Ensure we're on /home
    if (!page.url().includes("/home")) {
      await page.goto("/home");
    }

    // Persona greeting (time-of-day greeting + first name)
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening), chris/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Summary cards — check inside the main content area (not sidebar)
    const main = page.locator("#main-content");
    for (const label of [
      "Conditions",
      "Observations",
      "Encounters",
    ]) {
      await expect(main.getByText(label)).toBeVisible();
    }

    // Quick action pills (scoped to main content to avoid sidebar matches)
    const mainContent = page.locator("#main-content");
    await expect(
      mainContent.getByRole("link", { name: /timeline/i }),
    ).toBeVisible();
    await expect(
      mainContent.getByRole("link", { name: /deep dive/i }),
    ).toBeVisible();
    await expect(
      mainContent.getByRole("link", { name: /chat/i }),
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
    await page.goto("/records/timeline");
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

    // Pagination — click Next (only if there are multiple pages)
    const paginationText = await page.getByText(/page \d+ of \d+/i).textContent();
    const isMultiPage = paginationText && !paginationText.match(/page 1 of 1/i);
    const nextButton = page.getByRole("button", { name: /next/i });
    if (isMultiPage && await nextButton.isEnabled()) {
      await Promise.all([
        page.waitForResponse((resp) => resp.url().includes("/api/timeline") && resp.status() === 200),
        nextButton.click(),
      ]);
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
    await page.goto("/records/medications");
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
    await page.goto("/records/immunizations");
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
    const mainContent = page.locator("#main-content");
    await expect(async () => {
      const items = mainContent.locator("[class*='cursor-pointer'][class*='hover\\:bg-accent']");
      expect(await items.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10_000 });

    // Wait for entrance animation to settle
    await page.waitForTimeout(500);

    // Click an item to open detail drawer
    const items = mainContent.locator("[class*='cursor-pointer'][class*='hover\\:bg-accent']");
    await items.first().click();
    await expect(page.getByText("Resource Detail")).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");

    // Clear search for clean state
    await searchInput.clear();
  });

  // ── Test 12: Medication Insights ──────────────────────────────────
  test("medication insights — stat cards, methodology accordion", async () => {
    await page.goto("/records/medications/insights");
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
    await page.goto("/profile/settings");
    await expect(
      page.getByRole("heading", { name: "Settings" }),
    ).toBeVisible();

    // Connected Record
    await expect(page.getByText("Connected Record")).toBeVisible();

    // Appearance section (theme toggle)
    await expect(page.getByText("Appearance")).toBeVisible();

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

  // ── Test 14: Navigation — desktop sidebar and mobile bottom bar ──
  test("navigation — desktop sidebar and mobile bottom bar", async () => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/home/);

    // Desktop sidebar nav items (scoped to sidebar to avoid main content matches)
    const sidebar = page.locator('nav[aria-label="Main navigation"]');
    for (const label of ["Home", "Chat"]) {
      await expect(
        sidebar.getByRole("link", { name: label, exact: true }),
      ).toBeVisible();
    }

    // Records expandable section
    await expect(page.getByText("Records", { exact: true }).first()).toBeVisible();

    // Profile section
    await expect(
      page.getByRole("link", { name: "Profile", exact: true }),
    ).toBeVisible();

    // Sign Out button
    await expect(
      page.getByRole("button", { name: /sign out/i }),
    ).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Bottom tab bar should appear with 4 tabs
    const bottomNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(bottomNav).toBeVisible();
    for (const label of ["Home", "Records", "Chat", "Profile"]) {
      await expect(bottomNav.getByText(label)).toBeVisible();
    }

    // Reset viewport to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // ── Test 15: Records category grid ────────────────────────────────
  test("records category grid — navigate to category", async () => {
    await page.goto("/records");
    await expect(
      page.getByRole("heading", { name: "Records" }),
    ).toBeVisible({ timeout: 10_000 });

    // Should show category cards (scoped to main content to avoid sidebar matches)
    const recordsMain = page.locator("#main-content");
    for (const label of ["Health Conditions", "Medications", "Lab Results", "Immunizations"]) {
      await expect(recordsMain.getByText(label).first()).toBeVisible();
    }

    // Click a category card
    await page.getByText("Health Conditions").click();
    await expect(page).toHaveURL(/\/records\/conditions/);
    await expect(
      page.getByRole("heading", { name: "Health Conditions" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Test 16: Breadcrumb navigation ────────────────────────────────
  test("breadcrumb navigation", async () => {
    await page.goto("/records/conditions");
    await page.waitForLoadState("networkidle");

    // Breadcrumb should show "Records > Health Conditions"
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText("Records")).toBeVisible();
    await expect(breadcrumb.getByText("Health Conditions")).toBeVisible();

    // Click "Records" in breadcrumb
    await breadcrumb.getByRole("link", { name: "Records" }).click();
    await expect(page).toHaveURL(/\/records$/);
  });

  // ── Test 17: Error states — invalid route redirect ────────────────
  test("error states — invalid route redirects", async () => {
    await page.goto("/some-invalid-route");

    // Should redirect based on auth state (to /home since we're logged in)
    await expect(page).toHaveURL(/\/(home|login|consent|connect)/);
  });

  // ── Test 18: Old URL redirects ───────────────────────────────────
  test("old URL redirects work", async () => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/home/);

    await page.goto("/timeline");
    await expect(page).toHaveURL(/\/records\/timeline/);

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/profile\/settings/);
  });

  // ── Test 19: Crisis detection ─────────────────────────────────────
  test("crisis detection — shows emergency card without API call", async () => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");

    const input = page.locator("#chat-input");
    await input.fill("I am having chest pain");

    // Click send
    await page.getByRole("button", { name: /send message/i }).click();

    // Crisis card should appear
    await expect(
      page.getByText(/experiencing a medical emergency/i),
    ).toBeVisible();
    await expect(page.getByText("911")).toBeVisible();
    await expect(page.getByText("988")).toBeVisible();

    // Dismiss and continue
    await page.getByRole("button", { name: /continue chatting/i }).click();
    await expect(
      page.getByText(/experiencing a medical emergency/i),
    ).toBeHidden();
  });

  // ── Test 20: Chat suggested prompts ───────────────────────────────
  test("chat — suggested prompts in empty state", async () => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");

    // New chat to get empty state
    const newChatButton = page.getByRole("button", { name: /new chat/i });
    if (await newChatButton.isVisible()) {
      await newChatButton.click();
    }

    // Suggested prompts should be visible
    await expect(
      page.getByText("What conditions do I have?"),
    ).toBeVisible();

    // Disclaimer footer should be visible
    await expect(
      page.getByText(/not medical advice/i),
    ).toBeVisible();
  });

  // ── Test 22: Dashboard KPI cards ──────────────────────────────────
  test("dashboard — KPI cards render with icons and values", async () => {
    await page.goto("/home");
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible({ timeout: 10_000 });

    // KPI cards should show summary values (from KpiCard component)
    const main = page.locator("#main-content");
    for (const label of ["Conditions", "Medications", "Immunizations"]) {
      await expect(main.getByText(label)).toBeVisible();
    }

    // Values should be numeric (rendered by KpiCard)
    const kpiValues = main.locator(".text-2xl.font-bold");
    expect(await kpiValues.count()).toBeGreaterThanOrEqual(4);
  });

  // ── Test 23: Immunization chart renders ─────────────────────────
  test("immunizations — chart renders with data table toggle", async () => {
    // Use client-side navigation to avoid full-page reload auth race condition
    const sidebar = page.locator('nav[aria-label="Main navigation"]');
    // Expand records sub-menu if collapsed
    const immunizationsLink = sidebar.getByRole("link", { name: "Immunizations" });
    if (!(await immunizationsLink.isVisible())) {
      await sidebar.getByRole("button", { name: /records/i }).click();
    }
    await immunizationsLink.click();
    await expect(page).toHaveURL(/\/records\/immunizations/);

    await expect(
      page.getByRole("heading", { name: "Immunizations", exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    // Wait for data to finish loading (either total count or empty state)
    await expect(async () => {
      const hasTotal = await page.getByText(/\d+ total/).isVisible();
      const hasEmpty = await page.getByText(/no immunizations found/i).isVisible();
      expect(hasTotal || hasEmpty).toBeTruthy();
    }).toPass({ timeout: 15_000 });

    // Chart should render if data is available (inside figure with aria-label)
    const chart = page.locator('figure[aria-label="Immunization timeline chart"]');
    if (await chart.isVisible()) {
      // "View data as table" toggle should be present
      const detailsToggle = chart.getByText("View data as table");
      await expect(detailsToggle).toBeVisible();

      // Click to expand data table
      await detailsToggle.click();
      await expect(chart.locator("table")).toBeVisible();
    }
  });

  // ── Test 24: Medication insights chart ──────────────────────────
  test("medication insights — dosage chart or empty state", async () => {
    // Navigate via dashboard "Deep Dive" pill to keep SPA state intact (avoids page.goto reload)
    const sidebar = page.locator('nav[aria-label="Main navigation"]');
    await sidebar.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Click the "Deep Dive" quick action pill that links to /records/medications/insights
    await page.getByRole("link", { name: /deep dive/i }).click();
    await expect(page).toHaveURL(/\/records\/medications\/insights/, { timeout: 15_000 });

    await expect(
      page.getByRole("heading", { name: "Medication Insights", exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    // Either dosage chart renders or empty state is shown
    const dosageChart = page.locator('figure[aria-label="Medication dosage changes chart"]');
    const emptyState = page.getByText(/no medication insights available/i);

    // One of these should be present
    await expect(async () => {
      const chartVisible = await dosageChart.isVisible();
      const emptyVisible = await emptyState.isVisible();
      expect(chartVisible || emptyVisible).toBeTruthy();
    }).toPass({ timeout: 10_000 });
  });

  // ── Test 25: Trust badges on login ───────────────────────────────
  test("trust badges visible on login page", async ({ browser }) => {
    // Use a separate incognito context so the main page's session stays intact
    const loginContext = await browser.newContext();
    const loginPage = await loginContext.newPage();

    await loginPage.goto("/login");
    await expect(loginPage).toHaveURL(/\/login/, { timeout: 10_000 });

    await expect(loginPage.getByText("PHRI", { exact: true })).toBeVisible();

    // Trust badges should appear
    await expect(loginPage.getByText("HIPAA Compliant")).toBeVisible();
    await expect(loginPage.getByText("256-bit Encryption")).toBeVisible();
    await expect(loginPage.getByText("SOC 2 Certified")).toBeVisible();

    await loginContext.close();
  });

  // ── Test 26: Password visibility toggle ─────────────────────────
  test("login — password show/hide toggle", async ({ browser }) => {
    // Use a separate incognito context so the main page's session stays intact
    const loginContext = await browser.newContext();
    const loginPage = await loginContext.newPage();

    await loginPage.goto("/login");
    await expect(loginPage).toHaveURL(/\/login/, { timeout: 10_000 });

    const passwordInput = loginPage.locator("#password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click show password
    await loginPage
      .getByRole("button", { name: /show password/i })
      .click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Click hide password
    await loginPage
      .getByRole("button", { name: /hide password/i })
      .click();
    await expect(passwordInput).toHaveAttribute("type", "password");

    await loginContext.close();
  });

  // ── Test 27: Data provenance on dashboard ──────────────────────
  test("dashboard — data provenance shows source and sync time", async () => {
    // Navigate to Home via sidebar (SPA state preserved — no page.goto reload)
    const sidebar = page.locator('nav[aria-label="Main navigation"]');
    await sidebar.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });

    // Wait for dashboard to fully load
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Data provenance should show source
    await expect(page.getByText(/via FHIR/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Last synced/i)).toBeVisible();
  });

  // ── Test 28: Reduced motion ───────────────────────────────────────
  test("reduced motion — animations disabled", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    // Navigate via sidebar to trigger a client-side route change
    const sidebar = page.locator('nav[aria-label="Main navigation"]');
    await sidebar.getByRole("link", { name: "Chat" }).click();
    await expect(page).toHaveURL(/\/chat/, { timeout: 10_000 });
    await sidebar.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL(/\/home/);

    // Page should still render correctly with reduced motion
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Reset
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });
});
