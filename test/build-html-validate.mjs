import { HtmlValidate, FileSystemConfigLoader, formatterFactory, esmResolver } from "html-validate";
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
const USE_PARALLEL = process.env.HTML_VALIDATE_PARALLEL === "true" || process.argv.includes("--parallel");
const MAX_WORKERS = parseInt(process.env.HTML_VALIDATE_WORKERS) || 4;
const WORKER_SCRIPT_PATH = path.join(__dirname, "html-validate-worker.mjs");

// Find and sort all HTML files in the 'build' directory
const targets = glob.sync("build/**/*.html").sort();

if (targets.length === 0) {
  console.log("⚠️  No HTML files found in build directory");
  console.log("   Make sure to build the site first");
  process.exit(0);
}

console.log(`🧪 Validating ${targets.length} files${USE_PARALLEL ? ` with ${MAX_WORKERS} parallel workers` : " sequentially"}...`);

if (USE_PARALLEL && targets.length > 1) {
  await validateParallel();
} else {
  await validateSequential();
}

async function validateSequential() {
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
}

async function validateParallel() {
  // Initialize multibar with better formatting for parallel processing
  const multibar = new cliProgress.MultiBar({
    format: "Worker {workerName} [{bar}] {percentage}% | {value}/{total} | {status}",
    hideCursor: true,
    clearOnComplete: false,
    stopOnComplete: true,
    forceRedraw: false // Reduce terminal spam
  }, cliProgress.Presets.shades_classic);

  // Create progress bars for each worker
  const workerBars = [];
  for (let i = 0; i < MAX_WORKERS; i++) {
    const bar = multibar.create(0, 0, {
      workerName: `#${i + 1}`,
      status: "Waiting..."
    });
    workerBars.push(bar);
  }

  // Overall progress bar
  const overallBar = multibar.create(targets.length, 0, {
    workerName: "Overall",
    status: "Starting..."
  });

  let allTestsPassed = true;
  let completedTasks = 0;
  const results = [];

  // Worker management
  const workers = [];
  const taskQueue = [...targets];

  // Function to create a worker
  function createWorker(workerId) {
    const worker = new Worker(WORKER_SCRIPT_PATH);
    
    worker.on("message", (result) => {
      // Update progress
      completedTasks++;
      const workerBar = workerBars[result.workerId];
      
      // Store result
      results.push(result);
      
      if (!result.isValid) {
        allTestsPassed = false;
      }
      
      // Update worker progress
      workerBar.increment(1, {
        status: path.basename(result.filePath)
      });
      
      // Update overall progress
      overallBar.increment(1, {
        status: `${completedTasks}/${targets.length} completed`
      });
      
      // Process next task or mark worker as complete
      if (taskQueue.length > 0) {
        const nextTask = taskQueue.shift();
        workerBar.setTotal(workerBar.getTotal() + 1);
        worker.postMessage({
          filePath: nextTask,
          workerId: result.workerId
        });
      } else {
        // No more tasks, mark worker as complete
        workerBar.update(workerBar.getTotal(), {
          status: "Complete"
        });
      }
      
      // Check if all tasks are complete
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

  // Function to start processing
  function startParallelProcessing() {
    // Create workers
    for (let i = 0; i < MAX_WORKERS; i++) {
      const worker = createWorker(i);
      workers.push(worker);
    }
    
    // Distribute initial tasks
    const initialTasks = Math.min(MAX_WORKERS, taskQueue.length);
    
    for (let i = 0; i < initialTasks; i++) {
      const worker = workers[i];
      const task = taskQueue.shift();
      const workerId = i;
      
      workerBars[workerId].setTotal(1);
      workerBars[workerId].update(0, {
        status: path.basename(task)
      });
      
      worker.postMessage({
        filePath: task,
        workerId: workerId
      });
    }
  }

  // Function to complete processing
  function completeParallelProcessing() {
    multibar.stop();
    
    // Terminate all workers
    workers.forEach(worker => {
      worker.terminate();
    });
    
    // Display results summary
    console.log("\n📊 Results Summary:");
    
    // Group results by status
    const failedResults = results.filter(r => !r.isValid);
    
    if (failedResults.length > 0) {
      console.log(`\n❌ ${failedResults.length} files failed validation:`);
      failedResults.forEach(result => {
        console.log(result.message);
      });
    }
    
    const passedCount = results.filter(r => r.isValid).length;
    console.log(`\n✅ ${passedCount} files passed validation`);
    
    // Display final result
    if (allTestsPassed) {
      console.log("✨ All tests passed!\n");
    } else {
      console.log("❌ Some tests failed.\n");
      process.exit(1);
    }
  }

  // Start the processing
  return new Promise((resolve) => {
    const originalComplete = completeParallelProcessing;
    completeParallelProcessing = () => {
      originalComplete();
      resolve();
    };
    startParallelProcessing();
  });
}
