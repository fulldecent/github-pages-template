import { Rule } from "html-validate";
import Database from "better-sqlite3";
import fs from "fs";
import { execSync } from "child_process";

const CACHE_FOUND_EXPIRY = 60 * 60 * 24 * 30; // 30 days
const CACHE_NOT_FOUND_EXPIRY = 60 * 60 * 24 * 3; // 3 days
const TASK_PARALLELISM = 10;
const TIMEOUT_SECONDS = 5;

// TODO: try to use this for parallel fetching (lol after switching to fetch API)

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

export default class ExternalLinksRule extends Rule {
  documentation() {
    return {
      description: "Require all external links to be live.",
      url: "https://github.com/fulldecent/github-pages-template/#external-links",
    };
  }

  setup() {
    this.db = this.setupDatabase();
    this.on("dom:ready", this.domReady.bind(this));
  }

  setupDatabase() {
    fs.mkdirSync("cache", { recursive: true });
    const db = new Database("cache/external-links.db");
    db.pragma("journal_mode = WAL");
    db.exec("CREATE TABLE IF NOT EXISTS urls (url UNIQUE NOT NULL, found INTEGER NOT NULL, time INTEGER NOT NULL)");
    db.exec("CREATE INDEX IF NOT EXISTS time ON urls (time)");
    db.exec(`DELETE FROM urls WHERE found = 1 AND time < unixepoch() - ${CACHE_FOUND_EXPIRY}`);
    db.exec(`DELETE FROM urls WHERE found = 0 AND time < unixepoch() - ${CACHE_NOT_FOUND_EXPIRY}`);
    return db;
  }

  check(url, element) {
    if (!url || !url.startsWith("http")) {
      return
    }

    const row = this.db.prepare("SELECT found, time FROM urls WHERE url = ?").get(url);
    if (row) {
      // Link is bad, from recent cache
      if (row.found === 0) {
        this.report({
          node: element,
          message: `external link is broken: ${url}`,
        });
      }
      return;
    }

    try {
      const result = execSync(`curl --head --silent --fail --max-time ${TIMEOUT_SECONDS} --location "${url}"`);
      // Success: link is good
      this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 1, unixepoch())").run(url);
    } catch (error) {
      this.report({
        node: element,
        message: `external link is broken: ${url}`,
      });
      this.db.prepare("REPLACE INTO urls (url, found, time) VALUES (?, 0, unixepoch())").run(url);
    }
  }

  domReady({ document }) {
    const aElements = document.getElementsByTagName("a");
    for (const aElement of aElements) {
      const href = aElement.getAttribute("href").value;
      if (!href || href.startsWith("tel:")) continue;
      const hrefDecoded = href.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#63;/g, '?');
      this.check(hrefDecoded, aElement);
    }
  }
}