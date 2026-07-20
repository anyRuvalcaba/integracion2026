import MockAdapter from 'axios-mock-adapter';
import apiClient from '../services/apiClient';

// Single axios-mock-adapter instance shared across all tests.
// setupTests.js calls mock.reset() + setupDefaultMocks(mock) in beforeEach.
export const mock = new MockAdapter(apiClient, { onNoMatch: 'passthrough' });
