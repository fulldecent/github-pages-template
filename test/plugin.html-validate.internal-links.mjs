import fs from 'fs';
import { Rule } from 'html-validate';
import path from 'path';

export default class CheckInternalLinks extends Rule {
  static ALTERNATIVE_EXTENSIONS = ['.html', '.htm', '.php'];
  static EXTERNAL_LINK_PREFIXES = ['https://', 'http://', 'mailto:', 'tel:'];

  documentation() {
    return {
      description: 'Require all internal links (src and href attributes) to be live.',
      url: 'https://github.com/fulldecent/github-pages-template/#internal-links',
    };
  }

  setup() {
    // Set up the rule to listen for the "dom:ready" event
    this.on('dom:ready', this.domReady.bind(this));
  }

  checkTheLink(internalLink, element) {
    // Decode the internal link
    let decodedLink = decodeURIComponent(internalLink);

    // If absolute path then prefix with build
    if (decodedLink.startsWith('/')) {
      decodedLink = `${process.cwd()}/build${decodedLink}`;
    }

    // Resolve the path
    const basePath = path.dirname(element.location.filename);
    let resolvedPath = path.resolve(basePath, decodedLink);

    // If it's a directory, append index.html
    if (fs.existsSync(resolvedPath) && fs.lstatSync(resolvedPath).isDirectory()) {
      resolvedPath = path.join(resolvedPath, 'index.html');
    }

    // Pass if url fully matches a file
    if (fs.existsSync(resolvedPath)) {
      return;
    }

    // Pass if url matches with any alternative extension
    if (CheckInternalLinks.ALTERNATIVE_EXTENSIONS.some((ext) => fs.existsSync(`${resolvedPath}${ext}`))) {
      return;
    }

    // Report an error with the relative path
    this.report({
      node: element,
      message: `Internal link ${internalLink} is broken in file ${element.location.filename} at line ${element.location.line}, column ${element.location.column}`,
    });
  }

  domReady({ document }) {
    const elementsWithLink = document.querySelectorAll('[src], [href]');

    // Iterate over each anchor element
    elementsWithLink.forEach((element) => {
      // Get link from src or href attribute
      let url = '';
      if (element.hasAttribute('src')) {
        url = element.getAttribute('src').value;
      }
      if (element.hasAttribute('href')) {
        url = element.getAttribute('href').value;
      }

      // Remove fragment, if any
      if (url.includes('#')) {
        url = url.split('#')[0];
      }

      // Ignore if external link
      if (CheckInternalLinks.EXTERNAL_LINK_PREFIXES.some((prefix) => url.startsWith(prefix))) {
        return;
      }

      // Ignore if the link is empty
      if (url === '') {
        return;
      }

      // Check if the link exists
      this.checkTheLink(url, element);
    });
  }
}
