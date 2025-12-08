const siteUrl = process.env.SITE_URL || "https://example.com";

export default {
  title: "Site Title",
  url: siteUrl,
  lang: "en-US",
  description: "A site description.",
  author: {
    name: "Your Name",
    email: "your.email@example.com",
    url: "/about/",
  },
};
