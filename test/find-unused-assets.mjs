// find-unused-assets.mjs
import fs from "fs";
import path from "path";
import { glob } from "glob";
import { load } from "cheerio";

const BUILD_DIR = path.join(process.cwd(), "build");

// Asset file extensions to check
const ASSET_EXTENSIONS = [
  "css", "js", "jpg", "jpeg", "png", "gif", "svg", "webp",
  "woff", "woff2", "ttf", "otf", "eot", "ico", "mp4", "webm",
  "mp3", "wav", "ogg", "pdf", "zip", "tar", "gz"
];

// Find all asset files in the build directory
function findAssetFiles() {
  const extensions = ASSET_EXTENSIONS.map(ext => `**/*.${ext}`);
  return glob
    .sync(extensions, {
      cwd: BUILD_DIR,
      nocase: true,
      dot: false,
    })
    .filter((file) => fs.lstatSync(path.join(BUILD_DIR, file)).isFile());
}

// Find all HTML files in the build directory
function findHtmlFiles() {
  return glob
    .sync("**/*.html", {
      cwd: BUILD_DIR,
      nocase: true,
      dot: false,
    })
    .filter((file) => fs.lstatSync(path.join(BUILD_DIR, file)).isFile());
}

// Extract all asset references from HTML files
function extractAssetReferences(htmlFiles) {
  const references = new Set();

  htmlFiles.forEach((htmlFile) => {
    const content = fs.readFileSync(path.join(BUILD_DIR, htmlFile), "utf-8");
    const $ = load(content);
    const htmlDir = path.dirname(htmlFile);

    // Find all elements with src or href attributes that could reference assets
    $("[src], [href]").each((_, element) => {
      const $el = $(element);
      const src = $el.attr("src");
      const href = $el.attr("href");
      
      [src, href].forEach(url => {
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
  });

  return references;
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
  return config.some(pattern => {
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
console.log("🧪 Checking for unused asset files");

const assetFiles = findAssetFiles();
const htmlFiles = findHtmlFiles();

if (assetFiles.length === 0) {
  console.log("✨ No asset files found in build directory");
  process.exit(0);
}

if (htmlFiles.length === 0) {
  console.log("❌ No HTML files found in build directory");
  process.exit(1);
}

console.log(`📄 Found ${assetFiles.length} asset files and ${htmlFiles.length} HTML files`);

const referencedAssets = extractAssetReferences(htmlFiles);
const config = loadConfig();
const unusedAssets = [];

assetFiles.forEach((assetFile) => {
  const normalizedPath = path.normalize(assetFile);
  
  if (!referencedAssets.has(normalizedPath) && !shouldIgnoreFile(normalizedPath, config)) {
    unusedAssets.push(normalizedPath);
  }
});

if (unusedAssets.length > 0) {
  console.log("\n❌ Found unused asset files:");
  unusedAssets.forEach((asset) => {
    console.log(`   ${asset}`);
  });
  
  console.error(`\n❌ Found ${unusedAssets.length} unused asset files`);
  process.exit(1);
} else {
  console.log("\n✨ No unused asset files found!");
}