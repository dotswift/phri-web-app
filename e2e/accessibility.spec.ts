import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { TEST_EMAIL, TEST_PASSWORD } from "./global-setup";

/**
 * Accessibility audits for all authenticated pages.
 * Runs after the main app.spec.ts which sets up backend data.
 */
test.describe.serial("Accessibility audits", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Sign in
    await page.goto("/login");
    await page.locator("#email").fill(TEST_EMAIL);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for auth to resolve
    await page.waitForURL(/\/(home|consent|connect|progress)/, {
      timeout: 15_000,
    });

    // If we're on consent/connect/progress, run through the setup flow
    if (page.url().includes("/consent")) {
      // Step 1: Inform
      await page
        .getByRole("button", { name: /i understand — continue/i })
        .click();
      // Step 2: Select
      await page.locator("#dataUsage").check({ force: true });
      await page.locator("#llmDataFlow").check({ force: true });
      await page.locator("#deletionRights").check({ force: true });
      await page
        .getByRole("button", { name: /review & confirm/i })
        .click();
      // Step 3: Confirm
      await page
        .getByRole("button", { name: /i agree/i })
        .click();
      await page.waitForURL(/\/connect/, { timeout: 15_000 });
    }

    if (page.url().includes("/connect")) {
      await page.getByText("Chris Smith", { exact: true }).click();
      await page
        .getByRole("button", { name: /connect selected persona/i })
        .click();
      await page.waitForURL(/\/progress/, { timeout: 15_000 });
    }

    if (page.url().includes("/progress")) {
      await page.waitForURL(/\/home/, { timeout: 45_000 });
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Skip link ──────────────────────────────────────────────
  test("skip link is present and focusable", async () => {
    await page.goto("/home");
    await page.waitForSelector("h1");

    // Focus the skip link directly (Tab in headed Chromium may focus address bar first)
    const skipLink = page.locator('a[href="#main-content"]');
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveText("Skip to main content");
  });

  // ── Landmark structure ────────────────────────────────────
  test("landmarks are present", async () => {
    await page.goto("/home");
    await page.waitForSelector("h1");

    // Main content landmark
    const main = page.locator("#main-content");
    await expect(main).toBeVisible();

    // Navigation landmark
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeAttached();
  });

  // ── Dark mode toggle ──────────────────────────────────────
  test("dark mode toggle works", async () => {
    await page.goto("/settings");
    await page.waitForSelector("h1");

    // Find the theme toggle button
    const toggle = page.getByRole("button", {
      name: /switch to dark mode|switch to light mode/i,
    });
    await expect(toggle.first()).toBeVisible();

    // Click to toggle dark mode
    await toggle.first().click();

    // HTML element should have dark class
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Toggle back to light
    await toggle.first().click();
    await expect(html).not.toHaveClass(/dark/);
  });

  // ── Axe audits per page ───────────────────────────────────
  const pagesToAudit = [
    { name: "Home", url: "/home" },
    { name: "Records", url: "/records" },
    { name: "Immunizations", url: "/records/immunizations" },
    { name: "Medication Insights", url: "/records/medications/insights" },
    { name: "Chat", url: "/chat" },
    { name: "Settings", url: "/settings" },
  ];

  for (const { name, url } of pagesToAudit) {
    test(`axe audit — ${name}`, async () => {
      await page.goto(url);

      // Wait for page content to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude(".recharts-wrapper") // Exclude chart SVGs (handled via ChartAccessibility)
        .analyze();

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log(
          `[axe] ${name} violations:`,
          JSON.stringify(
            results.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.length,
            })),
            null,
            2,
          ),
        );
      }

      expect(results.violations).toEqual([]);
    });
  }

  // ── Dark mode axe audits ────────────────────────────────────
  test("axe audit — dark mode (Home + Chat)", async () => {
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });

    for (const { name, url } of [
      { name: "Home (dark)", url: "/home" },
      { name: "Chat (dark)", url: "/chat" },
    ]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude(".recharts-wrapper")
        .analyze();

      if (results.violations.length > 0) {
        console.log(
          `[axe] ${name} violations:`,
          JSON.stringify(
            results.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.length,
            })),
            null,
            2,
          ),
        );
      }

      expect(results.violations).toEqual([]);
    }

    // Reset
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
    });
  });

  // ── 320px viewport reflow test (WCAG 1.4.10) ───────────────
  test("320px viewport — content reflows without horizontal scroll", async () => {
    // Navigate to /home — use goto with wait for content
    await page.goto("/home");
    await page.waitForLoadState("networkidle");

    // Wait for authenticated dashboard content to load
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Shrink viewport to 320px — content should reflow responsively
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(1000);

    // Page should still show heading (may be in mobile layout now)
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible({ timeout: 10_000 });

    // No horizontal overflow — body scrollWidth should equal viewport width
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
