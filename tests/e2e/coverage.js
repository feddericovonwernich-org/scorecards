/**
 * Playwright Coverage Collection Utilities
 *
 * This module provides fixtures to collect Istanbul coverage data from E2E tests.
 * Coverage is only collected when the COVERAGE env var is set to 'true'.
 *
 * Usage:
 *   Replace `import { test, expect } from '@playwright/test'`
 *   with    `import { test, expect } from './coverage.js'`
 *   in test files to auto-collect coverage.
 *
 * Or use the collectCoverage helper in existing tests.
 */

import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Coverage output directory
const COVERAGE_DIR = path.join(__dirname, '../../.nyc_output');

// Ensure coverage directory exists
function ensureCoverageDir() {
  if (!fs.existsSync(COVERAGE_DIR)) {
    fs.mkdirSync(COVERAGE_DIR, { recursive: true });
  }
}

// Generate unique coverage filename
function getCoverageFilename(testTitle = 'unknown') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const sanitized = testTitle.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
  return path.join(COVERAGE_DIR, `coverage-${sanitized}-${timestamp}-${random}.json`);
}

/**
 * Collect coverage from a page and save to .nyc_output
 * @param {import('@playwright/test').Page} page
 * @param {string} testTitle - Name of the test for the coverage file
 */
export async function collectCoverage(page, testTitle = 'test') {
  if (process.env.COVERAGE !== 'true') {
    return;
  }

  try {
    const coverage = await page.evaluate(() => {
      return window.__coverage__ || null;
    });

    if (coverage) {
      ensureCoverageDir();
      const filename = getCoverageFilename(testTitle);
      fs.writeFileSync(filename, JSON.stringify(coverage));
    }
  } catch {
    // Silently ignore coverage collection errors
  }
}

/**
 * Extended test fixture that collects coverage after each test
 */
const test = base.extend({
  // Auto-collect coverage after each test when COVERAGE is enabled
  page: async ({ page }, use, testInfo) => {
    await use(page);

    // Collect coverage after the test
    await collectCoverage(page, testInfo.title);
  },
});

export { test, expect };
