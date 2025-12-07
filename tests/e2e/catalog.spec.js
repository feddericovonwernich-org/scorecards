import { test, expect } from './coverage.js';
import { expectedStats, expectedServices, sortOptions } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  getVisibleServiceNames,
  selectSort,
  searchServices,
  clearSearch,
  applyStatFilter,
} from './test-helper.js';

// ============================================================================
// CATALOG PAGE - Basic Display
// ============================================================================

test.describe('Catalog Page - Display', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should load and display correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Scorecards Catalog');
    await expect(page.locator('header')).toContainText('Scorecards');
  });

  test('should display correct dashboard stats', async ({ page }) => {
    const statsSection = page.locator('.services-stats');

    // Total Services
    const totalServices = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Total Services' })
      .locator('.stat-value')
      .textContent();
    expect(totalServices.trim()).toBe(expectedStats.totalServices.toString());

    // Average Score (approximately)
    const avgScore = await statsSection
      .locator('.stat-card')
      .filter({ hasText: 'Average Score' })
      .locator('.stat-value')
      .textContent();
    const avgScoreNum = parseInt(avgScore.trim());
    expect(avgScoreNum).toBeGreaterThan(50);
    expect(avgScoreNum).toBeLessThan(60);

    // Rank counts
    const goldCount = await statsSection.locator('.stat-card').filter({ hasText: 'Gold' }).locator('.stat-value').textContent();
    expect(goldCount.trim()).toBe(expectedStats.ranks.gold.toString());

    const silverCount = await statsSection.locator('.stat-card').filter({ hasText: 'Silver' }).locator('.stat-value').textContent();
    expect(silverCount.trim()).toBe(expectedStats.ranks.silver.toString());

    const bronzeCount = await statsSection.locator('.stat-card').filter({ hasText: 'Bronze' }).locator('.stat-value').textContent();
    expect(bronzeCount.trim()).toBe(expectedStats.ranks.bronze.toString());
  });

  test('should render correct number of service cards', async ({ page }) => {
    const count = await getServiceCount(page);
    expect(count).toBe(expectedStats.totalServices);
  });

  test('should display service card details correctly', async ({ page }) => {
    // Check test-repo-perfect (Gold, score 76)
    const perfectCard = page.locator('.service-card').filter({ hasText: 'test-repo-perfect' }).first();
    await expect(perfectCard).toBeVisible();
    await expect(perfectCard).toContainText('76');
    await expect(perfectCard).toContainText('Gold');

    // Check test-repo-empty (Bronze, score 23)
    const emptyCard = page.locator('.service-card').filter({ hasText: 'test-repo-empty' }).first();
    await expect(emptyCard).toBeVisible();
    await expect(emptyCard).toContainText('23');
    await expect(emptyCard).toContainText('Bronze');
  });

  test('should have GitHub links on all service cards', async ({ page }) => {
    const githubLinks = page.locator('.service-card a[href*="github.com"]');
    const count = await githubLinks.count();
    expect(count).toBeGreaterThanOrEqual(expectedStats.totalServices);
  });

  test('should display installation PR badges when present', async ({ page }) => {
    const edgeCasesCard = page.locator('.service-card').filter({ hasText: 'test-repo-edge-cases' }).first();
    const prBadge = edgeCasesCard.locator('a[href*="/pull/"]');
    await expect(prBadge).toBeVisible();
  });

  test('should display footer with documentation link', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Powered by Scorecards');
    const docLink = footer.locator('a', { hasText: 'Documentation' });
    await expect(docLink).toBeVisible();
  });

  test('should have all action buttons', async ({ page }) => {
    const buttons = ['Refresh Data', 'Re-run All Stale', 'Settings', 'Show GitHub Actions'];
    for (const name of buttons) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }
  });
});

// ============================================================================
// CATALOG PAGE - Sorting
// ============================================================================

