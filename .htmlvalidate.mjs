import { defineConfig } from "html-validate";

export default defineConfig({
  plugins: ["<rootDir>/test/plugin.html-validate.mjs"],
  extends: ["html-validate:prettier", "<rootDir>/test/plugin.html-validate.mjs:recommended"],
  rules: {
    "pacific-medical-training/mailto-awesome": "error",
    "pacific-medical-training/external-links": "error",
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
