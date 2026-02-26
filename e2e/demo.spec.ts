import { test, expect, type Page } from "@playwright/test";
import { TEST_EMAIL, TEST_PASSWORD } from "./global-setup";

const PAUSE = 2500; // ms between major visual beats
const TYPE_DELAY = 80; // ms per character for human-like typing

test.describe.serial("PHRI Demo Walkthrough", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Step 1: Sign in and set up ──────────────────────────────────────
  test("sign in, consent, connect persona", async () => {
    test.slow(); // 3× timeout for the setup flow

    // Login page
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await page.waitForTimeout(PAUSE);

    // Type credentials slowly
    await page.locator("#email").click();
    await page.locator("#email").type(TEST_EMAIL, { delay: TYPE_DELAY });
    await page.waitForTimeout(500);
    await page.locator("#password").click();
    await page.locator("#password").type(TEST_PASSWORD, { delay: TYPE_DELAY });
    await page.waitForTimeout(1000);

    // Sign in
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(consent|home|connect|progress)/, { timeout: 15_000 });
    await page.waitForTimeout(PAUSE);

    // Handle consent flow if needed (new user)
    if (page.url().includes("/consent")) {
      // Step 1: Inform
      await page
        .getByRole("button", { name: /i understand — continue/i })
        .click();

      // Step 2: Select — check all consent checkboxes
      await page.locator("#dataUsage").check({ force: true });
      await page.waitForTimeout(800);
      await page.locator("#llmDataFlow").check({ force: true });
      await page.waitForTimeout(800);
      await page.locator("#deletionRights").check({ force: true });
      await page.waitForTimeout(1000);

      await page
        .getByRole("button", { name: /review & confirm/i })
        .click();

      // Step 3: Confirm
      const consentResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/consent") &&
          resp.request().method() === "POST",
      );
      await page.getByRole("button", { name: /i agree/i }).click();
      await consentResponse;
      await expect(page).toHaveURL(/\/connect/, { timeout: 15_000 });
      await page.waitForTimeout(PAUSE);
    }

    if (page.url().includes("/connect")) {
      // Select Chris Smith
      await page.getByText("Chris Smith", { exact: true }).click();
      await page.waitForTimeout(1500);

      const connectResponse = page.waitForResponse(
        (resp) => resp.url().includes("/api/patient/connect"),
      );
      await page
        .getByRole("button", { name: /connect selected persona/i })
        .click();
      await connectResponse;
      await expect(page).toHaveURL(/\/progress/, { timeout: 15_000 });
    }

    if (page.url().includes("/progress")) {
      // Wait for data retrieval → redirect to home
      await expect(page).toHaveURL(/\/home/, { timeout: 45_000 });
    }

    await page.waitForTimeout(PAUSE);
  });

  // ── Step 2: Explore the dashboard ───────────────────────────────────
  test("explore the dashboard", async () => {
    test.slow();

    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening), chris/i }),
    ).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(PAUSE);

    // Hover over summary cards
    const main = page.locator("main, [class*='flex-1']").last();
    for (const label of [
      "Conditions",
      "Observations",
      "Encounters",
    ]) {
      const card = main.getByText(label).locator("../..");
      await card.hover();
      await page.waitForTimeout(1000);
    }

    // Hover over quick action pills
    await page.getByRole("link", { name: /timeline/i }).hover();
    await page.waitForTimeout(1200);
    await page.getByRole("link", { name: /deep dive/i }).hover();
    await page.waitForTimeout(1200);
    await page.getByRole("link", { name: /chat/i }).last().hover();
    await page.waitForTimeout(1200);

    // Pause on Recent Activity
    await page.getByText("Recent Activity").scrollIntoViewIfNeeded();
    await page.waitForTimeout(PAUSE);
  });

  // ── Step 3: Chat — ask about conditions ─────────────────────────────
  test("chat — ask about conditions and view citations", async () => {
    test.slow();

    await page.goto("/chat");
    await expect(
      page.getByText("Ask a question about your health records"),
    ).toBeVisible();
    await page.waitForTimeout(PAUSE);

    // Type a question slowly
    const input = page.getByPlaceholder(/ask about your health records/i);
    await input.click();
    await input.type("What conditions do I have?", { delay: TYPE_DELAY });
    await page.waitForTimeout(1000);

    // Send
    await page
      .getByRole("button")
      .filter({ has: page.locator("svg") })
      .last()
      .click();

    // Wait for the assistant response to stream in
    await expect(async () => {
      const msgs = page.locator("[class*='bg-muted']");
      await expect(msgs.first()).toBeVisible();
    }).toPass({ timeout: 30_000 });

    // Pause to let viewers read the response
    await page.waitForTimeout(4000);

    // Click a citation if one exists
    const citationMarker = page.locator("sup").first();
    if (await citationMarker.isVisible()) {
      await citationMarker.click();
      await page.waitForTimeout(3000); // Pause on the popover
      // Close popover by clicking elsewhere
      await page.locator("body").click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(1000);
    }

    // Pause on Sources section if visible
    const sources = page.getByText("Sources:");
    if (await sources.isVisible()) {
      await sources.scrollIntoViewIfNeeded();
      await page.waitForTimeout(PAUSE);
    }
  });

  // ── Step 4: Chat — follow-up question ───────────────────────────────
  test("chat — ask a follow-up question", async () => {
    test.slow();

    const input = page.getByPlaceholder(/ask about your health records/i);
    await input.click();
    await input.type("Tell me more about my latest encounter", {
      delay: TYPE_DELAY,
    });
    await page.waitForTimeout(1000);

    // Send
    await page
      .getByRole("button")
      .filter({ has: page.locator("svg") })
      .last()
      .click();

    // Wait for the new assistant response
    await expect(async () => {
      const msgs = page.locator("[class*='bg-muted']");
      expect(await msgs.count()).toBeGreaterThanOrEqual(2);
    }).toPass({ timeout: 30_000 });

    // Pause to read the response
    await page.waitForTimeout(5000);
  });

  // ── Step 5: Browse the timeline ─────────────────────────────────────
  test("browse the timeline", async () => {
    test.slow();

    // Navigate via sidebar — expand Records sub-menu if collapsed
    const timelineLink = page.getByRole("link", { name: "Timeline", exact: true });
    if (!(await timelineLink.isVisible())) {
      await page.getByRole("button", { name: /records/i }).click();
      await page.waitForTimeout(500);
    }
    await timelineLink.click();
    await expect(
      page.getByRole("heading", { name: "Timeline" }),
    ).toBeVisible();
    await page.waitForTimeout(PAUSE);

    // Wait for items to load
    await expect(page.getByText(/page \d+ of \d+/i)).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(PAUSE);

    // Hover over a few timeline cards
    const cards = page.locator("[class*='cursor-pointer']");
    const count = await cards.count();
    for (let i = 0; i < Math.min(3, count); i++) {
      await cards.nth(i).hover();
      await page.waitForTimeout(1000);
    }

    // Click the first card to open the detail drawer
    if (count > 0) {
      await cards.first().click();
      await expect(page.getByText("Resource Detail")).toBeVisible();
      await page.waitForTimeout(4000); // Pause on the drawer

      // Close drawer
      await page.keyboard.press("Escape");
      await page.waitForTimeout(1500);
    }

    // Final pause on the timeline view
    await page.waitForTimeout(PAUSE);
  });
});