test.describe('Catalog Page - Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should sort by "Score: High to Low" by default', async ({ page }) => {
    const names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-stale');
    expect(names[names.length - 1]).toBe('test-repo-empty');
  });

  test('should sort by "Score: Low to High"', async ({ page }) => {
    await selectSort(page, 'Score: Low to High');

    await expect(async () => {
      const names = await getVisibleServiceNames(page);
      expect(names[0]).toBe('test-repo-empty');
    }).toPass({ timeout: 3000 });

    const names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-empty');
    expect(names[names.length - 1]).toBe('test-repo-stale');
  });

  test('should sort by "Name: A to Z"', async ({ page }) => {
    await selectSort(page, 'Name: A to Z');

    await expect(async () => {
      const names = await getVisibleServiceNames(page);
      expect(names[0]).toBe('test-repo-edge-cases');
    }).toPass({ timeout: 3000 });

    const names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-edge-cases');
    expect(names[names.length - 1]).toBe('test-repo-stale');
  });

  test('should sort by "Name: Z to A"', async ({ page }) => {
    await selectSort(page, 'Name: Z to A');

    await expect(async () => {
      const names = await getVisibleServiceNames(page);
      expect(names[0]).toBe('test-repo-stale');
    }).toPass({ timeout: 3000 });

    const names = await getVisibleServiceNames(page);
    expect(names[0]).toBe('test-repo-stale');
    expect(names[names.length - 1]).toBe('test-repo-edge-cases');
  });
});

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should filter by service name search (case-insensitive)', async ({ page }) => {
    // Test lowercase search
    await searchServices(page, 'python');
    let count = await getServiceCount(page);
    expect(count).toBe(1);
    await expect(page.locator('.service-card').first()).toContainText('test-repo-python');

    // Test uppercase search (case-insensitive)
    await clearSearch(page);
    await searchServices(page, 'PYTHON');
    count = await getServiceCount(page);
    expect(count).toBe(1);
    await expect(page.locator('.service-card').first()).toContainText('test-repo-python');
  });

  test('should clear search and show all services', async ({ page }) => {
    await searchServices(page, 'python');

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });

    await clearSearch(page);

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.totalServices);
    }).toPass({ timeout: 3000 });
  });

  test('should handle search with no results', async ({ page }) => {
    await searchServices(page, 'nonexistent-service-xyz');

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(0);
    }).toPass({ timeout: 3000 });
  });

  test('should have search input placeholder', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: 'Search services...' });
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /search/i);
  });
});

// ============================================================================
// RANK FILTERING
// ============================================================================

test.describe('Rank Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should filter by rank when clicking stat card', async ({ page }) => {
    const ranks = [
      { name: 'Gold', count: expectedStats.ranks.gold },
      { name: 'Silver', count: expectedStats.ranks.silver },
      { name: 'Bronze', count: expectedStats.ranks.bronze },
    ];

    for (const rank of ranks) {
      // Click rank filter
      const rankStat = page.locator('.services-stats .stat-card').filter({ hasText: rank.name });
      await rankStat.click();

      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(rank.count);
      }).toPass({ timeout: 3000 });

      // Verify cards have correct rank
      const firstCard = page.locator('.service-card').first();
      await expect(firstCard).toContainText(rank.name);

      // Clear filter for next iteration (click twice to cycle through exclude, then clear)
      await rankStat.click();
      await rankStat.click();

      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices);
      }).toPass({ timeout: 3000 });
    }
  });

  test('should combine search with rank filter', async ({ page }) => {
    // Filter by Silver rank
    const silverStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Silver' });
    await silverStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.silver);
    }).toPass({ timeout: 3000 });

    // Then search for "javascript"
    await searchServices(page, 'javascript');

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });

    const serviceCard = page.locator('.service-card').first();
    await expect(serviceCard).toContainText('test-repo-javascript');
    await expect(serviceCard).toContainText('Silver');
  });

  test('should show filter stat cards', async ({ page }) => {
    const filters = ['With API', 'Stale', 'Installed'];
    for (const filter of filters) {
      const stat = page.locator('.stat-card').filter({ hasText: filter });
      await expect(stat).toBeVisible();
    }
  });

  test('should update filtered count in dashboard', async ({ page }) => {
    const bronzeStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Bronze' });
    await bronzeStat.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.bronze);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// 3-STATE FILTERING
// ============================================================================

test.describe('StatCard 3-State Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should cycle through 3 filter states: include → exclude → clear', async ({ page }) => {
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    const initialCount = await getServiceCount(page);

    // First click → include mode (shows only Gold)
    await goldStat.click();
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.gold);
    }).toPass({ timeout: 3000 });

    // Second click → exclude mode (shows all except Gold)
    await goldStat.click();
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(initialCount - expectedStats.ranks.gold);
    }).toPass({ timeout: 3000 });

    // Third click → cleared (shows all)
    await goldStat.click();
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(initialCount);
    }).toPass({ timeout: 3000 });
  });

  test('should show active styling on include state', async ({ page }) => {
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });

    await goldStat.click();
    await expect(goldStat).toHaveClass(/active/);
  });

  test('should show exclude styling on second click', async ({ page }) => {
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });

    await goldStat.click();
    await expect(goldStat).toHaveClass(/active/);

    await goldStat.click();
    await expect(goldStat).toHaveClass(/exclude/);
  });

  test('should remove styling when cleared', async ({ page }) => {
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });

    // Cycle through: include → exclude → clear
    await goldStat.click();
    await goldStat.click();
    await goldStat.click();

    await expect(goldStat).not.toHaveClass(/active/);
    await expect(goldStat).not.toHaveClass(/excluded/);
  });
});
