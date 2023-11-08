// Must use CommonJS and not ES modules
// Source: https://gitlab.com/html-validate/html-validate/-/issues/214
// and: https://gitlab.com/html-validate/html-validate/-/issues/125
// Inspiration: https://github.com/Intecmedia/Intecmedia.Webpack/blob/74fa4140380ed2468b4a1e9213349b427ab85577/plugin.html-validate.iframe.js

// (WE 2023-04-21) TODO: this is checking everything in parallel, I don't know why, we want it to run synchronously with timeouts

const { Rule } = require("html-validate");
const Database = require("better-sqlite3");
const fs = require("fs");

const CACHE_TIME = 60 * 60 * 24 * 2; // 2 days

// Latest packages
// Ensure that Bootstrap, Bootstrap Icons and other packages use the latest versions
class LatestPackages extends Rule {
  setup() {
    this.on("dom:ready", this.domReady.bind(this));
    // setup database
    fs.mkdirSync("cache", { recursive: true });
    const db = Database("cache/latest-packages.db");
    db.pragma("journal_mode = WAL");
    db.exec(
      "CREATE TABLE IF NOT EXISTS latest_packages (url UNIQUE NOT NULL, current INTEGER NOT NULL, time INTEGER NOT NULL)"
    );
    db.exec("CREATE INDEX IF NOT EXISTS time ON latest_packages (time)");
    db.exec(`DELETE FROM latest_packages WHERE time < unixepoch() - ${CACHE_TIME}`);
    this.db = db;
  }

  check(url, element) {
    // Skip if URL is empty
    if (!url) {
      return;
    }
    // Skip if URL is local
    if (!url.startsWith("http")) {
      return;
    }
    // Skip if Google Analytics 🙁 googletagmanager.com
    if (url.includes("googletagmanager.com")) {
      return;
    }
    // Confirm using integrity + crossorigin
    if (!element.hasAttribute("integrity") || !element.hasAttribute("crossorigin")) {
      this.report({
        node: element,
        message: `missing integrity + crossorigin for ${url}`,
      });
    }
    // Check cache
    const row = this.db.prepare("SELECT current, time FROM latest_packages WHERE url = ?").get(url);
    if (row) {
      if (row.current === 1) {
        return;
      } else {
        this.report({
          node: element,
          message: `using outdated package version ${url} (loaded cached from ${row.time})`,
        });
        return;
      }
    }
    // Try to research by fetching (asynchronous), TODO: will be way better if this is synchronous, can avoid duplicate checking

    // If if this package is on jsDelivr...
    if (url.includes("jsdelivr")) {
      // URL is like https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js
      // or https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css
      const packageNameAndVersion = url.split("/")[4];
      const packageName = packageNameAndVersion.split("@")[0];
      const packageVersion = packageNameAndVersion.split("@")[1];

      try {
        fetch(`https://data.jsdelivr.com/v1/package/npm/${packageName}`, { redirect: "manual" })
          .then((response) => {
            if (response.status === 200) {
              return response.json();
            } else {
              throw new Error(`jsDelivr API returned status ${response.status}`);
            }
          })
          .then((result) => {
            // result is like {"latest": "5.2.3", "latest-3": "3.4.1", "latest-4": "4.6.2", "latest-5": "5.2.3", "next-5": "5.3.0-alpha3"}
            // Is packageVersion in result.tags?
            if (Object.values(result.tags).includes(packageVersion)) {
              this.db.prepare("REPLACE INTO latest_packages (url, current, time) VALUES (?, 1, unixepoch())").run(url); // using REPLACE only because ASYNC requests :-( may run duplicate
              return;
            } else {
              this.db.prepare("REPLACE INTO latest_packages (url, current, time) VALUES (?, 0, unixepoch())").run(url); // using REPLACE only because ASYNC requests :-( may run duplicate
              this.report({
                node: element,
                message: `using outdated package version ${url} (saving to cache)`,
              });
              return;
            }
          })
          .catch((e) => {
            console.error(e);
            this.report({
              node: element,
              message: `error checking package version ${url}: ${e}`,
            });
            return;
          });
      } catch (e) {
        console.error(e);
        this.report({
          node: element,
          message: `error checking package version ${url}: ${e}`,
        });
        return;
      }
      return;
    }
  }

  domReady({ document }) {
    // check scripts
    const scriptElements = document.getElementsByTagName("script");
    for (const scriptElement of scriptElements) {
      const src = scriptElement.getAttribute("src")?.value;
      this.check(src, scriptElement);
    }
    // check css
    const linkElements = document.getElementsByTagName("link");
    for (const linkElement of linkElements) {
      // skip if not stylesheet
      if (linkElement.getAttribute("rel")?.value !== "stylesheet") {
        continue;
      }
      const href = linkElement.getAttribute("href")?.value;
      this.check(href, linkElement);
    }
  }
}

module.exports = { LatestPackages };

module.exports.rules = {
  "pacific-medical-training/latest-packages": LatestPackages,
};
