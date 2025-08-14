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
