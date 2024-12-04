import { HtmlValidate, FileSystemConfigLoader, formatterFactory, esmResolver } from "html-validate";
import { glob } from "glob";

// Find and sort all HTML files in the 'build' directory
const targets = glob.sync("build/**/*.html").sort();

// Initialize HtmlValidate instance
const resolver = esmResolver();
const loader = new FileSystemConfigLoader([resolver]);
const htmlValidate = new HtmlValidate(loader);
const formatter = formatterFactory("stylish");
let allTestsPassed = true;

// Validate each target file
for (const target of targets) {
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
}

if (allTestsPassed) {
  console.log("✨✨ All tests passed! ✨✨");
} else {
  process.exit(1);
}
