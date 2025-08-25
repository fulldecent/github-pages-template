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
 * Create extensionless symlinks for HTML files
 */
function createExtensionlessSymlinks() {
  console.log("🔗 Creating extensionless symlinks for HTML files...");

  if (!fs.existsSync(buildDir)) {
    console.error(`❌ Build directory does not exist: ${buildDir}`);
    process.exit(1);
  }

  const htmlFiles = findHtmlFiles(buildDir);

  if (htmlFiles.length === 0) {
    console.log("⚠️  No HTML files found in build directory");
    return;
  }

  let symlinksCreated = 0;

  htmlFiles.forEach((htmlFile) => {
    const dir = path.dirname(htmlFile);
    const basename = path.basename(htmlFile, ".html");
    
    // Skip index.html files as they typically don't need extensionless symlinks
    // (the directory itself serves as the extensionless version)
    if (basename === "index") {
      return;
    }

    const symlinkPath = path.join(dir, basename);
    const relativeTarget = path.basename(htmlFile);

    try {
      // Check if symlink already exists
      if (fs.existsSync(symlinkPath)) {
        // Check if it's a symlink pointing to the right target
        if (fs.lstatSync(symlinkPath).isSymbolicLink()) {
          const currentTarget = fs.readlinkSync(symlinkPath);
          if (currentTarget === relativeTarget) {
            console.log(`✅ Symlink already exists: ${path.relative(buildDir, symlinkPath)} -> ${relativeTarget}`);
            return;
          } else {
            // Remove existing symlink with wrong target
            fs.unlinkSync(symlinkPath);
          }
        } else {
          console.log(`⚠️  File already exists (not a symlink): ${path.relative(buildDir, symlinkPath)}`);
          return;
        }
      }

      // Create the symlink
      fs.symlinkSync(relativeTarget, symlinkPath);
      console.log(`✅ Created symlink: ${path.relative(buildDir, symlinkPath)} -> ${relativeTarget}`);
      symlinksCreated++;

    } catch (error) {
      console.error(`❌ Failed to create symlink ${path.relative(buildDir, symlinkPath)}: ${error.message}`);
    }
  });

  console.log(`🎉 Successfully created ${symlinksCreated} extensionless symlinks`);
}

// Run the script
createExtensionlessSymlinks();