// Must use CommonJS and not ES modules
// Source: https://gitlab.com/html-validate/html-validate/-/issues/214
// and: https://gitlab.com/html-validate/html-validate/-/issues/125
// Inspiration: https://github.com/Intecmedia/Intecmedia.Webpack/blob/74fa4140380ed2468b4a1e9213349b427ab85577/plugin.html-validate.iframe.js

// (WE 2023-04-21) TODO: this is checking everything in parallel, I don't know why, we want it to run synchronously with timeouts

const { Rule } = require("html-validate");
const Database = require("better-sqlite3");
const fs = require("fs");

const CACHE_FOUND_EXPIRY = 60 * 60 * 24 * 30; // 30 days
const CACHE_NOT_FOUND_EXPIRY = 60 * 60 * 24 * 3; // 3 days

// Validate all external links point to a live thing
class ExternalLinks extends Rule {
  setup() {
    this.on("dom:ready", this.domReady.bind(this));
    // setup database
    fs.mkdirSync("cache", { recursive: true });
    const db = Database("cache/external-links.db");
    db.pragma("journal_mode = WAL");
    db.exec("CREATE TABLE IF NOT EXISTS urls (url UNIQUE NOT NULL, found INTEGER NOT NULL, time INTEGER NOT NULL)");
    db.exec("CREATE INDEX IF NOT EXISTS time ON urls (time)");
    db.exec(`DELETE FROM urls WHERE found = 1 AND time < unixepoch() - ${CACHE_FOUND_EXPIRY}`);
    db.exec(`DELETE FROM urls WHERE found = 0 AND time < unixepoch() - ${CACHE_NOT_FOUND_EXPIRY}`);
    this.db = db;
  }

  check(url, element) {
    if (!url) {
      return;
    }
    if (!url.startsWith("http")) {
      return;
    }
    // Check cache (synchronous)
    const row = this.db.prepare("SELECT found, time FROM urls WHERE url = ?").get(url);
    if (row) {
      if (row.found === 1) {
        return;
      }
      if (row.found === 0) {
        this.report({
          node: element,
          message: `external link is broken: ${url} (loaded cached from ${row.time})`,
        });
        return;
      }
    }
    // Try to fetch link (asynchronous), TODO: will be way better if this is synchronous, can avoid duplicate checking
    fetch(url, { method: "HEAD", timeout: 5000, redirect: "manual" })
      .then((response) => {
        if (response.ok) {
          this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 1, unixepoch())").run(url); // using REPLACE only because ASYNC requests :-( may run duplicate
          return;
        }
        this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 0, unixepoch())").run(url); // using REPLACE only because ASYNC requests :-( may run duplicate
        this.report({
          node: element,
          message: `external link is broken: ${url} (saving to cache)`,
        });
        return;
      })
      .catch((error) => {
        // If the error is because server is down, timeout, or refused connection, then treat as broken
        if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED") {
          this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 0, unixepoch())").run(url);
          this.report({
            node: element,
            message: `external link is broken: ${url} (saving to cache)`,
          });
          return;
        }
        // For other errors (what kinds?) use console.log but do not report a finding
        console.log("Error with fetch ERROR FETCHING LINK: ", url, error);
      });
  }

  domReady({ document }) {
    const aElements = document.getElementsByTagName("a");
    for (const aElement of aElements) {
      const href = aElement.getAttribute("href").value;
      // url decode this // hack, see https://gitlab.com/html-validate/html-validate/-/issues/218
      // decode &amp; to &
      const hrefDecoded = href.replace(/&amp;/g, "&");
      this.check(hrefDecoded, aElement);
    }
  }
}

module.exports = { ExternalLinks };

module.exports.rules = {
  "pacific-medical-training/external-links": ExternalLinks,
};
