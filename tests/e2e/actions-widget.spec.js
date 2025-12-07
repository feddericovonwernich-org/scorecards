/**
 * Actions Widget E2E Tests
 * Tests for the GitHub Actions workflow monitoring sidebar widget
 */

import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  setGitHubPAT,
} from './test-helper.js';

// Mock workflow runs data
const mockWorkflowRunsData = {
  total_count: 5,
  workflow_runs: [
    {
      id: 1,
      name: 'Scorecards Workflow',
      status: 'completed',
      conclusion: 'success',
      html_url: 'https://github.com/test/repo/actions/runs/1',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      run_started_at: new Date(Date.now() - 3660000).toISOString(),
    },
    {
      id: 2,
      name: 'Scorecards Workflow',
      status: 'completed',
      conclusion: 'failure',
      html_url: 'https://github.com/test/repo/actions/runs/2',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
      run_started_at: new Date(Date.now() - 7260000).toISOString(),
    },
    {
      id: 3,
      name: 'Scorecards Workflow',
      status: 'in_progress',
      conclusion: null,
      html_url: 'https://github.com/test/repo/actions/runs/3',
      created_at: new Date(Date.now() - 300000).toISOString(),
      updated_at: new Date(Date.now() - 300000).toISOString(),
      run_started_at: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 4,
      name: 'Scorecards Workflow',
      status: 'queued',
      conclusion: null,
      html_url: 'https://github.com/test/repo/actions/runs/4',
      created_at: new Date(Date.now() - 60000).toISOString(),
      updated_at: new Date(Date.now() - 60000).toISOString(),
      run_started_at: null,
    },
    {
      id: 5,
      name: 'Scorecards Workflow',
      status: 'completed',
      conclusion: 'cancelled',
      html_url: 'https://github.com/test/repo/actions/runs/5',
      created_at: new Date(Date.now() - 10800000).toISOString(),
      updated_at: new Date(Date.now() - 10800000).toISOString(),
      run_started_at: new Date(Date.now() - 10860000).toISOString(),
    },
  ],
};

async function mockWorkflowRuns(page, { runs = mockWorkflowRunsData, status = 200 } = {}) {
  await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
    const headers = route.request().headers();
    const hasAuth = headers['authorization'] && headers['authorization'].startsWith('token ');

    if (!hasAuth) {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ message: 'Requires authentication' }),
        headers: { 'Content-Type': 'application/json' },
      });
      return;
    }

    await route.fulfill({
      status: status,
      body: JSON.stringify(runs),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

// Selector for React widget (excludes the HTML-based widget with id="widget-sidebar")
const REACT_WIDGET_SELECTOR = '.widget-sidebar:not(#widget-sidebar)';
const REACT_WIDGET_OPEN_SELECTOR = '.widget-sidebar.open:not(#widget-sidebar)';

async function openActionsWidget(page) {
  await page.getByRole('button', { name: 'Show GitHub Actions' }).click();
  await page.waitForSelector(REACT_WIDGET_OPEN_SELECTOR, { state: 'visible', timeout: 5000 });
}

// ============================================================================
// OPENING AND CLOSING
// ============================================================================

test.describe('Actions Widget - Opening and Closing', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should open widget and display header with GitHub Actions link', async ({ page }) => {
    // Verify button exists
    const actionsButton = page.getByRole('button', { name: 'Show GitHub Actions' });
    await expect(actionsButton).toBeVisible();

    // Open widget
    await openActionsWidget(page);

    const sidebar = page.locator(REACT_WIDGET_OPEN_SELECTOR);
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText('GitHub Actions');

    // Verify header link
    const link = page.locator(`${REACT_WIDGET_SELECTOR} .widget-header-link`);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /github\.com.*actions/);
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('should close widget via close button and backdrop', async ({ page }) => {
    await openActionsWidget(page);

    // Close via button
    await page.locator(`${REACT_WIDGET_SELECTOR} button[aria-label="Close widget"]`).click();
    await page.waitForSelector(REACT_WIDGET_OPEN_SELECTOR, { state: 'hidden' });
    await expect(page.locator(REACT_WIDGET_OPEN_SELECTOR)).not.toBeVisible();

    // Reopen and close via backdrop
    await openActionsWidget(page);
    await page.locator('.widget-backdrop').click();
    await expect(page.locator(REACT_WIDGET_OPEN_SELECTOR)).not.toBeVisible();
  });
});

