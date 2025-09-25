// scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";

// -------------------- constants --------------------
const buildFolderPath = path.join(process.cwd(), "build");
const sitemapPath = path.join(buildFolderPath, "sitemap.xml");

// -------------------- helpers --------------------
function isHtmlFile(p) {
  return path.extname(p).toLowerCase() === ".html";
}

function readFileUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function getHtmlFilesRecursive(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      getHtmlFilesRecursive(p, out);
    } else if (isHtmlFile(p)) {
      out.push(p);
    }
  }
  return out;
}

// Detect <meta name="experiment" content="true">
function isExperiment(content) {
  return /<meta\s+name=["']experiment["']\s+content=["']true["']\s*\/?>/i.test(content);
}

// Extract absolute canonical URL from <link rel="canonical" href="...">
// - Attribute order-agnostic
// - Single or double quotes
function extractCanonicalAbsoluteUrl(content) {
  const linkTags = content.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    if (!/\brel\s*=\s*["']canonical["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const href = hrefMatch[1].trim();
    try {
      const urlObj = new URL(href);
      if (!/^https?:$/.test(urlObj.protocol)) {
        return { error: `Canonical must use http(s) scheme: ${href}` };
      }
      return { url: href };
    } catch {
      return { error: `Canonical is not a valid absolute URL: ${href}` };
    }
  }
  return { error: `No <link rel="canonical" href="..."> tag found` };
}

function isHomepage(absUrl) {
  const u = new URL(absUrl);
  return (u.pathname === "/" || u.pathname === "") && !u.search && !u.hash;
}

// -------------------- main --------------------
function main() {
  if (!fs.existsSync(buildFolderPath)) {
    console.error(`❌ Build folder not found: ${buildFolderPath}`);
    process.exit(1);
  }

  const htmlFiles = getHtmlFilesRecursive(buildFolderPath);
  if (htmlFiles.length === 0) {
    console.error(`❌ No HTML files found under ${buildFolderPath}`);
    process.exit(1);
  }

  const errors = [];
  const entries = [];

  for (const filePath of htmlFiles) {
    const content = readFileUtf8(filePath);

    // Skip experiments entirely
    if (isExperiment(content)) continue;

    const { url, error } = extractCanonicalAbsoluteUrl(content);
    if (error) {
      errors.push(`• ${path.relative(buildFolderPath, filePath)} — ${error}`);
      continue;
    }

    entries.push({
      loc: url,
      priority: isHomepage(url) ? "1.00" : "0.80",
    });
  }

  if (errors.length > 0) {
    console.error("❌ Canonical URL validation failed for the following pages:");
    for (const e of errors) console.error(e);
    process.exit(1);
  }

  // Deduplicate canonicals (multiple files may map to same canonical)
  const seen = new Set();
  const unique = [];
  for (const e of entries) {
    if (seen.has(e.loc)) continue;
    seen.add(e.loc);
    unique.push(e);
  }

  // Sort for deterministic output
  unique.sort((a, b) => a.loc.localeCompare(b.loc));

  // Build XML (no <lastmod>)
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const e of unique) {
    xml += `  <url><loc>${e.loc}</loc><priority>${e.priority}</priority></url>\n`;
  }
  xml += `</urlset>\n`;

  fs.writeFileSync(sitemapPath, xml, "utf8");
  console.log(`✅ sitemap.xml generated: ${path.relative(process.cwd(), sitemapPath)}`);
  console.log(`   URLs: ${unique.length}`);
}

main();
