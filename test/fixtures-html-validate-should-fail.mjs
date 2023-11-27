// Documentation: https://html-validate.org/dev/using-api.html

import { FileSystemConfigLoader, HtmlValidate, formatterFactory } from "html-validate";

const loader = new FileSystemConfigLoader(); // Load html-validate config from .htmlvalidate.json
const htmlValidate = new HtmlValidate(loader);
const formatter = formatterFactory("text");
let allTestsPassed = true;

const specifications = [
  {
    filePath: "test/fixtures/missing-canonical-link.html",
    messages: [
      {
        "ruleId": "pacific-medical-training/canonical",
        "severity": 2,
        "message": "<head> is missing <link rel=\"canonical\" ...>",
        "size": 0,
        "selector": null,
        "ruleUrl": "https://github.com/fulldecent/github-pages-template/"
      }
    ],
  },
];

// async for all tests
const tests = specifications.map(async ({ filePath, messages }) => {
  const report = await htmlValidate.validateFile(filePath);
  const expectedString = JSON.stringify(messages, null, 2);
  const actualString = report.results.length === 0 
    ? "[]"
    : JSON.stringify(report.results[0].messages, null, 2);

  if (expectedString === actualString) {
    console.log(`✅ File ${filePath} produced expected result.`);
  } else {
    console.error(`❌ File ${filePath} did not produce expected result.\n\nExpected:\n${expectedString}\n\nActual:\n${actualString}`);
    allTestsPassed = false;
  }
});

Promise.all(tests).then(() => {
  if (allTestsPassed) {
    console.log("Test of all fixtures produced expected results.");
  } else {
    console.error("❌ Tests of fixtures did not produce expected results.");
    process.exit(1);
  }
});