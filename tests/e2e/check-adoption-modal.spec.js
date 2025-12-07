import { test, expect } from './coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openCheckAdoptionDashboard,
  closeCheckAdoptionModal,
  switchToTeamsView,
  openTeamModal,
} from './test-helper.js';

// ============================================================================
// CHECK ADOPTION DASHBOARD - Modal Structure
// ============================================================================

test.describe('Check Adoption Dashboard - Modal Structure', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await openCheckAdoptionDashboard(page);
  });

  test('modal opens with correct structure', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Check Adoption Dashboard');
    await expect(modal.getByRole('button', { name: 'Close modal' })).toBeVisible();
  });

  test('displays overall stats with correct styling', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');
    const statsRow = modal.locator('.adoption-stats-row');
    await expect(statsRow).toBeVisible();

    const statCards = modal.locator('.adoption-stat-card');
    expect(await statCards.count()).toBeGreaterThanOrEqual(2);

    await expect(modal.locator('.adoption-stat-value').first()).toBeVisible();
    await expect(modal.locator('.adoption-stat-label').first()).toBeVisible();
  });

  test('close button and Escape key close modal', async ({ page }) => {
    // Test close button
    await closeCheckAdoptionModal(page);
    await expect(page.locator('#check-adoption-modal')).toBeHidden();

    // Reopen and test Escape key
    await openCheckAdoptionDashboard(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#check-adoption-modal')).toBeHidden();
  });
});

// ============================================================================
// CHECK ADOPTION DASHBOARD - Check Selector
// ============================================================================

test.describe('Check Adoption Dashboard - Check Selector', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await openCheckAdoptionDashboard(page);
  });

  test('check selector dropdown is visible and functional', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    const toggle = modal.locator('.check-card-selected');
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();
    await expect(modal.locator('.check-card-search input')).toBeVisible();

    const options = modal.locator('.check-card-option');
    expect(await options.count()).toBeGreaterThan(0);
  });

  test('check selector search filters options', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    await modal.locator('.check-card-selected').click();
    await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();

    await modal.locator('.check-card-search input').fill('License');

    await expect(async () => {
      const visibleOptions = modal.locator('.check-card-option:visible');
      expect(await visibleOptions.count()).toBeLessThan(13);
    }).toPass({ timeout: 3000 });
  });

  test('check selector changes update the dashboard', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    const initialCheckName = await modal.locator('.check-card-selected .check-card-name').textContent();

    await modal.locator('.check-card-selected').click();
    await modal.locator('.check-card-option').nth(1).click();

    await expect(modal.locator('.check-card-dropdown.open')).not.toBeVisible();

    const newCheckName = await modal.locator('.check-card-selected .check-card-name').textContent();
    expect(newCheckName).not.toBe(initialCheckName);

    await expect(modal.locator('.check-card-selected .check-card-description')).toBeVisible();
  });

  test('clicking outside closes dropdown', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    await modal.locator('.check-card-selected').click();
    await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();

    await modal.locator('.adoption-stats-row').click({ force: true });
    await expect(modal.locator('.check-card-dropdown.open')).not.toBeVisible();
  });
});

// ============================================================================
// CHECK ADOPTION DASHBOARD - Table
// ============================================================================

test.describe('Check Adoption Dashboard - Table', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await openCheckAdoptionDashboard(page);
  });

  test('table displays teams with progress bars and correct columns', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    const table = modal.locator('.adoption-table');
    await expect(table).toBeVisible();

    // Verify header row has correct columns (5 including Excl. column)
    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(5);
    await expect(headers.nth(0)).toContainText('Team');
    await expect(headers.nth(1)).toContainText('Adoption');
    await expect(headers.nth(2)).toContainText('Progress');
    await expect(headers.nth(3)).toContainText('Passing');
    await expect(headers.nth(4)).toContainText('Excl.');

    // Verify at least one data row exists with progress bar
    const rows = modal.locator('.adoption-row');
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(rows.first().locator('.progress-bar-inline')).toBeVisible();
  });

  test('table sorting works for columns', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Test Team column sorting
    await modal.locator('.adoption-table th:has-text("Team")').click();
    const teamHeader = modal.locator('.adoption-table th:has-text("Team")');
    await expect(teamHeader.locator('.sort-indicator')).toBeVisible();

    // Test Adoption column sorting
    await modal.locator('.adoption-table th:has-text("Adoption")').click();
    const adoptionHeader = modal.locator('.adoption-table th:has-text("Adoption")');
    const sortIndicator = await adoptionHeader.locator('.sort-indicator').textContent();
    expect(sortIndicator).toMatch(/[↑↓]/);

    // Click again to reverse
    await modal.locator('.adoption-table th:has-text("Adoption")').click();
    await expect(async () => {
      const newSortIndicator = await adoptionHeader.locator('.sort-indicator').textContent();
      expect(newSortIndicator).not.toBe(sortIndicator);
    }).toPass({ timeout: 3000 });
  });

  test('clicking team row opens team detail modal', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    const teamRow = modal.locator('.adoption-row:not(.no-team)').first();
    if (await teamRow.count() > 0) {
      await teamRow.click();
      await expect(page.locator('#team-modal')).toBeVisible();
    }
  });

  test('No Team row has distinct styling', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');
    const noTeamRow = modal.locator('.adoption-row:has-text("No Team")');

    if (await noTeamRow.count() > 0) {
      await expect(noTeamRow).toHaveClass(/no-team/);
    }
  });

  test('progress bar shows correctly for 0% adoption', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    const zeroPercentRow = modal.locator('.adoption-row').filter({
      has: page.locator('.adoption-cell', { hasText: /^0%$/ })
    });

    if (await zeroPercentRow.count() > 0) {
      const progressFill = zeroPercentRow.first().locator('.progress-fill');
      await expect(progressFill).toHaveClass(/none/);
    }
  });
});

