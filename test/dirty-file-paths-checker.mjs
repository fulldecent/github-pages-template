import fs from "fs";
import path from "path";
import { glob } from "glob";

const CONFIG_FILE = path.join(process.cwd(), "test", "dirty-file-paths.json");
const BUILD_DIR = path.join(process.cwd(), "build");

// Load and parse the configuration file
function loadConfig() {
  try {
    const configContent = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(configContent);
  } catch (error) {
    console.error("Error loading configuration:", error.message);
    process.exit(1);
  }
}

// Find all files in the build directory
function findTargetFiles() {
  return glob
    .sync("**/*", {
      cwd: BUILD_DIR,
      nocase: false, // Case sensitive as per requirements
      dot: false,
    })
    .filter((file) => {
      const fullPath = path.join(BUILD_DIR, file);
      return fs.lstatSync(fullPath).isFile();
    });
}

// Convert relative file path to the format expected by rules (starting with /)
function normalizePathForMatching(filePath) {
  // Convert backslashes to forward slashes and ensure it starts with /
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.startsWith("/") ? normalized : "/" + normalized;
}

// Check a single file's path against the dirty path rules
function checkFile(filePath, config) {
  const normalizedPath = normalizePathForMatching(filePath);

  // Process rules in order, later rules take precedence
  let finalRule = null;

  for (const rule of config) {
    try {
      const regex = new RegExp(rule.path);
      if (regex.test(normalizedPath)) {
        finalRule = rule;
      }
    } catch (error) {
      console.error(`Invalid regex pattern in rule: ${rule.path}`, error.message);
      process.exit(1);
    }
  }

  // Return violation only if the final matching rule is dirty
  if (finalRule && finalRule.dirty) {
    return { path: normalizedPath, advice: finalRule.advice };
  }

  return null;
}

console.log("🧪 Testing files for dirty file paths");

const config = loadConfig();
const files = findTargetFiles();
let hasErrors = false;
const violationsByPath = new Map();

// Collect violations
files.forEach((file) => {
  const violation = checkFile(file, config);
  if (violation) {
    hasErrors = true;
    console.log(`❌ ${file}: ${violation.advice}`);
    violationsByPath.set(violation.path, violation.advice);
  }
});

// Summary of clean files
const cleanFiles = files.filter((file) => !checkFile(file, config));
console.log(`✅ Site includes ${cleanFiles.length} clean files`);

// Summary of dirty paths
if (hasErrors) {
  console.log("Following are dirty file paths:");
  violationsByPath.forEach((advice, path) => {
    console.log(`${path} ${advice}`);
  });
  console.error("\n❌ Dirty paths check failed");
  process.exit(1);
} else {
  console.log("✨ All files passed dirty paths check!\n");
}
