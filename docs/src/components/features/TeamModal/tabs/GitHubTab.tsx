/**
 * GitHub Tab Component
 * Displays GitHub team information and members
 */

import { useCallback } from 'react';
import type { TeamMember } from '../../../../types/index.js';

interface GitHubTabProps {
  githubOrg?: string;
  githubSlug?: string;
  members: TeamMember[] | null;
  loading: boolean;
}

/**
 * GitHub Tab Component
 */
export function GitHubTab({
  githubOrg,
  githubSlug,
  members,
  loading,
}: GitHubTabProps) {
  // Handle settings click
  const handleSettingsClick = useCallback(() => {
    window.openSettings?.();
  }, []);

  // Not linked to GitHub
  if (!githubOrg || !githubSlug) {
    return (
      <div className="tab-panel" id="team-tab-github">
        <div className="team-not-linked">Not linked to a GitHub team</div>
      </div>
    );
  }

  const teamUrl = `https://github.com/orgs/${githubOrg}/teams/${githubSlug}`;

  // Loading state
  if (loading) {
    return (
      <div className="tab-panel" id="team-tab-github">
        <div className="team-github-section team-github-loading">
          <span className="loading-spinner" /> Loading GitHub team...
        </div>
      </div>
    );
  }

  // Not authenticated
  if (members === null) {
    return (
      <div className="tab-panel" id="team-tab-github">
        <div className="team-github-section">
          <a href={teamUrl} target="_blank" rel="noopener noreferrer" className="team-github-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            {githubSlug}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
            </svg>
          </a>
          <div className="team-github-signin">
            <button className="btn-link" onClick={handleSettingsClick}>
              Sign in to view team members
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No members found
  if (!members || members.length === 0) {
    return (
      <div className="tab-panel" id="team-tab-github">
        <div className="team-github-section">
          <a href={teamUrl} target="_blank" rel="noopener noreferrer" className="team-github-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            {githubSlug}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
            </svg>
          </a>
          <div className="team-members-empty">
            No members found or unable to access team
          </div>
        </div>
      </div>
    );
  }

  // Has members
  return (
    <div className="tab-panel" id="team-tab-github">
      <div className="team-github-section">
        <a href={teamUrl} target="_blank" rel="noopener noreferrer" className="team-github-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          {githubSlug}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
          </svg>
        </a>
        <div className="team-members">
          <span className="members-label">Members ({members.length}):</span>
          <div className="members-grid">
            {members.map((member) => (
              <a
                key={member.login}
                href={member.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="team-member"
                title={member.login}
              >
                <img
                  src={`${member.avatar_url}&s=48`}
                  alt={member.login}
                  className="team-member-avatar"
                />
                <span className="team-member-name">@{member.login}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GitHubTab;
