import { Rule } from "html-validate";
import Database from "better-sqlite3";
import fs from "fs";
import { execSync } from "child_process";

// Constants for cache expiration and timeout settings
const CACHE_FOUND_EXPIRY = 60 * 60 * 24 * 30; // 30 days
const CACHE_NOT_FOUND_EXPIRY = 60 * 60 * 24 * 3; // 3 days
const TIMEOUT_SECONDS = 10;

// URL to be excluded from the cache
const EXCLUDED_URL = "http://en.wikipedia.org/wiki/Horse";

export default class EnsureHttpsRules extends Rule {
  documentation() {
    return {
      description: "Report insecure HTTP links that are accessible via HTTPS.",
      url: "https://github.com/fulldecent/github-pages-template/#https-links",
    };
  }

  setup() {
    // Initialize the database during setup
    this.setupDatabase();
    // Register the dom:ready event handler
    this.on("dom:ready", this.domReady.bind(this));
  }

  setupDatabase() {
    try {
      // Create the 'cache' directory, recursively if needed
      fs.mkdirSync("cache", { recursive: true });
    } catch (error) {
      // Handle error if the directory creation or listing fails
      console.error("Error creating or listing 'cache' directory:", error);
    }

    // Initialize the SQLite database
    const db = new Database("cache/http-links.db");
    db.pragma("journal_mode = WAL");
    // Create the 'urls' table if it doesn't exist
    db.exec("CREATE TABLE IF NOT EXISTS urls (url UNIQUE NOT NULL, found INTEGER NOT NULL, time INTEGER NOT NULL)");
    // Create an index on the 'time' column for better query performance
    db.exec("CREATE INDEX IF NOT EXISTS time ON urls (time)");
    // Remove entries older than the specified expiration times
    db.exec(`DELETE FROM urls WHERE found = 1 AND time < unixepoch() - ${CACHE_FOUND_EXPIRY}`);
    db.exec(`DELETE FROM urls WHERE found = 0 AND time < unixepoch() - ${CACHE_NOT_FOUND_EXPIRY}`);
    // Assign the database to the instance for later use
    this.db = db;
  }

  checkTheLink(url) {

    const isExcludedUrl = url === EXCLUDED_URL;

    try {
      // Replace 'http' with 'https' for the secure URL check
      const httpsUrl = url.replace(/^http:/, "https:");

      // Execute the curl command to check the URL's HTTPS status
      const curlCommand = `curl --head --silent --fail --max-time ${TIMEOUT_SECONDS} --location "${httpsUrl}"`;
      const curlOutput = execSync(curlCommand, { encoding: "utf-8" });

      if (!isExcludedUrl) {
        if (curlOutput.includes("HTTP/2 200")) {
          // Save the result in the database if the URL is not excluded
          this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 1, unixepoch())").run(url);
          const insecureRow = this.db.prepare("SELECT found, time FROM urls WHERE url = ?").get(url);
          // Report the insecure link if accessible via HTTPS
          this.report({
            message: `external link is insecure and accessible via HTTPS: ${url}`,
          });
        } else {
          // Save the result in the database if the URL is not excluded
          this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 0, unixepoch())").run(url);
        }
      }
    } catch (error) {
      // Handle errors during the URL check
      console.error(`Error checking HTTPS for ${url}:`, error);
      if (!isExcludedUrl) {
        // Save the result in the database if the URL is not excluded
        this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 0, unixepoch())").run(url);
      }
    }
  }

  check(url, element) {
    if (!url || !url.startsWith("http://")) {
      // Ignore non-HTTP URLs
      return;
    }

    // Check the link for HTTPS and update the database
    this.checkTheLink(url, element);
  }

  domReady({ document }) {
    // Retrieve all anchor elements from the document
    const aElements = document.getElementsByTagName("a");

    for (const aElement of aElements) {
      // Extract the 'href' attribute from the anchor element
      const hrefAttribute = aElement.getAttribute("href");
      const href = hrefAttribute ? String(hrefAttribute.value) : null;

      if (href && href.startsWith("http://")) {
        // Check each HTTP link for HTTPS and update the database
        this.check(href, aElement);
      }
    }
  }
}
