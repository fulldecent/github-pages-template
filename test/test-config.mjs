/**
 * Test configuration for handling environment-specific behavior
 * This module provides configuration for tests to behave appropriately in different environments
 */

// Detect if we're running in CI environment
const isCI = !!(
  process.env.CI ||
  process.env.CONTINUOUS_INTEGRATION ||
  process.env.BUILD_NUMBER ||
  process.env.GITHUB_ACTIONS ||
  process.env.GITLAB_CI ||
  process.env.CIRCLECI ||
  process.env.TRAVIS ||
  process.env.JENKINS_URL
);

// Detect if we're in offline mode (no network access expected)
const isOffline = !!(process.env.OFFLINE_MODE || process.env.NO_NETWORK || process.env.TEST_OFFLINE);

// Network timeout settings
const NETWORK_TIMEOUTS = {
  // Shorter timeouts in CI to fail fast
  SHORT: isCI ? 3 : 5,
  MEDIUM: isCI ? 5 : 10,
  LONG: isCI ? 10 : 15,
};

// Cache expiry settings
const CACHE_EXPIRY = {
  // Longer cache in CI to reduce network dependencies
  FOUND: isCI ? 60 * 60 * 24 * 90 : 60 * 60 * 24 * 30, // 90 days in CI, 30 days locally
  NOT_FOUND: isCI ? 60 * 60 * 24 * 14 : 60 * 60 * 24 * 3, // 14 days in CI, 3 days locally
  PACKAGE_CHECK: isCI ? 60 * 60 * 24 * 7 : 60 * 60 * 24 * 2, // 7 days in CI, 2 days locally
};

// Error handling configuration
const ERROR_HANDLING = {
  // In CI, network failures should produce deterministic results
  NORMALIZE_NETWORK_FAILURES: isCI || isOffline,
  // Retry settings
  MAX_RETRIES: isCI ? 1 : 2,
  RETRY_DELAY: 1000, // ms
};

// Test behavior configuration
const TEST_CONFIG = {
  // Whether to skip network-dependent tests entirely
  SKIP_NETWORK_TESTS: isOffline,
  // Whether to use mock data for network failures
  USE_MOCK_DATA: isCI || isOffline,
  // Whether to normalize status codes for network failures
  NORMALIZE_STATUS_CODES: true,
  // Default status code for network failures
  DEFAULT_NETWORK_FAILURE_STATUS: 500,
};

export { isCI, isOffline, NETWORK_TIMEOUTS, CACHE_EXPIRY, ERROR_HANDLING, TEST_CONFIG };

export default {
  isCI,
  isOffline,
  NETWORK_TIMEOUTS,
  CACHE_EXPIRY,
  ERROR_HANDLING,
  TEST_CONFIG,
};
