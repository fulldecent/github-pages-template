// TODO: use fetch API

import { Rule } from "html-validate";
import Database from "better-sqlite3";
import fs from "fs";
import { execSync } from "child_process";

const CACHE_TIME = 60 * 60 * 24 * 2; // 2 days

export default class LatestPackages extends Rule {
  setup() {
    this.on("dom:ready", this.domReady.bind(this));
    this.db = this.setupDatabase();
  }

  setupDatabase() {
    fs.mkdirSync("cache", { recursive: true });
    const db = new Database("cache/latest-packages.db");
    db.exec(
      "CREATE TABLE IF NOT EXISTS latest_packages (url UNIQUE NOT NULL, current INTEGER NOT NULL, time INTEGER NOT NULL)",
    );
    db.exec("CREATE INDEX IF NOT EXISTS time ON latest_packages (time)");
    db.exec(`DELETE FROM latest_packages WHERE time < unixepoch() - ${CACHE_TIME}`);
    return db;
  }

  check(url, element) {
    if (!url || !url.startsWith("http") || url.includes("googletagmanager.com")) {
      return;
    }

    if (!element.hasAttribute("integrity") || !element.hasAttribute("crossorigin")) {
      this.report({
        node: element,
        message: `missing integrity + crossorigin for ${url}`,
      });
    }

    const row = this.db.prepare("SELECT current, time FROM latest_packages WHERE url = ?").get(url);
    if (row) {
      if (row.current === 0) {
        this.report({
          node: element,
          message: `using outdated package version ${url}`,
        });
      }
      return;
    }

    if (url.includes("jsdelivr")) {
      const packageNameAndVersion = url.split("/")[4];
      const packageName = packageNameAndVersion.split("@")[0];
      const packageVersion = packageNameAndVersion.split("@")[1];

      try {
        const result = execSync(
          `curl --silent --fail --location "https://data.jsdelivr.com/v1/package/npm/${packageName}"`,
        );
        const data = JSON.parse(result.toString());

        if (Object.values(data.tags).includes(packageVersion)) {
          this.db.prepare("REPLACE INTO latest_packages (url, current, time) VALUES (?, 1, unixepoch())").run(url);
        } else {
          this.db.prepare("REPLACE INTO latest_packages (url, current, time) VALUES (?, 0, unixepoch())").run(url);
          this.report({
            node: element,
            message: `using outdated package version ${url}`,
          });
        }
      } catch (e) {
        console.error(e);
        this.report({
          node: element,
          message: `error checking package version ${url}: ${e}`,
        });
      }
    }
  }

  domReady({ document }) {
    const scriptElements = document.getElementsByTagName("script");
    for (const scriptElement of scriptElements) {
      const src = scriptElement.getAttribute("src")?.value;
      this.check(src, scriptElement);
    }

    const linkElements = document.getElementsByTagName("link");
    for (const linkElement of linkElements) {
      if (linkElement.getAttribute("rel")?.value !== "stylesheet") {
        continue;
      }
      const href = linkElement.getAttribute("href")?.value;
      this.check(href, linkElement);
    }
  }
}
