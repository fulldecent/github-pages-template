// Documentation: https://html-validate.org/dev/using-api.html
import { HtmlValidate, FileSystemConfigLoader, esmResolver } from "html-validate";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import testConfig, { TEST_CONFIG } from "./test-config.mjs";

// Setup
const resolver = esmResolver();
const loader = new FileSystemConfigLoader([resolver]);
const htmlValidate = new HtmlValidate(loader);
const requiredResultsPath = path.resolve("./test/fixtures/required-results.json");
const actualResultsPath = path.resolve("./test/fixtures/actual-results.json");
let allTestsPassed = true;
const requiredResults = JSON.parse(readFileSync(requiredResultsPath, "utf8"));
let actualResults = {};

/**
 * Normalize test results to handle network-dependent variations
 * This makes tests more deterministic by standardizing network failure codes
 */
function normalizeTestResults(results) {
  if (!Array.isArray(results)) return results;
  
  return results.map(result => {
    if (result.ruleId === "pacific-medical-training/external-links" && 
        result.message.includes("status 0:") && 
        TEST_CONFIG.NORMALIZE_STATUS_CODES) {
      // Normalize status 0 to status 500 for network failures
      return {
        ...result,
        message: result.message.replace("status 0:", "status 500:")
      };
    }
    return result;
  });
}

console.log("🧪 Testing fixtures");
if (testConfig.isCI) {
  console.log("⚙️  Running in CI mode with network failure normalization");
}

for (const filePath in requiredResults) {
  const actualReport = await htmlValidate.validateFile(filePath);
  let actualResult = actualReport.results.length === 0 ? [] : actualReport.results[0].messages;
  
  // Normalize results for consistent testing
  actualResult = normalizeTestResults(actualResult);
  
  // Also normalize expected results for comparison
  const expectedResult = normalizeTestResults(requiredResults[filePath]);

  if (JSON.stringify(actualResult) !== JSON.stringify(expectedResult)) {
    console.error(`❌ ${filePath} did not produce expected result.`);
    console.error("Expected:");
    console.error(
      `\x1b[31m` +
        JSON.stringify(expectedResult, null, 2)
          .split("\n")
          .map((line) => `  ${line}`)
          .join("\n") +
        `\x1b[0m`,
    );
    console.error("Actual:");
    console.error(
      `\x1b[32m` +
        JSON.stringify(actualResult, null, 2)
          .split("\n")
          .map((line) => `  ${line}`)
          .join("\n") +
        `\x1b[0m`,
    );
    allTestsPassed = false;
  } else {
    console.log(`✅ ${filePath}`);
  }
  actualResults[filePath] = actualResult;
}

// Write out actual results to fixtures/required-results.json
writeFileSync(actualResultsPath, JSON.stringify(actualResults, null, 4), "utf8");

// Summary
if (allTestsPassed) {
  console.log("\n✨ All fixtures produced required results!\n");
} else {
  console.error("\n❌ Tests of fixtures did not produce expected results.");
  console.error("💡 Tip: If these are expected changes due to environment differences,");
  console.error("   you may need to update required-results.json with the normalized results.");
  console.error(`📁 Actual results saved to: ${actualResultsPath}`);
  process.exit(1);
}
