import { Worker } from "worker_threads";
import { glob } from "glob";
import cliProgress from "cli-progress";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAX_WORKERS = 4; // Number of parallel workers
const WORKER_SCRIPT_PATH = path.join(__dirname, "html-validate-worker.mjs");

// Find and sort all HTML files in the 'test/fixtures-multithread' directory for testing
// In production, this would be "build/**/*.html"
const targets = glob.sync("test/fixtures-multithread/**/*.html").sort();

if (targets.length === 0) {
  console.log("⚠️  No test files found in test/fixtures-multithread/");
  console.log("   This script is designed to test parallel processing with many files.");
  console.log("   Run 'yarn test' for regular validation.");
  process.exit(0);
}

console.log(`🧪 Validating ${targets.length} files with ${MAX_WORKERS} parallel workers...`);

// Initialize multibar
const multibar = new cliProgress.MultiBar({
  format: "Worker {workerName} [{bar}] {percentage}% | {value}/{total} | {status}",
  hideCursor: true,
  clearOnComplete: false,
  stopOnComplete: true,
  forceRedraw: true
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
const availableWorkers = [];
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
    
    // Process next task or mark worker as available
    if (taskQueue.length > 0) {
      const nextTask = taskQueue.shift();
      workerBar.setTotal(workerBar.getTotal() + 1);
      worker.postMessage({
        filePath: nextTask,
        workerId: result.workerId
      });
    } else {
      // No more tasks, mark worker as available
      workerBar.update(workerBar.getTotal(), {
        status: "Complete"
      });
      availableWorkers.push(worker);
    }
    
    // Check if all tasks are complete
    if (completedTasks === targets.length) {
      completeProcessing();
    }
  });
  
  worker.on("error", (error) => {
    console.error(`Worker ${workerId} error:`, error);
    allTestsPassed = false;
    completeProcessing();
  });
  
  return worker;
}

// Function to start processing
function startProcessing() {
  // Create workers
  for (let i = 0; i < MAX_WORKERS; i++) {
    const worker = createWorker(i);
    workers.push(worker);
    availableWorkers.push(worker);
  }
  
  // Distribute initial tasks
  const initialTasks = Math.min(MAX_WORKERS, taskQueue.length);
  
  for (let i = 0; i < initialTasks; i++) {
    const worker = availableWorkers.pop();
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
function completeProcessing() {
  multibar.stop();
  
  // Terminate all workers
  workers.forEach(worker => {
    worker.terminate();
  });
  
  // Display results summary
  console.log("\n📊 Results Summary:");
  
  // Group results by worker for display
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
startProcessing();