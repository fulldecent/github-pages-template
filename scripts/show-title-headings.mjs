// show-title-headings.mjs html_file ...
//
// e.g. node scripts/show-title-headings.mjs build/**/*.html
//
// - build/pals.html
//   - TITLE: Get your PALS certification online
//   - H1: Get your PALS certification online
//     - H2: PALS certification designed for healthcare professionals like you
//     - H2: Why you need to become certified in pediatric advanced life support (PALS)
//     - H2: What are the steps to getting becoming PALS certified?
//       - H3: Step 1—sign up for online training
// ...

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

  // Title
  const title = $("title").first().text().trim() || "(no <title>)";
  console.log(`  - TITLE: ${title}`);

  // Headings
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = el.name.toUpperCase(); // e.g., 'H1'
    const level = Number(tag.charAt(1)); // e.g., 1 for 'H1'
    const spaces = "  ".repeat(level);
    const headingText = $(el).text().replace(/\s+/g, " ").trim();
    console.log(`${spaces}- ${tag}: ${headingText}`);
  });
});
