import { HtmlValidate, FileSystemConfigLoader, formatterFactory, esmResolver } from "html-validate";
import { glob } from "glob";
import cliProgress from "cli-progress";

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

// Initialize progress bar
const bar = new cliProgress.SingleBar({
  format: "🧪 [{bar}] {percentage}% | {value}/{total} | ETA: {eta}s | {file}",
  forceRedraw: true,
});
// Monkey-patch in logging support https://github.com/npkgz/cli-progress/issues/159#issuecomment-2959578474
bar.loggingBuffer = [];
bar.log = function (message) {
  bar.loggingBuffer.push(message);
};
bar.on("redraw-pre", (data) => {
  if (bar.loggingBuffer.length > 0) {
    bar.terminal.clearLine();
    bar.terminal.cursorTo(0);
    while (bar.loggingBuffer.length > 0) {
      bar.terminal.write(bar.loggingBuffer.shift());
      bar.terminal.write("\n");
    }
  }
});

console.log("🧪 Validating files...");
bar.start(targets.length, 0, { file: "Starting..." });

for (const target of targets) {
  try {
    bar.increment(0, { file: target });
    const report = await htmlValidate.validateFile(target);
    if (!report.valid) {
      bar.log(formatter(report.results));
      allTestsPassed = false;
    } else {
      bar.log(`✅ ${target}`);
    }
  } catch (error) {
    bar.log(`❌ Error validating ${target}: ${error.message}`);
    allTestsPassed = false;
  }
  bar.increment(1);
}

bar.stop();

// Display final result
if (allTestsPassed) {
  console.log("✨ All tests passed!\n");
} else {
  console.log("❌ Some tests failed.\n");
  process.exit(1);
}
