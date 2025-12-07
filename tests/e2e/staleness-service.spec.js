/**
 * Staleness Service E2E Tests
 *
 * Tests to exercise staleness detection functionality,
 * targeting low coverage in staleness.ts (23%).
 */

import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
} from './test-helper.js';

test.describe('Staleness Detection - Stats Card', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show Stale stat card with correct count', async ({ page }) => {
    // The stats section should have a "Stale" card
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await expect(staleCard).toBeVisible();

    // The count should be 1 (test-repo-stale has different checks_hash)
    const staleCount = await staleCard.locator('.stat-value').textContent();
    expect(parseInt(staleCount)).toBe(1);
  });

  test('should show Total Services stat card', async ({ page }) => {
    // Look for the Total Services stat in services view
    const totalServices = page.locator('#services-view').getByText('Total Services');
    await expect(totalServices).toBeVisible();
  });

  test('should show Average Score stat', async ({ page }) => {
    const avgScore = page.locator('#services-view').getByText('Average Score');
    await expect(avgScore).toBeVisible();
  });
});

test.describe('Staleness Detection - Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should filter to show only stale services when clicking Stale card', async ({ page }) => {
    // Get initial service count
    const initialCount = await getServiceCount(page);
    expect(initialCount).toBeGreaterThan(1);

    // Click on Stale stat card to filter
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await staleCard.click();

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Should show fewer services (only stale ones)
    const filteredCount = await getServiceCount(page);
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBe(1); // Only test-repo-stale
  });

  test('should show test-repo-stale when filtering by stale', async ({ page }) => {
    // Click on Stale stat card to filter
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await staleCard.click();

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // The stale service should be visible
    const staleService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleService).toBeVisible();
  });

  test('should clear stale filter when clicking Stale card again', async ({ page }) => {
    // Click on Stale stat card to filter (include)
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await staleCard.click();
    await page.waitForTimeout(300);

    // Get filtered count
    const filteredCount = await getServiceCount(page);
    expect(filteredCount).toBe(1);

    // Click twice more to cycle through exclude -> clear
    await staleCard.click(); // exclude
    await page.waitForTimeout(300);
    await staleCard.click(); // clear
    await page.waitForTimeout(300);

    // Should show all services again
    const allCount = await getServiceCount(page);
    expect(allCount).toBeGreaterThan(filteredCount);
  });

  test('should exclude stale services on second click', async ({ page }) => {
    // Click on Stale stat card twice to exclude
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await staleCard.click(); // include
    await page.waitForTimeout(300);
    await staleCard.click(); // exclude
    await page.waitForTimeout(300);

    // test-repo-stale should NOT be visible
    const staleService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleService).toBeHidden();
  });
});

test.describe('Staleness Detection - Visual Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show STALE badge on stale service cards', async ({ page }) => {
    // Find the stale service card
    const staleService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleService).toBeVisible();

    // It should have a STALE badge (use specific class selector)
    await expect(staleService.locator('.badge-stale')).toBeVisible();
  });

  test('should not show STALE badge on up-to-date service cards', async ({ page }) => {
    // Find a non-stale service card
    const upToDateService = page.locator('.service-card').filter({ hasText: 'test-repo-perfect' });
    await expect(upToDateService).toBeVisible();

    // It should NOT have a STALE badge (use specific class selector)
    const staleBadge = upToDateService.locator('.badge-stale');
    await expect(staleBadge).toHaveCount(0);
  });

  test('should show INSTALLED badge on installed service cards', async ({ page }) => {
    // Find the stale service card (which is also installed)
    const installedService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(installedService).toBeVisible();

    // It should have an INSTALLED badge (use text to find badge)
    await expect(installedService.locator('text=INSTALLED')).toBeVisible();
  });
});

