import { Rule } from "html-validate";
import Database from "better-sqlite3";
import fs from "fs";
import { execSync } from "child_process";
import { quote as shellEscape } from "shell-quote";

const CACHE_FOUND_EXPIRY = 60 * 60 * 24 * 30; // 30 days
const CACHE_NOT_FOUND_EXPIRY = 60 * 60 * 24 * 3; // 3 days
const TASK_PARALLELISM = 10;
const TIMEOUT_SECONDS = 5;
// Look like modern Chrome
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.999 Safari/537.36";

// Use your proxy server to check external links
// This URL must accept a query parameter `url` and return the status code and possibly location: header in the response.
// Status code 500 is returned if the server is down or timeout.
const PROXY_URL = "https://api.PacificMedicalTraining.com/public/link-check/status";

// html-validate runs check() synchronously, so we can't use async functions like fetch here. Maybe after their
// version 9 release we can use the fetch API and this parallel approach.
/**
 * Process Promise functions up to N at the same time.
 *
 * @param {array} promiseFunctions - An array of functions that return a promise.
 * @param {number} parallelism - The maximum number of tasks that can be processed concurrently. Must be greater than zero.
 * @returns {Promise} A promise that resolves when all tasks have completed.
 */
async function runPromiseFunctionsWithParallelism(promiseFunctions, parallelism) {
  const promisesInProgress = new Set();
  for (const promiseFunction of promiseFunctions) {
    if (promisesInProgress.size >= parallelism) {
      await Promise.race(promisesInProgress);
    }
    const promise = promiseFunction().then(() => {
      promisesInProgress.delete(promise);
    });
    promisesInProgress.add(promise);
  }
  return Promise.all(promisesInProgress);
}

/**
 * Normalize URLs to ensure consistent casing for domain names
 * URLs like https://ExAmple.com and https://example.com will be treated as the same URL
 * https://github.com/fulldecent/github-pages-template/issues/123
 *
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL with lowercase domain
 */
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // Convert hostname to lowercase but keep path, query, and fragment with original casing
    urlObj.hostname = urlObj.hostname.toLowerCase();
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, return the original URL
    return url;
  }
}

export default class ExternalLinksRule extends Rule {
  documentation() {
    return {
      description: "Require all external links to be live.",
      url: "https://github.com/fulldecent/github-pages-template/#external-links",
    };
  }

  setup() {
    this.db = this.setupDatabase();
    this.skipUrlsRegex = this.loadSkipUrls();
    this.on("tag:ready", this.tagReady.bind(this));
  }

  setupDatabase() {
    fs.mkdirSync("cache", { recursive: true });
    const db = new Database("cache/external-links.db");
    db.exec("CREATE TABLE IF NOT EXISTS urls (url UNIQUE NOT NULL, status, redirect_to, time)");
    db.exec("CREATE INDEX IF NOT EXISTS time ON urls (time)");
    db.exec(`DELETE FROM urls WHERE status BETWEEN 200 AND 299 AND time < unixepoch() - ${CACHE_FOUND_EXPIRY}`);
    db.exec(`DELETE FROM urls WHERE status NOT BETWEEN 200 AND 299 AND time < unixepoch() - ${CACHE_NOT_FOUND_EXPIRY}`);
    return db;
  }

  loadSkipUrls() {
    try {
      const skipUrlsFile = fs.readFileSync("./test/skip-urls.regex.txt", "utf-8");
      const skipUrls = skipUrlsFile.split("\n").filter((url) => url.trim() !== "");
      // Convert each skip URL pattern to a regex object
      return skipUrls.map((pattern) => new RegExp(pattern));
    } catch (error) {
      console.error("Error loading skip URLs:", error);
      return [];
    }
  }

