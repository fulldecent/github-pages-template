import { Rule } from "html-validate";
import { execSync } from "child_process";

// Constants for task parallelism and timeout
const TASK_PARALLELISM = 10;
const TIMEOUT_SECONDS = 10;

// Function to run promise functions with parallelism
async function runPromiseFunctionsWithParallelism(promiseFunctions, parallelism) {
  const promisesInProgress = new Set();

  async function runPromiseFunction(promiseFunction) {
    const promise = promiseFunction();
    promisesInProgress.add(promise);
    await promise;
    promisesInProgress.delete(promise);
  }

  for (const promiseFunction of promiseFunctions) {
    if (promisesInProgress.size >= parallelism) {
      await Promise.race(promisesInProgress);
    }

    await runPromiseFunction(promiseFunction);
  }

  await Promise.all(promisesInProgress);
}

// Class definition for the custom rule
export default class EnsureHttpsRules extends Rule {
  // Documentation method providing information about the rule
  documentation() {
    return {
      description: "Report insecure HTTP links that are accessible via HTTPS.",
      url: "https://github.com/fulldecent/github-pages-template/#https-links",
    };
  }

  // Setup method called when the rule is set up
  setup() {
    // Attach the domReady method to the "dom:ready" event
    this.on("dom:ready", this.domReady.bind(this));
  }

  // Method to check if an HTTP link is accessible via HTTPS
  async checkTheLink(url, element) {
    try {
      // Convert HTTP URL to HTTPS
      const httpsUrl = url.replace(/^http:/, "https:");

      // Execute a curl command to check the status of the HTTPS link
      const curlCommand = `curl --head --silent --fail --max-time ${TIMEOUT_SECONDS} --location "${httpsUrl}"`;
      const curlOutput = execSync(curlCommand, { encoding: "utf-8" });

      // Continue processing based on the curl command output
      if (curlOutput.includes("HTTP/2 200")) {
        // Report if the external link is insecure and accessible via HTTPS
        this.report({
          node: element,
          message: `external link is insecure and accessible via HTTPS: ${url}`,
        });
      }
    } catch (error) {
      // Links with errors are dealt with in the external broken links test
      return;
    }
  }

  // Method to check links in the DOM
  async check(url, element) {
    // Check if the URL is an HTTP link
    if (!url || !url.startsWith("http://")) {
      return;
    }

    // Check the accessibility of the link
    await this.checkTheLink(url, element);
  }

  // Method called when the DOM is ready
  domReady({ document }) {
    // Get all anchor elements in the document
    const aElements = document.getElementsByTagName("a");
    const promiseFunctions = [];

    // Create promise functions for each anchor element to check the link
    for (const aElement of aElements) {
      const hrefAttribute = aElement.getAttribute("href");
      const href = hrefAttribute ? String(hrefAttribute.value) : null;

      if (!href) continue;

      // Push promise functions to the array
      promiseFunctions.push(() => this.check(href, aElement));
    }

    // Run promise functions with parallelism
    runPromiseFunctionsWithParallelism(promiseFunctions, TASK_PARALLELISM);
  }
}
