const { Rule } = require("html-validate");

class ValidateCanonical extends Rule {
  documentation() {
    return {
      description: "Require a <link rel='canonical'> in <head> with specific href format.",
      url: "https://github.com/fulldecent/github-pages-template/",
    };
  }

  setup() {
    // This is called once when the rule is first loaded.
    this.on("dom:ready", (event) => {
      const { document } = event;
      // Use querySelector, not querySelectorAll, because Google only uses the first canonical link
      const linkCanonical = document.querySelector('head link[rel="canonical"]');

      if (!linkCanonical) {
        this.report({
          node: document.head,
          message: '<head> is missing <link rel="canonical" ...>',
        });
      } else {
        const href = linkCanonical.getAttribute("href").value;

        if (href && /\.\w+$/.test(href)) {
          this.report({
            node: linkCanonical,
            message: 'Canonical link href should be extensionless (no .html, .php, etc.)',
          });
        }

        if (href && href.toLowerCase().endsWith("/index")) {
          this.report({
            node: linkCanonical,
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