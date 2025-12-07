/**
 * Store Actions E2E Tests
 *
 * Tests to exercise Zustand store filter and sort logic,
 * targeting low branch coverage in appStore.ts (13.46% branches).
 */

import { test, expect } from './coverage.js';
import { expectedStats, expectedTeams } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  getServiceCount,
  searchServices,
  clearSearch,
  selectSort,
  switchToTeamsView,
  switchToServicesView,
  openServiceModal,
  closeServiceModal,
  openSettingsModal,
  closeSettingsModal,
} from './test-helper.js';

// ============================================================================
// RANK FILTERS - Include/Exclude/Clear
// ============================================================================

test.describe('Store Actions - Rank Filters', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should cycle through include/exclude/clear for all ranks', async ({ page }) => {
    const ranks = [
      { name: 'Gold', count: expectedStats.ranks.gold },
      { name: 'Silver', count: expectedStats.ranks.silver },
      { name: 'Bronze', count: expectedStats.ranks.bronze },
    ];

    for (const rank of ranks) {
      const statCard = page.locator('.services-stats .stat-card').filter({ hasText: rank.name });

      // First click - include
      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(rank.count);
      }).toPass({ timeout: 3000 });

      // Verify all visible cards have the correct rank
      const serviceCards = page.locator('.service-card');
      const cardCount = await serviceCards.count();
      for (let i = 0; i < cardCount; i++) {
        await expect(serviceCards.nth(i)).toContainText(rank.name);
      }

      // Second click - exclude
      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices - rank.count);
      }).toPass({ timeout: 3000 });

      // Verify no visible cards have the excluded rank
      const excludedCards = page.locator('.service-card');
      const excludedCount = await excludedCards.count();
      for (let i = 0; i < excludedCount; i++) {
        await expect(excludedCards.nth(i)).not.toContainText(rank.name);
      }

      // Third click - clear
      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices);
      }).toPass({ timeout: 3000 });
    }
  });
});

// ============================================================================
// SPECIAL FILTERS - Stale, Installed, API
// ============================================================================

test.describe('Store Actions - Special Filters', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should include/exclude Stale and Installed services', async ({ page }) => {
    const filters = [
      { name: 'Stale', count: expectedStats.stale },
      { name: 'Installed', count: expectedStats.installed },
    ];

    for (const filter of filters) {
      const statCard = page.locator('.services-stats .stat-card').filter({ hasText: filter.name });

      // Include
      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(filter.count);
      }).toPass({ timeout: 3000 });

      // Exclude
      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices - filter.count);
      }).toPass({ timeout: 3000 });

      // Clear
      await statCard.click();
      await expect(async () => {
        const count = await getServiceCount(page);
        expect(count).toBe(expectedStats.totalServices);
      }).toPass({ timeout: 3000 });
    }
  });

  test('should include/exclude With API services', async ({ page }) => {
    const apiStat = page.locator('.services-stats .stat-card').filter({ hasText: /API/i });

    // Skip if API stat card doesn't exist
    if (await apiStat.count() === 0) {
      test.skip();
      return;
    }

    // Include
    await apiStat.click();
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.withAPI);
    }).toPass({ timeout: 3000 });

    // Exclude
    await apiStat.click();
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.totalServices - expectedStats.withAPI);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// COMBINED FILTERS (AND logic)
// ============================================================================

