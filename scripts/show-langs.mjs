// show-langs.mjs html_file ...
//
// e.g. node scripts/show-langs.mjs build/**/*.html
//
// - build/home.html
//   - LANG: en
//   - CANONICAL: https://acls.net/
//   - ALTERNATE fr-CA: https://acls.net/fr-CA/
//   - ALTERNATE en-US: https://acls.net/
//   - ALTERNATE en-CA: https://acls.net/en-CA/
// ...
//
// Note: this example shows the page is lang "en" but it recommends itself as "en-US". This inconsistency is okay and
// does we do not identify with any best practice saying these need to be consistent.

import fs from "fs";
import { load } from "cheerio";

// process.argv is [node_executable, script_path, script_args...]
const args = process.argv.slice(2);

// Check usage
if (args.length === 0) {
  const scriptName = process.argv[1].split("/").pop();
  console.log(`Usage: ${scriptName} file ...`);
  process.exit(1);
}

// Process each file
args.forEach((file) => {
  console.log(`- ${file}`);

  const html = fs.readFileSync(file, "utf8");
  const $ = load(html);

  // Get the language from the html element
  const lang = $("html").attr("lang") || "(no lang)";
  // Canonical link
  const canonicalLink = $('link[rel="canonical"]').attr("href") || "(no canonical)";
  console.log(`  - LANG: ${lang}`);
  console.log(`  - CANONICAL: ${canonicalLink}`);

  // Alternate language links
  $('link[rel~="alternate"][hreflang]').each((_, el) => {
    const hreflang = $(el).attr("hreflang");
    const href = $(el).attr("href");
    console.log(`  - ALTERNATE ${hreflang}: ${href}`);
  });
});
