# Horses website (🔨 UPDATE THIS AFTER YOU "USE TEMPLATE")

##   Updating content

🔨 Add specific notes here about content style guides or how contributors can work together to update content on your site.

## How to build this website locally

### Setup local environment

_In production (GitHub Actions), environment is setup by workflows in [.github/workflows/](.github/workflows/)._

Use VS Code and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), install a Docker host (on Mac, use [OrbStack](https://orbstack.dev/)) then run VS Code command "Reopen in Container".

Or if you do not want VS Code or the Docker setup, install your environment manually:

1. Install Ruby (use version in [build-test-deploy.yml](https://github.com/fulldecent/github-pages-template/blob/main/.github/workflows/build-test-deploy.yml) in "Setup Ruby", (try [rbenv](https://github.com/rbenv/rbenv))

2. Install Jekyll:

   ```sh
   gem update --system
   gem install bundler
   bundle install
   ```

3. Install Node & yarn, use version in build-test-deploy.yml in "Setup Node.js", (try nvm):

   ```sh
   nvm install # uses our .nvmrc
   nvm use # uses our .nvmrc
   yarn install
   ```

### Build the site

Build the HTML website.

```sh
yarn build
```

Access your site at <http://127.0.0.1:4000> (or see other "server address" in console output).

### Serve/run the site

```sh
bundle exec jekyll serve --livereload
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

Perform website testing (you must have already [built the site](#build-the-site))

:warning: `yarn build` produces different files than `bundle exec jekyll serve`. And the test suite may have false positives if you test the `serve` output.

```sh
yarn test
```

This tests structured data (JSON+LD), hyperlinks and other best practices on each page. This done using [HTML-validate](https://html-validate.org/) and [Nice Checkers](https://github.com/fulldecent/html-validate-nice-checkers).

## Notes for VS Code

Open this folder in VS Code, allow the "Reopen in Container" and install recommended extensions.

This will give you formatting, linting, and other tools to help you develop.

## Maintenance: updating dependencies

Do this every month or so and please send a PR here if you see updates available:

```sh
yarn set version latest && yarn # Send PR
yarn upgrade-interactive # Send PR
```

Also you can run this to update your environment to match the GitHub Pages (no PR, this is in .gitignore):

```sh
bundle update --conservative # "--consersative" ignores updates that GitHub Pages is not using
```

## References

1. This website is built based on [best practices documented in github-pages-template](https://github.com/fulldecent/github-pages-template).
2. Setting up Docker
   1. We would prefer an open-source-licensed Docker implementation that runs at native speed on Mac, Linux and Windows. For Mac, you may prefer to [install Colima](https://github.com/abiosoft/colima?tab=readme-ov-file#installation) which is open source but about 5x slower than the OrbStack recommended above.
3. We use the github-pages gem instead of Jekyll because GitHub Pages [uses those specific versions](https://pages.github.com/versions/) instead of what is in your Gemfile.lock. This is also why we add Gemfile.lock to .gitignore.
