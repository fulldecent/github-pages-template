// Documentation: https://html-validate.org/dev/using-api.html

import { HtmlValidate } from "html-validate";
import plugin from "./plugin.html-validate.mjs";
// We prefer to use FileSystemConfigLoader, see https://gitlab.com/html-validate/html-validate/-/issues/230#note_1670756378
const htmlValidate = new HtmlValidate({
  extends: ["html-validate:recommended"],
  plugins: [plugin],
  rules: {
    "mailto-awesome": "error",
    "external-links": "error",
    "internal-links": "error",
    "https-links": "error",
    "no-jquery": "error",
    "canonical-link": "error",
    "latest-packages": "error",    
  },
});
let allTestsPassed = true;

const specifications = [
  {
    filePath: "test/fixtures/mailto-not-awesome.html",
    messages: [
      {
        "ruleId": "mailto-awesome",
        "severity": 2,
        "message": "mailto link must have a subject and body",
        "offset": 196,
        "line": 9,
        "column": 6,
        "size": 1,
        "selector": "html > body > a",
        "ruleUrl": "https://github.com/fulldecent/github-pages-template/#mailto-awesome"
      }
    ],
  }, {
    filePath: "test/fixtures/external-link-broken.html",
    messages: [
      {
        "ruleId": "external-links",
        "severity": 2,
        "message": "external link is broken: https://freehorses.example.com/free-horses-on-1998-04-01-only.html",
        "offset": 196,
        "line": 9,
        "column": 6,
        "size": 1,
        "selector": "html > body > a:nth-child(1)",
        "ruleUrl": "https://github.com/fulldecent/github-pages-template/#external-links"
      }
    ],
  }, {
    filePath: "test/fixtures/internal-link-broken.html",
    messages: [
      {
        "ruleId": "internal-links",
        "severity": 2,
        "message": "Internal link /free-horses-on-1998-04-01-only.html is broken in file test/fixtures/internal-link-broken.html at line 9, column 6",
        "offset": 196,
        "line": 9,
        "column": 6,
        "size": 1,
        "selector": "html > body > a",
        "ruleUrl": "https://github.com/fulldecent/github-pages-template/#internal-links"
      }
    ],
  }, {
    filePath: "test/fixtures/ensure-https.html",
    messages: [
      {
        "ruleId": "https-links",
        "severity": 2,
        "message": "external link is insecure and accessible via HTTPS: http://en.wikipedia.org/wiki/Horse",
        "offset": 196,
        "line": 9,
        "column": 6,
        "size": 1,
        "selector": "html > body > a",
        "ruleUrl": "https://github.com/fulldecent/github-pages-template/#https-links"
      }
    ],
  }, { 
    "filePath": "test/fixtures/using-jquery.html",
    "messages": [
      {
        "ruleId": "no-jquery",
        "severity": 2,
        "message": "script tag with src including jQuery",
        "offset": 123,
        "line": 6,
        "column": 6,
        "size": 6,
        "selector": "html > head > script",
        "ruleUrl": "https://github.com/fulldecent/github-pages-template/#no-jquery"
      }
    ],
  }, {
      "filePath": "test/fixtures/canonical-link-missing.html",
      "messages": [
        {
          "ruleId": "canonical-link",
          "severity": 2,
          "message": "<head> is missing <link rel=\"canonical\" ...>",
          "size": 0,
          "selector": null,
          "ruleUrl": "https://github.com/fulldecent/github-pages-template/#canonical"
        }
      ]
  }, {
    "filePath": "test/fixtures/old-package.html",
    "messages": [
      {
        "ruleId": "latest-packages",
        "severity": 2,
        "message": "using outdated package version https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.min.js",
        "offset": 123,
        "line": 6,
        "column": 6,
        "size": 6,
        "selector": "html > head > script"
      }
    ]
}
];

// async for all tests
const tests = specifications.map(async ({ filePath, messages }) => {
  const report = await htmlValidate.validateFile(filePath);
  const expectedString = JSON.stringify(messages, null, 2);
  const actualString = report.results.length === 0 
    ? "[]"
    : JSON.stringify(report.results[0].messages, null, 2);

  if (expectedString === actualString) {
    console.log(`✅ ${filePath}`);
  } else {
    console.error(`❌ ${filePath} did not produce expected result.`);
    console.error(`\x1b[31m` + expectedString.split("\n").map(line => `- ${line}`).join("\n") + `\x1b[0m`);
    console.error(`\x1b[32m` + actualString.split("\n").map(line => `+ ${line}`).join("\n") + `\x1b[0m`);
    allTestsPassed = false;
  }
});

Promise.all(tests).then(() => {
  if (allTestsPassed) {
    console.log("Test of all fixtures produced expected results.\n");
  } else {
    console.error("❌ Tests of fixtures did not produce expected results.");
    process.exit(1);
  }
});