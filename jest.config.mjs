export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit', '<rootDir>/tests/integration'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'common/**/*.js',
    'server/**/*.js',
    'src/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 5000,
  verbose: true,
  transformIgnorePatterns: []
};
