import { defineConfig } from "html-validate";

export default defineConfig({
  plugins: ["html-validate-github-pages"],
  extends: ["html-validate:prettier", "html-validate-github-pages:recommended"],
  rules: {
    "github-pages/mailto-awesome": "error",
    "github-pages/external-links": "error",
    "github-pages/no-jquery": "error",
    "github-pages/canonical-link": "error",
    "github-pages/latest-packages": "error",
    "github-pages/https-links": "error",
    "github-pages/internal-links": "error",
    "wcag/h37": [
      "error",
      {
        allowEmpty: false,
        alias: [],
      },
    ],
  },
});
