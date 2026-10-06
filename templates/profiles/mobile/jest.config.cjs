module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/.agents/', '/.promethee/', '/dist/'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
};
