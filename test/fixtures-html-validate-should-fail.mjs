// Documentation: https://html-validate.org/dev/using-api.html

import { FileSystemConfigLoader, HtmlValidate, formatterFactory } from "html-validate";

const loader = new FileSystemConfigLoader(); // Load html-validate config from .htmlvalidate.json
const htmlValidate = new HtmlValidate(loader);
const formatter = formatterFactory("text");
var exitCode = 0;

const fixtureAndExpectedResults = [
  {
    filePath: "test/fixtures/missing-canonical-link.html",
    messages: [
      {
        "ruleId": "pacific-medical-training/canonical",
        "severity": 2,
        "message": "<head> missing <link> with rel=\"canonical\"",
        "offset": 36,
        "line": 3,
        "column": 4,
        "size": 4,
        "selector": "html > head"
      }
    ],
  },
];

for (const { filePath, messages } of fixtureAndExpectedResults) {
  htmlValidate.validateFile(filePath).then((report) => {
    const expectedString = JSON.stringify(messages, null, 2);
    const actualString = JSON.stringify(report.results[0].messages, null, 2);
    if (expectedString !== actualString) {
      console.error(`Incorrect result when testing ${filePath}.\n\nExpected:\n${expectedString}\n\nActual:\n${actualString}`);
      exitCode = 1;
    }
  });
};

process.on("exit", () => {
  process.exit(exitCode);
});