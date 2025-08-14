// Import necessary modules and dependencies
import { Rule } from "html-validate";
import Database from "better-sqlite3";
import fs from "fs";
import { execSync } from "child_process";
import { shouldSkipNetworkChecks, safeCurlCommand } from "./network-utils.mjs";

// Constants for cache expiry and timeout settings
const CACHE_FOUND_EXPIRY = 60 * 60 * 24 * 30; // 30 days
const CACHE_NOT_FOUND_EXPIRY = 60 * 60 * 24 * 3; // 3 days
const TIMEOUT_SECONDS = 10;

// Class definition for the custom HTML validation rule
export default class EnsureHttpsRules extends Rule {
  // Documentation method providing information about the rule
  documentation() {
    return {
      description: "Report insecure HTTP links that are accessible via HTTPS.",
      url: "https://github.com/fulldecent/github-pages-template/#https-links",
    };
  }

  // Setup method called when the rule is initialized
  setup() {
    // Initialize the database and set up event listener for DOM readiness
    this.setupDatabase();
    this.on("dom:ready", this.domReady.bind(this));
  }

  // Method to set up the SQLite database for caching link statuses
  setupDatabase() {
    try {
      // Create the 'cache' directory if it doesn't exist
      fs.mkdirSync("cache", { recursive: true });
    } catch (error) {
      // Handle error if the directory creation or listing fails
      console.error("Error creating or listing 'cache' directory:", error);
    }

    // Initialize the SQLite database and set up required tables and indices
    const db = new Database("cache/http-links.db");
    db.exec("CREATE TABLE IF NOT EXISTS urls (url UNIQUE NOT NULL, found INTEGER NOT NULL, time INTEGER NOT NULL)");
    db.exec("CREATE INDEX IF NOT EXISTS time ON urls (time)");

    // Cleanup expired cache entries
    db.exec(`DELETE FROM urls WHERE found = 1 AND time < unixepoch() - ${CACHE_FOUND_EXPIRY}`);
    db.exec(`DELETE FROM urls WHERE found = 0 AND time < unixepoch() - ${CACHE_NOT_FOUND_EXPIRY}`);

    // Save the database instance to the class property
    this.db = db;
  }

  // Method to check if an HTTP link is accessible via HTTPS
  checkTheLink(url, element) {
    // Skip network checks if in sandboxed environment without connectivity
    if (shouldSkipNetworkChecks()) {
      console.log(`⚠️  Skipping HTTPS check for ${url} (network unavailable or disabled)`);
      return;
    }

    try {
      // Replace 'http' with 'https' in the URL
      const httpsUrl = url.replace(/^http:/, "https:");

      // Use the safe curl command
      const result = safeCurlCommand(httpsUrl, {
        timeout: TIMEOUT_SECONDS,
        followRedirects: true,
      });

      if (!result.success) {
        // If network call failed, log but don't fail the test
        console.log(`⚠️  Could not check HTTPS for ${url}: ${result.error}`);
        this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 0, unixepoch())").run(url);
        return;
      }

      // If the link is accessible via HTTPS, report it as insecure
      if (result.statusCode >= 200 && result.statusCode < 300) {
        this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 1, unixepoch())").run(url);
        this.report({
          node: element,
          message: `external link is insecure and accessible via HTTPS: ${url}`,
        });
      } else {
        // If not accessible via HTTPS, update the database entry
        this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 0, unixepoch())").run(url);
      }
    } catch (error) {
      // Handle errors during the link checking process
      console.log(`⚠️  Error checking HTTPS for ${url}: ${error.message}`);
      this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 0, unixepoch())").run(url);
    }
  }

  // Method called for checking links against the rule
  check(url, element) {
    // Check if the URL is an HTTP link
    if (!url || !url.startsWith("http://")) {
      return;
    }

    // Retrieve the status of the link from the database
    const row = this.db.prepare("SELECT found, time FROM urls WHERE url = ?").get(url);

    // If the link is already marked as secure, no need to check again just report the error.
    if (row && row.found === 1) {
      this.report({
        node: element,
        message: `external link is insecure and accessible via HTTPS: ${url}`,
      });
      return;
    }

    // Perform the actual link checking
    this.checkTheLink(url, element);
  }

  domReady({ document }) {
    // Skip network checks if in sandboxed environment without connectivity
    if (shouldSkipNetworkChecks()) {
      return;
    }

    const aElements = document.getElementsByTagName("a");
    for (const aElement of aElements) {
      if (!aElement.hasAttribute("href")) continue;
      const href = aElement.getAttribute("href").value;
      if (!href) continue;
      if (href.startsWith("http://")) {
        const hrefDecoded = href
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&#63;/g, "?");
        this.check(hrefDecoded, aElement);
      }
    }
  }
}