// ============================================================================
// CHECK ADOPTION - Exclusion Feature
// ============================================================================

test.describe('Check Adoption - Exclusion Feature', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await openCheckAdoptionDashboard(page);
  });

  test('excluded stat card appears when exclusions exist', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    // Select OpenAPI Specification check which has exclusions
    await modal.locator('.check-card-selected').click();
    await modal.locator('.check-card-search input').fill('OpenAPI Spec');
    await expect(modal.locator('.check-card-option:visible').first()).toBeVisible();
    await modal.locator('.check-card-option:visible').first().click();

    const excludedStatCard = modal.locator('.adoption-stat-card.excluded');
    await expect(excludedStatCard).toBeVisible();
    await expect(excludedStatCard.locator('.adoption-stat-label')).toContainText('Excluded');
  });

  test('excluded count is shown in table rows', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    await modal.locator('.check-card-selected').click();
    await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();
    await modal.locator('.check-card-search input').fill('OpenAPI Specification');
    await expect(modal.locator('.check-card-option').first()).toBeVisible({ timeout: 5000 });
    await modal.locator('.check-card-option').first().click();

    await expect(modal.locator('.adoption-table')).toBeVisible();

    const frontendRow = modal.locator('.adoption-row').filter({ hasText: 'frontend' });
    if (await frontendRow.count() > 0) {
      const excludedCell = frontendRow.locator('.adoption-cell.has-excluded');
      await expect(excludedCell).toBeVisible();
      const excludedCount = excludedCell.locator('.excluded-count');
      await expect(excludedCount).toBeVisible();
      expect(await excludedCount.textContent()).not.toBe('—');
    }
  });

  test('teams without exclusions show dash in Excl. column', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    await modal.locator('.check-card-selected').click();
    await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();
    await modal.locator('.check-card-search input').fill('README Documentation');
    await expect(modal.locator('.check-card-option').first()).toBeVisible({ timeout: 5000 });
    await modal.locator('.check-card-option').first().click();

    await expect(modal.locator('.adoption-table')).toBeVisible();

    const rows = modal.locator('.adoption-row');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });

    let foundDash = false;
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const excludedCount = rows.nth(i).locator('.excluded-count');
      const text = await excludedCount.textContent();
      if (text?.trim() === '—') {
        foundDash = true;
        const parentCell = rows.nth(i).locator('.adoption-cell').last();
        await expect(parentCell).not.toHaveClass(/has-excluded/);
        break;
      }
    }
    expect(foundDash).toBe(true);
  });

  test('overall stats show Services Passing with active count', async ({ page }) => {
    const modal = page.locator('#check-adoption-modal');

    await modal.locator('.check-card-selected').click();
    await modal.locator('.check-card-search input').fill('API Environment');
    await expect(modal.locator('.check-card-option:visible').first()).toBeVisible();
    await modal.locator('.check-card-option:visible').first().click();

    const servicesPassingCard = modal.locator('.adoption-stat-card').filter({ hasText: 'Services Passing' });
    await expect(servicesPassingCard).toBeVisible();

    const value = await servicesPassingCard.locator('.adoption-stat-value').textContent();
    expect(value).toMatch(/^\d+\/\d+$/);
  });
});

// ============================================================================
// TEAM MODAL - Check Adoption with Exclusions
// ============================================================================

