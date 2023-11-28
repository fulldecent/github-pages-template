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
  {
    filePath: "test/fixtures/no-jquery.html",
    messages: [
      {
        "ruleId": "pacific-medical-training/no-jquery", // Correct ruleId for NoJquery rule
        "severity": 2,
        "message": "script tag with src including jQuery",
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
  const actualMessages = report.results.length === 0
    ? []
    : report.results[0].messages;

  const hasExpectedMessage = actualMessages.some(
    (actualMessage) =>
      actualMessage.ruleId === messages[0].ruleId &&
      actualMessage.message === messages[0].message
  );

  if (hasExpectedMessage) {
    console.log(`✅ File ${filePath} produced expected result.`);
  } else {
    console.error(`❌ File ${filePath} did not produce expected result.`);
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
