// This has to be .prettierrc.js, not .prettierrc because of Yarn 4+ and plugins
// Notes: https://dev.to/javien/how-to-use-prettier-plugin-with-yarn-pnp-in-vscode-4pf8

/** @type {import("prettier").Options} */
module.exports = {
  printWidth: 120,
  plugins: [require.resolve("@shopify/prettier-plugin-liquid/standalone")],
  overrides: [
    {
      files: "*.html",
      options: {
        parser: "liquid-html",
      },
    },
  ],
};
