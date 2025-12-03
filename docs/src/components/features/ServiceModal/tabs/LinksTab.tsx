/**
 * Links Tab Component
 * Displays service-related links
 */

import type { ServiceLink } from '../../../../types/index.js';

interface LinksTabProps {
  links: ServiceLink[];
}

/**
 * Links Tab Component
 */
export function LinksTab({ links }: LinksTabProps) {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className="tab-panel" id="links-tab">
      <ul className="link-list">
        {links.map((link, index) => (
          <li key={index} className="link-item">
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                style={{ flexShrink: 0, marginRight: 8 }}
              >
                <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" />
              </svg>
              <div className="link-content">
                <strong className="link-name">{link.name}</strong>
                {link.description && (
                  <p className="link-description">{link.description}</p>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LinksTab;
