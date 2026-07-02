module.exports = {
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/app/core/$1',
    '@shared/(.*)': '<rootDir>/src/app/shared/$1',
    '@env': '<rootDir>/src/environments/environment',
  },
  roots: ['<rootDir>/src'],
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['./setup-jest.ts'],
  collectCoverage: true,
  coverageReporters: ['lcov'],
  coverageDirectory: './coverage/jest',
  collectCoverageFrom: ['**/*.ts'],
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
};
