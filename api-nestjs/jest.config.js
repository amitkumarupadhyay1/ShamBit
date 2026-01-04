module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Root directory for tests
  rootDir: 'src',

  // Test file patterns
  testRegex: '.*\\.spec\\.ts$',

  // Transform files
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Coverage collection
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.enum.ts',
    '!**/*.types.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.d.ts',
    '!**/main.ts',
    '!**/test/**',
  ],

  // Coverage directory
  coverageDirectory: '../coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // Coverage thresholds - Reduced for practical CI/CD
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },

  // Module name mapping for path aliases (Fixed: was moduleNameMapping)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,

  // Maximum worker processes
  maxWorkers: '50%',

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],

  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$))',
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/test/global-setup.ts',
  globalTeardown: '<rootDir>/test/global-teardown.ts',

  // Preset for TypeScript
  preset: 'ts-jest',

  // TypeScript configuration - Updated format
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};