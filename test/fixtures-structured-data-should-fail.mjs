import { execSync } from "child_process";
import path from "path";

console.log("🧪 Testing structured data fixtures");

const fixtures = [
  {
    file: "test/fixtures/valid-jsonld.html",
    shouldPass: true,
    description: "valid JSON-LD",
  },
  {
    file: "test/fixtures/invalid-jsonld.html",
    shouldPass: false,
    description: "invalid JSON-LD (syntax error)",
  },
];

let allTestsPassed = true;

for (const fixture of fixtures) {
  try {
    const result = execSync(`yarn dlx structured-data-testing-tool --file "${fixture.file}"`, {
      encoding: "utf8",
      stdio: "pipe",
    });

    const hasError =
      result.includes("Error in jsonld parse") || (result.includes("Failed:") && !result.includes("Failed: 0"));

    const actuallyPassed = !hasError;

    if (actuallyPassed === fixture.shouldPass) {
      console.log(`✅ ${fixture.file}: ${fixture.description} - ${actuallyPassed ? "passed" : "failed"} as expected`);
    } else {
      console.error(
        `❌ ${fixture.file}: ${fixture.description} - expected ${fixture.shouldPass ? "pass" : "fail"} but got ${actuallyPassed ? "pass" : "fail"}`,
      );
      console.error("Output:", result);
      allTestsPassed = false;
    }
  } catch (error) {
    // execSync throws on non-zero exit codes, but structured-data-testing-tool doesn't always exit with error codes
    console.error(`❌ ${fixture.file}: ${fixture.description} - execution error`);
    console.error("Error:", error.message);
    if (error.stdout) {
      console.error("Stdout:", error.stdout);
    }
    allTestsPassed = false;
  }
}

if (allTestsPassed) {
  console.log("✨ All fixtures produced expected results!\n");
} else {
  console.error("❌ Some fixture tests failed.");
  process.exit(1);
}
