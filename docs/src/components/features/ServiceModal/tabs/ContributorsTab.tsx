/**
 * Contributors Tab Component
 * Displays recent contributors to the service
 */

import { useMemo } from 'react';
import type { Contributor } from '../../../../types/index.js';

interface ContributorsTabProps {
  contributors: Contributor[];
}

/**
 * Simple MD5 hash for Gravatar
 * This is a basic implementation for avatar URLs
 */
function md5(str: string): string {
  // Use a simple hash for demo - in production, import from utils/crypto
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Contributor item component
 */
function ContributorItem({ contributor }: { contributor: Contributor }) {
  const emailHash = useMemo(
    () => md5(contributor.email.toLowerCase().trim()),
    [contributor.email]
  );
  const avatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=48`;

  const githubUsername = contributor.email
    .split('@')[0]
    .replace(/[^a-zA-Z0-9-]/g, '');
  const isGithubEmail =
    contributor.email.includes('github') ||
    contributor.email.includes('users.noreply.github.com');

  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=48';
  };

  return (
    <div className="contributor-item">
      <img
        src={avatarUrl}
        alt={contributor.name}
        className="contributor-avatar"
        onError={handleAvatarError}
      />
      <div className="contributor-info">
        <div className="contributor-name">
          <strong>{contributor.name}</strong>
          {isGithubEmail && (
            <a
              href={`https://github.com/${githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="contributor-github-link"
              title="View GitHub profile"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          )}
        </div>
        <div className="contributor-email">{contributor.email}</div>
        <div className="contributor-meta">
          <span
            className="contributor-commits"
            title={`${contributor.commit_count} commit${contributor.commit_count !== 1 ? 's' : ''}`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{ verticalAlign: 'middle', marginRight: 4 }}
            >
              <path d="M1.643 3.143.427 1.927A.25.25 0 0 1 .604 1.5h6.792a.25.25 0 0 1 .177.427L6.357 3.143a.25.25 0 0 1-.177.073H1.82a.25.25 0 0 1-.177-.073ZM2.976 7.5A2.5 2.5 0 0 1 0 7.5v-2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v2a2.5 2.5 0 0 1-2.024 0Zm1.524-.5h-3v.25a1.5 1.5 0 0 0 3 0V7ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
            </svg>
            {contributor.commit_count} commit
            {contributor.commit_count !== 1 ? 's' : ''}
          </span>
          <span
            className="contributor-date"
            title={new Date(contributor.last_commit_date).toLocaleString()}
          >
            Last commit: {formatDate(contributor.last_commit_date)}
          </span>
          <span className="contributor-hash">
            <code>{contributor.last_commit_hash}</code>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Contributors Tab Component
 */
export function ContributorsTab({ contributors }: ContributorsTabProps) {
  if (!contributors || contributors.length === 0) {
    return null;
  }

  return (
    <div className="tab-panel" id="contributors-tab">
      <h4 className="tab-section-header">Recent Contributors (Last 20 Commits)</h4>
      <p className="tab-section-description" style={{ marginBottom: 20 }}>
        Contributors who have committed to this repository recently, ordered by
        commit count.
      </p>
      <div className="contributors-list">
        {contributors.map((contributor, index) => (
          <ContributorItem key={index} contributor={contributor} />
        ))}
      </div>
    </div>
  );
}

export default ContributorsTab;
