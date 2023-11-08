// Must use CommonJS and not ES modules
// Source: https://gitlab.com/html-validate/html-validate/-/issues/214
// and: https://gitlab.com/html-validate/html-validate/-/issues/125
// Inspiration: https://github.com/Intecmedia/Intecmedia.Webpack/blob/74fa4140380ed2468b4a1e9213349b427ab85577/plugin.html-validate.iframe.js

const { Rule } = require("html-validate");

// Disallow script tag with src including jQuery
// Best practice: switch jQuery to Vanilla JS for faster loading
class NoJquery extends Rule {
  setup() {
    this.on("dom:ready", this.domReady.bind(this));
  }

  domReady({ document }) {
    const scriptElements = document.getElementsByTagName("script");
    scriptElements.forEach((scriptElement) => {
      const src = scriptElement.getAttribute("src")?.value;

      // Skip if no src property
      if (!src) {
        return;
      }

      // Skip if not jQuery
      if (!src.includes("jquery")) {
        return;
      }

      this.report({
        node: scriptElement,
        message: "script tag with src including jQuery",
      });
    });
  }
}

module.exports = { NoJquery };

module.exports.rules = {
  "pacific-medical-training/no-jquery": NoJquery,
};
