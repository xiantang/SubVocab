module.exports = {
  // Use jsdom environment for browser-like testing
  testEnvironment: 'jsdom',
  
  // Setup files to run before each test
  setupFiles: ['<rootDir>/tests/setup/mock-extension-apis.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
    '!tests/**',
    '!node_modules/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Module name mapping for easier imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true
};