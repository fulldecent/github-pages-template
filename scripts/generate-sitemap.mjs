import fs from "fs";
import path from "path";
import https from "https";
import { parseString } from "xml2js"; // Using xml2js for XML parsing

const site = "https://www.acls.net";
const buildFolderPath = path.join(process.cwd(), "build");
const sitemapPath = path.join(buildFolderPath, "sitemap.xml");
const daysThreshold = 30; // Number of days to compare for updating lastmod

// Function to generate sitemap XML content
function generateSitemap(files, lastmodDate) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  files.forEach((file) => {
    // Convert file path to URL and remove file extensions
    const url = file
      .replace(buildFolderPath, "")
      .replace(/\\/g, "/")
      .replace(/index\.html?$/, "")
      .replace(/\.html?$/, "");
    xml += `<url><loc>${site}${url}</loc>`;
    xml += `<lastmod>${lastmodDate.toISOString()}</lastmod>`; // Use lastmodDate if it exists
    xml += url === "/" ? "<priority>1.00</priority>" : "<priority>0.80</priority>";
    xml += "</url>\n";
  });

  xml += "</urlset>";
  return xml;
}

// Recursive function to find HTML files in subdirectories
function getHTMLFiles(dir, fileList) {
  const files = fs.readdirSync(dir);
  fileList = fileList || [];

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getHTMLFiles(filePath, fileList);
    } else if (path.extname(file) === ".html") {
      const content = fs.readFileSync(filePath, "utf8");
      const experimentMetaTag = content.match(/<meta\s+name=["']experiment["']\s+content=["']true["']\s*\/?>/i);
      if (!experimentMetaTag) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// Fetch sitemap.xml from the provided URL
https
  .get(`${site}/sitemap.xml`, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      // Check if sitemap.xml file exists
      parseString(data, (err, result) => {
        if (err) {
          generateAndWriteSitemap(new Date());
          return;
        }

        // Get the lastmod date of the first URL
        const lastmod = new Date(result.urlset.url[0].lastmod[0]);
        const today = new Date();
        // Calculate the difference in days
        const differenceInTime = today.getTime() - lastmod.getTime();
        const differenceInDays = Math.round(differenceInTime / (1000 * 3600 * 24));
        // Generate the sitemap using lastmod if the difference is more than daysThreshold, else use currentDate
        const sitemapDate = differenceInDays > daysThreshold ? today : lastmod;
        generateAndWriteSitemap(sitemapDate);
      });
    });
  })
  .on("error", (err) => {
    console.error("Error fetching sitemap:", err);
    // If there's an error fetching the sitemap, generate the sitemap with the current date
    generateAndWriteSitemap(new Date());
  });

// Function to generate and write sitemap
function generateAndWriteSitemap(lastmodDate) {
  // Find all HTML files in build folder and its subdirectories
  const htmlFiles = getHTMLFiles(buildFolderPath);
  // Generate sitemap XML content
  const sitemapXML = generateSitemap(htmlFiles, lastmodDate);
  // Write sitemap XML to file
  fs.writeFile(sitemapPath, sitemapXML, (err) => {
    if (err) throw err;
    console.log("Sitemap.xml generated successfully!");
  });
}
