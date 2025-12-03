export default {
  // Use different projects for different test types
  projects: [
    // Node.js tests (existing behavior)
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['**/tests/unit/**/*.test.js'],
      collectCoverageFrom: [
        'docs/src/**/*.js',
        'checks/**/*.js',
        '!checks/**/node_modules/**'
      ],
      transform: {},
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      }
    },
    // React component tests
    {
      displayName: 'react',
      testEnvironment: 'jsdom',
      testMatch: ['**/docs/src/**/*.test.{ts,tsx}'],
      injectGlobals: true,
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
          tsconfig: {
            jsx: 'react-jsx',
            esModuleInterop: true,
            module: 'ESNext',
            moduleResolution: 'bundler',
            target: 'ES2022',
            strict: true,
            skipLibCheck: true,
          }
        }]
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup/react.ts'],
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
    }
  ],
  coverageDirectory: 'coverage',
};
