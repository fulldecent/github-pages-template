// Documentation: https://html-validate.org/dev/using-api.html
import { HtmlValidate, FileSystemConfigLoader, esmResolver } from "html-validate";

// Initialize HtmlValidate instance
const resolver = esmResolver();
const loader = new FileSystemConfigLoader([resolver]);
const htmlValidate = new HtmlValidate(loader);
let allTestsPassed = true;

const requiredResults = {
  "test/fixtures/mailto-not-awesome.html": [
    {
      ruleId: "pacific-medical-training/mailto-awesome",
      severity: 2,
      message: "mailto link must have a subject and body",
      offset: 196,
      line: 9,
      column: 6,
      size: 1,
      selector: "html > body > a",
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#mailto-awesome",
    },
  ],
  "test/fixtures/external-link-broken.html": [
    {
      ruleId: "pacific-medical-training/external-links",
      severity: 2,
      message:
        "external link is broken with status 404: https://freehorses.example.com/free-horses-on-1998-04-01-only.html",
      offset: 271,
      line: 9,
      column: 81,
      size: 1,
      selector: "html > body > a:nth-child(1)",
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#external-links",
    },
    {
      ruleId: "pacific-medical-training/external-links",
      severity: 2,
      message: "external link is broken with status 404: https://----.example.com?a=b&c=d",
      offset: 348,
      line: 10,
      column: 51,
      size: 1,
      selector: "html > body > a:nth-child(2)",
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#external-links",
    },
    {
      ruleId: "pacific-medical-training/external-links",
      severity: 2,
      message: "external link is broken with status 404: https://-..-..-.-.-",
      offset: 413,
      line: 11,
      column: 34,
      size: 1,
      selector: "html > body > a:nth-child(3)",
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#external-links",
    },
    {
      ruleId: "pacific-medical-training/external-links",
      severity: 2,
      message:
        "external link is broken with status 404: https://httpbin.org/redirect-to?url=https://example.com&status_code=301",
      offset: 655,
      line: 14,
      column: 86,
      size: 1,
      selector: "html > body > a:nth-child(6)",
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#external-links",
    },
    {
      ruleId: "pacific-medical-training/external-links",
      severity: 2,
      message: "external link is broken with status 404: https://ExAmple.com",
      offset: 717,
      line: 15,
      column: 34,
      size: 1,
      selector: "html > body > a:nth-child(7)",
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#external-links",
    },
    {
      ruleId: "pacific-medical-training/external-links",
      severity: 2,
      message: "external link is broken with status 404: https://example.com",
      offset: 767,
      line: 16,
      column: 34,
      size: 1,
      selector: "html > body > a:nth-child(8)",
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#external-links",
    },
  ],
  "test/fixtures/internal-link-broken.html": [
    {
      ruleId: "pacific-medical-training/internal-links",
      severity: 2,
      message: 'internal link "/free-horses-on-1998-04-01-only.html" is broken.',
      offset: 241,
      line: 9,
      column: 51,
      size: 1,
      selector: "html > body > a",
    },
  ],
  "test/fixtures/ensure-https.html": [
    {
      ruleId: "pacific-medical-training/https-links",
      severity: 2,
      message: "external link is insecure and accessible via HTTPS: http://en.wikipedia.org/wiki/Horse",
      offset: 196,
      line: 9,
      column: 6,
      size: 1,
      selector: "html > body > a",
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#https-links",
    },
    {
      ruleId: "pacific-medical-training/external-links",
      severity: 2,
      message: "external link is broken with status 404: http://en.wikipedia.org/wiki/Horse",
      offset: 239,
      line: 9,
      column: 49,
      size: 1,
      selector: "html > body > a",
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#external-links",
    },
  ],
  "test/fixtures/using-jquery.html": [
    {
      ruleId: "pacific-medical-training/no-jquery",
      severity: 2,
      message: "script tag with src including jQuery",
      offset: 123,
      line: 6,
      column: 6,
      size: 6,
      selector: "html > head > script",
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#no-jquery",
    },
  ],
  "test/fixtures/canonical-link-missing.html": [
    {
      ruleId: "pacific-medical-training/canonical-link",
      severity: 2,
      message: '<head> is missing <link rel="canonical" ...>',
      size: 0,
      selector: null,
      ruleUrl: "https://github.com/fulldecent/github-pages-template/#canonical",
    },
  ],
  "test/fixtures/old-package.html": [
    {
      ruleId: "pacific-medical-training/latest-packages",
      severity: 2,
      message: "using outdated package version https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.min.js",
      offset: 123,
      line: 6,
      column: 6,
      size: 6,
      selector: "html > head > script",
    },
  ],
  "test/fixtures/image-missing-alt.html": [
    {
      ruleId: "wcag/h37",
      severity: 2,
      message: '<img> cannot have empty "alt" attribute',
      offset: 249,
      line: 9,
      column: 59,
      size: 3,
      selector: "html > body > img",
      ruleUrl: "https://html-validate.org/rules/wcag/h37.html",
    },
  ],
};

const outcomes = Object.entries(requiredResults).map(async ([filePath, messages]) => {
  const report = await htmlValidate.validateFile(filePath);
  const expectedString = JSON.stringify(messages, null, 2);
  const actualString = report.results.length === 0 ? "[]" : JSON.stringify(report.results[0].messages, null, 2);

  if (expectedString === actualString) {
    console.log(`✅ ${filePath}`);
  } else {
    console.error(`❌ ${filePath} did not produce expected result.`);
    console.error(
      `\x1b[31m` +
        expectedString
          .split("\n")
          .map((line) => `- ${line}`)
          .join("\n") +
        `\x1b[0m`,
    );
    console.error(
      `\x1b[32m` +
        actualString
          .split("\n")
          .map((line) => `+ ${line}`)
          .join("\n") +
        `\x1b[0m`,
    );
    allTestsPassed = false;
  }
});

console.log("🧪 Testing fixtures");
Promise.all(outcomes).then(() => {
  if (allTestsPassed) {
    console.log("✨ All fixtures produced required results!\n");
  } else {
    console.error("❌ Tests of fixtures did not produce expected results.");
    process.exit(1);
  }
});
