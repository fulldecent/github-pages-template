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

// Find files that may contain asset references (HTML, CSS, JSON, JS, .htaccess)
function findReferenceFiles() {
  const patterns = [
    "**/*.html",
    "**/*.css",
    "**/*.webmanifest",
    "**/*.json",
    "**/*.js",
    "**/*.mjs",
    "**/.htaccess",
    "**/manifest.json",
  ];

  const allReferenceFiles = new Set();

  patterns.forEach((pattern) => {
    const files = glob
      .sync(pattern, {
        cwd: TARGET_DIR,
        nocase: true,
        dot: true, // Include .htaccess files
      })
      .filter((file) => fs.lstatSync(path.join(TARGET_DIR, file)).isFile());

    files.forEach((file) => allReferenceFiles.add(file));
  });

  return Array.from(allReferenceFiles);
}

// Extract all asset references from HTML, CSS, JSON, JS, and .htaccess files
function extractAssetReferences(referenceFiles) {
  const references = new Set();

  referenceFiles.forEach((refFile) => {
    const content = fs.readFileSync(path.join(TARGET_DIR, refFile), "utf-8");
    const refDir = path.dirname(refFile);
    const fileExt = path.extname(refFile).toLowerCase();

    if (fileExt === ".html") {
      extractFromHtml(content, refDir, references);
    } else if (fileExt === ".css") {
      extractFromCss(content, refDir, references);
    } else if (fileExt === ".webmanifest" || fileExt === ".json") {
      extractFromJson(content, refDir, references);
    } else if (fileExt === ".js" || fileExt === ".mjs") {
      extractFromJs(content, refDir, references);
    } else if (refFile.endsWith(".htaccess")) {
      extractFromHtaccess(content, refDir, references);
    }
  });

  return references;
}

// Extract asset references from HTML content
function extractFromHtml(content, htmlDir, references) {
  const $ = load(content);

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
        }
      }
    });
  });

  // Also scan the entire HTML content for CSS url() references
  extractUrlReferences(content, htmlDir, references);
}

// Extract asset references from CSS content
function extractFromCss(content, cssDir, references) {
  extractUrlReferences(content, cssDir, references);
}

// Extract asset references from JSON content (webmanifest, etc.)
function extractFromJson(content, jsonDir, references) {
  try {
    const jsonData = JSON.parse(content);
    const jsonString = JSON.stringify(jsonData);

    // Look for image/asset paths in JSON string values
    const pathMatches =
      jsonString.match(/"([^"]*\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot))"[^/\\a-zA-Z]/gi) || [];
    pathMatches.forEach((match) => {
      const pathMatch = match.match(/"([^"]+)"/);
      if (pathMatch && pathMatch[1]) {
        const url = pathMatch[1];
        if (!isExternalUrl(url) && !isDataUrl(url)) {
          const resolvedPath = resolveRelativeUrl(url, jsonDir);
          if (resolvedPath) {
            references.add(resolvedPath);
          }
        }
      }
    });
  } catch (error) {
    // If JSON parsing fails, fall back to regex search
    extractUrlReferences(content, jsonDir, references);
  }
}

// Extract asset references from JavaScript content
function extractFromJs(content, jsDir, references) {
  // Look for asset paths in strings (single quotes, double quotes, or backticks)
  const patterns = [
    /'([^']*\.(png|jpg|jpeg|gif|webp|svg|ico|css|html|js|woff|woff2|ttf|eot))'/gi,
    /"([^"]*\.(png|jpg|jpeg|gif|webp|svg|ico|css|html|js|woff|woff2|ttf|eot))"/gi,
    /`([^`]*\.(png|jpg|jpeg|gif|webp|svg|ico|css|html|js|woff|woff2|ttf|eot))`/gi,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const url = match[1];
      if (!isExternalUrl(url) && !isDataUrl(url)) {
        // For JS files, try both relative to JS dir and relative to site root
        let resolvedPath = resolveRelativeUrl(url, jsDir);

        // If the path doesn't start with / or ./ or ../, and we're not in the root,
        // also try it as a site-root-relative path
        if (!url.startsWith("/") && !url.startsWith("./") && !url.startsWith("../") && jsDir !== ".") {
          const siteRootPath = path.normalize(url);
          references.add(siteRootPath);
        }

        if (resolvedPath) {
          references.add(resolvedPath);
        }
      }
    }
  });

  // Also check for url() references
  extractUrlReferences(content, jsDir, references);
}

// Extract asset references from .htaccess content
function extractFromHtaccess(content, htaccessDir, references) {
  // Look for file paths in .htaccess rules
  const pathMatches =
    content.match(/[\/\w.-]+\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|html|woff|woff2|ttf|eot|pdf|doc|docx)\b/gi) || [];
  pathMatches.forEach((path) => {
    if (!isExternalUrl(path)) {
      const resolvedPath = resolveRelativeUrl(path, htaccessDir);
      if (resolvedPath) {
        references.add(resolvedPath);
      }
    }
  });
}

// Extract URL references from any content
function extractUrlReferences(content, contentDir, references) {
  const urlMatches = content.match(/url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/gi) || [];
  urlMatches.forEach((match) => {
    const urlMatch = match.match(/url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    if (urlMatch && urlMatch[1]) {
      const url = urlMatch[1];
      if (!isExternalUrl(url) && !isDataUrl(url)) {
        const resolvedPath = resolveRelativeUrl(url, contentDir);
        if (resolvedPath) {
          references.add(resolvedPath);
        }
      }
    }
  });
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
const referenceFiles = findReferenceFiles();
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

console.log(
  `📄 Found ${candidateFiles.length} candidate files, ${referenceFiles.length} reference files, and ${htmlFiles.length} HTML files`,
);

const referencedAssets = extractAssetReferences(referenceFiles);
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
