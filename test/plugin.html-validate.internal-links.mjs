import fs from "fs";
import { Rule } from "html-validate";
import path from "path";

export default class CheckInternalLinks extends Rule {
  static ALTERNATIVE_EXTENSIONS = [".html", ".php"];
  static EXTERNAL_LINK_PREFIXES = ["https://", "http://", "mailto:", "tel:"];

  documentation() {
    return {
      description: "Require all internal links (src and href attributes) to be live.",
      url: "https://github.com/fulldecent/github-pages-template/#internal-links",
    };
  }

  setup() {
    this.on("dom:ready", this.domReady.bind(this));
  }

  checkTheLink(internalLink, element) {
    let decodedLink = internalLink.includes("%") ? decodeURIComponent(internalLink) : internalLink;

    // Remove query string and fragment
    decodedLink = decodedLink.split(/[?#]/)[0];

    // If absolute path, prefix with the build directory
    if (decodedLink.startsWith("/")) {
      decodedLink = path.join(process.cwd(), "build", decodedLink);
    }

    // Resolve the path
    const basePath = path.dirname(element.location.filename);
    let resolvedPath = path.resolve(basePath, decodedLink);

    // Pass if the URL matches a file or an alternative extension
    if (
      fs.existsSync(resolvedPath) ||
      CheckInternalLinks.ALTERNATIVE_EXTENSIONS.some((ext) => fs.existsSync(`${resolvedPath}${ext}`))
    ) {
      return;
    }

    // Check if it is a directory and append index.html
    const isDirectory = fs.existsSync(resolvedPath) && fs.lstatSync(resolvedPath).isDirectory();
    if (isDirectory) {
      resolvedPath = path.join(resolvedPath, "index.html");
    }

    // Report an error with the relative path
    this.report({
      node: element,
      message: `Internal link ${internalLink} is broken in file ${element.location.filename} at line ${element.location.line}, column ${element.location.column}`,
    });
  }

  domReady({ document }) {
    const elementsWithLink = document.querySelectorAll("[src], [href]");

    elementsWithLink.forEach((element) => {
      let url = element.getAttribute("src")?.value || element.getAttribute("href")?.value;

      // Ignore empty or external links
      if (!url || CheckInternalLinks.EXTERNAL_LINK_PREFIXES.some((prefix) => url.startsWith(prefix))) {
        return;
      }

      this.checkTheLink(url.split("#")[0], element);
    });
  }
}