test.describe('Team Modal - Check Adoption with Exclusions', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await openTeamModal(page, 'platform');
  });

  test('check adoption section displays correctly with exclusions', async ({ page }) => {
    const modal = page.locator('#team-modal');

    const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
    if (await checkAdoptionTab.isVisible()) {
      await checkAdoptionTab.click();
      await expect(modal.locator('.tab-content, [class*="tab-content"]')).toBeVisible();
    }

    const checkSelect = modal.locator('#team-check-select');
    if (await checkSelect.isVisible()) {
      await checkSelect.selectOption({ label: 'API Environment Configuration' });
      await expect(modal.locator('.adoption-lists, .adoption-percentage')).toBeVisible();
    }

    // Verify three-column layout when exclusions exist
    const adoptionLists = modal.locator('.adoption-lists');
    if (await adoptionLists.isVisible()) {
      const excludedList = modal.locator('.adoption-list-excluded');
      if (await excludedList.count() > 0) {
        const hasThreeColumns = await adoptionLists.evaluate(el => el.classList.contains('three-columns'));
        expect(hasThreeColumns).toBe(true);
      }
    }
  });

  test('excluded services show with distinct styling and reason', async ({ page }) => {
    const modal = page.locator('#team-modal');

    const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
    if (await checkAdoptionTab.isVisible()) {
      await checkAdoptionTab.click();
      await expect(modal.locator('.tab-content, [class*="tab-content"]')).toBeVisible();
    }

    const checkSelect = modal.locator('#team-check-select');
    if (await checkSelect.isVisible()) {
      await checkSelect.selectOption({ label: 'API Environment Configuration' });
      await expect(modal.locator('.adoption-lists, .adoption-percentage')).toBeVisible();
    }

    // Check for exclusion styling
    const excludedItems = modal.locator('.adoption-service-item.excluded');
    if (await excludedItems.count() > 0) {
      await expect(excludedItems.first()).toBeVisible();
      await expect(excludedItems.first()).toHaveClass(/excluded/);
    }

    // Check for exclusion reason
    const exclusionReason = modal.locator('.exclusion-reason');
    if (await exclusionReason.count() > 0) {
      await expect(exclusionReason.first()).toBeVisible();
    }
  });

  test('adoption percentage displays correctly', async ({ page }) => {
    const modal = page.locator('#team-modal');

    const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
    if (await checkAdoptionTab.isVisible()) {
      await checkAdoptionTab.click();
      await expect(modal.locator('.tab-content, [class*="tab-content"]')).toBeVisible();
    }

    const checkSelect = modal.locator('#team-check-select');
    if (await checkSelect.isVisible()) {
      await checkSelect.selectOption({ label: 'API Environment Configuration' });
      await expect(modal.locator('.adoption-lists, .adoption-percentage')).toBeVisible();
    }

    const adoptionPercentage = modal.locator('.adoption-percentage');
    if (await adoptionPercentage.isVisible()) {
      const text = await adoptionPercentage.textContent();
      expect(text).toMatch(/\d+%/);
    }
  });
});

// ============================================================================
// CHECK ADOPTION - Dark Mode
// ============================================================================

test.describe('Check Adoption - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Enable dark mode
    const darkModeToggle = page.locator('button[aria-label="Toggle night mode"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    }
  });

  test('modal is visible and functional in dark mode', async ({ page }) => {
    await openCheckAdoptionDashboard(page);
    const modal = page.locator('#check-adoption-modal');

    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toBeVisible();
    await expect(modal.locator('.adoption-stats-row')).toBeVisible();
    await expect(modal.locator('.adoption-table')).toBeVisible();

    await closeCheckAdoptionModal(page);
    await expect(page.locator('#check-adoption-modal')).toBeHidden();
  });

  test('exclusion styling is visible in dark mode', async ({ page }) => {
    await openCheckAdoptionDashboard(page);
    const modal = page.locator('#check-adoption-modal');

    // Select a check with exclusions
    await modal.locator('.check-card-selected').click();
    await modal.locator('.check-card-search input').fill('OpenAPI Spec');
    await expect(modal.locator('.check-card-option:visible').first()).toBeVisible();
    await modal.locator('.check-card-option:visible').first().click();

    const excludedStatCard = modal.locator('.adoption-stat-card.excluded');
    if (await excludedStatCard.count() > 0) {
      await expect(excludedStatCard).toBeVisible();
    }

    const excludedCells = modal.locator('.adoption-cell.has-excluded');
    if (await excludedCells.count() > 0) {
      await expect(excludedCells.first()).toBeVisible();
    }
  });
});
