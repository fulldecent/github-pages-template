import { parentPort, workerData } from "worker_threads";
import { HtmlValidate, FileSystemConfigLoader, formatterFactory, esmResolver } from "html-validate";

// Initialize HtmlValidate instance (same as main script)
const resolver = esmResolver();
const loader = new FileSystemConfigLoader([resolver]);
const htmlValidate = new HtmlValidate(loader);
const formatter = formatterFactory("stylish");

// Listen for messages from parent thread
parentPort.on("message", async (data) => {
  const { filePath, workerId } = data;
  
  try {
    const report = await htmlValidate.validateFile(filePath);
    
    // Add 1 second delay for testing parallel processing visualization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = {
      workerId,
      filePath,
      success: report.valid,
      message: report.valid ? `✅ ${filePath}` : formatter(report.results),
      isValid: report.valid
    };
    
    parentPort.postMessage(result);
  } catch (error) {
    // Add 1 second delay for testing parallel processing visualization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = {
      workerId,
      filePath,
      success: false,
      message: `❌ Error validating ${filePath}: ${error.message}`,
      isValid: false
    };
    
    parentPort.postMessage(result);
  }
});