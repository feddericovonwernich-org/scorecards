/**
 * React Testing Setup
 * Configures jest-dom matchers and global test utilities
 */

import '@testing-library/jest-dom';

// Mock window properties used by components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.githubPAT
Object.defineProperty(window, 'githubPAT', {
  writable: true,
  value: null,
});

// Note: Not mocking document.documentElement.getAttribute
// Tests should use setAttribute('data-theme', 'light') in beforeEach to set initial theme

// Mock window global functions that components may call
Object.defineProperty(window, 'openSettings', {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, 'toggleActionsWidget', {
  writable: true,
  value: () => {},
});
