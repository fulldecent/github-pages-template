import { Rule } from "html-validate";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export default class StructuredDataRule extends Rule {
  documentation() {
    return {
      description: "Validate JSON-LD structured data using structured-data-testing-tool",
      url: "https://github.com/fulldecent/github-pages-template/#structured-data",
    };
  }

  setup() {
    this.on("tag:ready", this.tagReady.bind(this));
  }

  tagReady({ target }) {
    if (target.tagName === "script") {
      const type = target.getAttribute("type")?.value;
      
      // Only process script tags with type="application/ld+json"
      if (type === "application/ld+json") {
        this.validateJsonLd(target);
      }
    }
  }

  validateJsonLd(scriptElement) {
    // Try to read the file content directly and extract the script
    if (scriptElement.location && scriptElement.location.filename) {
      try {
        const fileContent = fs.readFileSync(scriptElement.location.filename, 'utf8');
        const lines = fileContent.split('\n');
        
        // Find script tag boundaries
        let startLine = -1;
        let endLine = -1;
        let inScript = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('<script type="application/ld+json">')) {
            startLine = i + 1; // Start after the opening tag
            inScript = true;
          } else if (inScript && line.includes('</script>')) {
            endLine = i;
            break;
          }
        }
        
        if (startLine >= 0 && endLine >= 0) {
          const scriptContent = lines.slice(startLine, endLine).join('\n').trim();
          
          if (scriptContent) {
            this.testStructuredData(scriptContent, scriptElement);
            return;
          }
        }
      } catch (error) {
        this.report({
          node: scriptElement,
          message: `Error reading file for structured data validation: ${error.message}`,
        });
        return;
      }
    }
    
    this.report({
      node: scriptElement,
      message: "JSON-LD script tag is empty or cannot be read",
    });
  }

  testStructuredData(content, scriptElement) {

    // Create a temporary HTML file with just this JSON-LD script
    const tempDir = "/tmp";
    const tempFileName = `structured-data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.html`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    try {
      // Create minimal HTML with just the JSON-LD script
      const tempHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Structured Data Test</title>
</head>
<body>
  <script type="application/ld+json">
${content}
  </script>
</body>
</html>`;

      fs.writeFileSync(tempFilePath, tempHtml);

      // Run structured-data-testing-tool on the temporary file
      const result = execSync(`yarn dlx structured-data-testing-tool --file "${tempFilePath}"`, {
        encoding: "utf8",
        stdio: "pipe",
      });

      // Check for errors in the output
      if (result.includes("Error in jsonld parse")) {
        this.report({
          node: scriptElement,
          message: "JSON-LD parse error in structured data",
        });
      } else if (result.includes("Failed:") && !result.includes("Failed: 0")) {
        this.report({
          node: scriptElement,
          message: "Structured data validation failed",
        });
      }
      // Note: We don't report warnings as errors, only actual failures

    } catch (error) {
      this.report({
        node: scriptElement,
        message: `Structured data testing error: ${error.message}`,
      });
    } finally {
      // Clean up temporary file
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }
}