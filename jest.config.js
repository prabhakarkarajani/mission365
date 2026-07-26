/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  // Scoped to pure-TS logic only, not RN/Expo components - those need a
  // different transform (e.g. jest-expo + RN Testing Library) that this
  // config doesn't set up. Widen this when a component-level test is
  // actually added. `ai/providers` included alongside `domain` because the
  // mock provider (src/ai/providers/mock/mock.provider.ts) is the same
  // kind of pure, deterministic, RN-free logic - see Sprint 6 retro.
  testMatch: ['<rootDir>/src/**/domain/**/*.test.ts', '<rootDir>/src/ai/providers/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
};
