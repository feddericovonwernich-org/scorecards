/**
 * Distribution Tab Component
 * Displays rank distribution for a team
 */

import type { RankName } from '../../../../types/index.js';

interface DistributionTabProps {
  rankDistribution: Record<string, number>;
  serviceCount: number;
}

const RANKS: RankName[] = ['platinum', 'gold', 'silver', 'bronze'];

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Distribution Tab Component
 */
export function DistributionTab({
  rankDistribution,
  serviceCount,
}: DistributionTabProps) {
  return (
    <div className="tab-panel" id="team-tab-distribution">
      <div className="rank-distribution-detail">
        {RANKS.map((rank) => {
          const count = rankDistribution[rank] || 0;
          const pct =
            serviceCount > 0 ? Math.round((count / serviceCount) * 100) : 0;

          return (
            <div key={rank} className="rank-dist-row">
              <span className="rank-dist-label">{capitalize(rank)}</span>
              <div className="rank-dist-bar-container">
                <div
                  className={`rank-dist-bar rank-${rank}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="rank-dist-count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DistributionTab;
