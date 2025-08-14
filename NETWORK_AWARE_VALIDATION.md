# Network-Aware HTML Validation Improvements

This document describes the enhanced testing infrastructure that makes the GitHub Pages template more robust in various environments, particularly sandboxed CI/CD environments where network access may be limited.

## Overview of Improvements

The GitHub Pages template now includes sophisticated network-aware validation that gracefully handles network connectivity issues while maintaining comprehensive testing coverage.

### Key Features

1. **Adaptive Network Detection**: Automatically detects network availability and sandboxed environments
2. **Graceful Fallbacks**: Skips network-dependent checks when connectivity is unavailable
3. **Comprehensive Test Coverage**: Maintains validation coverage for non-network-dependent rules
4. **Environment-Aware Testing**: Different test expectations based on network availability

## Network Utilities (`test/network-utils.mjs`)

### Functions

#### `hasNetworkConnectivity()`
- Tests network connectivity using a reliable endpoint
- Caches results for 5 minutes to avoid repeated checks
- Returns `true` if network is available, `false` otherwise

#### `isSandboxedEnvironment()`
- Detects common CI/CD and sandboxed environments
- Checks for environment variables like `CI`, `GITHUB_ACTIONS`, `TRAVIS`, etc.
- Returns `true` if running in a sandboxed environment

#### `shouldSkipNetworkChecks()`
- Determines whether network checks should be skipped
- Considers explicit configuration (`SKIP_NETWORK_CHECKS=true`)
- Automatically skips in sandboxed environments without connectivity
- Returns `true` if network checks should be bypassed

#### `safeCurlCommand(url, options)`
- Provides safe curl execution with proper error handling
- Returns structured result objects with status codes and error information
- Handles timeouts and network failures gracefully

## Enhanced Validation Plugins

### External Links Plugin (`test/plugin.html-validate.external-links.mjs`)
- **Improvement**: Skips external link validation when network is unavailable
- **Behavior**: Logs warnings instead of failing tests in sandboxed environments
- **Fallback**: Uses cached results when available

### HTTPS Links Plugin (`test/plugin.html-validate.https-links.mjs`)
- **Improvement**: Gracefully handles HTTPS availability checks
- **Behavior**: Skips HTTPS validation in network-restricted environments
- **Logging**: Provides informative warnings about skipped checks

### Latest Packages Plugin (`test/plugin.html-validate.latest-packages.mjs`)
- **Improvement**: Handles package version checking with network awareness
- **Behavior**: Skips version checks when network is unavailable
- **Caching**: Maintains local cache for offline operation

## Adaptive Test Infrastructure

### Fixture Testing (`test/fixtures-html-validate-should-fail.mjs`)
- **Enhancement**: Uses adaptive expectations based on network availability
- **Configuration**: `test/fixtures/required-results-adaptive.json` contains different expectations
- **Modes**: 
  - `network-available`: Full validation including network-dependent checks
  - `network-disabled`: Only non-network-dependent validation

### Comprehensive Testing (`test/comprehensive-network-tests.mjs`)
- **Purpose**: Demonstrates and validates the network-aware infrastructure
- **Coverage**: Tests various scenarios including network-dependent and independent validations
- **Reporting**: Provides detailed analysis of network environment and test results

## Configuration Options

### Environment Variables

#### `SKIP_NETWORK_CHECKS`
- **Values**: `true` / `false`
- **Purpose**: Explicitly disable network checks regardless of environment
- **Usage**: `SKIP_NETWORK_CHECKS=true yarn test`

#### Standard CI Variables
The system automatically detects these common CI/CD environment variables:
- `CI`
- `GITHUB_ACTIONS`
- `TRAVIS`
- `CIRCLECI`
- `JENKINS_URL`
- `BUILDKITE`
- `GITLAB_CI`

## Usage Examples

### Running Tests in Different Modes

```bash
# Normal testing (auto-detects environment)
yarn test

# Force disable network checks
SKIP_NETWORK_CHECKS=true yarn test

# Run comprehensive network tests
yarn node test/comprehensive-network-tests.mjs

# Run fixture tests only
yarn node test/fixtures-html-validate-should-fail.mjs
```

### Expected Behavior by Environment

#### Local Development (with network)
- All validation rules active
- External links checked
- HTTPS availability verified
- Package versions validated

#### CI/CD or Sandboxed Environment (no network)
- Network-dependent checks skipped with warnings
- Internal validation rules still active
- Tests pass without network failures
- Informative logging about skipped checks

#### Explicitly Disabled Network Checks
- Same as sandboxed environment behavior
- Useful for debugging or testing offline

## Benefits

1. **Reliability**: Tests no longer fail due to network issues in CI/CD environments
2. **Flexibility**: Maintains full validation capability when network is available
3. **Debugging**: Clear logging about which checks are skipped and why
4. **Maintainability**: Centralized network handling logic
5. **Performance**: Cached network connectivity checks reduce overhead

## Migration Guide

### For Existing Projects
1. The improvements are backward compatible
2. Existing test expectations automatically adapt
3. No configuration changes required
4. Network-dependent failures become warnings in sandboxed environments

### For New Projects
1. Use `yarn test` for comprehensive testing
2. Check logs for network-related warnings
3. Configure `SKIP_NETWORK_CHECKS=true` if needed for specific environments
4. Review the adaptive test results to understand what's being validated

## Technical Details

### Network Detection Algorithm
1. Check for explicit `SKIP_NETWORK_CHECKS` setting
2. Detect sandboxed environment via common CI variables
3. Test actual network connectivity with timeout
4. Cache results to avoid repeated network calls
5. Make adaptive decisions based on combined factors

### Error Handling Strategy
- Network failures become warnings, not errors
- Graceful degradation maintains test functionality
- Structured error reporting for debugging
- Clear distinction between validation errors and network issues

This enhanced infrastructure ensures that the GitHub Pages template remains robust and reliable across various deployment environments while maintaining comprehensive validation when network access is available.