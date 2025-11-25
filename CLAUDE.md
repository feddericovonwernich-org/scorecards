# Scorecards - AI Context

## Documentation Guidelines

- Write concise, clear documentation
- Avoid repetition - apply DRY principle
- Reference existing docs rather than duplicating
- Assume mature technical audience

## Testing Guidelines

### Playwright E2E Tests

**IMPORTANT: Always run Playwright tests synchronously, never in background.**

When running Playwright tests:
- ✅ DO: Run tests synchronously without background flag
  ```bash
  npx playwright test --project=chromium
  npx playwright test tests/e2e/catalog.spec.js --project=chromium
  ```
- ❌ DON'T: Run tests in background or with `run_in_background: true`
- ❌ DON'T: Use commands like `npx playwright test 2>&1 &`

**Reason**: Playwright tests involve browser automation and timing-sensitive operations. Running them in background makes it difficult to track test progress, see failures in real-time, and properly handle test output.

## Frontend Code Guidelines

### Colors and Styling

**IMPORTANT: Never hardcode colors in JavaScript files.**

- ✅ DO: Use CSS variables via `getCssVar()` from `docs/src/utils/css.js`
  ```javascript
  import { getCssVar } from '../utils/css.js';
  button.style.background = getCssVar('--color-success');
  ```
- ✅ DO: Use existing CSS classes when possible
- ❌ DON'T: Hardcode hex colors like `#10b981` or `#ef4444`
- ❌ DON'T: Use inline styles with hardcoded values

**Available CSS variables** (see `docs/css/base/variables.css`):
- `--color-success`, `--color-error` - Status colors
- `--color-success-btn`, `--color-error-btn` - Button state colors
- `--color-copy-success`, `--color-copy-default` - Clipboard feedback colors
- `--color-link-btn`, `--color-link-btn-hover` - Link button colors
- `--color-text-muted`, `--color-text-secondary`, `--color-text-error` - Text colors

### Constants and Configuration

**IMPORTANT: Use centralized constants, never hardcode magic values.**

- ✅ DO: Import from `docs/src/config/constants.js`
  ```javascript
  import { TIMING, API_CONFIG, STORAGE_KEYS } from '../config/constants.js';
  setTimeout(callback, TIMING.BUTTON_FEEDBACK);
  fetch(`${API_CONFIG.GITHUB_BASE_URL}/repos/...?per_page=${API_CONFIG.PER_PAGE}`);
  localStorage.setItem(STORAGE_KEYS.WIDGET_POLL_INTERVAL, value);
  ```
- ❌ DON'T: Hardcode timeouts like `2000`, `3000`, `5000`
- ❌ DON'T: Hardcode API params like `per_page=25`
- ❌ DON'T: Hardcode localStorage keys as strings

### SVG Icons

**IMPORTANT: Use centralized icon definitions.**

- ✅ DO: Import from `docs/src/config/icons.js`
  ```javascript
  import { getIcon } from '../config/icons.js';
  const html = `<button>${getIcon('github')} View on GitHub</button>`;
  ```
- ❌ DON'T: Copy-paste SVG markup into template strings
- ❌ DON'T: Duplicate icon definitions across files

**Available icons**: `github`, `refresh`, `checkmark`, `xMark`, `externalLink`, `pullRequest`, `download`, `arrowLeft`, `arrowRight`

### Shared Utilities

**IMPORTANT: Use existing utilities instead of duplicating code.**

| Utility | Location | Use For |
|---------|----------|---------|
| `getCssVar(name)` | `utils/css.js` | Access CSS variables in JS |
| `startButtonSpin(btn)` | `utils/animation.js` | Add loading spinner to button |
| `stopButtonSpin(btn)` | `utils/animation.js` | Remove loading spinner |
| `countByRank(services)` | `utils/statistics.js` | Count services by rank |
| `calculateAverageScore(services)` | `utils/statistics.js` | Calculate average score |
| `startLiveDurationUpdates(selector)` | `utils/duration-tracker.js` | Live workflow duration updates |
| `fetchWorkflowRuns(org, repo)` | `api/github.js` | Fetch GitHub workflow runs |

### Module Structure

When adding new code, follow this structure:
- `docs/src/config/` - Constants, icons, configuration
- `docs/src/api/` - API integrations (GitHub, registry)
- `docs/src/ui/` - UI components and rendering
- `docs/src/services/` - Business logic (auth, theme, staleness)
- `docs/src/utils/` - Reusable utility functions