// ============================================================================
// AUTHENTICATION REQUIRED
// ============================================================================

test.describe('Actions Widget - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show PAT required message and Configure Token button', async ({ page }) => {
    await openActionsWidget(page);

    const widgetContent = page.locator(`${REACT_WIDGET_SELECTOR} .widget-content`);
    await expect(widgetContent).toBeVisible();
    await expect(widgetContent).toContainText('Configure GitHub PAT');

    const configureButton = page.locator(`${REACT_WIDGET_SELECTOR} .btn--primary`);
    await expect(configureButton).toBeVisible();
    await expect(configureButton).toContainText('Configure Token');

    // Clicking Configure Token should close widget
    await configureButton.click();
    await expect(page.locator(REACT_WIDGET_OPEN_SELECTOR)).not.toBeVisible();
  });
});

// ============================================================================
// WITH AUTHENTICATION - WORKFLOW DISPLAY
// ============================================================================

test.describe('Actions Widget - Workflow Display', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await setGitHubPAT(page, mockPAT);
  });

  test('should display workflow runs with correct status icons', async ({ page }) => {
    await openActionsWidget(page);
    await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

    // Verify count
    const runItems = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item`);
    await expect(runItems).toHaveCount(5);

    // Verify all status types
    await expect(page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item--success`)).toBeVisible();
    await expect(page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item--failure`)).toBeVisible();
    await expect(page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item--in_progress`)).toBeVisible();
    await expect(page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item--queued`)).toBeVisible();
  });

  test('should display workflow run details with name, link, and duration', async ({ page }) => {
    await openActionsWidget(page);
    await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

    const firstRun = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item`).first();

    // Verify name
    await expect(firstRun.locator('.widget-run-name')).toContainText('Scorecards Workflow');

    // Verify link
    const viewLink = firstRun.locator('.widget-run-link');
    await expect(viewLink).toBeVisible();
    await expect(viewLink).toHaveAttribute('href', /github\.com.*actions\/runs/);

    // Verify duration/timestamp
    const durationText = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-duration`).first();
    await expect(durationText).toBeVisible();
    await expect(durationText).toContainText(/Completed|Running for|Queued/);
  });
});

// ============================================================================
// STATUS FILTERING
// ============================================================================

test.describe('Actions Widget - Status Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await setGitHubPAT(page, mockPAT);
  });

  test('should show filter buttons with counts and active state', async ({ page }) => {
    await openActionsWidget(page);
    await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

    const filters = page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters`);
    await expect(filters).toBeVisible();

    // Verify all filter buttons
    const filterNames = ['All', 'Running', 'Queued', 'Done'];
    for (const name of filterNames) {
      await expect(filters.locator('.filter-btn').filter({ hasText: name })).toBeVisible();
    }

    // Verify All is active by default
    const allFilter = filters.locator('.filter-btn').filter({ hasText: 'All' });
    await expect(allFilter).toHaveClass(/filter-btn--active/);

    // Verify counts
    await expect(allFilter.locator('.filter-btn__count')).toContainText('(5)');
    await expect(filters.locator('.filter-btn').filter({ hasText: 'Running' }).locator('.filter-btn__count')).toContainText('(1)');
    await expect(filters.locator('.filter-btn').filter({ hasText: 'Queued' }).locator('.filter-btn__count')).toContainText('(1)');
    await expect(filters.locator('.filter-btn').filter({ hasText: 'Done' }).locator('.filter-btn__count')).toContainText('(3)');
  });

  test('should filter workflows by status', async ({ page }) => {
    await openActionsWidget(page);
    await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

    const filters = [
      { name: 'Running', count: 1, statusClass: '.widget-run-item--in_progress' },
      { name: 'Queued', count: 1, statusClass: '.widget-run-item--queued' },
      { name: 'Done', count: 3, statusClass: null },
    ];

    for (const filter of filters) {
      const filterBtn = page.locator(`${REACT_WIDGET_SELECTOR} .widget-filters .filter-btn`).filter({ hasText: filter.name });
      await filterBtn.click();

      // Verify active styling
      await expect(filterBtn).toHaveClass(/filter-btn--active/);

      // Verify count
      const runItems = page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item`);
      await expect(runItems).toHaveCount(filter.count);

      // Verify status item if specific status
      if (filter.statusClass) {
        await expect(page.locator(`${REACT_WIDGET_SELECTOR} ${filter.statusClass}`)).toBeVisible();
      }
    }
  });
});

// ============================================================================
// POLLING INTERVAL
// ============================================================================

test.describe('Actions Widget - Polling Interval', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await setGitHubPAT(page, mockPAT);
  });

  test('should show polling interval dropdown with options', async ({ page }) => {
    await openActionsWidget(page);

    const intervalSelect = page.locator(`${REACT_WIDGET_SELECTOR} select[aria-label="Refresh interval"]`);
    await expect(intervalSelect).toBeVisible();

    // Verify default value
    await expect(intervalSelect).toHaveValue('30000');

    // Verify options
    await expect(intervalSelect.locator('option')).toHaveCount(8);
    await expect(intervalSelect.locator('option[value="0"]')).toHaveText('Disabled');
    await expect(intervalSelect.locator('option[value="5000"]')).toHaveText('5s');
    await expect(intervalSelect.locator('option[value="30000"]')).toHaveText('30s');
    await expect(intervalSelect.locator('option[value="60000"]')).toHaveText('1m');

    // Verify status bar shows auto-refresh by default
    const statusBar = page.locator(`${REACT_WIDGET_SELECTOR} .widget-status-bar`);
    await expect(statusBar).toBeVisible();
    await expect(statusBar).toContainText('Auto-refreshing');
  });

  test('should update status bar when polling is disabled', async ({ page }) => {
    await openActionsWidget(page);

    const intervalSelect = page.locator(`${REACT_WIDGET_SELECTOR} select[aria-label="Refresh interval"]`);
    await intervalSelect.selectOption('0');

    const statusBar = page.locator(`${REACT_WIDGET_SELECTOR} .widget-status-bar`);
    await expect(statusBar).toContainText('Auto-refresh disabled');
  });
});

// ============================================================================
// REFRESH BUTTON
// ============================================================================

test.describe('Actions Widget - Refresh', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await mockWorkflowRuns(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await setGitHubPAT(page, mockPAT);
  });

  test('should have refresh button that refreshes data', async ({ page }) => {
    await openActionsWidget(page);
    await page.waitForSelector(`${REACT_WIDGET_SELECTOR} .widget-run-item`, { state: 'visible', timeout: 5000 });

    const refreshButton = page.locator(`${REACT_WIDGET_SELECTOR} button[title="Refresh now"]`);
    await expect(refreshButton).toBeVisible();

    await refreshButton.click();

    // Items should still be visible after refresh
    await expect(page.locator(`${REACT_WIDGET_SELECTOR} .widget-run-item`).first()).toBeVisible();
  });
});

// ============================================================================
// EMPTY AND ERROR STATES
// ============================================================================

test.describe('Actions Widget - Empty and Error States', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test('should show empty state when no workflow runs', async ({ page }) => {
    await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ total_count: 0, workflow_runs: [] }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await setGitHubPAT(page, mockPAT);
    await openActionsWidget(page);

    const widgetContent = page.locator(`${REACT_WIDGET_SELECTOR} .widget-content`);
    await expect(widgetContent).toBeVisible();
    await expect(widgetContent).toContainText('No');
    await expect(widgetContent).toContainText('workflow runs');
  });

  test('should show error state on API failure', async ({ page }) => {
    await page.route('**/api.github.com/repos/**/actions/runs*', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Internal Server Error' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await setGitHubPAT(page, mockPAT);
    await openActionsWidget(page);

    const errorState = page.locator(`${REACT_WIDGET_SELECTOR} .widget-empty--error`);
    await expect(errorState).toBeVisible();
    await expect(errorState).toContainText('Error');
  });
});
