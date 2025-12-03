/**
 * Badges Tab Component
 * Displays badge markdown for README files
 */

import { useState, useCallback, useEffect } from 'react';

interface BadgesTabProps {
  org: string;
  repo: string;
}

/**
 * Badges Tab Component
 */
export function BadgesTab({ org, repo }: BadgesTabProps) {
  const [rawBaseUrl, setRawBaseUrl] = useState('');
  const [copiedScore, setCopiedScore] = useState(false);
  const [copiedRank, setCopiedRank] = useState(false);

  // Get raw base URL on mount
  useEffect(() => {
    const getBaseUrl = async () => {
      try {
        const { getRawBaseUrl } = await import('../../../../api/registry.js');
        setRawBaseUrl(getRawBaseUrl());
      } catch {
        // Fallback
        setRawBaseUrl(
          'https://raw.githubusercontent.com/example/scorecards/catalog'
        );
      }
    };
    getBaseUrl();
  }, []);

  const scoreBadgeUrl = `https://img.shields.io/endpoint?url=${rawBaseUrl}/badges/${org}/${repo}/score.json`;
  const rankBadgeUrl = `https://img.shields.io/endpoint?url=${rawBaseUrl}/badges/${org}/${repo}/rank.json`;

  const scoreBadgeMarkdown = `![Score](${scoreBadgeUrl})`;
  const rankBadgeMarkdown = `![Rank](${rankBadgeUrl})`;

  // Copy to clipboard
  const handleCopy = useCallback(
    async (text: string, type: 'score' | 'rank') => {
      try {
        await navigator.clipboard.writeText(text);
        if (type === 'score') {
          setCopiedScore(true);
          setTimeout(() => setCopiedScore(false), 2000);
        } else {
          setCopiedRank(true);
          setTimeout(() => setCopiedRank(false), 2000);
        }
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        if (type === 'score') {
          setCopiedScore(true);
          setTimeout(() => setCopiedScore(false), 2000);
        } else {
          setCopiedRank(true);
          setTimeout(() => setCopiedRank(false), 2000);
        }
      }
    },
    []
  );

  return (
    <div className="tab-panel" id="badges-tab">
      <h4 className="tab-section-header">Badge Preview</h4>
      <div className="badge-preview-container">
        <img src={scoreBadgeUrl} alt="Score Badge" style={{ height: 20 }} />
        <img src={rankBadgeUrl} alt="Rank Badge" style={{ height: 20 }} />
      </div>

      <h4 className="tab-section-header" style={{ marginBottom: 10 }}>
        Add to Your README
      </h4>
      <p className="tab-section-description">Copy the markdown below:</p>

      <div style={{ position: 'relative', marginBottom: 15 }}>
        <button
          onClick={() => handleCopy(scoreBadgeMarkdown, 'score')}
          className={`copy-button ${copiedScore ? 'copied' : ''}`}
        >
          {copiedScore ? 'Copied!' : 'Copy'}
        </button>
        <pre className="badge-code-block">{scoreBadgeMarkdown}</pre>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => handleCopy(rankBadgeMarkdown, 'rank')}
          className={`copy-button ${copiedRank ? 'copied' : ''}`}
        >
          {copiedRank ? 'Copied!' : 'Copy'}
        </button>
        <pre className="badge-code-block">{rankBadgeMarkdown}</pre>
      </div>
    </div>
  );
}

export default BadgesTab;
