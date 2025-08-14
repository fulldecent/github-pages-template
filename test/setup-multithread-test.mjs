#!/usr/bin/env node

/**
 * Setup script for testing multi-threading functionality
 * Creates 100 copies of a test HTML file to validate parallel processing
 */

import fs from "fs";
import path from "path";

const TEST_DIR = "test/fixtures-multithread";
const SOURCE_FILE = "test/fixtures/canonical-link-missing.html";
const BUILD_DIR = "build";
const NUM_FILES = 100;

// Create test fixtures directory
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Read the source file
const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf8');

// Create 100 copies
console.log(`Creating ${NUM_FILES} test files in ${TEST_DIR}/...`);
for (let i = 1; i <= NUM_FILES; i++) {
  const fileName = `test-file-${i}.html`;
  const filePath = path.join(TEST_DIR, fileName);
  fs.writeFileSync(filePath, sourceContent);
}

// Create build directory and copy files there for testing
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

console.log(`Copying test files to ${BUILD_DIR}/ for testing...`);
const testFiles = fs.readdirSync(TEST_DIR);
testFiles.forEach(file => {
  const sourcePath = path.join(TEST_DIR, file);
  const destPath = path.join(BUILD_DIR, file);
  fs.copyFileSync(sourcePath, destPath);
});

console.log(`✅ Setup complete! Created ${NUM_FILES} test files.`);
console.log(`\nTo test multi-threading, run:`);
console.log(`  yarn test-multithread`);
console.log(`\nTo compare sequential vs parallel modes:`);
console.log(`  yarn node test/build-html-validate.mjs`);
console.log(`  yarn node test/build-html-validate.mjs --parallel`);