import { Rule } from "html-validate";

export default class MailtoAwesomeRule extends Rule {
  documentation() {
    return {
      description: "Every mailto: link must have a subject and body",
      url: "https://github.com/fulldecent/github-pages-template/#mailto-awesome",
    };
  }

  setup() {
    this.on("dom:ready", this.domReady.bind(this));
  }

  domReady({ document }) {
    const aElements = document.getElementsByTagName("a");
    aElements.forEach((aElement) => {
      const href = aElement.getAttribute("href")?.value;

      // Skip if no href property
      if (!href) {
        return;
      }

      // Skip if not a mailto: link
      if (!href.startsWith("mailto:")) {
        return;
      }

      const hasSubject = href.includes("subject=");
      const hasBody = href.includes("body=");
      if (!hasSubject || !hasBody) {
        this.report({
          node: aElement,
          message: "mailto link must have a subject and body",
        });
      }
    });
  }
}