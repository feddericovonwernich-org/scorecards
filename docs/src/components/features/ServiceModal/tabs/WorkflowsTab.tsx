/**
 * Workflows Tab Component
 * Displays workflow runs for a service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WorkflowRun } from '../../../../types/index.js';

interface WorkflowsTabProps {
  org: string;
  repo: string;
  runs: WorkflowRun[];
  onRunsUpdate: (runs: WorkflowRun[]) => void;
}

type FilterStatus = 'all' | 'in_progress' | 'queued' | 'completed';

const POLLING_INTERVALS = [
  { value: 5000, label: '5s' },
  { value: 10000, label: '10s' },
  { value: 15000, label: '15s' },
  { value: 30000, label: '30s' },
  { value: 60000, label: '1m' },
  { value: 120000, label: '2m' },
  { value: 300000, label: '5m' },
  { value: 0, label: 'Off' },
];

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {return 'just now';}
  if (diffMins < 60) {return `${diffMins}m ago`;}
  if (diffHours < 24) {return `${diffHours}h ago`;}
  return `${diffDays}d ago`;
}

/**
 * Get status badge class
 */
function getStatusClass(status: string, conclusion: string | null): string {
  if (status === 'completed') {
    return conclusion === 'success' ? 'success' : 'failure';
  }
  return status;
}

/**
 * Workflow run item component
 */
function WorkflowRunItem({ run }: { run: WorkflowRun }) {
  const statusClass = getStatusClass(run.status, run.conclusion);

  return (
    <div className={`workflow-run-item ${statusClass}`}>
      <div className="workflow-run-header">
        <span className={`workflow-status-badge ${statusClass}`}>
          {run.status === 'completed' ? run.conclusion : run.status}
        </span>
        <span className="workflow-run-name">{run.name}</span>
      </div>
      <div className="workflow-run-meta">
        <span className="workflow-run-time">
          {formatRelativeTime(run.created_at)}
        </span>
        {run.head_branch && (
          <span className="workflow-run-branch">{run.head_branch}</span>
        )}
      </div>
      <div className="workflow-run-actions">
        <a
          href={run.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="workflow-run-link"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
}

/**
 * Workflows Tab Component
 */
export function WorkflowsTab({
  org,
  repo,
  runs,
  onRunsUpdate,
}: WorkflowsTabProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [pollingInterval, setPollingInterval] = useState(30000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch workflow runs
  const fetchRuns = useCallback(async () => {
    if (!org || !repo) {return;}

    setLoading(true);
    setError(null);

    try {
      const { fetchWorkflowRuns } = await import('../../../../api/github.js');
      const workflowRuns = await fetchWorkflowRuns(org, repo);
      onRunsUpdate(workflowRuns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, [org, repo, onRunsUpdate]);

  // Initial fetch
  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Polling
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (pollingInterval > 0) {
      pollIntervalRef.current = setInterval(fetchRuns, pollingInterval);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pollingInterval, fetchRuns]);

  // Filter runs
  const filteredRuns = runs.filter((run) => {
    if (filter === 'all') {return true;}
    return run.status === filter;
  });

  // Count by status
  const counts = {
    all: runs.length,
    in_progress: runs.filter((r) => r.status === 'in_progress').length,
    queued: runs.filter((r) => r.status === 'queued').length,
    completed: runs.filter((r) => r.status === 'completed').length,
  };

  return (
    <div className="tab-panel" id="workflows-tab">
      {/* Filter buttons and controls */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
          }}
        >
          <div className="widget-filters" style={{ margin: 0 }}>
            {(['all', 'in_progress', 'queued', 'completed'] as FilterStatus[]).map(
              (status) => (
                <button
                  key={status}
                  className={`widget-filter-btn ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status === 'all'
                    ? 'All'
                    : status === 'in_progress'
                      ? 'In Progress'
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="filter-count">{counts[status]}</span>
                </button>
              )
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="widget-interval-select"
              value={pollingInterval}
              onChange={(e) => setPollingInterval(Number(e.target.value))}
              title="Auto-refresh interval"
            >
              {POLLING_INTERVALS.map((interval) => (
                <option key={interval.value} value={interval.value}>
                  {interval.label}
                </option>
              ))}
            </select>
            <button
              className="widget-refresh-btn"
              onClick={fetchRuns}
              title="Refresh"
              style={{ padding: '6px 10px' }}
              disabled={loading}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div id="service-workflows-content">
        {loading && runs.length === 0 && (
          <div className="loading">Loading workflow runs...</div>
        )}
        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchRuns} className="btn-primary">
              Try Again
            </button>
          </div>
        )}
        {!loading && !error && filteredRuns.length === 0 && (
          <div className="empty-state">No workflow runs found</div>
        )}
        {filteredRuns.length > 0 && (
          <div className="workflow-runs-list">
            {filteredRuns.map((run) => (
              <WorkflowRunItem key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkflowsTab;
