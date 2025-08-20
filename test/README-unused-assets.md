# Unused Assets Checker

The `find-unused-assets.mjs` script checks for asset files that are not referenced from any HTML file in the build directory.

## What it checks

The script scans for the following asset types:
- CSS files (`.css`)
- JavaScript files (`.js`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`)
- Fonts (`.woff`, `.woff2`, `.ttf`, `.otf`, `.eot`)
- Icons (`.ico`)
- Media files (`.mp4`, `.webm`, `.mp3`, `.wav`, `.ogg`)
- Documents (`.pdf`)
- Archives (`.zip`, `.tar`, `.gz`)

## How it works

1. **Finds all asset files** in the `build/` directory
2. **Scans HTML files** for references to assets via:
   - `src` attributes (images, scripts, etc.)
   - `href` attributes (stylesheets, links, etc.)
   - CSS `url()` references (both inline and in external CSS files)
3. **Resolves relative paths** correctly based on the HTML file's location
4. **Ignores external links** (http/https URLs) and data URLs
5. **Handles extensionless URLs** that might map to `.html` files
6. **Reports unused assets** that have no references

## Configuration

You can create an allowlist for files that should be ignored even if not directly referenced:

**File:** `test/unused-assets-allowlist.json`

```json
[
  "assets/js/analytics\\.js",
  "assets/images/social-.*",
  "^robots\\.txt$",
  "^\\.well-known/.*"
]
```

Each entry is a regular expression pattern that will be tested against the asset file path.

## Usage

```bash
# Run the checker
yarn node test/find-unused-assets.mjs

# Or as part of the test suite
yarn test
```

## Exit codes

- `0`: No unused assets found
- `1`: Unused assets found or error occurred

## Example output

```text
🧪 Checking for unused asset files
📄 Found 6 asset files and 4 HTML files

❌ Found unused asset files:
   assets/js/unused-analytics.js
   assets/images/old-logo.png

❌ Found 2 unused asset files
```