  check(url, element) {
    // Normalize URL to handle case-insensitive domains
    const normalizedUrl = normalizeUrl(url);

    // Use shell-quote to safely escape the URL
    const escapedUrl = shellEscape([url]);

    // Execute the curl command to fetch only the headers synchronously and capture the status code
    const result = execSync(`curl --head --silent --max-time ${TIMEOUT_SECONDS} --max-redirs 0 \
    --user-agent "${USER_AGENT}" \
    --header "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9" \
    --write-out "%{http_code}" --dump-header - --output /dev/null ${escapedUrl} || true`);

    // Convert output to string and split by newline
    const output = result.toString();
    const statusCode = parseInt(output.match(/(\d{3})$/)[1], 10); // The last 3 digits in output
    const statusCodeFolded = statusCode === 0 ? 500 : statusCode;
    const locationMatch = output.match(/Location: (.+)/i);
    const redirectTo = locationMatch ? locationMatch[1].trim() : null;

    this.db
      .prepare("REPLACE INTO urls (url, status, redirect_to, time) VALUES (?, ?, ?, unixepoch())")
      .run(normalizedUrl, statusCodeFolded, redirectTo);
    if (statusCodeFolded < 200 || statusCodeFolded >= 300) {
      if (redirectTo) {
        this.report({
          node: element,
          message: `external link ${url} redirects to: ${redirectTo}`,
        });
      } else {
        this.report({
          node: element,
          message: `external link is broken with status ${statusCodeFolded}: ${url}`,
        });
      }
    }
  }

  /**
   * Access
   */
  // Access with proxy
  checkWithProxy(url, element) {
    // Normalize URL to handle case-insensitive domains
    const normalizedUrl = normalizeUrl(url);

    const urlWithQuery = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
    // Use shell-quote to safely escape the URL
    const escapedUrl = shellEscape([urlWithQuery]);

    // Execute the curl command to fetch only the headers synchronously and capture the status code
    const result = execSync(`curl --head --silent --max-time ${TIMEOUT_SECONDS} --max-redirs 0 \
    --write-out "%{http_code}" --dump-header - --output /dev/null ${escapedUrl} || true`);

    // Convert output to string and split by newline
    const output = result.toString();
    const statusCodeMatch = output.match(/(\d{3})$/); // The last 3 digits in output
    const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1], 10) : 500;
    const locationMatch = output.match(/Location: (.+)/i);
    const redirectTo = locationMatch ? locationMatch[1].trim() : null;

    this.db
      .prepare("REPLACE INTO urls (url, status, redirect_to, time) VALUES (?, ?, ?, unixepoch())")
      .run(normalizedUrl, statusCode, redirectTo);
    if (statusCode < 200 || statusCode >= 300) {
      if (redirectTo) {
        this.report({
          node: element,
          message: `external link ${url} redirects to: ${redirectTo}`,
        });
      } else {
        this.report({
          node: element,
          message: `external link is broken with status ${statusCode}: ${url}`,
        });
      }
    }
  }

  // Check for href external links
  tagReady({ target }) {
    // TODO: also check image.src, link.href, script.src
    if (target.tagName !== "a") {
      return;
    }

    if (!target.hasAttribute("href")) {
      return;
    }

    // Decode the URL from the href attribute, see https://gitlab.com/html-validate/html-validate/-/issues/218
    // Quickly replace a few common HTML entities, TODO use a real approach for this
    const url = target.getAttribute("href").value.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<");

    if (/^https?:\/\//i.test(url) === false) {
      return;
    }

    if (this.skipUrlsRegex.some((regex) => regex.test(url))) {
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    // Use cache if the URL is in there
    const row = this.db.prepare("SELECT * FROM urls WHERE url = ?").get(normalizedUrl);
    if (row) {
      if (row.redirect_to) {
        this.report({
          node: target,
          message: `external link ${url} redirects to: ${row.redirect_to}`,
        });
        return;
      }
      if (row.status < 200 || row.status >= 300) {
        this.report({
          node: target,
          message: `external link is broken with status ${row.status}: ${url}`,
        });
        return;
      }
    }

    if (PROXY_URL !== null) {
      this.checkWithProxy(url, target);
    } else {
      this.check(url, target);
    }
  }
}
