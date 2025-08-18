const fs = require("fs");
const https = require("https");

const FEED_URL = "https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";
const PROXY_URL = "https://soft-madeleine-2c2c86.netlify.app/.netlify/functions/cors-proxy/" + FEED_URL;

function fetchXML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function extractField(desc, label) {
  // Look for only the first matching line
  const regex = new RegExp(`${label}:\\s*([^<\\n]+)`, "i");
  const match = desc.match(regex);
  return match ? match[1].trim() : null;
}

function cleanHTML(input) {
  return input
    .replace(/<br\s*\/?>/gi, "\n")      // Replace <br> with newlines
    .replace(/<\/?strong>/gi, "")       // Remove <strong> tags
    .replace(/&nbsp;/gi, " ")           // Optional: convert &nbsp;
    .replace(/<\/?[^>]+(>|$)/g, "")     // Remove any other HTML tags
    .trim();
}

(async () => {
  try {
    console.log("📡 Fetching RSS feed...");
    const xml = await fetchXML(PROXY_URL);

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXML = match[1];

      const getTag = tag => {
        const match = itemXML.match(new RegExp(`<${tag}>(.*?)</${tag}>`, "i"));
        return match ? match[1].trim() : "";
      };

      const title = getTag("title");
      let description = getTag("description");
      description = cleanHTML(description);

      const date = extractField(description, "Event date") ||
                   extractField(description, "Event dates") || "TBA";
      const time = extractField(description, "Event time") || "TBA";

      // Location can sometimes show multiple times, grab only the first
      const locationMatch = description.match(/Location:\s*([\s\S]+?)($|\n|Time:)/i);
      const location = locationMatch ? locationMatch[1].trim() : "TBA";

      items.push({ title, date, time, location });
    }

    console.log(`✅ Found ${items.length} events. Writing to events.json...`);
    fs.writeFileSync("events.json", JSON.stringify(items, null, 2));
    console.log("💾 events.json written.");
  } catch (err) {
    console.error("❌ Failed to fetch or parse events:", err);
    process.exit(1);
  }
})();