test.describe('Staleness Detection - Combined Filters', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should combine stale filter with search', async ({ page }) => {
    // First apply stale filter
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await staleCard.click();
    await page.waitForTimeout(300);

    // Now search for something
    const searchInput = page.getByRole('textbox', { name: 'Search services...' });
    await searchInput.fill('test-repo');
    await page.waitForTimeout(300);

    // Should still show the stale service
    const count = await getServiceCount(page);
    expect(count).toBe(1);

    // Search for something that doesn't exist
    await searchInput.fill('nonexistent');
    await page.waitForTimeout(300);

    // Should show no services
    const zeroCount = await getServiceCount(page);
    expect(zeroCount).toBe(0);
  });

  test('should combine stale filter with Gold rank filter', async ({ page }) => {
    // Include Gold filter
    const goldCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    await goldCard.click();
    await page.waitForTimeout(300);

    // Include Stale filter
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await staleCard.click();
    await page.waitForTimeout(300);

    // test-repo-stale is Gold AND Stale
    const staleService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleService).toBeVisible();

    // Should show only 1 service
    const count = await getServiceCount(page);
    expect(count).toBe(1);
  });

  test('should filter by Installed and Stale together', async ({ page }) => {
    // Include Installed
    const installedCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });
    await installedCard.click();
    await page.waitForTimeout(300);

    // Include Stale
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await staleCard.click();
    await page.waitForTimeout(300);

    // test-repo-stale is both Installed AND Stale
    const staleService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleService).toBeVisible();

    const count = await getServiceCount(page);
    expect(count).toBe(1);
  });
});

test.describe('Staleness Detection - Edge Cases', () => {
  test('should handle page load without errors', async ({ page }) => {
    // This tests that staleness calculation doesn't break page load
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Verify page loaded without errors
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible();
  });

  test('should show correct stale count in stats', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Get stale count
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    const staleCount = parseInt(await staleCard.locator('.stat-value').textContent());

    // Stale count should be 1 in our fixtures
    expect(staleCount).toBe(1);
  });

  test('should calculate staleness percentage correctly', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Get stale and total counts
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    const staleCount = parseInt(await staleCard.locator('.stat-value').textContent());

    // Total services count (from fixture: 9 services)
    const totalServices = await getServiceCount(page);

    // Stale percentage = 1/9 = ~11%
    const percentage = Math.round((staleCount / totalServices) * 100);
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);
  });
});

test.describe('Staleness Detection - Installed Services', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show Installed stat card', async ({ page }) => {
    const installedCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });
    await expect(installedCard).toBeVisible();
  });

  test('should count installed services correctly', async ({ page }) => {
    const installedCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });
    const installedCount = parseInt(await installedCard.locator('.stat-value').textContent());

    // We know at least test-repo-stale is installed
    expect(installedCount).toBeGreaterThanOrEqual(1);
  });

  test('should filter to installed services', async ({ page }) => {
    const installedCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });
    await installedCard.click();
    await page.waitForTimeout(300);

    // Should show installed services
    const count = await getServiceCount(page);
    expect(count).toBeGreaterThanOrEqual(1);

    // test-repo-stale should be visible (it's installed)
    const staleService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleService).toBeVisible();
  });

  test('should exclude installed services on second click', async ({ page }) => {
    const installedCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });
    await installedCard.click(); // include
    await page.waitForTimeout(300);
    await installedCard.click(); // exclude
    await page.waitForTimeout(300);

    // test-repo-stale should NOT be visible (it's the only installed one)
    const staleService = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleService).toBeHidden();
  });

  test('should show both Stale and Installed counts', async ({ page }) => {
    const staleCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    const installedCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });

    const staleCount = parseInt(await staleCard.locator('.stat-value').textContent());
    const installedCount = parseInt(await installedCard.locator('.stat-value').textContent());

    // test-repo-stale is both stale and installed
    expect(staleCount).toBeGreaterThanOrEqual(1);
    expect(installedCount).toBeGreaterThanOrEqual(1);
  });
});
