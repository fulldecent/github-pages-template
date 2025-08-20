// find-unused-assets.mjs
import fs from "fs";
import path from "path";
import { glob } from "glob";
import { load } from "cheerio";

// Get target directory from command line argument or default to "build"
const TARGET_DIR = process.argv[2] ? path.resolve(process.argv[2]) : path.join(process.cwd(), "build");

// Show usage if help is requested
if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.log("Usage: node find-unused-assets.mjs [directory]");
  console.log("");
  console.log("Finds files that are not referenced from any HTML file in the target directory.");
  console.log("Files matching patterns in test/unused-assets-allowlist.json are ignored.");
  console.log("");
  console.log("Arguments:");
  console.log('  directory  Directory to scan (default: "./build")');
  console.log("");
  console.log("Examples:");
  console.log("  node find-unused-assets.mjs                        # Scan ./build directory");
  console.log("  node find-unused-assets.mjs /path/to/site          # Scan custom directory");
  console.log("  node find-unused-assets.mjs test/fixtures/clean    # Scan test fixtures");
  process.exit(0);
}

// Find all files in the target directory (excluding directories)
function findAllFiles() {
  return glob
    .sync("**/*", {
      cwd: TARGET_DIR,
      nocase: true,
      dot: true,
    })
    .filter((file) => fs.lstatSync(path.join(TARGET_DIR, file)).isFile());
}

// Find all HTML files in the target directory
function findHtmlFiles() {
  return glob
    .sync("**/*.html", {
      cwd: TARGET_DIR,
      nocase: true,
      dot: false,
    })
    .filter((file) => fs.lstatSync(path.join(TARGET_DIR, file)).isFile());
}

// Extract all asset references from HTML and CSS files
function extractAssetReferences(htmlFiles) {
  const references = new Set();

  htmlFiles.forEach((htmlFile) => {
    const content = fs.readFileSync(path.join(TARGET_DIR, htmlFile), "utf-8");
    const $ = load(content);
    const htmlDir = path.dirname(htmlFile);

    // Find all elements with src or href attributes that could reference assets
    $("[src], [href]").each((_, element) => {
      const $el = $(element);
      const src = $el.attr("src");
      const href = $el.attr("href");

      [src, href].forEach((url) => {
        if (url && !isExternalUrl(url) && !isDataUrl(url)) {
          const resolvedPath = resolveRelativeUrl(url, htmlDir);
          if (resolvedPath) {
            references.add(resolvedPath);

            // If the URL is extensionless, also check for .html version
            if (!path.extname(resolvedPath)) {
              references.add(resolvedPath + ".html");
            }

            // If this is a CSS file, parse it for url() references
            if (resolvedPath.endsWith(".css")) {
              parseCssFile(resolvedPath, references);
            }
          }
        }
      });
    });

    // Also scan the entire HTML content for CSS url() references
    const urlMatches = content.match(/url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/gi) || [];
    urlMatches.forEach((match) => {
      const urlMatch = match.match(/url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        if (!isExternalUrl(url) && !isDataUrl(url)) {
          const resolvedPath = resolveRelativeUrl(url, htmlDir);
          if (resolvedPath) {
            references.add(resolvedPath);
          }
        }
      }
    });
  });

  return references;
}

// Parse CSS file for url() references
function parseCssFile(cssFilePath, references) {
  try {
    const cssContent = fs.readFileSync(path.join(TARGET_DIR, cssFilePath), "utf-8");
    const cssDir = path.dirname(cssFilePath);

    const urlMatches = cssContent.match(/url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/gi) || [];
    urlMatches.forEach((match) => {
      const urlMatch = match.match(/url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        if (!isExternalUrl(url) && !isDataUrl(url)) {
          const resolvedPath = resolveRelativeUrl(url, cssDir);
          if (resolvedPath) {
            references.add(resolvedPath);
          }
        }
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not parse CSS file ${cssFilePath}:`, error.message);
  }
}

// Check if URL is external (starts with http/https or //)
function isExternalUrl(url) {
  return /^(https?:)?\/\//.test(url);
}

// Check if URL is a data URL
function isDataUrl(url) {
  return url.startsWith("data:");
}

// Resolve relative URL to file path relative to build directory
function resolveRelativeUrl(url, htmlDir) {
  try {
    // Remove query string and fragment
    const cleanUrl = url.split("?")[0].split("#")[0];

    let resolvedPath;
    if (cleanUrl.startsWith("/")) {
      // Absolute path relative to site root
      resolvedPath = cleanUrl.substring(1);
    } else {
      // Relative path
      resolvedPath = path.join(htmlDir, cleanUrl);
    }

    // Normalize the path (resolve .. and . segments)
    return path.normalize(resolvedPath);
  } catch (error) {
    return null;
  }
}

// Load configuration for allowlisted files
function loadConfig() {
  const configFile = path.join(process.cwd(), "test", "unused-assets-allowlist.json");
  try {
    if (fs.existsSync(configFile)) {
      const configContent = fs.readFileSync(configFile, "utf-8");
      return JSON.parse(configContent);
    }
  } catch (error) {
    console.warn("Warning: Could not load unused-assets-allowlist.json:", error.message);
  }
  return [];
}

// Check if a file should be ignored based on configuration
function shouldIgnoreFile(filePath, config) {
  return config.some((pattern) => {
    try {
      const regex = new RegExp(pattern);
      return regex.test(filePath);
    } catch (error) {
      console.warn(`Warning: Invalid regex pattern '${pattern}':`, error.message);
      return false;
    }
  });
}

// Main execution
console.log("🧪 Checking for unused files");
console.log(`📁 Scanning directory: ${TARGET_DIR}`);

// Verify target directory exists
if (!fs.existsSync(TARGET_DIR)) {
  console.error(`❌ Target directory does not exist: ${TARGET_DIR}`);
  process.exit(1);
}

const allFiles = findAllFiles();
const htmlFiles = findHtmlFiles();

// Filter files to get potential unused files (excluding those in allowlist)
const config = loadConfig();
const candidateFiles = allFiles.filter((file) => !shouldIgnoreFile(file, config));

if (candidateFiles.length === 0) {
  console.log("✨ No candidate files found to check (all files are in allowlist)");
  process.exit(0);
}

if (htmlFiles.length === 0) {
  console.log("❌ No HTML files found in target directory");
  process.exit(1);
}

console.log(`📄 Found ${candidateFiles.length} candidate files and ${htmlFiles.length} HTML files`);

const referencedAssets = extractAssetReferences(htmlFiles);
const unusedAssets = [];

candidateFiles.forEach((file) => {
  const normalizedPath = path.normalize(file);

  if (!referencedAssets.has(normalizedPath)) {
    unusedAssets.push(normalizedPath);
  }
});

if (unusedAssets.length > 0) {
  console.log("\n❌ Found unused files:");
  unusedAssets.forEach((asset) => {
    console.log(`   ${asset}`);
  });

  console.error(`\n❌ Found ${unusedAssets.length} unused files`);
  process.exit(1);
} else {
  console.log("\n✨ No unused files found!");
}
