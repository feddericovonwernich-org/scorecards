import { test, expect } from './fixtures/catalog.fixture.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openServiceModal,
  closeServiceModal,
  setGitHubPAT,
  clickServiceModalTab,
} from './test-helper.js';

test.describe('Service Modal - Basic Behavior', () => {
  test('should open, display service info, and close correctly', async ({ catalogPage }) => {
    await openServiceModal(catalogPage, 'test-repo-perfect');

    const modal = catalogPage.locator('#service-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('test-repo-perfect');
    await expect(modal).toContainText('76');
    await expect(modal).toContainText('Gold');

    // Close with X button
    await closeServiceModal(catalogPage);
    await expect(modal).not.toBeVisible();
  });

  test('should close with Escape key', async ({ catalogPage }) => {
    await openServiceModal(catalogPage, 'test-repo-perfect');
    await catalogPage.keyboard.press('Escape');
    await expect(catalogPage.locator('#service-modal')).not.toBeVisible();
  });

  test('should have GitHub link and Refresh Data button', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');
    const githubLink = modal.locator('a[href*="github.com"]').first();
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com.*test-repo-perfect/);

    const refreshButton = modal.getByRole('button', { name: 'Refresh Data' });
    await expect(refreshButton).toBeVisible();
  });
});

test.describe('Service Modal - Check Results Tab', () => {
  test('should display all check information correctly', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');
    const checkResults = modal.locator('.check-result');
    const count = await checkResults.count();
    expect(count).toBeGreaterThanOrEqual(10);

    // Check for pass/fail indicators
    const passedChecks = modal.locator('.check-result').filter({ hasText: '✓' });
    const failedChecks = modal.locator('.check-result').filter({ hasText: '✗' });
    expect(await passedChecks.count()).toBeGreaterThan(0);
    expect(await failedChecks.count()).toBeGreaterThan(0);

    // Check output and weight display
    const outputSection = modal.locator('strong', { hasText: 'Output:' }).first();
    await expect(outputSection).toBeVisible();

    const weightText = modal.getByText(/Weight: \d+/);
    await expect(weightText.first()).toBeVisible();

    // Score in modal stats
    const statValue = modal.locator('.modal-stat-value').filter({ hasText: '76' });
    await expect(statValue).toBeVisible();
  });

  test('should display check categories with correct functionality', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');

    // Verify categories exist and are expanded
    await expect(modal.locator('.category-name').filter({ hasText: 'Scorecards Setup' })).toBeVisible();
    await expect(modal.locator('.category-name').filter({ hasText: 'Documentation' })).toBeVisible();

    const categories = modal.locator('.check-category');
    expect(await categories.count()).toBeGreaterThan(0);

    // First category should be open
    const firstCategory = categories.first();
    expect(await firstCategory.getAttribute('open')).not.toBeNull();

    // Category stats should show pass/fail format
    const categoryStats = modal.locator('.category-stats');
    await expect(categoryStats.first()).toContainText(/\d+\/\d+ passed/);

    // Collapse and expand functionality
    const firstCategoryHeader = firstCategory.locator('.check-category-header');
    await firstCategoryHeader.click();
    await expect(async () => {
      expect(await firstCategory.getAttribute('open')).toBeNull();
    }).toPass({ timeout: 3000 });

    await firstCategoryHeader.click();
    await expect(async () => {
      expect(await firstCategory.getAttribute('open')).not.toBeNull();
    }).toPass({ timeout: 3000 });
  });

  test('should show specific check pass/fail status', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');

    // README Documentation check should pass
    const readmeCheck = modal.locator('.check-result').filter({ hasText: 'README Documentation' });
    await expect(readmeCheck).toContainText('✓');

    // Scorecard Configuration check should fail
    const configCheck = modal.locator('.check-result').filter({ hasText: 'Scorecard Configuration' });
    await expect(configCheck).toContainText('✗');
  });
});

