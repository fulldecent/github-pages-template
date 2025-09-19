module.exports = {
  ci: {
    collect: {
      // Use a local static server instead of trying to analyze file:// URLs
      staticDistDir: "./build",
      // Specify the URLs to test (extensionless versions)
      url: [
        "http://localhost/index.html",
        "http://localhost/index2.html",
        "http://localhost/experiment-template/page-to-test",
        "http://localhost/experiment-template/variant-1",
        "http://localhost/experiment-template/variant-2",
      ],
      // Give pages time to load and render content
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
        // Increase timeout to allow for content rendering
        maxWaitForLoad: 30000,
        // Wait for network to be idle before collecting metrics
        networkQuietThresholdMs: 5000,
        // Ensure we wait for content to render
        waitUntil: ["load", "networkidle0"],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.5 }],
        "categories:accessibility": ["error", { minScore: 0.8 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        // Allow FCP to be more lenient for static content
        "first-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 6000 }],
      },
    },
  },
};
