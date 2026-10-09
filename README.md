# Horses website

> [!TIP]
> This template is a starting point you can use for every collaboratively-edited HTML website. We offer:
>
> * A build that matches the [github-pages](https://github.com/github/pages-gem) gem, and a test that reads the built HTML
> * Continuous integration to [check formatting](.github/workflows/lint.yml), then [build, test, and deploy](.github/workflows/build-test-deploy.yml)
> * Modern [EditorConfig](.editorconfig), [.gitignore](.gitignore) and linting
>
> What is in-scope for this template?
>
> We the people who publish HTML together, in order to keep one build that matches GitHub Pages and to make a website inviting for more editors, maintain this starting point.
>
> Pages live under [source/](source/). The Ruby version and the Node.js version are pinned in this repository. GitHub Pages publishes the result.
>
> This project will not include extra reporting and analisys tools. There are a couple scripts in there which are plenty for you to use and study.
>
> And now below is the template, shown for a specific hypothetical project, enjoy!

[![Lint](https://github.com/fulldecent/github-pages-template/actions/workflows/lint.yml/badge.svg)](https://github.com/fulldecent/github-pages-template/actions/workflows/lint.yml) [![Build, test, deploy](https://github.com/fulldecent/github-pages-template/actions/workflows/build-test-deploy.yml/badge.svg)](https://github.com/fulldecent/github-pages-template/actions/workflows/build-test-deploy.yml)

A one-page album about horses, with a small experiment on coat color.

Our site offers:

* A home page you can replace with your own pages
* An experiment that sends each visitor to one variant and remembers the choice
* Setup for the Ruby and Node.js versions the build and the tests expect

[ Imagine a photo here of the horses album open on a laptop. ]

> [!NOTE]
> Replace the project name, description, picture and badge URLs with your own. Show the site before asking people to read further.

## Try it out

The site is published at <https://fulldecent.github.io/github-pages-template/>. Open it and read the page. The coat-color experiment is at <https://fulldecent.github.io/github-pages-template/experiment-template/page-to-test>.

> [!NOTE]
> Replace these addresses with your published site. Delete this section when the site has no public page yet.

## Usage

Read the album on the home page. Open the coat-color experiment and reload the page. The same visitor stays on the same variant.

> [!NOTE]
> Explain how to use your project.

## Development

Thank you for taking an interest in improving our horses website and the websites of people who started from this project!

_In production (GitHub Actions), the environment is set up by the workflows in [.github/workflows/](.github/workflows/)._

Use VS Code and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), install a Docker host (on Mac, use [OrbStack](https://orbstack.dev/)) then run the VS Code command "Reopen in Container".

Or install the toolchain on the host:

1. Install Ruby and the gems that match GitHub Pages. [rv](https://github.com/spinel-coop/rv) reads [.ruby-version](.ruby-version).

   ```sh
   brew install rv
   rv ruby install
   rv run bundle install
   ```

2. Install Node.js and Yarn. [fnm](https://github.com/Schniz/fnm) reads [.node-version](.node-version). The Yarn version is `packageManager` in [package.json](package.json).

   ```sh
   fnm install
   fnm use
   corepack enable
   yarn install
   ```

   For a Node.js module or command-line tool, start from https://github.com/fulldecent/node.js-template.

`yarn build:jekyll` and `yarn dev` run Jekyll through `rv run bundle exec`. A `bundle` taken from Homebrew uses a different Ruby than [.ruby-version](.ruby-version) and fails looking for `exe/bundle`.

Build the HTML:

```sh
yarn build
```

That writes the site into `build/`.

Serve it locally:

```sh
yarn dev
```

Open <http://127.0.0.1:4000>. The console prints the address when the port differs.

Editors change HTML under [source/](source/). The home page is [source/index.html](source/index.html). The experiment layout is [source/_layouts/experiment.html](source/_layouts/experiment.html).

Open this folder in VS Code, allow "Reopen in Container", and install the recommended extensions. That installs formatting and linting for this repository.

### Testing

Every update we publish has to pass the test suite. GitHub runs that suite on each push to `main` and on pull requests. Run it locally before you send a pull request. Build the site first.

```sh
yarn test
```

This checks structured data, hyperlinks, and other page rules with [HTML-validate](https://html-validate.org/) and [Nice Checkers](https://github.com/fulldecent/html-validate-nice-checkers).

Correct formatting before you send proposed changes. A build is unnecessary for these two commands.

```sh
yarn lint
yarn format
```

You can pass paths:

```sh
yarn lint source/index.html README.md
yarn format source/index.html README.md
```

Prettier's cache lives in `cache/` and is written only by `--write`. A lint-only run, including CI, leaves the cache untouched. `.prettierignore` lists `*.md`, so Prettier skips Markdown and markdownlint formats it. When you pass paths, markdownlint receives only the `.md` paths. markdownlint-cli2 lints any path you hand it, so the script drops the rest.

### Releases

A push to the default branch publishes the site. The deploy job in [build-test-deploy.yml](.github/workflows/build-test-deploy.yml) uploads the `build/` artifact to GitHub Pages.

A git tag names a revision of this project. Cite that tag when you describe which revision you started from.

> [!NOTE]
> Replace this with how your site is published.

### Maintenance

The project administrator completes these maintenance tasks each month. If they are 3+ months late, please remind them or send your own issue/pull request.

1. Identify external Actions in [.github/workflows](./.github/workflows) scripts and look for available new versions. Review and then update to the new version if it is safe. GitHub-supported Actions (i.e. under the actions/ organization) may require only cursory review.
1. Update the Node.js pin, Yarn, and packages.

   ```sh
   curl -s https://nodejs.org/dist/index.json | jq -r '[.[] | select(.lts != false)][0].version' > .node-version
   yarn set version latest && yarn
   yarn upgrade-interactive
   ```

   [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) repeats the Node major and the Yarn version, because the dev container feature has no way to read `.node-version` or `packageManager`. Update those pins in the same change.

1. Update the Ruby pin to the version GitHub Pages is running. `Gemfile.lock` is gitignored, so this change is [.ruby-version](.ruby-version) and the Ruby minor in the dev container image.

   ```sh
   curl -s https://pages.github.com/versions.json | jq -r .ruby > .ruby-version
   rv ruby install
   rv run bundle install
   ```

## Project scope

We are people who keep a shared page about horses and want new editors to be able to change it with us.

This site is one album page and one coat-color experiment. The pages stay as HTML that GitHub Pages can build.

A change that needs a server at request time is outside this site. The page is files in a repository, built ahead of time.

> [!NOTE]
> Introduce your community, explain what is in scope, and say what is out of scope.

## References

1. We use title case only for proper nouns, including the name of our project.
1. This project is built based on [best practices documented in github-pages-template](https://github.com/fulldecent/github-pages-template), release 1.8.0.
1. This project is built based on [best practices documented in project-template](https://github.com/fulldecent/project-template), release v1.3.0.
1. This project is released under the [MIT license](./LICENSE.md).
1. [EditorConfig](.editorconfig) and the top of [.gitignore](.gitignore) are taken from project-template release 1.3.0. The rules that follow are `/build`, `/cache`, and `/.yarn`, then [GitHubPages.gitignore](https://github.com/github/gitignore/blob/main/GitHubPages.gitignore) and [Node.gitignore](https://github.com/github/gitignore/blob/main/Node.gitignore). The Node paste repeats the `.env` lines.
1. Prettier runs through Yarn. [.prettierrc.js](.prettierrc.js) loads `@shopify/prettier-plugin-liquid` with `require.resolve`, which Yarn PnP resolves. Markdown uses [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) and [.markdownlint-cli2.yaml](.markdownlint-cli2.yaml), which extends `markdownlint/style/prettier` and limits `no-duplicate-heading` to siblings.
1. `.yarnrc.yml` sets `npmMinimalAgeGate` to 0 and `approvedGitRepositories` to `"**"`. [Yarn: Security](https://yarnpkg.com/features/security)
1. We use the github-pages gem. GitHub Pages [builds with the versions on pages.github.com](https://pages.github.com/versions/) and ignores `Gemfile.lock`, which is why that file is gitignored. [pages-gem issue 768](https://github.com/github/pages-gem/issues/768)
1. For Mac, [OrbStack](https://orbstack.dev/) runs the dev container. [Colima](https://github.com/abiosoft/colima?tab=readme-ov-file#installation) is an open-source Docker host and is about 5x slower for this workload.

> [!NOTE]
> Carefully consider which license to apply to your project and replace the copyright line in [LICENSE.md](LICENSE.md). Cite external sources that materially informed your decisions, including the release of github-pages-template you used.
