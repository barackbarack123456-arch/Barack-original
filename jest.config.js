export default {
  moduleNameMapper: {
    '^https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js$': '<rootDir>/__mocks__/firebase-firestore.js',
  },
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/unit/**/*.spec.js'],
};
