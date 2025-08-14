# HTML Validate GitHub Pages Plugin

An [html-validate](https://html-validate.org/) plugin that implements best practices for GitHub Pages websites. This plugin provides a comprehensive set of validation rules to ensure your static site follows modern web standards, accessibility guidelines, and SEO best practices.

## Features

This plugin includes the following validation rules:

### 🔗 External Links (`github-pages/external-links`)
- Validates that external links are reachable
- Detects broken links and reports HTTP status codes
- Identifies redirects and suggests using the final destination URL
- Caches link check results to improve performance

### 🔒 HTTPS Links (`github-pages/https-links`)
- Ensures external links use HTTPS when available
- Automatically checks if HTTP links have HTTPS alternatives
- Improves security and SEO by enforcing secure connections

### 📍 Internal Links (`github-pages/internal-links`)
- Validates that internal links point to existing files
- Supports multiple file extensions and index files
- Catches broken internal navigation

### 📧 Mailto Awesome (`github-pages/mailto-awesome`)
- Ensures mailto links include subject and body parameters
- Improves user experience by pre-filling email composition
- Follows best practices for contact forms

### 🚫 No jQuery (`github-pages/no-jquery`)
- Detects usage of jQuery library
- Encourages modern vanilla JavaScript practices
- Helps reduce bundle size and improve performance

### 🎯 Canonical Link (`github-pages/canonical-link`)
- Validates presence and format of canonical link elements
- Prevents duplicate content issues
- Improves SEO rankings

### 📦 Latest Packages (`github-pages/latest-packages`)
- Checks if external JavaScript/CSS packages are up to date
- Validates integrity and crossorigin attributes
- Caches version information to avoid repeated API calls
- Supports CDN services like jsDelivr

## Installation

```bash
npm install html-validate-github-pages
```

## Usage

### Basic Setup

Add the plugin to your html-validate configuration:

```javascript
// .htmlvalidate.mjs
import { defineConfig } from "html-validate";

export default defineConfig({
  plugins: ["html-validate-github-pages"],
  extends: ["html-validate-github-pages:recommended"],
});
```

### Manual Configuration

You can also configure individual rules:

```javascript
// .htmlvalidate.mjs
import { defineConfig } from "html-validate";

export default defineConfig({
  plugins: ["html-validate-github-pages"],
  rules: {
    "github-pages/external-links": "error",
    "github-pages/https-links": "error",
    "github-pages/internal-links": "error",
    "github-pages/mailto-awesome": "error",
    "github-pages/no-jquery": "warn",
    "github-pages/canonical-link": "error",
    "github-pages/latest-packages": "error",
  },
});
```

## Rule Details

### External Links

Validates external links and reports:
- Broken links (4xx, 5xx status codes)
- Redirects (3xx status codes)
- Unreachable links (network errors)

```html
<!-- ❌ Bad: Broken link -->
<a href="https://example.com/404">Broken link</a>

<!-- ✅ Good: Working link -->
<a href="https://example.com/">Working link</a>
```

### HTTPS Links

Ensures external links use HTTPS when available:

```html
<!-- ❌ Bad: HTTP when HTTPS is available -->
<a href="http://example.com/">Insecure link</a>

<!-- ✅ Good: HTTPS link -->
<a href="https://example.com/">Secure link</a>
```

### Internal Links

Validates internal links point to existing files:

```html
<!-- ❌ Bad: File doesn't exist -->
<a href="/nonexistent.html">Broken internal link</a>

<!-- ✅ Good: File exists -->
<a href="/existing-page.html">Working internal link</a>
```

### Mailto Awesome

Ensures mailto links include subject and body:

```html
<!-- ❌ Bad: Missing subject and body -->
<a href="mailto:contact@example.com">Contact us</a>

<!-- ✅ Good: Includes subject and body -->
<a href="mailto:contact@example.com?subject=Hello&body=Hi there!">Contact us</a>
```

### No jQuery

Detects jQuery usage and suggests alternatives:

```html
<!-- ❌ Bad: jQuery usage -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- ✅ Good: Modern vanilla JavaScript -->
<script>
  document.querySelector('#myElement').addEventListener('click', handler);
</script>
```

### Canonical Link

Validates canonical link elements:

```html
<!-- ❌ Bad: Missing canonical link -->
<head>
  <title>My Page</title>
</head>

<!-- ✅ Good: Proper canonical link -->
<head>
  <title>My Page</title>
  <link rel="canonical" href="https://example.com/my-page/" />
</head>
```

### Latest Packages

Validates external packages and security attributes:

```html
<!-- ❌ Bad: Outdated package, missing integrity -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.min.js"></script>

<!-- ✅ Good: Latest package with integrity and crossorigin -->
<script 
  src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js"
  integrity="sha384-..."
  crossorigin="anonymous">
</script>
```

## Configuration Options

### Internal Links Options

```javascript
{
  rules: {
    "github-pages/internal-links": [
      "error",
      {
        webRoot: "./build",
        alternativeExtensions: [".html", ".php"],
        indexFile: "index.html"
      }
    ]
  }
}
```

## Performance

The plugin includes several performance optimizations:

- **Caching**: Link checks and package version lookups are cached to disk
- **Parallel Processing**: External link validation runs in parallel with configurable concurrency
- **Smart Expiry**: Different cache expiry times for found vs. not-found resources
- **Timeout Protection**: Configurable timeouts prevent hanging requests

## Contributing

This plugin is part of the [github-pages-template](https://github.com/fulldecent/github-pages-template) project. Issues and contributions are welcome!

## License

MIT License - see the [LICENSE](https://github.com/fulldecent/github-pages-template/blob/main/LICENSE) file for details.