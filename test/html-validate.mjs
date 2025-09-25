import { globSync } from "glob";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
// In the future, the CLI may improve and this script may be unnecessary.
// SEE: https://gitlab.com/html-validate/html-validate/-/issues/273
const MAX_WORKERS = parseInt(process.env.HTML_VALIDATE_WORKERS) || 4;
const WORKER_SCRIPT_PATH = path.join(__dirname, "html-validate-worker.mjs");

/**
 * Gathers target HTML files from command-line arguments or a default directory.
 * @returns {string[]} A sorted and deduplicated array of HTML file paths.
 */
function getTargetFiles() {
  const args = process.argv.slice(2);

  // If no arguments are provided, use the default glob pattern.
  if (args.length === 0) {
    console.log("ℹ️  No paths provided. Searching for HTML files in `build/` directory...");
    return globSync("build/**/*.html").sort();
  }

  // If arguments are provided, process them into a list of glob patterns.
  const patterns = args.map((arg) => {
    try {
      // Check if the argument is a directory.
      if (fs.statSync(arg).isDirectory()) {
        // If it is, create a glob pattern to find all HTML files within it.
        return path.join(arg, "**", "*.html");
      }
    } catch (error) {
      // If fs.statSync fails, the path might not exist or isn't a directory.
      // In that case, we assume it's a file path or a glob pattern and use it directly.
    }
    // Return the argument as-is for glob to process.
    return arg;
  });

  console.log(`ℹ️  Searching for files matching: ${patterns.join(", ")}`);
  // Use glob to find all files matching the generated patterns.
  const files = globSync(patterns, { nodir: true });

  // Return a deduplicated and sorted list of files.
  return [...new Set(files)].sort();
}

const targets = getTargetFiles();

if (targets.length === 0) {
  console.log("⚠️  No HTML files found in build directory");
  console.log("   Make sure to build the site first");
  process.exit(0);
}

console.log(`🧪 Validating ${targets.length} files with up to ${MAX_WORKERS} parallel workers...`);

await validateParallel();

async function validateParallel() {
  let completedTasks = 0;
  let allTestsPassed = true;
  const results = [];
  const workers = [];
  const taskQueue = [...targets];

  let isDone = false;
  function completeParallelProcessing() {
    if (isDone) return;
    isDone = true;

    workers.forEach((worker) => worker.terminate());

    const failedResults = results.filter((r) => !r.isValid);
    const passedCount = results.length - failedResults.length;

    console.log("\n📊 Results summary:");
    console.log(`✅ ${passedCount} files passed validation`);

    if (failedResults.length > 0) {
      console.log(`❌ ${failedResults.length} files failed validation`);
      process.exit(1);
    } else {
      console.log("✨ All tests passed!\n");
    }
  }

  function createWorker(workerId) {
    const worker = new Worker(WORKER_SCRIPT_PATH);

    worker.on("message", (result) => {
      completedTasks++;
      results.push(result);

      const relativeFilePath = path.relative(process.cwd(), result.filePath);

      if (!result.isValid) {
        allTestsPassed = false;
        console.log(`❌ (${completedTasks} of ${targets.length}) ${relativeFilePath}`);
        // Print error messages with indentation
        const errorLines = result.message.trim().split("\n");
        errorLines.forEach((line) => {
          console.log(`- ${line}`);
        });
      } else {
        console.log(`✅ (${completedTasks} of ${targets.length}) ${relativeFilePath}`);
      }

      if (taskQueue.length > 0) {
        const nextTask = taskQueue.shift();
        worker.postMessage({ filePath: nextTask, workerId });
      }

      if (completedTasks === targets.length) {
        completeParallelProcessing();
      }
    });

    worker.on("error", (error) => {
      console.error(`Worker ${workerId} error:`, error);
      allTestsPassed = false;
      completeParallelProcessing();
    });

    return worker;
  }

  function startParallelProcessing() {
    const workerCount = Math.min(MAX_WORKERS, taskQueue.length);
    for (let i = 0; i < workerCount; i++) {
      const worker = createWorker(i);
      workers.push(worker);
    }

    workers.forEach((worker, i) => {
      if (taskQueue.length > 0) {
        const task = taskQueue.shift();
        worker.postMessage({ filePath: task, workerId: i });
      }
    });
  }

  return new Promise((resolve) => {
    const originalComplete = completeParallelProcessing;
    completeParallelProcessing = () => {
      originalComplete();
      resolve();
    };
    if (targets.length > 0) {
      startParallelProcessing();
    } else {
      completeParallelProcessing();
    }
  });
}
