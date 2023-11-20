// Import the Rule class from the "html-validate" module
const { Rule } = require("html-validate");

// Define a custom rule named ValidateCanonical that extends the Rule class
// This rule checks for head tags with link attributes that include rel="canonical"
class ValidateCanonical extends Rule {
  // Set up the rule
  setup() {
    // Register an event listener for the "dom:ready" event
    this.on("dom:ready", this.domReady.bind(this));
  }

  // Event handler for the "dom:ready" event
  domReady({ document }) {
    // Get all head elements in the document
    const headElements = document.getElementsByTagName("head");

    // Iterate over each head element
    headElements.forEach((headElement) => {
      // Get the first <link> element within the <head> with rel="canonical"
      const linkElement = headElement.querySelector('link[rel="canonical"]');

      // Skip to the next element if no <link rel="canonical"> is found
      if (!linkElement) {
        // Report a violation of the rule for head without a rel="canonical"
        this.report({
          node: headElement,
          message: 'head without rel="canonical"',
        });
      } else {
        // Check if href is extensionless (no .html, .php, etc.)
        const href = linkElement.getAttribute("href")?.value;
        if (href && /\.\w+$/.test(href)) {
          this.report({
            node: linkElement,
            message: 'Canonical link href should be extensionless (no .html, .php, etc.)',
          });
        }

        // Check if href is "/index" or ends with "/index"
        if (href && (href.toLowerCase() === "/index" || href.toLowerCase().endsWith("/index"))) {
          this.report({
            node: linkElement,
            message: 'Canonical link href should be "/" and not end with "/index"',
          });
        }
      }
    });
  }
}

// Export the ValidateCanonical rule as the module's default export
module.exports = { ValidateCanonical };

// Export an object that maps the rule name to the ValidateCanonical rule
module.exports.rules = {
  "pacific-medical-training/canonical": ValidateCanonical,
};
