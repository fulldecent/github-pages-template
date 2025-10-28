import { defineConfig } from "html-validate";
import NiceCheckersPlugin from "@fulldecent/nice-checkers-plugin";

export default defineConfig({
  plugins: [NiceCheckersPlugin],
  extends: ["html-validate:prettier", "nice-checkers-plugin:recommended"],
  rules: {
    "allowed-links": [
      "error",
      {
        allowExternal: {
          exclude: ["utm_"],
        },
        allowRelative: {
          exclude: [".htm[l]?$"],
        },
        allowAbsolute: {
          exclude: [".htm[l]?$"],
        },
      },
    ],
    "nice-checkers/external-links": [
      "error",
      {
        proxyUrl: "https://api.PacificMedicalTraining.com/public/link-check/status",
        skipRegexes: ["dont-check-this.example.com"],
      },
    ],
    "wcag/h37": [
      "error",
      {
        allowEmpty: false,
        alias: [],
      },
    ],
  },
});
