module.exports = {
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/app/core/$1',
    '@shared/(.*)': '<rootDir>/src/app/shared/$1',
  },
  roots: ['<rootDir>/src'],
  preset: 'jest-preset-angular',
  setupFilesAfterSetup: ['./setup-jest.ts'],
  collectCoverage: true,
  coverageReporters: ['lcov'],
  coverageDirectory: './coverage/jest',
  collectCoverageFrom: ['**/*.ts'],
};
