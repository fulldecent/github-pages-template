# How to run this application locally

## Setup environment

_In production (GitHub Actions), environment is setup by by workflows in [.github/workflows/](.github/workflows/)._

_For local testing (try VS Code + Dev Containers extension, Podman Desktop), these steps are performed by [.devcontainer/](.devcontainer/) when you run Reopen in Container._

1. Install Ruby (use version in [build-test-deploy.yml](https://github.com/fulldecent/github-pages-template/blob/main/.github/workflows/build-test-deploy.yml) in "Setup Ruby", (try rbenv)

1. Install Jekyll

   ```sh
   gem update --system
   gem install bundler
   bundle install
   ```

1. Install Node & yarn, use version in build-test-deploy.yml in "Setup Node.js", (try nvm)

   ```sh
   nvm install --lts --reinstall-packages-from=current
   nvm use --lts
   yarn install
   ```

## Build the site

Build the HTML website (see available localhost:#### port in the console output):

```sh
bundle exec jekyll build
```

## Serve/run the site

```sh
bundle exec jekyll serve
```
To live reload changes use:
```sh
bundle exec jekyll serve --livereload
```

## (Bonus) if you will build using Jekyll but deploy to a different server with a script interpreter

You can run PHP or similar on the built site. Here's how.

```sh
(cd build; php -S localhost:4001)
```

## Testing

All testing is performed using Node scripts:

```sh
yarn test
```

## VS Code

Open this folder in VS Code and install recommended extensions. Then use "Reload Window" to activate them.

This will give you formatting, linting, and other tools to help you develop.
