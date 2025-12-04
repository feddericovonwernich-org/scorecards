/**
 * Check Adoption Tab Component
 * Displays check adoption rates for a team
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ServiceData, RankName, CheckMetadata } from '../../../../types/index.js';

interface CheckAdoptionTabProps {
  teamServices: ServiceData[];
  teamName?: string;
}

interface AdoptionStats {
  passing: number;
  failing: number;
  excluded?: number;
  total: number;
  activeTotal?: number;
  percentage: number;
  services: Array<{
    org: string;
    repo: string;
    name: string;
    score: number;
    rank: RankName;
    checkStatus?: 'pass' | 'fail' | 'excluded';
    exclusionReason?: string;
  }>;
}

/**
 * Check Adoption Tab Component
 */
export function CheckAdoptionTab({
  teamServices,
  teamName: _teamName,
}: CheckAdoptionTabProps) {
  const [checks, setChecks] = useState<CheckMetadata[]>([]);
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load checks metadata
  useEffect(() => {
    const loadChecks = async () => {
      setLoading(true);
      try {
        const { loadChecks: loadChecksApi } = await import(
          '../../../../api/checks.js'
        );
        const checksData = await loadChecksApi();
        setChecks(checksData.checks || []);
        if (checksData.checks?.length > 0 && !selectedCheckId) {
          setSelectedCheckId(checksData.checks[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load check data'
        );
      } finally {
        setLoading(false);
      }
    };

    loadChecks();
  }, [selectedCheckId]);

  // Calculate adoption stats for selected check
  const stats = useMemo((): AdoptionStats | null => {
    if (!selectedCheckId || teamServices.length === 0) {
      return null;
    }

    const services = teamServices.map((s) => {
      const checkResult = s.check_results?.[selectedCheckId];
      const excluded = s.excluded_checks?.find(
        (e) => e.check === selectedCheckId
      );

      return {
        org: s.org,
        repo: s.repo,
        name: s.name,
        score: s.score,
        rank: s.rank,
        checkStatus: excluded
          ? ('excluded' as const)
          : checkResult === 'pass'
            ? ('pass' as const)
            : ('fail' as const),
        exclusionReason: excluded?.reason,
      };
    });

    const passing = services.filter((s) => s.checkStatus === 'pass').length;
    const failing = services.filter((s) => s.checkStatus === 'fail').length;
    const excluded = services.filter((s) => s.checkStatus === 'excluded').length;
    const activeTotal = passing + failing;
    const percentage =
      activeTotal > 0 ? Math.round((passing / activeTotal) * 100) : 0;

    return {
      passing,
      failing,
      excluded,
      total: services.length,
      activeTotal,
      percentage,
      services,
    };
  }, [selectedCheckId, teamServices]);

  // Handle check selection
  const handleSelectCheck = useCallback((checkId: string) => {
    setSelectedCheckId(checkId);
    setDropdownOpen(false);
  }, []);

  // Handle service click
  const handleServiceClick = useCallback((org: string, repo: string) => {
    window.showServiceDetail?.(org, repo);
  }, []);

  // Filter checks by search
  const filteredChecks = useMemo(() => {
    if (!searchQuery) {return checks;}
    const query = searchQuery.toLowerCase();
    return checks.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [checks, searchQuery]);

  // Selected check info
  const selectedCheck = checks.find((c) => c.id === selectedCheckId);

  if (loading) {
    return (
      <div className="tab-panel" id="team-tab-adoption">
        <div className="check-adoption-loading">
          <span className="loading-spinner" /> Loading check data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tab-panel" id="team-tab-adoption">
        <div className="empty-state">{error}</div>
      </div>
    );
  }

  if (checks.length === 0) {
    return (
      <div className="tab-panel" id="team-tab-adoption">
        <div className="empty-state">No check metadata available</div>
      </div>
    );
  }

  const passingServices =
    stats?.services.filter((s) => s.checkStatus === 'pass') || [];
  const failingServices =
    stats?.services.filter((s) => s.checkStatus === 'fail') || [];
  const excludedServices =
    stats?.services.filter((s) => s.checkStatus === 'excluded') || [];

  return (
    <div className="tab-panel" id="team-tab-adoption">
      <div className="check-adoption-content">
        {/* Check selector */}
        <div className="check-selector">
          <label>Select Check:</label>
          <div className="check-selector-dropdown">
            <button
              className="check-selector-toggle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="check-selector-text">
                {selectedCheck?.name || 'Select a check'}
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.427 7.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="check-selector-menu open">
                <div className="check-selector-search">
                  <input
                    type="text"
                    placeholder="Search checks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="check-selector-options">
                  {filteredChecks.map((check) => (
                    <div
                      key={check.id}
                      className={`check-selector-option ${check.id === selectedCheckId ? 'selected' : ''}`}
                      onClick={() => handleSelectCheck(check.id)}
                    >
                      {check.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Check description */}
        {selectedCheck?.description && (
          <div className="check-info">
            <p className="check-description">{selectedCheck.description}</p>
          </div>
        )}

        {/* Adoption progress */}
        {stats && (
          <div className="adoption-progress">
            <div className="progress-header">
              <span className="progress-label">Adoption Rate</span>
              <span className="progress-value">
                {stats.percentage}% ({stats.passing}/{stats.activeTotal} active)
                {excludedServices.length > 0 && (
                  <span className="excluded-note">
                    {excludedServices.length} excluded
                  </span>
                )}
              </span>
            </div>
            <div className="progress-bar-large">
              <div
                className={`progress-fill ${stats.percentage >= 80 ? 'high' : stats.percentage >= 50 ? 'medium' : 'low'}`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Service lists */}
        <div
          className={`adoption-lists ${excludedServices.length > 0 ? 'three-columns' : ''}`}
        >
          <div className="adoption-column passing">
            <h4>Passing ({passingServices.length})</h4>
            <div className="adoption-service-list">
              {passingServices.length === 0 ? (
                <div className="empty-list">No passing services</div>
              ) : (
                passingServices.map((s) => (
                  <div
                    key={`${s.org}/${s.repo}`}
                    className="adoption-service-item passing"
                    onClick={() => handleServiceClick(s.org, s.repo)}
                  >
                    <span className="service-name">{s.name}</span>
                    <span className={`service-score rank-${s.rank}`}>
                      {Math.round(s.score)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="adoption-column failing">
            <h4>Failing ({failingServices.length})</h4>
            <div className="adoption-service-list">
              {failingServices.length === 0 ? (
                <div className="empty-list">No failing services</div>
              ) : (
                failingServices.map((s) => (
                  <div
                    key={`${s.org}/${s.repo}`}
                    className="adoption-service-item failing"
                    onClick={() => handleServiceClick(s.org, s.repo)}
                  >
                    <span className="service-name">{s.name}</span>
                    <span className={`service-score rank-${s.rank}`}>
                      {Math.round(s.score)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {excludedServices.length > 0 && (
            <div className="adoption-column excluded">
              <h4>Excluded ({excludedServices.length})</h4>
              <div className="adoption-service-list excluded-list">
                {excludedServices.map((s) => (
                  <div
                    key={`${s.org}/${s.repo}`}
                    className="adoption-service-item excluded"
                    onClick={() => handleServiceClick(s.org, s.repo)}
                  >
                    <span className="service-name">{s.name}</span>
                    <span
                      className="exclusion-reason"
                      title={s.exclusionReason || 'Excluded'}
                    >
                      {s.exclusionReason || 'Excluded'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckAdoptionTab;
