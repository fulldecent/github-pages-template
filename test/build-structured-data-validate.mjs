import { glob } from "glob";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Find and sort all HTML files in the 'build' directory
const targets = glob.sync("build/**/*.html").sort();

if (targets.length === 0) {
  console.log("⚠️  No HTML files found in build directory");
  console.log("   Make sure to build the site first");
  process.exit(0);
}

console.log(`🧪 Validating structured data in ${targets.length} files...`);

let hasErrors = false;

// Validate each target file
for (const target of targets) {
  try {
    // Use structured-data-testing-tool CLI to test the file
    const result = execSync(`yarn dlx structured-data-testing-tool --file "${target}"`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Check if there are JSON-LD parse errors or failed tests in the output
    if (result.includes('Error in jsonld parse') || 
        (result.includes('Failed:') && !result.includes('Failed: 0'))) {
      console.log("❌ " + target);
      console.log(result);
      hasErrors = true;
    } else {
      console.log("✅ " + target);
      // Show a summary of structured data found
      const lines = result.split('\n');
      const schemaLine = lines.find(line => line.includes('Schema.org schemas:'));
      if (schemaLine && !schemaLine.includes('Schema.org schemas: 0')) {
        console.log(`    📋 ${schemaLine.trim()}`);
      }
      // Only show detailed output if there are warnings
      if (result.includes('Warnings:') && !result.includes('Warnings: 0')) {
        console.log("⚠️  Warnings found:");
        console.log(result);
      }
    }
  } catch (error) {
    console.log("❌ " + target);
    console.log("⚠️  Error testing file:", error.message);
    if (error.stdout) {
      console.log(error.stdout);
    }
    if (error.stderr) {
      console.error(error.stderr);
    }
    hasErrors = true;
  }
}

if (hasErrors) {
  console.log("❌ Some tests failed.");
  process.exit(1);
} else {
  console.log("✨ All tests passed!\n");
}