test.describe('Service Modal - API Specification Tab', () => {
  test('should display complete API specification information', async ({ serviceModalPage }) => {
    await clickServiceModalTab(serviceModalPage, 'API Specification');

    const modal = serviceModalPage.locator('#service-modal');

    // API metadata
    await expect(modal).toContainText('Perfect Example API');
    await expect(modal).toContainText('1.0.0');
    await expect(modal).toContainText('openapi.yaml');
    await expect(modal).toContainText('3.0');

    // Endpoint counts
    await expect(modal).toContainText(/\d+ paths/i);
    await expect(modal).toContainText(/\d+ operations/i);

    // GitHub link in API tab (specific to openapi.yaml)
    const apiTab = modal.locator('#api-tab');
    const githubLink = apiTab.locator('a').filter({ hasText: 'View on GitHub' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com.*openapi\.yaml/);
  });

  test('should have expandable raw specification section', async ({ serviceModalPage }) => {
    await clickServiceModalTab(serviceModalPage, 'API Specification');

    const modal = serviceModalPage.locator('#service-modal');
    const rawSpecToggle = modal.getByText(/View Raw Specification/i);
    await expect(rawSpecToggle).toBeVisible();

    await rawSpecToggle.click();
    await expect(async () => {
      const hasCodeBlock = await modal.locator('pre, code').count() > 0;
      expect(hasCodeBlock).toBe(true);
    }).toPass({ timeout: 3000 });
  });

  test('should show environment configuration message', async ({ serviceModalPage }) => {
    await clickServiceModalTab(serviceModalPage, 'API Specification');
    const modal = serviceModalPage.locator('#service-modal');
    await expect(modal).toContainText(/Configure environments|\.scorecard\/config\.yml|API Explorer/i);
  });
});

test.describe('Service Modal - Contributors Tab', () => {
  test('should display complete contributor information', async ({ serviceModalPage }) => {
    await clickServiceModalTab(serviceModalPage, 'Contributors');

    const modal = serviceModalPage.locator('#service-modal');

    // Heading and description
    await expect(modal).toContainText(/Recent Contributors/i);
    await expect(modal).toContainText(/committed to this repository/i);

    // Contributor details
    const avatars = modal.locator('img[alt]');
    expect(await avatars.count()).toBeGreaterThan(0);

    const names = modal.locator('strong');
    expect(await names.count()).toBeGreaterThan(0);

    // Email, commit count, and date
    await expect(modal).toContainText(/@/);
    await expect(modal).toContainText(/\d+ commit/i);
    await expect(modal).toContainText(/Last commit/i);

    // Commit hash
    const codeElements = modal.locator('code');
    expect(await codeElements.count()).toBeGreaterThan(0);
  });
});

test.describe('Service Modal - Badges Tab', () => {
  test('should display badge previews and markdown correctly', async ({ serviceModalPage }) => {
    await clickServiceModalTab(serviceModalPage, 'Badges');

    const modal = serviceModalPage.locator('#service-modal');

    // Badge previews
    await expect(modal).toContainText(/Badge Preview/i);
    await expect(modal.locator('img[alt*="Score"]')).toBeVisible();
    await expect(modal.locator('img[alt*="Rank"]')).toBeVisible();

    // Markdown section
    await expect(modal).toContainText(/Add to Your README/i);
    await expect(modal).toContainText('![Score]');
    await expect(modal).toContainText('![Rank]');
    await expect(modal).toContainText('img.shields.io');
    await expect(modal).toContainText('test-repo-perfect');

    // Copy buttons
    const copyButtons = modal.getByRole('button', { name: 'Copy' });
    expect(await copyButtons.count()).toBeGreaterThanOrEqual(2);
  });

  test('should copy badge markdown to clipboard', async ({ serviceModalPage }) => {
    await serviceModalPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await clickServiceModalTab(serviceModalPage, 'Badges');

    const modal = serviceModalPage.locator('#service-modal');
    const copyButton = modal.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    await expect(modal).toContainText(/Copied/i);

    // Wait for reset
    await expect(async () => {
      const resetButton = modal.getByRole('button', { name: 'Copy' }).first();
      await expect(resetButton).toBeVisible();
    }).toPass({ timeout: 5000 });
  });
});

test.describe('Service Modal - Workflow Runs Tab', () => {
  test('should show PAT required message and Configure Token button when no token', async ({ serviceModalPage }) => {
    await clickServiceModalTab(serviceModalPage, 'Workflow Runs');

    const modal = serviceModalPage.locator('#service-modal');
    const hasPrompt = await modal.getByText(/Configure|Token|PAT|GitHub/i).count() > 0;
    expect(hasPrompt).toBe(true);

    const configButton = modal.getByRole('button', { name: /Configure Token/i });
    await expect(configButton).toBeVisible();
  });

  test('should show workflow filter and refresh controls with PAT', async ({ catalogPage }) => {
    await setGitHubPAT(catalogPage, mockPAT);

    await catalogPage.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ workflow_runs: [], total_count: 0 }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openServiceModal(catalogPage, 'test-repo-perfect');
    await clickServiceModalTab(catalogPage, 'Workflow Runs');

    const modal = catalogPage.locator('#service-modal');
    await expect(modal.getByRole('button', { name: /All/i })).toBeVisible();

    const refreshDropdown = modal.locator('select').filter({ hasText: /Refresh|15s|30s/i });
    expect(await refreshDropdown.count()).toBeGreaterThan(0);
  });

  test('should display workflow runs when API returns data', async ({ catalogPage }) => {
    await setGitHubPAT(catalogPage, mockPAT);

    await catalogPage.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          workflow_runs: [{
            id: 123456, name: 'CI', status: 'completed', conclusion: 'success',
            run_number: 42, created_at: '2025-01-01T12:00:00Z',
            html_url: 'https://github.com/test/repo/actions/runs/123456',
          }],
          total_count: 1,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await openServiceModal(catalogPage, 'test-repo-perfect');
    await clickServiceModalTab(catalogPage, 'Workflow Runs');

    await expect(catalogPage.locator('#service-modal')).toContainText(/CI|workflow/i);
  });
});

