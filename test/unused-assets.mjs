import fs from "fs";
import path from "path";
import { globSync } from "glob";

/**
 * UNUSED ASSETS CHECKER
 *
 * This is a VERY NAIVE test that identifies potentially unused assets in the build folder.
 *
 * How it works:
 * 1. Scans all files in the build directory
 * 2. Excludes files matching the EXCLUDE_PATTERNS (default: HTML files)
 * 3. Creates a mapping of base filenames to their full paths
 * 4. Searches through all build files for references to each base filename
 * 5. Reports any files whose base names are never mentioned anywhere
 *
 * Limitations (under reporting):
 * 1. If the basename of an asset is mentioned anywhere (even if not actually used), it will NOT be reported
 *
 * Limitations (over reporting):
 * 1. If another website or external source references the asset, it will be reported as unused
 * 2. If the asset is referenced in a way that does not include the base filename (e.g., dynamically constructed paths), it will be reported as unused
 * 3. If the asset is referenced with URL encoding or special characters, it may be reported as unused
 *
 * This is useful for finding obviously unused files, but manual review is recommended
 * before deleting anything identified by this test.
 */

const BUILD_DIR = path.join(process.cwd(), "build");

// Configurable: Regular expressions to exclude files from being checked as potential unused assets
// By default, we exclude HTML files since they are the primary content, not assets
// If there are assets in this site which are not referenced by filename
const EXCLUDE_PATTERNS = [/\.html$/, /\/robots\.txt$/, /\/favicon\.ico$/, /\/sitemap\.xml$/];

/**
 * Determines if a file should be excluded based on EXCLUDE_PATTERNS
 * @param {string} filePath - The full file path to check
 * @returns {boolean} True if the file should be excluded
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Gets all files in the build directory
 * @returns {string[]} Array of absolute file paths
 */
function getAllBuildFiles() {
  return globSync(path.join(BUILD_DIR, "**", "*"), {
    nodir: true,
    absolute: true,
  });
}

/**
 * Creates a mapping of base filenames to their full paths
 * @param {string[]} files - Array of file paths
 * @returns {Map<string, string[]>} Map where key is base filename, value is array of full paths
 */
function createBaseNameMapping(files) {
  const mapping = new Map();

  for (const file of files) {
    if (shouldExclude(file)) {
      continue;
    }

    const baseName = path.basename(file);
    if (!mapping.has(baseName)) {
      mapping.set(baseName, []);
    }
    mapping.get(baseName).push(file);
  }

  return mapping;
}

/**
 * Searches all build files for references to the given base names
 * @param {string[]} allFiles - All files to search through
 * @param {Map<string, string[]>} baseNameMap - Map of base names to check
 * @returns {Map<string, string[]>} Map of base names that were NOT found anywhere
 */
function findUnreferencedAssets(allFiles, baseNameMap) {
  const unreferenced = new Map(baseNameMap);

  for (const file of allFiles) {
    // Skip binary files that we can't meaningfully search
    if (/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|otf)$/i.test(file)) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(file, "utf-8");
    } catch (error) {
      // Skip files we can't read
      continue;
    }

    // Check each remaining base name to see if it appears in this file
    for (const baseName of unreferenced.keys()) {
      if (content.includes(baseName)) {
        unreferenced.delete(baseName);

        // Early exit if we've found all files
        if (unreferenced.size === 0) {
          return unreferenced;
        }
      }
    }
  }

  return unreferenced;
}

/**
 * Main execution function
 */
function main() {
  console.log("🔍 Scanning for unused assets in the build directory...\n");

  // Get all files
  const allFiles = getAllBuildFiles();
  console.log(`ℹ️  Found ${allFiles.length} total files in build directory`);

  // Create base name mapping for potential assets
  const baseNameMap = createBaseNameMapping(allFiles);
  const assetCount = Array.from(baseNameMap.values()).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`ℹ️  Checking ${assetCount} potential asset files (${baseNameMap.size} unique base names)`);
  console.log(`ℹ️  Excluded patterns: ${EXCLUDE_PATTERNS.map((p) => p.toString()).join(", ")}\n`);

  // Find unreferenced assets
  const unreferenced = findUnreferencedAssets(allFiles, baseNameMap);

  // Report results
  if (unreferenced.size === 0) {
    console.log("✅ No unused assets detected!");
    process.exit(0);
  } else {
    console.log(`❌ Found ${unreferenced.size} base name(s) that appear to be unused:\n`);

    const sortedBaseNames = Array.from(unreferenced.keys()).sort();
    for (const baseName of sortedBaseNames) {
      const paths = unreferenced.get(baseName);
      console.log(`  ${baseName}:`);
      for (const p of paths) {
        const relativePath = path.relative(BUILD_DIR, p);
        console.log(`    - /${relativePath}`);
      }
      console.log();
    }

    console.log("⚠️  Note: This is a naive check. Please manually verify before deleting files.");
    process.exit(1);
  }
}

main();
