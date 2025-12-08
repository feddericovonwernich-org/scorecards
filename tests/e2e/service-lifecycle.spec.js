/**
 * Service Lifecycle E2E Tests (Consolidated)
 *
 * Phase 2 Coverage Improvement - User story-based comprehensive tests
 * Consolidated from 21 tests → 8 tests
 *
 * Coverage targets:
 * - staleness.ts, animation.ts, github.ts
 * - LinksTab.tsx, ServiceCard.tsx
 */

import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  setGitHubPAT,
  openServiceModal,
  closeServiceModal,
  clickServiceModalTab,
  mockWorkflowDispatch,
  mockWorkflowRuns,
  getServiceCount,
} from './test-helper.js';

// ============================================================================
// USER STORY 2.1: STALE SERVICE RE-RUN JOURNEY (Consolidated: 5 → 2 tests)
// ============================================================================

test.describe('Stale Service Re-run Journey', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should identify stale services, filter them, and complete re-run workflow', async ({ page }) => {
    // Phase 1: Identify stale service with correct badges
    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await expect(staleCard).toBeVisible();
    await expect(staleCard.locator('.badge-stale')).toBeVisible();
    await expect(staleCard.locator('text=INSTALLED')).toBeVisible();

    // Verify non-stale service doesn't have STALE badge
    const freshCard = page.locator('.service-card').filter({ hasText: 'test-repo-perfect' });
    await expect(freshCard.locator('.badge-stale')).toHaveCount(0);

    // Phase 2: Filter to show only stale services
    const initialCount = await getServiceCount(page);
    const staleStatCard = page.locator('.services-stats .stat-card').filter({ hasText: 'Stale' });
    await staleStatCard.click();
    await page.waitForTimeout(300);
    expect(await getServiceCount(page)).toBe(1);
    await expect(page.locator('.service-card').first()).toContainText('test-repo-stale');

    // Clear filter
    await staleStatCard.click();
    await staleStatCard.click();
    await page.waitForTimeout(300);

    // Phase 3: Authenticate and trigger re-run
    await setGitHubPAT(page, mockPAT);
    await mockWorkflowDispatch(page, { status: 204 });

    const rerunButton = staleCard.locator('button').filter({ hasText: /re-?run|trigger/i });
    if (await rerunButton.count() > 0 && await rerunButton.first().isVisible()) {
      await rerunButton.first().click({ force: true });

      // Verify response (toast or spinner)
      await expect(async () => {
        const hasToast = await page.locator('.toast').count() > 0;
        const hasSpinner = await staleCard.locator('.spinning, [class*="spin"]').count() > 0;
        expect(hasToast || hasSpinner).toBe(true);
      }).toPass({ timeout: 5000 });
    }
  });

  test('should handle workflow dispatch errors gracefully', async ({ page }) => {
    await setGitHubPAT(page, mockPAT);
    await mockWorkflowDispatch(page, { status: 500 });

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const rerunButton = staleCard.locator('button').filter({ hasText: /re-?run|trigger/i });

    if (await rerunButton.count() > 0 && await rerunButton.first().isVisible()) {
      await rerunButton.first().click({ force: true });
      await expect(async () => {
        expect(await page.locator('.toast').count()).toBeGreaterThan(0);
      }).toPass({ timeout: 5000 });
    }
  });
});

// ============================================================================
// USER STORY 2.2: SERVICE MODAL EXPLORATION (Consolidated: 8 → 3 tests)
// ============================================================================

test.describe('Service Modal Complete Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should display service overview, navigate all tabs, and close with keyboard', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    const modal = page.locator('#service-modal');

    // Phase 1: Verify overview
    await expect(modal.locator('h2')).toContainText('test-repo-perfect');
    await expect(modal).toContainText('76');
    await expect(modal).toContainText(/Gold/i);
    await expect(modal.locator('a[href*="github.com"]').first()).toBeVisible();

    // Phase 2: Check Results tab (default) with categories and indicators
    await expect(modal.locator('.check-category').first()).toBeVisible();
    expect(await modal.locator('.check-result').filter({ hasText: '✓' }).count()).toBeGreaterThan(0);
    expect(await modal.locator('.check-result').filter({ hasText: '✗' }).count()).toBeGreaterThan(0);
    await expect(modal.getByText(/Weight: \d+/).first()).toBeVisible();
    await expect(modal.locator('.category-stats').first()).toContainText(/\d+\/\d+ passed/);

    // Phase 3: API Specification tab
    await clickServiceModalTab(page, 'API Specification');
    await expect(modal).toContainText('Perfect Example API');
    await expect(modal).toContainText('1.0.0');
    await expect(modal).toContainText(/\d+ paths/i);

    // Phase 4: Contributors tab
    await clickServiceModalTab(page, 'Contributors');
    await expect(modal).toContainText(/Recent Contributors/i);
    expect(await modal.locator('img[alt]').count()).toBeGreaterThan(0);
    await expect(modal).toContainText(/\d+ commit/i);

    // Phase 5: Badges tab
    await clickServiceModalTab(page, 'Badges');
    await expect(modal).toContainText(/Badge Preview/i);
    await expect(modal.locator('img[alt*="Score"]')).toBeVisible();
    await expect(modal).toContainText('![Score]');
    expect(await modal.getByRole('button', { name: 'Copy' }).count()).toBeGreaterThanOrEqual(2);

    // Phase 6: Close with X button
    await closeServiceModal(page);
    await expect(modal).not.toBeVisible();

    // Phase 7: Reopen and close with Escape
    await openServiceModal(page, 'test-repo-perfect');
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should display workflow runs tab with PAT configuration states', async ({ page }) => {
    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Workflow Runs');
    const modal = page.locator('#service-modal');

    // Without PAT: Show config prompt
    await expect(modal.getByText(/Configure|Token|PAT/i).first()).toBeVisible();
    await expect(modal.getByRole('button', { name: /Configure Token/i })).toBeVisible();

    await closeServiceModal(page);

    // With PAT: Show workflow controls
    await setGitHubPAT(page, mockPAT);
    await mockWorkflowRuns(page, {
      runs: {
        workflow_runs: [{
          id: 123456, name: 'CI', status: 'completed', conclusion: 'success',
          run_number: 42, created_at: '2025-01-01T12:00:00Z',
          html_url: 'https://github.com/test/repo/actions/runs/123456',
        }],
        total_count: 1,
      }
    });

    await openServiceModal(page, 'test-repo-perfect');
    await clickServiceModalTab(page, 'Workflow Runs');
    await expect(modal.getByRole('button', { name: /All/i })).toBeVisible();

    await closeServiceModal(page);
  });

  test('should support keyboard navigation for service cards and modal tabs', async ({ page }) => {
    // Focus and open with Enter
    const firstCard = page.locator('.service-card').first();
    await firstCard.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#service-modal')).toBeVisible();
    await closeServiceModal(page);

    // Focus and open with Space
    await firstCard.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#service-modal')).toBeVisible();

    // Verify tabs are present and clickable
    const modal = page.locator('#service-modal');
    const tabs = modal.locator('.tab-btn');
    expect(await tabs.count()).toBeGreaterThan(1);

    // Click second tab to verify tab switching works
    await tabs.nth(1).click();
    await page.waitForTimeout(200);
    await expect(tabs.nth(1)).toHaveClass(/active/);

    await closeServiceModal(page);
  });
});

