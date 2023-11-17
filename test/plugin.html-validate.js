// TODO: extract this and publish to npm as a package

// Must use CommonJS and not ES modules
// Source: https://gitlab.com/html-validate/html-validate/-/issues/214
// and: https://gitlab.com/html-validate/html-validate/-/issues/125
// Inspiration: https://github.com/Intecmedia/Intecmedia.Webpack/blob/74fa4140380ed2468b4a1e9213349b427ab85577/plugin.html-validate.iframe.js

const { definePlugin } = require("html-validate");

const { rules: mailtoAwesomeRules } = require("./plugin.html-validate.mailto-awesome.js");
const { rules: externalLinksRules } = require("./plugin.html-validate.external-links.js");
const { rules: noJqueryRules } = require("./plugin.html-validate.no-jquery.js");
const { rules: ValidateCanonicalRules } = require("./plugin.html-validate.canonical.js");
const { rules: latestPackagesRules } = require("./plugin.html-validate.latest-packages.js");

module.exports = definePlugin({
  name: "pacific-medical-training",
  rules: {
    ...mailtoAwesomeRules,
    ...externalLinksRules,
    ...noJqueryRules,
    ...ValidateCanonicalRules,
    ...latestPackagesRules,
  },
  configs: {
    recommended: {
      rules: {
        "pacific-medical-training/mailto-awesome": "error",
        "pacific-medical-training/external-links": "error",
        "pacific-medical-training/no-jquery": "error",
        "pacific-medical-training/canonical": "error",
        "pacific-medical-training/latest-packages": "error",
      },
    },
  },
});
