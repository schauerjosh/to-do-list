// Jest config for React 19+ and ESM
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/index.js',
    '!src/index.jsx',
    '!**/node_modules/**',
    '!**/test/**',
  ],
  coverageReporters: ['text', 'lcov'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '<rootDir>/src/**/*.test.[jt]s?(x)'
  ],
};
