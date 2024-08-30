import { Rule } from 'html-validate';

export default class NoJquery extends Rule {
  documentation() {
    return {
      description: 'Disallow script tag with src including jQuery',
      url: 'https://github.com/fulldecent/github-pages-template/#no-jquery',
    };
  }

  setup() {
    this.on('dom:ready', this.domReady.bind(this));
  }

  domReady({ document }) {
    const scriptElements = document.getElementsByTagName('script');
    scriptElements.forEach((scriptElement) => {
      const src = scriptElement.getAttribute('src')?.value;

      // Skip if no src property
      if (!src) {
        return;
      }

      // Skip if not jQuery
      if (!src.includes('jquery')) {
        return;
      }

      this.report({
        node: scriptElement,
        message: 'script tag with src including jQuery',
      });
    });
  }
}
