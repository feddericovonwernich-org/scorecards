/**
 * Services Tab Component
 * Displays list of services belonging to a team
 */

import type { ServiceData } from '../../../../types/index.js';

interface ServicesTabProps {
  services: ServiceData[];
  onServiceClick: (org: string, repo: string) => void;
}

/**
 * Services Tab Component
 */
export function ServicesTab({ services, onServiceClick }: ServicesTabProps) {
  if (!services || services.length === 0) {
    return (
      <div className="tab-panel" id="team-tab-services">
        <div className="empty-state">No services in this team</div>
      </div>
    );
  }

  return (
    <div className="tab-panel" id="team-tab-services">
      <div className="team-services-list">
        {services.map((service) => {
          const score =
            service.score !== null && service.score !== undefined
              ? Math.round(service.score)
              : '-';
          const rankClass = service.rank ? `rank-${service.rank}` : '';

          return (
            <div
              key={`${service.org}/${service.repo}`}
              className="team-service-item"
              onClick={() => onServiceClick(service.org, service.repo)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onServiceClick(service.org, service.repo);
                }
              }}
            >
              <span className="service-name">{service.repo}</span>
              <span className={`service-score ${rankClass}`}>{score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ServicesTab;