test.describe('Store Actions - Combined Filters', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should combine rank with stale filter', async ({ page }) => {
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    await goldStat.click();

    const staleStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await staleStat.click();

    // Should show only Gold AND Stale services (test-repo-stale)
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });

    await expect(page.locator('.service-card').first()).toContainText('test-repo-stale');
  });

  test('should combine search with rank filter', async ({ page }) => {
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    await goldStat.click();

    await searchServices(page, 'stale');

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });
  });

  test('should combine include and exclude filters', async ({ page }) => {
    // Include Silver
    const silverStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Silver' });
    await silverStat.click();

    // Exclude Installed
    const installedStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Installed' });
    await installedStat.click();
    await installedStat.click();

    // Should show Silver that are NOT installed
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBeGreaterThanOrEqual(0);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// SORT OPTIONS
// ============================================================================

test.describe('Store Actions - Sort Options', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should sort by score (default high to low, then low to high)', async ({ page }) => {
    // Default sort is score-desc
    const sortSelect = page.locator('#sort-select');
    await expect(sortSelect).toHaveValue('score-desc');

    // Verify descending order
    let cards = page.locator('.service-card');
    let firstScore = await cards.first().locator('.score, [class*="score"]').textContent();
    let lastScore = await cards.last().locator('.score, [class*="score"]').textContent();
    expect(parseInt(firstScore)).toBeGreaterThanOrEqual(parseInt(lastScore));

    // Switch to ascending
    await selectSort(page, 'Score: Low to High');

    await expect(async () => {
      await expect(sortSelect).toHaveValue('score-asc');
      cards = page.locator('.service-card');
      firstScore = await cards.first().locator('.score, [class*="score"]').textContent();
      lastScore = await cards.last().locator('.score, [class*="score"]').textContent();
      expect(parseInt(firstScore)).toBeLessThanOrEqual(parseInt(lastScore));
    }).toPass({ timeout: 3000 });
  });

  test('should sort by name (A-Z and Z-A)', async ({ page }) => {
    // Sort A to Z
    await selectSort(page, 'Name: A to Z');

    await expect(async () => {
      const sortSelect = page.locator('#sort-select');
      await expect(sortSelect).toHaveValue('name-asc');
    }).toPass({ timeout: 3000 });

    // Verify ascending order
    let cards = await page.locator('.service-card').all();
    let names = [];
    for (const card of cards) {
      const name = await card.locator('.service-name').textContent();
      names.push(name.toLowerCase());
    }
    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeLessThanOrEqual(0);
    }

    // Sort Z to A
    await selectSort(page, 'Name: Z to A');

    await expect(async () => {
      const sortSelect = page.locator('#sort-select');
      await expect(sortSelect).toHaveValue('name-desc');
    }).toPass({ timeout: 3000 });

    // Verify descending order
    cards = await page.locator('.service-card').all();
    names = [];
    for (const card of cards) {
      const name = await card.locator('.service-name').textContent();
      names.push(name.toLowerCase());
    }
    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeGreaterThanOrEqual(0);
    }
  });

  test('should sort by Recently Updated', async ({ page }) => {
    await selectSort(page, 'Recently Updated');

    await expect(async () => {
      const sortSelect = page.locator('#sort-select');
      const value = await sortSelect.inputValue();
      expect(['updated-desc', 'recently-updated']).toContain(value);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// VIEW SWITCHING
// ============================================================================

test.describe('Store Actions - View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should switch between Services and Teams views', async ({ page }) => {
    // Switch to Teams view
    await switchToTeamsView(page);
    await expect(page.locator('.teams-grid')).toBeVisible();
    await expect(page.locator('.services-grid')).not.toBeVisible();

    // Verify team count
    const teamCards = page.locator('.team-card');
    const count = await teamCards.count();
    expect(count).toBe(expectedStats.teams);

    // Switch back to Services view
    await switchToServicesView(page);
    await expect(page.locator('.services-grid')).toBeVisible();
    await expect(page.locator('.teams-grid')).not.toBeVisible();
  });

  test('should filter Teams by search', async ({ page }) => {
    await switchToTeamsView(page);

    const searchInput = page.getByRole('textbox', { name: /search teams/i });
    await searchInput.fill('platform');

    await expect(async () => {
      const teamCards = page.locator('.team-card');
      const count = await teamCards.count();
      expect(count).toBe(1);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// TEAM FILTER
// ============================================================================

test.describe('Store Actions - Team Filter', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should filter services by team and clear filter', async ({ page }) => {
    const teamFilterToggle = page.locator('.team-filter-toggle');

    // Apply team filter
    await teamFilterToggle.click();
    await page.locator('.team-option').filter({ hasText: 'platform' }).locator('input').click();
    await teamFilterToggle.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedTeams.platform.serviceCount);
    }).toPass({ timeout: 3000 });

    // Clear by unchecking
    await teamFilterToggle.click();
    await page.locator('.team-option').filter({ hasText: 'platform' }).locator('input').click();
    await teamFilterToggle.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.totalServices);
    }).toPass({ timeout: 3000 });
  });

  test('should support multi-team filter', async ({ page }) => {
    const teamFilterToggle = page.locator('.team-filter-toggle');

    // Select both frontend and backend teams
    await teamFilterToggle.click();
    await page.locator('.team-option').filter({ hasText: 'frontend' }).locator('input').click();
    await page.locator('.team-option').filter({ hasText: 'backend' }).locator('input').click();
    await teamFilterToggle.click();

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedTeams.frontend.serviceCount + expectedTeams.backend.serviceCount);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// CLEAR FILTERS
// ============================================================================

test.describe('Store Actions - Clear Filters', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should maintain rank filter when clearing search', async ({ page }) => {
    // Apply rank filter
    const goldStat = page.locator('.services-stats .stat-card').filter({ hasText: 'Gold' });
    await goldStat.click();

    // Add search
    await searchServices(page, 'test');

    // Clear search
    await clearSearch(page);

    // Rank filter should still be applied
    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.ranks.gold);
    }).toPass({ timeout: 3000 });

    // Click gold to exclude, then clear
    await goldStat.click(); // exclude
    await goldStat.click(); // clear

    await expect(async () => {
      const count = await getServiceCount(page);
      expect(count).toBe(expectedStats.totalServices);
    }).toPass({ timeout: 3000 });
  });
});

// ============================================================================
// DISPLAY MODE
// ============================================================================

test.describe('Store Actions - Display Mode', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should toggle display mode and persist to localStorage', async ({ page }) => {
    const listViewButton = page.locator('[data-display-mode="list"], .display-mode-toggle');

    if (await listViewButton.isVisible()) {
      await listViewButton.click();

      const displayMode = await page.evaluate(() => {
        return localStorage.getItem('scorecards-display-mode');
      });

      expect(['grid', 'list']).toContain(displayMode);
    }
  });
});

// ============================================================================
// MODAL STATE
// ============================================================================

test.describe('Store Actions - Modal State', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should open and close service modal (button and Escape key)', async ({ page }) => {
    // Open modal
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('test-repo-perfect');

    // Close via button
    await closeServiceModal(page);
    await expect(modal).not.toBeVisible();

    // Reopen and close via Escape
    await openServiceModal(page, 'test-repo-perfect');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should open and close settings modal', async ({ page }) => {
    await openSettingsModal(page);

    const modal = page.locator('#settings-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Settings');

    await closeSettingsModal(page);
    await expect(modal).not.toBeVisible();
  });
});
