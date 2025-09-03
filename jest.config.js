export default {
  moduleNameMapper: {
    '^https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js$': '<rootDir>/__mocks__/firebase-app.js',
    '^https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js$': '<rootDir>/__mocks__/firebase-auth.js',
    '^https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js$': '<rootDir>/__mocks__/firebase-firestore.js',
    '^https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js$': '<rootDir>/__mocks__/firebase-functions.js',
  },
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/unit/**/*.spec.js'],
  transform: {},
};