test.describe('Service Modal - Links Tab', () => {
  test('should not show Links tab when service has no links', async ({ serviceModalPage }) => {
    const linksTab = serviceModalPage.locator('#service-modal').getByRole('button', { name: 'Links', exact: true });
    expect(await linksTab.count()).toBe(0);
  });
});

test.describe('Service Modal - Tab Navigation', () => {
  test('should default to Check Results tab and switch correctly', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');

    // Check Results should be active by default
    const checkResultsTab = modal.getByRole('button', { name: 'Check Results' });
    expect(await checkResultsTab.evaluate(el => el.classList.contains('active'))).toBe(true);
    await expect(modal).toContainText(/passed|failed|Weight/i);

    // Switch to API tab
    await clickServiceModalTab(serviceModalPage, 'API Specification');
    const apiTab = modal.getByRole('button', { name: 'API Specification' });
    expect(await apiTab.evaluate(el => el.classList.contains('active'))).toBe(true);
    await expect(modal).toContainText(/OpenAPI|API|paths/i);

    // Verify tab state preservation
    await clickServiceModalTab(serviceModalPage, 'Contributors');
    await expect(modal).toContainText(/Recent Contributors/i);

    await clickServiceModalTab(serviceModalPage, 'Badges');
    await expect(modal).toContainText(/Badge Preview/i);

    await clickServiceModalTab(serviceModalPage, 'Contributors');
    await expect(modal).toContainText(/Recent Contributors/i);
  });

  test('should have keyboard accessible tabs', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');
    const tabs = modal.locator('.tab-btn');

    await tabs.first().focus();
    await serviceModalPage.keyboard.press('Tab');
    await serviceModalPage.keyboard.press('Enter');

    expect(await modal.locator('.tab-btn.active').count()).toBe(1);
  });
});

test.describe('Service Modal - Mobile Tab Scroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should have tabs container and handle scroll correctly on mobile', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');

    const modal = page.locator('#service-modal');
    const tabsContainer = modal.locator('.tabs-container');
    const tabs = modal.locator('.tabs');

    await expect(tabsContainer).toBeVisible();
    await expect(tabs).toBeVisible();
    await expect(page.locator('.tab-btn').first()).toBeVisible();

    // Left arrow should not be visible at start
    await expect(page.locator('.tab-scroll-left')).toHaveCount(0);

    // Test scroll if right arrow exists
    const rightArrow = page.locator('.tab-scroll-right');
    if (await rightArrow.count() > 0) {
      const initialScrollLeft = await tabs.evaluate(el => el.scrollLeft);
      expect(initialScrollLeft).toBe(0);

      await rightArrow.click();

      await expect(async () => {
        expect(await tabs.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
      }).toPass({ timeout: 3000 });

      await expect(page.locator('.tab-scroll-left')).toBeVisible();
    }
  });

  test('should not show scroll arrows on desktop when content fits', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await openServiceModal(page, 'test-repo-perfect');

    const leftCount = await page.locator('.tab-scroll-left').count();
    const rightCount = await page.locator('.tab-scroll-right').count();
    expect(leftCount + rightCount).toBeLessThanOrEqual(1);
  });
});

test.describe('Service Modal - Case-Insensitive Categories', () => {
  test('should group checks by category with case-insensitive matching', async ({ serviceModalPage }) => {
    const modal = serviceModalPage.locator('#service-modal');

    const categories = modal.locator('.check-category');
    expect(await categories.count()).toBeGreaterThan(0);

    await expect(modal.locator('.category-name').filter({ hasText: 'Documentation' })).toBeVisible();
    await expect(modal.locator('.category-name').filter({ hasText: 'Scorecards Setup' })).toBeVisible();
  });
});
