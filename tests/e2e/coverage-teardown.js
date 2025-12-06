/**
 * Playwright Global Teardown for Coverage Collection
 *
 * Generates coverage reports using nyc after tests complete.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COVERAGE_DIR = path.join(__dirname, '../../.nyc_output');
const PROJECT_ROOT = path.join(__dirname, '../../');

export default async function globalTeardown() {
  // Check if any coverage files were collected
  if (!fs.existsSync(COVERAGE_DIR)) {
    console.log('Coverage: No coverage data collected');
    return;
  }

  const files = fs.readdirSync(COVERAGE_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('Coverage: No coverage files found');
    return;
  }

  console.log(`Coverage: Found ${files.length} coverage file(s)`);

  try {
    // Generate coverage reports using nyc
    execSync('npx nyc report --reporter=text --reporter=html --reporter=lcov', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
    console.log('Coverage: Reports generated in coverage/');
  } catch (error) {
    console.error('Coverage: Failed to generate reports', error.message);
  }
}
