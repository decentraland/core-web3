/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./jest.setup.cjs'],
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.spec.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/index.ts']
}
