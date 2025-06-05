// Documentation: https://html-validate.org/dev/using-api.html
import { HtmlValidate, FileSystemConfigLoader, esmResolver } from "html-validate";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

// Setup
const resolver = esmResolver();
const loader = new FileSystemConfigLoader([resolver]);
const htmlValidate = new HtmlValidate(loader);
const requiredResultsPath = path.resolve('./test/fixtures/required-results.json');
const actualResultsPath = path.resolve('./test/fixtures/actual-results.json');
let allTestsPassed = true;
const requiredResults = JSON.parse(readFileSync(requiredResultsPath, 'utf8'));
let actualResults = {};

console.log("🧪 Testing fixtures");

for (const filePath in requiredResults) {
  const actualReport = await htmlValidate.validateFile(filePath);
  const actualResult = actualReport.results.length === 0 ? [] : actualReport.results[0].messages;

  if (JSON.stringify(actualResult) !== JSON.stringify(requiredResults[filePath])) {
    console.error(`❌ ${filePath} did not produce expected result.`);
    console.error(
      `\x1b[31m` +
        JSON.stringify(requiredResults[filePath], null, 2)
          .split("\n")
          .map((line) => `- ${line}`)
          .join("\n") +
        `\x1b[0m`,
    );
    console.error(
      `\x1b[32m` +
        JSON.stringify(actualResult, null, 2)
          .split("\n")
          .map((line) => `- ${line}`)
          .join("\n") +
        `\x1b[0m`,
    );
    allTestsPassed = false;
  }
  actualResults[filePath] = actualResult;
}

// Write out actual results to fixtures/required-results.json
writeFileSync(actualResultsPath, JSON.stringify(actualResults, null, 4), 'utf8');

// Summary
if (allTestsPassed) {
  console.log("✨ All fixtures produced required results!\n");
} else {
  console.error("❌ Tests of fixtures did not produce expected results. Saved actual results to " + actualResultsPath);
  process.exit(1);
}
