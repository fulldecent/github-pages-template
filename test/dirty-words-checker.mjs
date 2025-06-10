import fs from "fs";
import path from "path";
import { glob } from "glob";

const CONFIG_FILE = path.join(process.cwd(), "test", "dirty-words.json");
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

// Check all files in the build directory
function findTargetFiles() {
  return glob
    .sync("**/*", {
      cwd: BUILD_DIR,
      nocase: true,
      dot: false,
    })
    .filter((file) => {
      const fullPath = path.join(BUILD_DIR, file);
      return fs.lstatSync(fullPath).isFile();
    });
}

// Check a single file against all patterns
function checkFile(filePath, patterns) {
  const fullPath = path.join(BUILD_DIR, filePath);
  const content = fs.readFileSync(fullPath, "utf-8");
  const violations = [];

  patterns.forEach((pattern) => {
    const flags = pattern.ignoreCase ? "gi" : "g";
    const regex = new RegExp(pattern.regexp, flags);

    const matches = content.match(regex);
    if (matches) {
      violations.push({
        pattern: pattern,
        matches: matches,
        count: matches.length,
      });
    }
  });

  return violations;
}

console.log("🧪 Testing files for dirty words");

const config = loadConfig();
const files = findTargetFiles();
let hasErrors = false;

files.forEach((file) => {
  const violations = checkFile(file, config);

  if (violations.length > 0) {
    hasErrors = true;
    console.log(`❌ ${file}:`);

    violations.forEach((violation) => {
      const { pattern, matches, count } = violation;
      console.error(`   ${pattern.severity.toUpperCase()}: ${pattern.note}`);
      console.log(`   Found ${count} matches:`);
      matches.forEach((match) => {
        console.log(`     "${match}"`);
      });
    });
  }
});

if (hasErrors) {
  console.error("\n❌ Dirty words check failed");
  process.exit(1);
} else {
  console.log("✨ All files passed dirty words check!\n");
}
