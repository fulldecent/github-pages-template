// TODO: extract this and publish to npm as a package
import { definePlugin } from "html-validate";
import MailtoAwesomeRule from "./plugin.html-validate.mailto-awesome.mjs";
import ExternalLinksRules from "./plugin.html-validate.external-links.mjs";
import NoJqueryRules from "./plugin.html-validate.no-jquery.mjs";
import CanonicalLinkRule from "./plugin.html-validate.canonical-link.mjs";
import LatestPackagesRules from "./plugin.html-validate.latest-packages.mjs";

const plugin = definePlugin({
  name: "pacific-medical-training",
  rules: {
    "mailto-awesome": MailtoAwesomeRule,
    "external-links": ExternalLinksRules,
    "no-jquery": NoJqueryRules,
    "canonical-link": CanonicalLinkRule,
    "latest-packages": LatestPackagesRules,
   },
  configs: {
    recommended: {
      rules: {
        "pacific-medical-training/mailto-awesome": "error",
        "pacific-medical-training/external-links": "error",
        "pacific-medical-training/no-jquery": "error",
        "pacific-medical-training/canonical-link": "error",
        "pacific-medical-training/latest-packages": "error",
      },
    },
  },
});

export default plugin;