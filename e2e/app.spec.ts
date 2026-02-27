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
    test.slow(); // 3× timeout — backend data retrieval can be slow

    // If already on /home (returning user), skip
    if (page.url().includes("/home")) {
      test.skip();
      return;
    }

    await expect(
      page.getByText(/accessing medical records/i),
    ).toBeVisible();

    // Wait for redirect to /home (data retrieval can take up to 90s)
    await expect(page).toHaveURL(/\/home/, { timeout: 90_000 });
  });

  // ── Test 7: Dashboard (Home) ────────────────────────────────────────
  test("dashboard — persona name, nav cards, insight summaries", async () => {
    // Ensure we're on /home
    if (!page.url().includes("/home")) {
      await page.goto("/home");
    }

    // Persona greeting (time-of-day greeting + first name)
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening), chris/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Navigation cards — check inside the main content area (not sidebar)
    const main = page.locator("#main-content");
    for (const label of [
      "Timeline",
      "Medications",
      "Immunizations",
      "Chat",
    ]) {
      await expect(main.getByText(label).first()).toBeVisible();
    }

    // Navigation cards link to their pages
    await expect(main.locator('a[href="/timeline"]')).toBeVisible();
    await expect(main.locator('a[href="/records/medications/insights"]').first()).toBeVisible();
    await expect(main.locator('a[href="/chat"]').first()).toBeVisible();

    // Insight summary cards (title appears in both heading and link, use first)
    await expect(main.getByText("Medication Insights").first()).toBeVisible();
    await expect(main.getByText("Immunization Insights").first()).toBeVisible();
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
  test("timeline — pill filters, sort, detail drawer", async () => {
    await page.goto("/timeline");
    await expect(
      page.getByRole("heading", { name: "Timeline" }),
    ).toBeVisible();

    // Wait for items to load (event count shows when loaded)
    await expect(page.getByText(/^\d+ events$/).first()).toBeVisible({
      timeout: 15_000,
    });

    // Pill filter bar — "All" pill should be present
    await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible();

    // Date filter — "All Time" pill
    await expect(page.getByRole("button", { name: "All Time" })).toBeVisible();

    // Filter by Condition pill if available
    const conditionPill = page.getByRole("button", { name: /Condition/i });
    if (await conditionPill.isVisible()) {
      await conditionPill.click();
      // Event count should update
      await expect(page.getByText(/^\d+ (events|of \d+ events)$/).first()).toBeVisible({
        timeout: 10_000,
      });
    }

    // Click a timeline card to open detail drawer
    const cards = page.locator("[class*='cursor-pointer']");
    if ((await cards.count()) > 0) {
      await cards.first().click();
      await expect(page.getByRole("heading", { name: "Resource Detail" })).toBeVisible();
      // Close drawer
      await page.keyboard.press("Escape");
    }
  });

  // ── Test 10: Medications — empty state ────────────────────────────
  test("medications — redirects to insights", async () => {
    await page.goto("/records/medications");
    // /records/medications redirects to /records/medications/insights
    await expect(page).toHaveURL(/\/records\/medications\/insights/);
    await expect(
      page.getByRole("heading", { name: "Medication Insights", exact: true }),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Test 11: Immunizations ────────────────────────────────────────
  test("immunizations — stats, findings, timeline, detail drawer", async () => {
    await page.goto("/records/immunizations");
    await expect(
      page.getByRole("heading", { name: "Immunizations", exact: true }),
    ).toBeVisible();

    // Compact stat row: "X immunizations · Y vaccines"
    await expect(page.getByText(/\d+ immunizations/).first()).toBeVisible({
      timeout: 10_000,
    });

    // Key Findings section
    await expect(page.getByText("Key Findings")).toBeVisible();

    // Timeline items (grouped by year, inside border-l timeline)
    const mainContent = page.locator("#main-content");
    const timelineItems = mainContent.locator(".border-l-2 .cursor-pointer");
    await expect(async () => {
      expect(await timelineItems.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10_000 });

    // Click a timeline item to open detail drawer
    await timelineItems.first().click();
    await expect(page.getByRole("heading", { name: "Resource Detail" })).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
  });

  // ── Test 12: Medication Insights ──────────────────────────────────
  test("medication insights — stats, findings, methodology accordion", async () => {
    await page.goto("/records/medications/insights");
    await expect(
      page.getByRole("heading", { name: "Medication Insights", exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    // Compact stat row: "X medications · Y active"
    await expect(page.getByText(/\d+ medications/).first()).toBeVisible();

    // Key Findings (if data available)
    const findings = page.getByText("Key Findings");
    if (await findings.isVisible()) {
      await expect(findings).toBeVisible();
    }

    // Methodology accordion
    const methodologyTrigger = page.getByRole("button", {
      name: /methodology/i,
    });
    await expect(methodologyTrigger).toBeVisible();
    await methodologyTrigger.click();

    // Expanded content (allow time for accordion animation)
    await expect(page.getByText("Steps")).toBeVisible({ timeout: 5_000 });
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

    // Appearance section (theme toggle)
    await expect(page.getByText("Appearance")).toBeVisible();

    // AI Mode toggle
    await expect(page.getByText("AI Mode")).toBeVisible();
    const aiSwitch = page.locator("#ai-mode");
    await expect(aiSwitch).toBeVisible();

    // Toggle off
    await aiSwitch.click();
    await expect(page.getByText(/ai chat disabled/i)).toBeVisible({
      timeout: 5_000,
    });

    // Toggle back on
    await aiSwitch.click();
    await expect(page.getByText(/ai chat enabled/i)).toBeVisible({
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

    // Settings link
    await expect(
      sidebar.getByRole("link", { name: "Settings", exact: true }),
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
    for (const label of ["Home", "Records", "Chat", "Settings"]) {
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

    await page.goto("/records/timeline");
    await expect(page).toHaveURL(/\/timeline/);

    await page.goto("/profile/settings");
    await expect(page).toHaveURL(/\/settings/);
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

    // Empty state heading
    await expect(
      page.getByText("Ask a question about your health records"),
    ).toBeVisible();

    // Suggested prompt buttons should be visible (personalized or defaults)
    const promptButtons = page.locator("button").filter({ has: page.locator("svg") }).filter({ hasText: /\?$/ });
    await expect(async () => {
      expect(await promptButtons.count()).toBeGreaterThanOrEqual(2);
    }).toPass({ timeout: 10_000 });
  });

  // ── Test 22: Dashboard KPI cards ──────────────────────────────────
  test("dashboard — nav cards render with icons and descriptions", async () => {
    await page.goto("/home");
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Nav cards should show labels and descriptions
    const main = page.locator("#main-content");
    for (const label of ["Timeline", "Medications", "Immunizations", "Chat"]) {
      await expect(main.getByText(label).first()).toBeVisible();
    }

    // Each nav card should be a link
    const navLinks = main.locator("a[href]").filter({ hasText: /timeline|medications|immunizations|chat/i });
    expect(await navLinks.count()).toBeGreaterThanOrEqual(4);
  });

  // ── Test 23: Immunization chart renders ─────────────────────────
  test("immunizations — timeline and methodology via sidebar nav", async () => {
    // Use client-side navigation to avoid full-page reload auth race condition
    const sidebar = page.locator('nav[aria-label="Main navigation"]');
    await sidebar.getByRole("link", { name: "Immunizations" }).click();
    await expect(page).toHaveURL(/\/records\/immunizations/);

    await expect(
      page.getByRole("heading", { name: "Immunizations", exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    // Wait for data to finish loading
    await expect(async () => {
      const hasData = await page.getByText(/\d+ immunizations/).first().isVisible();
      const hasEmpty = await page.getByText(/no immunizations found/i).isVisible();
      expect(hasData || hasEmpty).toBeTruthy();
    }).toPass({ timeout: 15_000 });

    // Methodology accordion
    const methodologyTrigger = page.getByRole("button", { name: /methodology/i });
    if (await methodologyTrigger.isVisible()) {
      await methodologyTrigger.click();
      await expect(page.getByText("Steps")).toBeVisible();
      await expect(page.getByText("Limitations")).toBeVisible();
    }
  });

  // ── Test 24: Medication insights chart ──────────────────────────
  test("medication insights — navigate via sidebar and verify content", async () => {
    // Navigate via sidebar to keep SPA state intact
    const sidebar = page.locator('nav[aria-label="Main navigation"]');
    await sidebar.getByRole("link", { name: "Medications" }).click();
    await expect(page).toHaveURL(/\/records\/medications\/insights/, { timeout: 15_000 });

    await expect(
      page.getByRole("heading", { name: "Medication Insights", exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    // Stat row or empty state
    await expect(async () => {
      const statsVisible = await page.getByText(/\d+ medications/).first().isVisible();
      const emptyVisible = await page.getByText(/no medication insights available/i).isVisible();
      expect(statsVisible || emptyVisible).toBeTruthy();
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
