/**
 * StatCard Component
 *
 * Displays a statistic with value and label.
 * Supports filterable cards that can be clicked to filter data.
 */

import type { RankType } from './Badge.js';

export type FilterType = RankType | 'has-api' | 'stale' | 'installed';
export type FilterState = 'include' | 'exclude' | null;

interface StatCardProps {
  /** The statistic value to display */
  value: number | string;
  /** The label describing the statistic */
  label: string;
  /** Whether this card is filterable (clickable) */
  filterable?: boolean;
  /** The filter type for this card */
  filterType?: FilterType;
  /** Current filter state */
  filterState?: FilterState;
  /** Click handler for filterable cards */
  onClick?: (filterType: FilterType) => void;
  /** Additional CSS classes */
  className?: string;
  /** Element ID for DOM reference */
  id?: string;
}

// Map filter types to CSS class prefixes
function getFilterClass(filterType: FilterType): string {
  switch (filterType) {
  case 'platinum':
  case 'gold':
  case 'silver':
  case 'bronze':
    return `rank-${filterType}`;
  case 'has-api':
    return 'filter-api';
  case 'stale':
    return 'filter-stale';
  case 'installed':
    return 'filter-installed';
  default:
    return '';
  }
}

export function StatCard({
  value,
  label,
  filterable = false,
  filterType,
  filterState = null,
  onClick,
  className = '',
  id,
}: StatCardProps) {
  const handleClick = () => {
    if (filterable && filterType && onClick) {
      onClick(filterType);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filterable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  const classes = [
    'stat-card',
    filterable ? 'filterable' : 'non-filterable',
    filterType ? getFilterClass(filterType) : '',
    filterState === 'include' ? 'active' : '',
    filterState === 'exclude' ? 'exclude' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={filterable ? 'button' : undefined}
      tabIndex={filterable ? 0 : undefined}
      data-filter={filterType}
      id={id}
    >
      <div className="stat-value" id={id ? `${id}-value` : undefined}>
        {value}
      </div>
      <div className="stat-label">
        {label}
      </div>
    </div>
  );
}

/**
 * StatCardGroup - Container for multiple stat cards
 */
interface StatCardGroupProps {
  children: React.ReactNode;
  className?: string;
  view?: 'services' | 'teams';
}

export function StatCardGroup({ children, className = '', view = 'services' }: StatCardGroupProps) {
  const viewClass = view === 'teams' ? 'teams-stats' : 'services-stats';

  return (
    <section className={`stats ${viewClass} ${className}`}>
      {children}
    </section>
  );
}
