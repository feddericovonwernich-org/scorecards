/**
 * Checks Tab Component
 * Displays check results grouped by category
 */

import { useMemo } from 'react';
import type { CheckResult, CheckStatus } from '../../../../types/index.js';

interface ChecksTabProps {
  checks: CheckResult[];
}

// Category display order
const CATEGORY_ORDER = [
  'Scorecards Setup',
  'Documentation',
  'Testing & CI',
  'Configuration & Compliance',
  'Other',
];

/**
 * Get status icon for a check
 */
function getStatusIcon(status: CheckStatus): string {
  switch (status) {
  case 'pass':
    return '\u2713'; // checkmark
  case 'excluded':
    return '\u2298'; // circled slash
  default:
    return '\u2717'; // X
  }
}

/**
 * Group checks by category
 */
function groupChecksByCategory(
  checks: CheckResult[]
): Record<string, CheckResult[]> {
  const categories: Record<string, CheckResult[]> = {};

  checks.forEach((check) => {
    const category = check.category || 'Other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(check);
  });

  // Return in defined order
  const ordered: Record<string, CheckResult[]> = {};
  CATEGORY_ORDER.forEach((category) => {
    const matchingKey = Object.keys(categories).find(
      (key) => key.toLowerCase() === category.toLowerCase()
    );
    if (matchingKey) {
      ordered[category] = categories[matchingKey];
    }
  });

  return ordered;
}

/**
 * Single check result component
 */
function CheckItem({ check }: { check: CheckResult }) {
  const isExcluded = check.status === 'excluded';

  return (
    <div className={`check-result ${check.status}`}>
      <div className="check-name">
        {getStatusIcon(check.status)} {check.name}
      </div>
      {check.description && (
        <div className="check-description">{check.description}</div>
      )}
      {isExcluded && (
        <div className="check-excluded-notice">
          <em>Excluded from scoring</em>
        </div>
      )}
      {check.stdout && check.stdout.trim() && (
        <div className="check-output">
          <strong>Output:</strong>
          <br />
          {check.stdout.trim()}
        </div>
      )}
      {check.stderr && check.stderr.trim() && check.status === 'fail' && (
        <div className="check-output check-output-error">
          <strong>Error:</strong>
          <br />
          {check.stderr.trim()}
        </div>
      )}
      <div className="check-meta">
        Weight: {check.weight} | Duration: {check.duration}s
      </div>
    </div>
  );
}

/**
 * Check category component
 */
function CheckCategory({
  category,
  checks,
}: {
  category: string;
  checks: CheckResult[];
}) {
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const excludedCount = checks.filter((c) => c.status === 'excluded').length;
  const activeCount = checks.length - excludedCount;
  const allPassed = passCount === activeCount && activeCount > 0;

  return (
    <details className="check-category" open>
      <summary className="check-category-header">
        <span className="category-arrow">{'\u25BC'}</span>
        <span className="category-name">{category}</span>
        <span
          className={`category-stats ${allPassed ? 'all-passed' : 'has-failures'}`}
        >
          {passCount}/{activeCount} passed
          {excludedCount > 0 && (
            <span className="excluded-count"> ({excludedCount} excluded)</span>
          )}
        </span>
      </summary>
      <div className="check-category-content">
        {checks.map((check) => (
          <CheckItem key={check.check_id} check={check} />
        ))}
      </div>
    </details>
  );
}

/**
 * Checks Tab Component
 */
export function ChecksTab({ checks }: ChecksTabProps) {
  const categorizedChecks = useMemo(
    () => groupChecksByCategory(checks),
    [checks]
  );

  if (checks.length === 0) {
    return (
      <div className="tab-panel" id="checks-tab">
        <div className="empty-state">No check results available</div>
      </div>
    );
  }

  return (
    <div className="tab-panel" id="checks-tab">
      <div className="check-categories">
        {Object.entries(categorizedChecks).map(([category, categoryChecks]) => (
          <CheckCategory
            key={category}
            category={category}
            checks={categoryChecks}
          />
        ))}
      </div>
    </div>
  );
}

export default ChecksTab;
