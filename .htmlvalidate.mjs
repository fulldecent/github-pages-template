import { defineConfig } from "html-validate";

export default defineConfig({
  plugins: ["<rootDir>/test/plugin.html-validate.mjs"],
  extends: ["html-validate:prettier", "<rootDir>/test/plugin.html-validate.mjs:recommended"],
  rules: {
    "allowed-links": [
      "error",
      {
        allowExternal: {
          exclude: ["\\\\?utm_source=chatgpt.com", ".htm[l]?$"],
        },
        allowRelative: {
          exclude: [".htm[l]?$"],
        },
        allowAbsolute: {
          exclude: [".htm[l]?$"],
        },
      },
    ],
    "pacific-medical-training/mailto-awesome": "error",
    "pacific-medical-training/external-links": [
      "error",
      {
        proxyUrl: "https://api.PacificMedicalTraining.com/public/link-check/status",
      },
    ],
    "pacific-medical-training/no-jquery": "error",
    "pacific-medical-training/canonical-link": "error",
    "pacific-medical-training/latest-packages": "error",
    "pacific-medical-training/https-links": "error",
    "pacific-medical-training/internal-links": "error",
    "wcag/h37": [
      "error",
      {
        allowEmpty: false,
        alias: [],
      },
    ],
  },
});
