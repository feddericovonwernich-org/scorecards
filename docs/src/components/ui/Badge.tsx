/**
 * Badge Components
 *
 * Reusable badge components for displaying ranks and status indicators.
 */

export type RankType = 'platinum' | 'gold' | 'silver' | 'bronze';
export type UtilityBadgeType = 'api' | 'stale' | 'installed';

// Utility to capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * RankBadge - Full rank badge (e.g., "PLATINUM", "GOLD")
 */
interface RankBadgeProps {
  rank: RankType;
  className?: string;
  isModalHeader?: boolean;
}

export function RankBadge({ rank, className = '', isModalHeader = false }: RankBadgeProps) {
  const classes = [
    'rank-badge',
    rank,
    isModalHeader ? 'modal-header-badge' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {capitalize(rank)}
    </div>
  );
}

/**
 * MiniRankBadge - Small badge showing count for a rank
 */
interface MiniRankBadgeProps {
  rank: RankType;
  count: number;
  className?: string;
}

export function MiniRankBadge({ rank, count, className = '' }: MiniRankBadgeProps) {
  const classes = [
    'mini-rank-badge',
    `rank-${rank}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {count}
    </span>
  );
}

/**
 * RankBadgeGroup - Renders mini badges for all ranks with counts > 0
 */
interface RankBadgeGroupProps {
  distribution: Record<RankType, number>;
  className?: string;
}

export function RankBadgeGroup({ distribution, className = '' }: RankBadgeGroupProps) {
  const ranks: RankType[] = ['platinum', 'gold', 'silver', 'bronze'];
  const visibleRanks = ranks.filter((r) => distribution[r] > 0);

  if (visibleRanks.length === 0) {
    return <MiniRankBadge rank="bronze" count={0} />;
  }

  return (
    <div className={`team-card-ranks ${className}`}>
      {visibleRanks.map((rank) => (
        <MiniRankBadge key={rank} rank={rank} count={distribution[rank]} />
      ))}
    </div>
  );
}

/**
 * UtilityBadge - API, Stale, Installed badges
 */
interface UtilityBadgeProps {
  type: UtilityBadgeType;
  className?: string;
}

const UTILITY_BADGE_LABELS: Record<UtilityBadgeType, string> = {
  api: 'API',
  stale: 'STALE',
  installed: 'INSTALLED',
};

export function UtilityBadge({ type, className = '' }: UtilityBadgeProps) {
  const classes = [
    `badge-${type}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {UTILITY_BADGE_LABELS[type]}
    </span>
  );
}

/**
 * ServiceBadges - Container for utility badges on service cards
 */
interface ServiceBadgesProps {
  hasApi?: boolean;
  isStale?: boolean;
  isInstalled?: boolean;
  className?: string;
}

export function ServiceBadges({
  hasApi = false,
  isStale = false,
  isInstalled = false,
  className = '',
}: ServiceBadgesProps) {
  const hasBadges = hasApi || isStale || isInstalled;

  if (!hasBadges) {
    return null;
  }

  return (
    <div className={`service-badges ${className}`}>
      {hasApi && <UtilityBadge type="api" />}
      {isStale && <UtilityBadge type="stale" />}
      {isInstalled && <UtilityBadge type="installed" />}
    </div>
  );
}

/**
 * ScoreBadge - Displays numeric score
 */
interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className = '' }: ScoreBadgeProps) {
  return (
    <div className={`score-badge ${className}`}>
      {score}
    </div>
  );
}
