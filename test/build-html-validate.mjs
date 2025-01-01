import { HtmlValidate, FileSystemConfigLoader, formatterFactory, esmResolver } from "html-validate";
import { glob } from "glob";

// In the future, the CLI may improve and this script may be unnecessary.
// SEE: https://gitlab.com/html-validate/html-validate/-/issues/273

// Find and sort all HTML files in the 'build' directory
const targets = glob.sync("build/**/*.html").sort();

// Initialize HtmlValidate instance
const resolver = esmResolver();
const loader = new FileSystemConfigLoader([resolver]);
const htmlValidate = new HtmlValidate(loader);
const formatter = formatterFactory("stylish");
let allTestsPassed = true;

// Validate each target file
const outcomes = targets.map(async (target) => {
  try {
    const report = await htmlValidate.validateFile(target);
    if (!report.valid) {
      console.log(formatter(report.results));
      allTestsPassed = false;
    } else {
      console.log(`✅ ${target}`);
    }
  } catch (error) {
    console.error(`Error validating ${target}:`, error);
    allTestsPassed = false;
  }
});

console.log("🧪 Testing pages");
Promise.all(outcomes).then(() => {
  if (allTestsPassed) {
    console.log("✨ All tests passed!\n");
  } else {
    console.log("❌ Some tests failed.");
    process.exit(1);
  }
});
