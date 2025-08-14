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
   nvm install --lts --reinstall-packages-from=current
   nvm use --lts
   yarn install
   ```

### Build the site

Build the HTML website.

```sh
bundle exec jekyll build
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
yarn lint-fix
```

### Testing

Perform website testing (you must have already [built the site](#build-the-site))

```sh
yarn test
```

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

## HTML Validation Plugin

This project includes a comprehensive HTML validation plugin called `html-validate-github-pages` that enforces best practices for GitHub Pages websites. The plugin is available in the [`html-validate-plugin/`](html-validate-plugin/) directory and can be used in other projects.

### Plugin Features

The plugin includes the following validation rules:

- **External Links** (`github-pages/external-links`): Validates that external links are reachable
- **HTTPS Links** (`github-pages/https-links`): Ensures external links use HTTPS when available  
- **Internal Links** (`github-pages/internal-links`): Validates that internal links point to existing files
- **Mailto Awesome** (`github-pages/mailto-awesome`): Ensures mailto links include subject and body parameters
- **No jQuery** (`github-pages/no-jquery`): Detects usage of jQuery library
- **Canonical Link** (`github-pages/canonical-link`): Validates presence and format of canonical link elements
- **Latest Packages** (`github-pages/latest-packages`): Checks if external JavaScript/CSS packages are up to date

### Using the Plugin

To use this plugin in your own project:

```bash
npm install html-validate-github-pages
```

Then configure it in your `.htmlvalidate.mjs`:

```javascript
import { defineConfig } from "html-validate";

export default defineConfig({
  plugins: ["html-validate-github-pages"],
  extends: ["html-validate-github-pages:recommended"],
});
```

For detailed documentation, see the [plugin README](html-validate-plugin/README.md).

## References

1. This website is built based on [best practices documented in github-pages-template](https://github.com/fulldecent/github-pages-template).
2. Setting up Docker
   1. We would prefer an open-source-licensed Docker implementation that runs at native speed on Mac, Linux and Windows. For Mac, you may prefer to [install Colima](https://github.com/abiosoft/colima?tab=readme-ov-file#installation) which is open source but about 5x slower than the OrbStack recommended above.
3. We use the github-pages gem instead of Jekyll because GitHub Pages [uses those specific versions](https://pages.github.com/versions/) instead of what is in your Gemfile.lock. This is also why we add Gemfile.lock to .gitignore.
