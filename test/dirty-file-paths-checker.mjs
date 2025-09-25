import fs from "fs";
import path from "path";
import { globSync } from "glob";

const CONFIG_FILE = path.join(process.cwd(), "test", "dirty-file-paths.json");
const BUILD_DIR = path.join(process.cwd(), "build");

/**
 * Loads and parses the configuration file for dirty path rules.
 * @returns {object[]} The parsed configuration.
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(`❌ Error: Configuration file not found at ${CONFIG_FILE}`);
    process.exit(1);
  }
  try {
    const configContent = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(configContent);
  } catch (error) {
    console.error("❌ Error loading or parsing configuration:", error.message);
    process.exit(1);
  }
}

/**
 * Gathers target files from command-line arguments or the default build directory.
 * @returns {string[]} An array of absolute file paths to check.
 */
function getTargetFiles() {
  const args = process.argv.slice(2);

  // If no arguments, default to all files in the build directory.
  if (args.length === 0) {
    return globSync(path.join(BUILD_DIR, "**", "*"), {
      nodir: true,
      absolute: true,
    });
  }

  // Process arguments as file paths, directory paths, or glob patterns.
  const patterns = args.map((arg) => {
    try {
      if (fs.statSync(arg).isDirectory()) {
        // If it's a directory, create a glob to find all files within it.
        return path.join(arg, "**", "*");
      }
    } catch (e) {
      // Not a directory or doesn't exist, treat as a file/glob.
    }
    return arg;
  });

  console.log(`ℹ️  Searching for files matching: ${patterns.join(", ")}`);
  return globSync(patterns, {
    nodir: true,
    absolute: true,
  });
}

/**
 * Converts a file path to the format expected by rules (e.g., /path/to/file.html).
 * @param {string} filePath - The file path relative to the build directory.
 * @returns {string} The normalized path.
 */
function normalizePathForMatching(filePath) {
  // Convert backslashes to forward slashes and ensure it starts with /
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.startsWith("/") ? normalized : "/" + normalized;
}

/**
 * Checks a single file's path against the dirty path rules.
 * @param {string} relativeFilePath - The path of the file relative to the build directory.
 * @param {object[]} config - The array of rules.
 * @returns {object | null} A violation object or null if the path is clean.
 */
function checkFile(relativeFilePath, config) {
  const normalizedPath = normalizePathForMatching(relativeFilePath);
  let finalRule = null;

  for (const rule of config) {
    try {
      const regex = new RegExp(rule.path);
      if (regex.test(normalizedPath)) {
        finalRule = rule;
      }
    } catch (error) {
      console.error(`❌ Invalid regex in rule: ${rule.path}`, error.message);
      process.exit(1);
    }
  }

  // Return a violation only if the final matching rule is 'dirty: true'.
  if (finalRule && finalRule.dirty) {
    return { path: normalizedPath, advice: finalRule.advice };
  }

  return null;
}

console.log("🧪 Testing files for dirty file paths");

const config = loadConfig();
const absoluteFilePaths = getTargetFiles();
let hasErrors = false;
const violations = [];
const cleanFiles = [];

if (absoluteFilePaths.length === 0) {
  console.log("⚠️  No files found to check.");
  process.exit(0);
}

// Collect all violations and clean files
for (const absolutePath of absoluteFilePaths) {
  // Rules are based on the path relative to the site root (the build dir).
  const relativeToBuildDir = path.relative(BUILD_DIR, absolutePath);
  const violation = checkFile(relativeToBuildDir, config);

  // Use a path relative to the current working directory for user-friendly logging.
  const relativeToCwd = path.relative(process.cwd(), absolutePath);

  if (violation) {
    hasErrors = true;
    violations.push({ path: relativeToCwd, advice: violation.advice });
  } else {
    cleanFiles.push(relativeToCwd);
  }
}

// --- Report results ---

// First, log all the individual failures.
if (hasErrors) {
  console.log("\n---");
  violations.forEach(({ path, advice }) => {
    console.log(`❌ ${path}: ${advice}`);
  });
  console.log("---\n");
}

console.log(`📊 Results Summary:`);
console.log(`✅ Found ${cleanFiles.length} clean file paths.`);

if (hasErrors) {
  console.log(`❌ Found ${violations.length} dirty file paths.`);
  console.error("\n❌ Dirty paths check failed.");
  process.exit(1);
} else {
  console.log("✨ All file paths passed the check!\n");
}
