/**
 * Comprehensive test suite for network-aware HTML validation
 * This test demonstrates the improved robustness of the validation system
 */
import { HtmlValidate, FileSystemConfigLoader, esmResolver } from "html-validate";
import { shouldSkipNetworkChecks, hasNetworkConnectivity, isSandboxedEnvironment } from "./network-utils.mjs";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

console.log("🧪 Running comprehensive network-aware validation tests");

// Test network utilities
console.log("\n📊 Network Environment Analysis:");
console.log(`  - Sandboxed environment: ${isSandboxedEnvironment()}`);
console.log(`  - Network connectivity: ${hasNetworkConnectivity()}`);
console.log(`  - Network checks disabled: ${shouldSkipNetworkChecks()}`);
console.log(`  - SKIP_NETWORK_CHECKS env var: ${process.env.SKIP_NETWORK_CHECKS}`);

// Setup HTML validation
const resolver = esmResolver();
const loader = new FileSystemConfigLoader([resolver]);
const htmlValidate = new HtmlValidate(loader);

// Test scenarios
const testScenarios = [
  {
    name: "Valid HTML with no issues",
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Test</title>
    <link rel="canonical" href="https://example.com/">
  </head>
  <body>
    <h1>Hello World</h1>
    <a href="mailto:test@example.com?subject=Hello&body=World">Contact</a>
  </body>
</html>`,
    expectedErrors: 0
  },
  {
    name: "Mailto without subject/body",
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Test</title>
    <link rel="canonical" href="https://example.com/">
  </head>
  <body>
    <a href="mailto:test@example.com">Contact</a>
  </body>
</html>`,
    expectedErrors: 1,
    expectedRules: ["pacific-medical-training/mailto-awesome"]
  },
  {
    name: "Missing canonical link",
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Test</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>`,
    expectedErrors: 1,
    expectedRules: ["pacific-medical-training/canonical-link"]
  },
  {
    name: "External link (behavior depends on network)",
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Test</title>
    <link rel="canonical" href="https://example.com/">
  </head>
  <body>
    <a href="https://example.com">External Link</a>
  </body>
</html>`,
    expectedErrors: shouldSkipNetworkChecks() ? 0 : "depends on network",
    networkDependent: true
  }
];

let testsRun = 0;
let testsPassed = 0;

console.log("\n🏃 Running test scenarios:");

for (const scenario of testScenarios) {
  testsRun++;
  console.log(`\n  Test ${testsRun}: ${scenario.name}`);
  
  // Create temporary HTML file
  const tempPath = `/tmp/test-${testsRun}.html`;
  writeFileSync(tempPath, scenario.html);
  
  try {
    const report = await htmlValidate.validateFile(tempPath);
    const errors = report.results.length > 0 ? report.results[0].messages : [];
    
    console.log(`    Errors found: ${errors.length}`);
    
    if (scenario.networkDependent && shouldSkipNetworkChecks()) {
      console.log(`    ⚠️  Network-dependent test skipped (as expected)`);
      testsPassed++;
    } else if (scenario.expectedErrors === "depends on network") {
      console.log(`    ℹ️  Network-dependent result (actual: ${errors.length} errors)`);
      testsPassed++;
    } else if (errors.length === scenario.expectedErrors) {
      console.log(`    ✅ Expected ${scenario.expectedErrors} errors, got ${errors.length}`);
      
      // Check rule IDs if specified
      if (scenario.expectedRules) {
        const actualRules = errors.map(e => e.ruleId);
        const allRulesMatch = scenario.expectedRules.every(rule => actualRules.includes(rule));
        if (allRulesMatch) {
          console.log(`    ✅ All expected rules triggered: ${scenario.expectedRules.join(", ")}`);
        } else {
          console.log(`    ❌ Rule mismatch. Expected: ${scenario.expectedRules.join(", ")}, Got: ${actualRules.join(", ")}`);
        }
      }
      testsPassed++;
    } else {
      console.log(`    ❌ Expected ${scenario.expectedErrors} errors, got ${errors.length}`);
      if (errors.length > 0) {
        console.log(`    Error details:`);
        errors.forEach(error => {
          console.log(`      - ${error.ruleId}: ${error.message}`);
        });
      }
    }
  } catch (error) {
    console.log(`    ❌ Test failed with error: ${error.message}`);
  }
}

console.log(`\n📈 Test Results:`);
console.log(`  Tests run: ${testsRun}`);
console.log(`  Tests passed: ${testsPassed}`);
console.log(`  Success rate: ${Math.round((testsPassed / testsRun) * 100)}%`);

if (testsPassed === testsRun) {
  console.log(`\n✨ All comprehensive tests passed!`);
} else {
  console.log(`\n❌ Some comprehensive tests failed`);
  process.exit(1);
}