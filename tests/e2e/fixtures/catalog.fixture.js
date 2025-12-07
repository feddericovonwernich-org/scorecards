/**
 * Shared Playwright Fixtures for Scorecards Catalog Tests
 *
 * These fixtures provide pre-configured page states to reduce test setup boilerplate.
 * Import from this file instead of coverage.js when you need fixtures.
 *
 * Available fixtures:
 * - catalogPage: Page with catalog loaded (mockCatalogRequests + goto + waitForCatalogLoad)
 * - serviceModalPage: catalogPage with test-repo-perfect service modal open
 * - teamsViewPage: catalogPage switched to teams view
 * - teamModalPage: teamsViewPage with platform team modal open
 *
 * Usage:
 *   import { test, expect } from './fixtures/catalog.fixture.js';
 *
 *   test('my test', async ({ catalogPage }) => {
 *     // catalogPage is already loaded and ready
 *   });
 */

import { test as base, expect } from '../coverage.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  openServiceModal,
  openTeamModal,
  switchToTeamsView,
} from '../test-helper.js';

/**
 * Extended test fixture with pre-configured page states
 */
const test = base.extend({
  /**
   * Page with catalog loaded (replaces beforeEach boilerplate)
   */
  catalogPage: async ({ page }, use) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
    await use(page);
  },

  /**
   * Page with service modal already open (test-repo-perfect)
   */
  serviceModalPage: async ({ catalogPage }, use) => {
    await openServiceModal(catalogPage, 'test-repo-perfect');
    await use(catalogPage);
  },

  /**
   * Page switched to teams view
   */
  teamsViewPage: async ({ catalogPage }, use) => {
    await switchToTeamsView(catalogPage);
    await use(catalogPage);
  },

  /**
   * Page with team modal already open (platform team)
   */
  teamModalPage: async ({ catalogPage }, use) => {
    // openTeamModal already switches to teams view
    await openTeamModal(catalogPage, 'platform');
    await use(catalogPage);
  },
});

export { test, expect };
