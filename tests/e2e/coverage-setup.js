/**
 * Playwright Global Setup for Coverage Collection
 *
 * Cleans the .nyc_output directory before tests run.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COVERAGE_DIR = path.join(__dirname, '../../.nyc_output');

export default async function globalSetup() {
  // Clean coverage directory
  if (fs.existsSync(COVERAGE_DIR)) {
    fs.rmSync(COVERAGE_DIR, { recursive: true });
  }
  fs.mkdirSync(COVERAGE_DIR, { recursive: true });

  console.log('Coverage: Cleaned .nyc_output directory');
}
