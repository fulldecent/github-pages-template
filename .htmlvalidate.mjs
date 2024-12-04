import { defineConfig } from 'htmlvalidate';

export default defineConfig({
  "plugins": ["<rootDir>/test/plugin.html-validate.mjs"],
  "extends": ["html-validate:prettier", "<rootDir>/test/plugin.html-validate.mjs:recommended"],
  "rules": {
    "mailto-awesome": "error",
    "external-links": "error",
    "no-jquery": "error",
    "canonical-link": "error",
    "latest-packages": "error",
    "https-links": "error",
    "internal-links": "error"
  }
});
