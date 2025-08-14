import { definePlugin } from "html-validate";
import MailtoAwesomeRule from "./mailto-awesome.mjs";
import ExternalLinksRules from "./external-links.mjs";
import NoJqueryRules from "./no-jquery.mjs";
import CanonicalLinkRule from "./canonical-link.mjs";
import LatestPackagesRules from "./latest-packages.mjs";
import EnsureHttpsRules from "./https-links.mjs";
import CheckInternalLinks from "./internal-links.mjs";

export default definePlugin({
  name: "github-pages",
  rules: {
    "github-pages/mailto-awesome": MailtoAwesomeRule,
    "github-pages/external-links": ExternalLinksRules,
    "github-pages/no-jquery": NoJqueryRules,
    "github-pages/canonical-link": CanonicalLinkRule,
    "github-pages/latest-packages": LatestPackagesRules,
    "github-pages/https-links": EnsureHttpsRules,
    "github-pages/internal-links": CheckInternalLinks,
  },
  configs: {
    recommended: {
      rules: {
        "github-pages/mailto-awesome": "error",
        "github-pages/external-links": "error",
        "github-pages/no-jquery": "error",
        "github-pages/canonical-link": "error",
        "github-pages/latest-packages": "error",
        "github-pages/https-links": "error",
        "github-pages/internal-links": "error",
      },
    },
  },
});
