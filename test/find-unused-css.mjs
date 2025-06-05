// find-unused-css.mjs
import fs from "fs";
import path from "path";
import { glob } from "glob";
import css from "css";
import { load } from "cheerio"; // Correct named import for cheerio

const BUILD_DIR = path.join(process.cwd(), "build");

// Find all CSS and HTML files in the build directory
function findTargetFiles() {
  return {
    cssFiles: glob
      .sync("**/*.css", {
        cwd: BUILD_DIR,
        nocase: true,
        dot: false,
      })
      .filter((file) => fs.lstatSync(path.join(BUILD_DIR, file)).isFile()),
    htmlFiles: glob
      .sync("**/*.html", {
        cwd: BUILD_DIR,
        nocase: true,
        dot: false,
      })
      .filter((file) => fs.lstatSync(path.join(BUILD_DIR, file)).isFile()),
  };
}

// Extract class and ID selectors from a CSS file
function extractSelectors(cssFile) {
  const content = fs.readFileSync(path.join(BUILD_DIR, cssFile), "utf-8");
  const parsed = css.parse(content);
  const selectors = new Set();

  parsed.stylesheet.rules.forEach((rule) => {
    if (rule.type === "rule" && rule.selectors) {
      rule.selectors.forEach((selector) => {
        // Extract class (.class) and ID (#id) selectors
        const classMatches = selector.match(/\.[\w-]+/g) || [];
        const idMatches = selector.match(/#[\w-]+/g) || [];
        classMatches.forEach((cls) => selectors.add(cls));
        idMatches.forEach((id) => selectors.add(id));
      });
    }
  });

  return selectors;
}

// Check if selectors are used in HTML files
function checkSelectorsInHtml(selectors, htmlFiles) {
  const unusedSelectors = new Set(selectors);
  const usedSelectors = new Set();

  htmlFiles.forEach((htmlFile) => {
    const content = fs.readFileSync(path.join(BUILD_DIR, htmlFile), "utf-8");
    const $ = load(content); // Use named import 'load' from cheerio

    selectors.forEach((selector) => {
      if (selector.startsWith(".")) {
        const className = selector.slice(1);
        if ($(`[class~="${className}"]`).length > 0) {
          unusedSelectors.delete(selector);
          usedSelectors.add(selector);
        }
      } else if (selector.startsWith("#")) {
        const idName = selector.slice(1);
        if ($(`#${idName}`).length > 0) {
          // Fixed typo: '# Meters[idName]' to '#${idName}'
          unusedSelectors.delete(selector);
          usedSelectors.add(selector);
        }
      }
    });
  });

  return { unusedSelectors, usedSelectors };
}

// Main execution
console.log("🧪 Checking for unused CSS selectors");

const { cssFiles, htmlFiles } = findTargetFiles();
if (cssFiles.length === 0) {
  console.log("❌ No CSS files found in build directory");
  process.exit(1);
}
if (htmlFiles.length === 0) {
  console.log("❌ No HTML files found in build directory");
  process.exit(1);
}

let hasUnused = false;

cssFiles.forEach((cssFile) => {
  console.log(`\n📄 Analyzing ${cssFile}:`);
  const selectors = extractSelectors(cssFile);
  if (selectors.size === 0) {
    console.log("   No class or ID selectors found");
    return;
  }

  const { unusedSelectors, usedSelectors } = checkSelectorsInHtml(selectors, htmlFiles);

  if (unusedSelectors.size > 0) {
    hasUnused = true;
    console.log("   ❌ Unused selectors:");
    unusedSelectors.forEach((selector) => {
      console.log(`     ${selector}`);
    });
  }

  console.log(`   ✅ Used selectors: ${usedSelectors.size}`);
});

if (hasUnused) {
  console.error("\n❌ Found unused CSS selectors");
  process.exit(1);
} else {
  console.log("\n✨ No unused CSS selectors found!");
}
