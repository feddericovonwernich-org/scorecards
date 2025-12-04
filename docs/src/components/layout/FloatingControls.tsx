/**
 * Floating Controls Component
 * Theme toggle, settings, and actions widget buttons
 */

import { useState, useEffect, useCallback } from 'react';

export interface FloatingControlsProps {
  onSettingsClick?: () => void;
  onActionsWidgetClick?: () => void;
  actionsBadgeCount?: number;
}

/**
 * Sun icon for light mode
 */
function SunIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.06-1.06a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}

/**
 * Moon icon for dark mode
 */
function MoonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z" />
    </svg>
  );
}

/**
 * Settings/Lock icon
 */
function SettingsIcon({ hasToken }: { hasToken: boolean }) {
  if (hasToken) {
    return (
      <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.5 4a2.5 2.5 0 0 1 4.607-1.346.75.75 0 1 0 1.264-.808A4 4 0 0 0 4 4v1.5H3A1.5 1.5 0 0 0 1.5 7v7A1.5 1.5 0 0 0 3 15.5h10a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 13 5.5h-7V4Z" />
    </svg>
  );
}

/**
 * Clock/Actions icon
 */
function ActionsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.75.75 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

const THEME_KEY = 'theme';

/**
 * Floating Controls Component
 */
export function FloatingControls({
  onSettingsClick,
  onActionsWidgetClick,
  actionsBadgeCount = 0,
}: FloatingControlsProps) {
  // Use lazy initialization to avoid setState in effect
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });
  const [hasToken, setHasToken] = useState(() => {
    return !!window.githubPAT;
  });

  // Listen for token changes (storage event only - initial state handled by lazy init)
  useEffect(() => {
    const handleStorageChange = () => {
      setHasToken(!!window.githubPAT);
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    setIsDark(!isDark);
  }, [isDark]);

  // Handle settings click
  const handleSettingsClick = useCallback(() => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      // Fallback to global function
      window.openSettings?.();
    }
  }, [onSettingsClick]);

  // Handle actions widget click
  const handleActionsClick = useCallback(() => {
    if (onActionsWidgetClick) {
      onActionsWidgetClick();
    } else {
      // Fallback to global function
      window.toggleActionsWidget?.();
    }
  }, [onActionsWidgetClick]);

  return (
    <div className="floating-controls">
      {/* Theme Toggle */}
      <button
        className="floating-btn floating-btn--theme"
        title="Toggle night mode"
        aria-label="Toggle night mode"
        onClick={toggleTheme}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </button>

      {/* Settings */}
      <button
        className="floating-btn floating-btn--settings"
        title="Settings"
        aria-label="Settings"
        onClick={handleSettingsClick}
      >
        <SettingsIcon hasToken={hasToken} />
      </button>

      {/* GitHub Actions Widget Toggle */}
      <button
        className="floating-btn floating-btn--widget"
        title="Show GitHub Actions"
        aria-label="Show GitHub Actions"
        onClick={handleActionsClick}
      >
        <ActionsIcon />
        <span className="widget-badge">{actionsBadgeCount}</span>
      </button>
    </div>
  );
}

export default FloatingControls;
