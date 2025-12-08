const siteUrl = process.env.SITE_URL || "https://example.com";

module.exports = function (eleventyConfig) {
  // Pass through static files
  eleventyConfig.addPassthroughCopy("source/**/*.{png,jpg,jpeg,gif,svg,ico,webp,woff,woff2,ttf,eot,css}");

  // Custom filter to shuffle an array (equivalent to Jekyll's sample filter)
  eleventyConfig.addFilter("shuffle", function (array) {
    if (!Array.isArray(array)) return array;
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  // Custom filter to escape HTML (equivalent to Jekyll's escape filter)
  eleventyConfig.addFilter("escape", function (str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  });

  // Custom filter to get the last element of an array (for path processing)
  eleventyConfig.addFilter("last", function (array) {
    if (!Array.isArray(array)) return array;
    return array[array.length - 1];
  });

  // Custom filter to remove the last element from an array
  eleventyConfig.addFilter("pop", function (array) {
    if (!Array.isArray(array)) return array;
    return array.slice(0, -1);
  });

  // Custom filter to get array size
  eleventyConfig.addFilter("size", function (array) {
    if (Array.isArray(array)) return array.length;
    if (typeof array === "string") return array.length;
    return 0;
  });

  // Custom filter for jsonify
  eleventyConfig.addFilter("jsonify", function (value) {
    return JSON.stringify(value);
  });

  // Add global data
  eleventyConfig.addGlobalData("site", {
    lang: "en-US",
    url: siteUrl,
  });

  return {
    // Use Liquid as the template engine (matching Jekyll)
    templateFormats: ["html", "liquid", "njk", "md"],
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid",
    dir: {
      input: "source",
      output: "build",
      includes: "_includes",
      layouts: "_layouts",
    },
  };
};
