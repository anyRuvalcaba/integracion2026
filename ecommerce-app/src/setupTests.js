import '@testing-library/jest-dom';

// jsdom 16 (Jest 27 / CRA 5) doesn't expose TextEncoder/TextDecoder.
// React Router v7 and axios-mock-adapter require them at module-load time.
// Use require() — NOT import — so this runs before any test module is loaded.
// Babel hoists import statements; require() runs in-place.
const { TextEncoder, TextDecoder } = require('util');
Object.assign(global, { TextEncoder, TextDecoder });

// eslint-disable-next-line import/first
const { mock } = require('./mocks/server');
// eslint-disable-next-line import/first
const { setupDefaultMocks } = require('./mocks/handlers');

beforeEach(() => {
  mock.reset();
  setupDefaultMocks(mock);
});

afterAll(() => {
  mock.restore();
});
