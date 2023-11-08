// Must use CommonJS and not ES modules
// Source: https://gitlab.com/html-validate/html-validate/-/issues/214
// and: https://gitlab.com/html-validate/html-validate/-/issues/125
// Inspiration: https://github.com/Intecmedia/Intecmedia.Webpack/blob/74fa4140380ed2468b4a1e9213349b427ab85577/plugin.html-validate.iframe.js

const { Rule } = require("html-validate");

// Awesome mailto links
// Best practice: every mailto link must have a subject and body
class MailtoAwesomeRule extends Rule {
  setup() {
    this.on("dom:ready", this.domReady.bind(this));
  }

  domReady({ document }) {
    const aElements = document.getElementsByTagName("a");
    aElements.forEach((aElement) => {
      const href = aElement.getAttribute("href")?.value;

      // Skip if no href property
      if (!href) {
        return;
      }

      // Skip if not a mailto: link
      if (!href.startsWith("mailto:")) {
        return;
      }

      const hasSubject = href.includes("subject=");
      const hasBody = href.includes("body=");
      if (!hasSubject || !hasBody) {
        this.report({
          node: aElement,
          message: "mailto link must have a subject and body",
        });
      }
    });
  }
}

module.exports = { MailtoAwesomeRule };

module.exports.rules = {
  "pacific-medical-training/mailto-awesome": MailtoAwesomeRule,
};
