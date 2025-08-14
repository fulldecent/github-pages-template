# Test Infrastructure Documentation

This project implements robust, network-resilient testing practices that ensure consistent and deterministic test results across different environments.

## Overview

The testing infrastructure has been designed to handle network dependencies gracefully and provide consistent results whether running locally, in CI environments, or offline.

## Key Features

### 1. Environment-Aware Configuration

The test system automatically detects the runtime environment and adapts behavior accordingly:

- **CI Detection**: Automatically detects CI environments (GitHub Actions, GitLab CI, Travis, etc.)
- **Offline Mode**: Supports running tests without network access
- **Environment-Specific Timeouts**: Shorter timeouts in CI for faster feedback
- **Adaptive Caching**: Longer cache periods in CI to reduce network dependencies

### 2. Network Failure Handling

#### Status Code Normalization
- Network failures (curl status 0) are normalized to HTTP 500
- Provides deterministic test results regardless of network connectivity
- Distinguishes between actual HTTP errors and network connectivity issues

#### Graceful Degradation
- Network-dependent tests gracefully handle failures
- Package version checks return empty results instead of crashing
- External link checks continue with cached data when possible

### 3. Test Configuration

The test system is configured via `test/test-config.mjs`:

```javascript
// Automatic environment detection
const isCI = // Detects CI environments
const isOffline = // Detects offline mode

// Environment-specific settings
const NETWORK_TIMEOUTS = {
  SHORT: isCI ? 3 : 5,    // Shorter timeouts in CI
  MEDIUM: isCI ? 5 : 10,
  LONG: isCI ? 10 : 15
};

const CACHE_EXPIRY = {
  FOUND: isCI ? (60*60*24*90) : (60*60*24*30),     // 90 days in CI vs 30 days local
  NOT_FOUND: isCI ? (60*60*24*14) : (60*60*24*3),  // 14 days in CI vs 3 days local
};
```

### 4. Plugin Improvements

#### External Links Plugin
- Normalizes network failure status codes (0 → 500)
- Disables proxy in CI environments for predictable behavior
- Handles curl timeouts and DNS failures gracefully
- Provides clear error categorization

#### HTTPS Links Plugin
- Detects both HTTP/1.1 and HTTP/2 success responses
- Graceful handling of network timeouts
- Environment-aware error reporting

#### Latest Packages Plugin
- Fallback behavior when jsdelivr API is unreachable
- Longer cache periods in CI environments
- Silent failure mode instead of error reporting on network issues

### 5. Test Result Normalization

The fixture test runner (`test/fixtures-html-validate-should-fail.mjs`) implements:

- **Result Normalization**: Automatically converts status 0 to status 500 in test results
- **Better Error Reporting**: Clear diff display with helpful tips
- **Environment Indicators**: Shows when running in CI mode with normalization
- **Helpful Messages**: Guides users on updating expected results

## Usage

### Running Tests

```bash
# Normal mode (adapts to environment automatically)
yarn test

# Force CI mode (for testing CI behavior locally)
CI=true yarn test

# Force offline mode
OFFLINE_MODE=true yarn test
```

### Environment Variables

- `CI`: Forces CI mode behavior
- `OFFLINE_MODE`: Disables all network access
- `NO_NETWORK`: Alternative offline mode flag
- `TEST_OFFLINE`: Another offline mode flag

### Expected Behavior

#### Local Development
- Longer timeouts for network requests
- Shorter cache periods for faster development feedback
- More verbose error reporting
- Network failures produce actual error messages

#### CI Environments  
- Shorter timeouts for faster feedback
- Longer cache periods to reduce flakiness
- Network failures are normalized to consistent status codes
- Graceful degradation when external services are unavailable

#### Offline Mode
- All network-dependent tests skip or return empty results
- No external API calls are made
- Tests focus on local validation only

## Best Practices Implemented

1. **Deterministic Tests**: Network issues don't cause random test failures
2. **Environment Awareness**: Tests adapt to their runtime context
3. **Graceful Degradation**: Partial functionality when network is limited
4. **Clear Error Messages**: Distinguish between different failure types
5. **Consistent Results**: Same test outcome regardless of network state
6. **Fast Feedback**: Appropriate timeouts for each environment
7. **Comprehensive Coverage**: Tests still validate logic even when external services fail

## Troubleshooting

### Tests Failing Due to Network Issues
If tests are failing due to network connectivity:

1. Check if running in appropriate environment (CI vs local)
2. Verify expected results match current normalized behavior
3. Consider updating `required-results.json` if behavior has legitimately changed
4. Use `OFFLINE_MODE=true` for local development without network

### Updating Expected Results
When network behavior changes or new tests are added:

1. Run tests and check the generated `actual-results.json`
2. Verify the results match expected behavior for your environment
3. Update `required-results.json` if the changes are correct
4. Commit both the test changes and updated expected results

### Adding New Network-Dependent Tests
When adding new plugins or rules that make network calls:

1. Import and use the test configuration from `test/test-config.mjs`
2. Implement graceful error handling for network failures
3. Use environment-appropriate timeouts and cache settings
4. Add result normalization if needed for consistent testing
5. Test in both CI and local environments before committing
