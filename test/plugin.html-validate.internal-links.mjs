import fs from "fs";
import { Rule } from "html-validate";
import path from "path";

export default class CheckInternalLinks extends Rule {
  fileExistsCache = new Map();
  webRoot;
  alternativeExtensions;
  indexFile;

  static schema() {
    return {
      webRoot: {
        type: "string",
        description: "The root directory for resolving absolute links.",
      },
      alternativeExtensions: {
        type: "array",
        items: {
          type: "string",
        },
        description: "List of alternative file extensions to check for internal links.",
      },
      indexFile: {
        type: "string",
        description: "The default file to look for when resolving directory paths (e.g., 'index.html').",
      },
    };
  }

  constructor(options) {
    super(options);
    this.webRoot = options?.webRoot || process.cwd() + "/build";
    this.alternativeExtensions = options?.alternativeExtensions || [".html", ".php"];
    this.indexFile = options?.indexFile || "index.html";
  }

  setup() {
    this.on("tag:ready", this.tagReady.bind(this));
  }

  doesFileExist(path) {
    if (this.fileExistsCache.has(path)) {
      return this.fileExistsCache.get(path);
    }

    const exists = fs.existsSync(path);
    this.fileExistsCache.set(path, exists);
    return exists;
  }

  checkTheLink(internalLink, element) {
    let resolvedLink = internalLink;
    // If absolute path, prefix with the web root
    if (resolvedLink.startsWith("/")) {
      resolvedLink = path.join(this.webRoot, resolvedLink);
    }

    // Resolve the path
    const basePath = path.dirname(element.location.filename);
    let resolvedPath = path.resolve(basePath, resolvedLink);

    // If it's a directory, append the index file
    if (fs.existsSync(resolvedPath) && fs.lstatSync(resolvedPath).isDirectory()) {
      resolvedPath = path.join(resolvedPath, this.indexFile);
    }

    // Pass if the URL matches a file or an alternative extension
    if (
      this.doesFileExist(resolvedPath) ||
      this.alternativeExtensions.some((ext) => this.doesFileExist(`${resolvedPath}${ext}`))
    ) {
      return;
    }

    // Report an error with the resolved path
    this.report({
      node: element,
      message: `internal link "${internalLink}" is broken.`,
    });
  }

  tagReady({ target }) {
    // Check if the element has a `src` or `href` attribute
    let url = target.getAttribute("src")?.value || target.getAttribute("href")?.value;

    if (!url) {
      return;
    }

    url = decodeURIComponent(url);
    url = url.split("#")[0].split("?")[0];

    if (!url) {
      return;
    }

    // URL.parse returns null for internal links (because not absolutely resolvable)
    if (URL.parse(url) !== null) {
      return;
    }

    this.checkTheLink(url, target);
  }
}
