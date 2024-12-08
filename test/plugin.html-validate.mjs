// TODO: extract this and publish to npm as a package
import { definePlugin } from "html-validate";
import MailtoAwesomeRule from "./plugin.html-validate.mailto-awesome.mjs";
import ExternalLinksRules from "./plugin.html-validate.external-links.mjs";
import NoJqueryRules from "./plugin.html-validate.no-jquery.mjs";
import CanonicalLinkRule from "./plugin.html-validate.canonical-link.mjs";
import LatestPackagesRules from "./plugin.html-validate.latest-packages.mjs";
import EnsureHttpsRules from "./plugin.html-validate.https-links.mjs";
import CheckInternalLinks from "./plugin.html-validate.internal-links.mjs";

export default definePlugin({
  name: "pacific-medical-training",
  rules: {
    "pacific-medical-training/mailto-awesome": MailtoAwesomeRule,
    "pacific-medical-training/external-links": ExternalLinksRules,
    "pacific-medical-training/no-jquery": NoJqueryRules,
    "pacific-medical-training/canonical-link": CanonicalLinkRule,
    "pacific-medical-training/latest-packages": LatestPackagesRules,
    "pacific-medical-training/https-links": EnsureHttpsRules,
    "pacific-medical-training/internal-links": CheckInternalLinks,
  },
  configs: {
    recommended: {
      rules: {
        "pacific-medical-training/mailto-awesome": "error",
        "pacific-medical-training/external-links": "error",
        "pacific-medical-training/no-jquery": "error",
        "pacific-medical-training/canonical-link": "error",
        "pacific-medical-training/latest-packages": "error",
        "pacific-medical-training/https-links": "error",
        "pacific-medical-training/internal-links": "error",
      },
    },
  },
});
