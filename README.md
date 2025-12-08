# Horses website (🔨 update this after you "use template")

## Updating content

🔨 Add specific notes here about content style guides or how contributors can work together to update content on your site.

## How to build this website locally

### Setup local environment

Use Node and yarn (see version in `packageManager`). Quick start with nvm:

```sh
nvm install
nvm use
yarn install
```

You can also open this folder in VS Code and use "Reopen in Container" if you prefer a Dev Container setup.

### Build the site

Build the static HTML into `build/` with Eleventy.

```sh
yarn build
```

### Serve/run the site

Run a local server with live reload on port 4000.

```sh
yarn serve
```

### Linting

Perform code linting (this does not require building the site):

```sh
yarn lint
```

And automatically fix with:

```sh
yarn format-all
```

**Note:** Prettier caching is enabled using the `cache/` folder to speed up formatting checks. The cache is only written during `--write` operations (not `--check`), so CI environments should not expect cache benefits on lint-only operations.

### Testing

Perform website testing after you [build the site](#build-the-site):

```sh
yarn test
```

This runs HTML validation, link checks, and other best practices on each page using [HTML-validate](https://html-validate.org/) and [Nice Checkers](https://github.com/fulldecent/html-validate-nice-checkers).

## Why Eleventy instead of Jekyll

- Node-only tooling keeps setup lean while still producing GitHub Pages-ready HTML
- Liquid templates stay compatible with the prior Jekyll structure
- Fast local rebuilds and live reload with Eleventy 3
- Output matches the earlier Jekyll build (differences only allowed in whitespace)

## References

1. This website follows best practices documented in <https://github.com/fulldecent/github-pages-template>.
2. An Eleventy starter that mirrors this work lives at <https://github.com/fulldecent/github-pages-eleventy-template>.
