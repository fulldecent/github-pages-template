// Documentation: https://html-validate.org/dev/using-api.html

import { HtmlValidate, formatterFactory } from "html-validate";
import { glob } from "glob";
import plugin from "./plugin.html-validate.mjs";
const targets = glob.sync("build/**/*.html");
// We prefer to use FileSystemConfigLoader, see https://gitlab.com/html-validate/html-validate/-/issues/230#note_1670756378
const htmlValidate = new HtmlValidate({
  extends: ["html-validate:recommended"],
  plugins: [plugin],
  rules: {
    "mailto-awesome": "error",
    "external-links": "error",
    "no-jquery": "error",
    "canonical-link": "error",
    "latest-packages": "error",
    "https-links": "error",
    "internal-links": "error",
    "void-style": "off"
  }
});
const formatter = formatterFactory("stylish");
var allTestsPassed = true;

const validateTargets = async () => {
  for (const target of targets) {
    try {
      const report = await htmlValidate.validateFile(target);
      if (!report.valid) {
        console.log(formatter(report.results));
        allTestsPassed = false;
      } else {
        //emoji
        console.log("✅ " + target);
      }
    } catch (error) {
      console.error(`Error validating ${target}:`, error);
      allTestsPassed = false;
    }
  }

  process.exit(allTestsPassed ? 0 : 1);
};

validateTargets();