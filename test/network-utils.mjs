/**
 * Network utilities for handling connectivity and graceful fallbacks in sandboxed environments
 */
import { execSync } from "child_process";

let networkConnectivityCache = null;
let networkCheckTime = null;
const CONNECTIVITY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if we have network connectivity by testing a reliable endpoint
 * @returns {boolean} True if network is available, false otherwise
 */
export function hasNetworkConnectivity() {
  const now = Date.now();

  // Use cached result if it's still valid
  if (networkConnectivityCache !== null && networkCheckTime && now - networkCheckTime < CONNECTIVITY_CACHE_DURATION) {
    return networkConnectivityCache;
  }

  try {
    // Test connectivity with a quick DNS lookup to a reliable endpoint
    execSync("curl --silent --head --max-time 5 --fail https://httpbin.org/status/200", {
      timeout: 5000,
      stdio: "pipe",
    });
    networkConnectivityCache = true;
  } catch (error) {
    networkConnectivityCache = false;
  }

  networkCheckTime = now;
  return networkConnectivityCache;
}

/**
 * Check if we're running in a sandboxed environment
 * @returns {boolean} True if sandboxed, false otherwise
 */
export function isSandboxedEnvironment() {
  // Check for common CI/sandboxed environment indicators
  const indicators = [
    process.env.CI,
    process.env.GITHUB_ACTIONS,
    process.env.TRAVIS,
    process.env.CIRCLECI,
    process.env.JENKINS_URL,
    process.env.BUILDKITE,
    process.env.GITLAB_CI,
    process.env.SANDBOXED === "true",
  ];

  return indicators.some((indicator) => indicator);
}

/**
 * Determine if network checks should be skipped
 * @returns {boolean} True if network checks should be skipped
 */
export function shouldSkipNetworkChecks() {
  // Skip if explicitly disabled
  if (process.env.SKIP_NETWORK_CHECKS === "true") {
    return true;
  }

  // Skip if sandboxed and no network connectivity
  if (isSandboxedEnvironment() && !hasNetworkConnectivity()) {
    return true;
  }

  return false;
}

/**
 * Create a safe curl command with proper error handling
 * @param {string} url - The URL to check
 * @param {object} options - Options for the curl command
 * @returns {Promise<object>} Result object with status, output, error
 */
export function safeCurlCommand(url, options = {}) {
  const {
    timeout = 10,
    maxRedirs = 0,
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    followRedirects = false,
  } = options;

  try {
    const redirectFlag = followRedirects ? "--location" : "--max-redirs 0";
    const command = `curl --head --silent --max-time ${timeout} ${redirectFlag} \
      --user-agent "${userAgent}" \
      --write-out "%{http_code}" --dump-header - --output /dev/null "${url}" || true`;

    const result = execSync(command, {
      timeout: (timeout + 1) * 1000,
      encoding: "utf-8",
    });

    const statusCodeMatch = result.match(/(\d{3})$/);
    const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1], 10) : 0;
    const locationMatch = result.match(/Location: (.+)/i);
    const redirectTo = locationMatch ? locationMatch[1].trim() : null;

    return {
      success: true,
      statusCode,
      redirectTo,
      output: result,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      redirectTo: null,
      error: error.message,
      output: "",
    };
  }
}
