import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BUILD_DIR = path.join(process.cwd(), "build");

console.log("🧪 Testing extensionless files creation");

/**
 * Test the extensionless file creation script
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

    const extensionlessPath = path.join(dir, basename);

    // Check if extensionless file exists
    if (!fs.existsSync(extensionlessPath)) {
      console.error(`❌ Missing extensionless file: ${path.relative(BUILD_DIR, extensionlessPath)}`);
      hasErrors = true;
      return;
    }

    // Check if content is accessible and matches original
    try {
      const originalContent = fs.readFileSync(htmlFile, 'utf8');
      const extensionlessContent = fs.readFileSync(extensionlessPath, 'utf8');
      
      if (originalContent !== extensionlessContent) {
        console.error(`❌ Content mismatch in extensionless file: ${path.relative(BUILD_DIR, extensionlessPath)}`);
        hasErrors = true;
        return;
      }

      console.log(`✅ ${path.relative(BUILD_DIR, extensionlessPath)}`);
    } catch (error) {
      console.error(`❌ Cannot read extensionless file: ${path.relative(BUILD_DIR, extensionlessPath)} - ${error.message}`);
      hasErrors = true;
    }
  });

  return !hasErrors;
}

// Run the test
if (testSymlinkCreation()) {
  console.log("✨ All extensionless files are correctly created!\n");
  process.exit(0);
} else {
  console.error("\n❌ Extensionless files test failed");
  process.exit(1);
}