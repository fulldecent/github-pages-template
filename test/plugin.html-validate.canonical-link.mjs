import { Rule } from 'html-validate';

export default class CanonicalLinkRule extends Rule {
  documentation() {
    return {
      description: "Require a <link rel='canonical'> in <head> with specific href format.",
      url: 'https://github.com/fulldecent/github-pages-template/#canonical',
    };
  }

  setup() {
    this.on('dom:ready', this.domReady.bind(this));
  }

  domReady({ document }) {
    const linkCanonical = document.querySelector('head > link[rel="canonical"]');
    if (!linkCanonical) {
      this.report({
        node: document.head,
        message: '<head> is missing <link rel="canonical" ...>',
      });
    } else {
      const href = linkCanonical.getAttribute('href').value;

      if (href && /\.\w+$/.test(href)) {
        this.report({
          node: linkCanonical,
          message: 'Canonical link href should be extensionless (no .html, .php, etc.)',
        });
      }

      if (href && href.toLowerCase().endsWith('/index')) {
        this.report({
          node: linkCanonical,
          message: 'Canonical link href should be "/" and not end with "/index"',
        });
      }
    }
  }
}
