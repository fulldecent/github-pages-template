import fs from "fs";
import { Rule } from "html-validate";

export default class CheckInternalLinks extends Rule {
  documentation() {
    return {
      description: "Require all internal links (src and href attributes) to be live.",
      url: "https://github.com/fulldecent/github-pages-template/#internal-links",
    };
  }

  setup() {
    // Set up the rule to listen for the "dom:ready" event
    this.on("dom:ready", this.domReady.bind(this));
  }

  checkTheLink(internalLink, element) {
    try {
      let filePath = "";

      // Construct the file path based on the internal link
      if (internalLink === "/") {
        filePath = `${process.cwd()}/build${internalLink}index.html`;
      } else {
        filePath = `${process.cwd()}/build${internalLink}`;
      }

      // Check if the file exists using fs.existsSync
      if (!fs.existsSync(filePath)) {
        // Check if the URL has a file extension
        const hasExtension = /\.\w+$/.test(internalLink);

        if (!hasExtension) {
          // If the URL does not have an extension, try different extensions
          this.checkAlternativeExtensions(filePath, element);
        } else {
          // If the file doesn't exist and has an extension, report an error
          this.reportLinkError(internalLink, element);
        }
      }
    } catch (error) {
      // Handle other errors that might occur during the process
      this.reportError(`Error checking internal link ${internalLink}:`, error);
    }
  }

  checkAlternativeExtensions(filePath, element) {
    // List of alternative file extensions to check
    const extensions = [".html", ".htm", ".php"];

    // Check if any of the alternative extensions exist
    if (!extensions.some(ext => fs.existsSync(`${filePath}${ext}`))) {
      // If none of the file extensions exist, report an error
      this.reportLinkError(filePath, element);
    }
  }

  reportLinkError(internalLink, element) {
    // Extract relative path by removing the prefix if present
    const relativePath = internalLink.startsWith(`${process.cwd()}/build`) ?
      internalLink.substring(`${process.cwd()}/build`.length) : internalLink;

    // Report an error with the relative path
    this.report({
      node: element,
      message: `Internal link ${relativePath} is broken in file ${element.location.filename} at line ${element.location.line}, column ${element.location.column}`,
    });
  }

  reportError(message, error) {
    // Log errors to the console
    console.error(message, error);
  }

  check(url, element) {
    // Check if the URL is an HTTP or mailto link
    if (!url || url.startsWith("http") || url.startsWith("www") || url.startsWith("mailto")) {
      // If it's not an internal link, return early
      return;
    }

    // Check the accessibility of the link
    this.checkTheLink(url, element);
  }

  domReady({ document }) {
    // Get all anchor elements in the document with "src" or "href" attributes
    const aElements = document.querySelectorAll("[src], [href]");

    // Iterate over each anchor element
    aElements.forEach((element) => {
      let src = "";
      let href = "";

      try {
        // Read the "src" attribute of the element
        const srcAttribute = element.getAttribute("src");
        // Check if srcAttribute is not null before accessing the value property
        if (srcAttribute !== null) {
          src = srcAttribute.value;
        }
      } catch (error) {
        // Log an error if there's an issue reading the "src" attribute
        this.reportError(`Error reading 'src' attribute on element:`, error);
      }

      try {
        // Read the "href" attribute of the element
        const hrefAttribute = element.getAttribute("href");
        // Check if hrefAttribute is not null before accessing the value property
        if (hrefAttribute !== null) {
          href = hrefAttribute.value;
        }
      } catch (error) {
        // Log an error if there's an issue reading the "href" attribute
        this.reportError(`Error reading 'href' attribute on element:`, error);
      }

      // Step 1: Check if the URL has "#" in it
      if (src && src.includes("#")) {
        src = src.split("#")[0];
      }

      if (href && href.includes("#")) {
        href = href.split("#")[0];
      }

      // Step 2: Check "src" attribute if it's an internal link
      if (src && !src.startsWith("http") && !src.startsWith("www")) {
        this.check(src, element);
      }

      // Step 2: Check "href" attribute if it's an internal link
      if (href && !href.startsWith("http") && !href.startsWith("www")) {
        this.check(href, element);
      }
    });
  }
}
