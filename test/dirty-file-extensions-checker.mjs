import fs from "fs";
import path from "path";
import { glob } from "glob";

const CONFIG_FILE = path.join(process.cwd(), "test", "dirty-file-extensions.json");
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
      nocase: true,
      dot: false,
    })
    .filter((file) => {
      const fullPath = path.join(BUILD_DIR, file);
      return fs.lstatSync(fullPath).isFile();
    });
}

// Check a single file's extension against the disallowed extensions
function checkFile(filePath, config) {
  const ext = path.extname(filePath).toLowerCase();
  const violation = config.find((item) => `.${item.extension.toLowerCase()}` === ext);
  return violation ? { extension: ext, advice: violation.advice } : null;
}

console.log("🧪 Testing files for dirty file extensions");

const config = loadConfig();
const files = findTargetFiles();
let hasErrors = false;
const violationsByExtension = new Map();

// Collect violations
files.forEach((file) => {
  const violation = checkFile(file, config);
  if (violation) {
    hasErrors = true;
    console.log(`❌ ${file}: ${violation.advice}`);
    violationsByExtension.set(violation.extension, violation.advice);
  }
});

// Summary of allowed extensions
const allowedExtensions = new Set(
  files.map((file) => path.extname(file).toLowerCase()).filter((ext) => !violationsByExtension.has(ext) && ext !== ""),
);
const allowedExtensionsString =
  allowedExtensions.size > 0
    ? Array.from(allowedExtensions)
        .map((ext) => ext.slice(1))
        .join(" ")
    : "none";

console.log(`✅ Site includes file extensions: ${allowedExtensionsString}`);

// Summary of dirty extensions
if (hasErrors) {
  console.log("Following are dirty file extensions:");
  violationsByExtension.forEach((advice, extension) => {
    console.log(`${extension} ${advice}`);
  });
  console.error("\n❌ Dirty extensions check failed");
  process.exit(1);
} else {
  console.log("✨ All files passed dirty extensions check!\n");
}
