import fs from "fs";
import path from "path";

const buildDir = path.join(process.cwd(), "build");

/**
 * Recursively find all HTML files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} fileList - Array to collect file paths
 * @returns {string[]} Array of HTML file paths
 */
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

/**
 * Create extensionless copies for HTML files
 * Using file copies instead of symlinks for better GitHub Actions artifact compatibility
 */
function createExtensionlessSymlinks() {
  console.log("🔗 Creating extensionless copies for HTML files...");

  if (!fs.existsSync(buildDir)) {
    console.error(`❌ Build directory does not exist: ${buildDir}`);
    process.exit(1);
  }

  const htmlFiles = findHtmlFiles(buildDir);

  if (htmlFiles.length === 0) {
    console.log("⚠️  No HTML files found in build directory");
    return;
  }

  let filesCreated = 0;

  htmlFiles.forEach((htmlFile) => {
    const dir = path.dirname(htmlFile);
    const basename = path.basename(htmlFile, ".html");
    
    // Skip index.html files as they typically don't need extensionless versions
    // (the directory itself serves as the extensionless version)
    if (basename === "index") {
      return;
    }

    const extensionlessPath = path.join(dir, basename);

    try {
      // Check if extensionless file already exists
      if (fs.existsSync(extensionlessPath)) {
        console.log(`⚠️  File already exists: ${path.relative(buildDir, extensionlessPath)}`);
        return;
      }

      // Copy the HTML file to create extensionless version
      fs.copyFileSync(htmlFile, extensionlessPath);
      console.log(`✅ Created extensionless copy: ${path.relative(buildDir, extensionlessPath)}`);
      filesCreated++;

    } catch (error) {
      console.error(`❌ Failed to create extensionless copy ${path.relative(buildDir, extensionlessPath)}: ${error.message}`);
    }
  });

  console.log(`🎉 Successfully created ${filesCreated} extensionless copies`);
}

// Run the script
createExtensionlessSymlinks();