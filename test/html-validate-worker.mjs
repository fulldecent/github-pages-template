import { parentPort, workerData } from "worker_threads";
import { HtmlValidate, FileSystemConfigLoader, formatterFactory, esmResolver } from "html-validate";

// Initialize HtmlValidate instance (same as main script)
const resolver = esmResolver();
const loader = new FileSystemConfigLoader([resolver]);
const htmlValidate = new HtmlValidate(loader);
const formatter = formatterFactory("text");

// Listen for messages from parent thread
parentPort.on("message", async (data) => {
  const { filePath, workerId } = data;

  try {
    const report = await htmlValidate.validateFile(filePath);

    const result = {
      workerId,
      filePath,
      success: report.valid,
      message: report.valid ? `✅ ${filePath}` : formatter(report.results),
      isValid: report.valid,
      report: report,
    };

    parentPort.postMessage(result);
  } catch (error) {
    const result = {
      workerId,
      filePath,
      success: false,
      message: `❌ Error validating`,
      isValid: false,
    };

    parentPort.postMessage(result);
  }
});
