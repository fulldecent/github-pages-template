import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BUILD_DIR = path.join(process.cwd(), "build");

console.log("🧪 Testing extensionless symlinks creation");

/**
 * Test the symlink creation script
 */
function testSymlinkCreation() {
  let hasErrors = false;

  // Check if build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error("❌ Build directory does not exist. Please build the site first.");
    process.exit(1);
  }

  // Find all HTML files
  function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        findHtmlFiles(filePath, fileList);
      } else if (path.extname(file) === ".html") {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  const htmlFiles = findHtmlFiles(BUILD_DIR);

  if (htmlFiles.length === 0) {
    console.log("⚠️  No HTML files found in build directory");
    return !hasErrors;
  }

  console.log(`Found ${htmlFiles.length} HTML files`);

  // Test each HTML file (except index.html files)
  htmlFiles.forEach((htmlFile) => {
    const dir = path.dirname(htmlFile);
    const basename = path.basename(htmlFile, ".html");
    
    // Skip index.html files
    if (basename === "index") {
      return;
    }

    const symlinkPath = path.join(dir, basename);
    const expectedTarget = path.basename(htmlFile);

    // Check if symlink exists
    if (!fs.existsSync(symlinkPath)) {
      console.error(`❌ Missing symlink: ${path.relative(BUILD_DIR, symlinkPath)}`);
      hasErrors = true;
      return;
    }

    // Check if it's actually a symlink
    if (!fs.lstatSync(symlinkPath).isSymbolicLink()) {
      console.error(`❌ Not a symlink: ${path.relative(BUILD_DIR, symlinkPath)}`);
      hasErrors = true;
      return;
    }

    // Check if symlink points to correct target
    const actualTarget = fs.readlinkSync(symlinkPath);
    if (actualTarget !== expectedTarget) {
      console.error(`❌ Wrong symlink target: ${path.relative(BUILD_DIR, symlinkPath)} -> ${actualTarget} (expected: ${expectedTarget})`);
      hasErrors = true;
      return;
    }

    // Check if content is accessible through symlink
    try {
      const originalContent = fs.readFileSync(htmlFile, 'utf8');
      const symlinkContent = fs.readFileSync(symlinkPath, 'utf8');
      
      if (originalContent !== symlinkContent) {
        console.error(`❌ Content mismatch through symlink: ${path.relative(BUILD_DIR, symlinkPath)}`);
        hasErrors = true;
        return;
      }

      console.log(`✅ ${path.relative(BUILD_DIR, symlinkPath)} -> ${expectedTarget}`);
    } catch (error) {
      console.error(`❌ Cannot read through symlink: ${path.relative(BUILD_DIR, symlinkPath)} - ${error.message}`);
      hasErrors = true;
    }
  });

  return !hasErrors;
}

// Run the test
if (testSymlinkCreation()) {
  console.log("✨ All extensionless symlinks are correctly created!\n");
  process.exit(0);
} else {
  console.error("\n❌ Extensionless symlinks test failed");
  process.exit(1);
}