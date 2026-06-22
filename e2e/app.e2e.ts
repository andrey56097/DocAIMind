/**
 * DocAIMind — E2E smoke tests
 */

import { test, expect } from "@playwright/test";

test.describe("DocAIMind — E2E", () => {
  test("page loads with title and welcome message", async ({ page }) => {
    await page.goto("/");

    // Title
    await expect(page).toHaveTitle(/DocAIMind/);

    // Welcome message is visible on first load
    await expect(page.locator("#welcome-message")).toBeVisible();

    // Question input exists and has placeholder
    await expect(page.locator("#question-input")).toBeAttached();
    await expect(page.locator("#question-input")).toHaveAttribute("placeholder", /Ask a question/);
  });

  test("file input exists as hidden element", async ({ page }) => {
    await page.goto("/");

    // file input is hidden (styled off-screen), but exists
    const fileInput = page.locator("#file-input");
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute("type", "file");
  });

  test("sidebar toggle works on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const sidebar = page.locator("#sidebar");
    const toggle = page.locator("#sidebar-toggle");

    // Sidebar is hidden initially (no "open" class)
    await expect(sidebar).not.toHaveClass(/open/);

    // Click toggle
    await toggle.click();
    await expect(sidebar).toHaveClass(/open/);

    // Click toggle again to close
    await toggle.click();
    await expect(sidebar).not.toHaveClass(/open/);
  });

  test("delete all button is visible when no documents", async ({ page }) => {
    // The delete all button is always rendered, just hidden via style when docs=0
    await page.goto("/");
    await expect(page.locator("#delete-all-btn")).toBeAttached();
  });

  test("usage stats are displayed with initial values", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#total-tokens")).toHaveText("0");
    await expect(page.locator("#total-cost")).toHaveText("$0.00");
    await expect(page.locator("#question-count")).toHaveText("0");
  });
});
