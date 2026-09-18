/** Jest corre solo sobre el dominio puro: TypeScript sin React Native ni SQLite. */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/domain'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
};
