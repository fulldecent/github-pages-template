import { glob } from "glob";
import cliProgress from "cli-progress";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In the future, the CLI may improve and this script may be unnecessary.
// SEE: https://gitlab.com/html-validate/html-validate/-/issues/273

// Configuration
const MAX_WORKERS = parseInt(process.env.HTML_VALIDATE_WORKERS) || 4;
const WORKER_SCRIPT_PATH = path.join(__dirname, "html-validate-worker.mjs");

// Find and sort all HTML files in the 'build' directory
const targets = glob.sync("build/**/*.html").sort();

if (targets.length === 0) {
  console.log("⚠️  No HTML files found in build directory");
  console.log("   Make sure to build the site first");
  process.exit(0);
}

console.log(`🧪 Validating ${targets.length} files with ${MAX_WORKERS} parallel workers...`);

await validateParallel();

async function validateParallel() {
  const multibar = new cliProgress.MultiBar(
    {
      format: "[{bar}] {percentage}% | {value}/{total} | {status}",
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: true,
      forceRedraw: false,
    },
    cliProgress.Presets.shades_classic,
  );

  const overallBar = multibar.create(targets.length, 0, {
    status: "Starting...",
  });

  let completedTasks = 0;
  let allTestsPassed = true;
  const results = [];
  const workers = [];
  const taskQueue = [...targets];

  let isDone = false;
  function completeParallelProcessing() {
    if (isDone) return;
    isDone = true;

    multibar.stop();
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

      if (!result.isValid) {
        allTestsPassed = false;
        multibar.log(`❌ ${path.relative(process.cwd(), result.filePath)}\n${result.message.trim()}\n\n`);
      }

      overallBar.increment(1, {
        status: path.basename(result.filePath),
      });

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
    for (let i = 0; i < MAX_WORKERS; i++) {
      const worker = createWorker(i);
      workers.push(worker);
    }

    const initialTasks = Math.min(MAX_WORKERS, taskQueue.length);
    for (let i = 0; i < initialTasks; i++) {
      const task = taskQueue.shift();
      workers[i].postMessage({ filePath: task, workerId: i });
    }
  }

  return new Promise((resolve) => {
    const originalComplete = completeParallelProcessing;
    completeParallelProcessing = () => {
      originalComplete();
      resolve();
    };
    startParallelProcessing();
  });
}