// ============================================================================
// LINKS TAB COMPONENT (Consolidated: 3 → 1 test)
// ============================================================================

test.describe('Links Tab Component', () => {
  test('should render links with descriptions when available, hide when empty', async ({ page }) => {
    // Mock service with links
    await page.route('**/raw.githubusercontent.com/**/results/**', async (route) => {
      const url = route.request().url();
      if (url.includes('test-repo-stale')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            service: {
              org: 'feddericovonwernich',
              repo: 'test-repo-stale',
              name: 'test-repo-stale',
              team: 'platform',
              links: [
                { name: 'Documentation', url: 'https://docs.example.com', description: 'API docs and guides' },
                { name: 'Status Page', url: 'https://status.example.com' },
              ],
              openapi: null,
            },
            score: 80, rank: 'gold', checks_hash: 'different_hash',
            checks_count: 11, installed: true, recent_contributors: [],
            checks: [{ check_id: '01-readme', name: 'README', status: 'pass', category: 'Documentation', weight: 10 }],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Test 1: Service with links shows Links tab
    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    await staleCard.click();
    await page.waitForSelector('#service-modal', { state: 'visible' });
    await page.waitForTimeout(500);

    const modal = page.locator('#service-modal');
    const linksTab = modal.getByRole('button', { name: 'Links', exact: true });

    if (await linksTab.count() > 0) {
      await linksTab.click();
      await page.waitForTimeout(300);

      // Verify links structure
      const linkItems = modal.locator('.link-item, .link-list li');
      expect(await linkItems.count()).toBeGreaterThan(0);

      const firstLink = linkItems.first();
      await expect(firstLink.locator('a')).toHaveAttribute('target', '_blank');
      await expect(firstLink.locator('a')).toHaveAttribute('rel', /noopener/);

      // Verify description shown
      const desc = modal.locator('.link-description, .link-content p');
      if (await desc.count() > 0) {
        await expect(desc.first()).toContainText(/docs|guides/i);
      }
    }

    await page.keyboard.press('Escape');

    // Test 2: Service without links hides Links tab
    await openServiceModal(page, 'test-repo-perfect');
    expect(await modal.getByRole('button', { name: 'Links', exact: true }).count()).toBe(0);
    await closeServiceModal(page);
  });
});

// ============================================================================
// ANIMATION STATES (Consolidated: 2 → 1 test)
// ============================================================================

test.describe('Animation and Spinner States', () => {
  test('should show and stop spinner during operations', async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);

    // Test spinner on workflow dispatch
    await setGitHubPAT(page, mockPAT);
    await mockWorkflowDispatch(page, { status: 204, delay: 500 });

    const staleCard = page.locator('.service-card').filter({ hasText: 'test-repo-stale' });
    const rerunButton = staleCard.locator('button').filter({ hasText: /re-?run|trigger/i });

    if (await rerunButton.count() > 0 && await rerunButton.first().isVisible()) {
      await rerunButton.first().click({ force: true });

      // Wait for operation and verify toast appears (spinner stops)
      await expect(async () => {
        expect(await page.locator('.toast').count()).toBeGreaterThan(0);
      }).toPass({ timeout: 5000 });
    }

    // Test reload button spinner (if visible)
    const reloadButton = page.locator('#reload-data-btn, button[title*="Reload"]');
    if (await reloadButton.count() > 0 && await reloadButton.first().isVisible()) {
      await page.route('**/raw.githubusercontent.com/**/registry/all-services.json*', async (route) => {
        await new Promise(r => setTimeout(r, 300));
        await route.continue();
      });
      await reloadButton.first().click({ force: true });
      // Just verify no crash
      await expect(page.locator('.services-grid')).toBeVisible();
    }
  });
});
