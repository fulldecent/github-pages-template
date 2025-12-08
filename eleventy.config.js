module.exports = function (eleventyConfig) {
  // Pass through static files
  eleventyConfig.addPassthroughCopy("source/**/*.{png,jpg,jpeg,gif,svg,ico,webp,woff,woff2,ttf,eot,css}");

  // Custom filters — Eleventy and Liquid provide escape, last, pop, size built-in,
  // so we only add genuinely custom ones.

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

  // Custom filter for jsonify
  eleventyConfig.addFilter("jsonify", function (value) {
    return JSON.stringify(value);
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
