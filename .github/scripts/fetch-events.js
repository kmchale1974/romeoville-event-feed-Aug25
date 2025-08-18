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

function cleanDescription(raw) {
  // Remove HTML tags and decode HTML entities (basic)
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, "") // Remove all HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function extractField(desc, labels) {
  for (const label of labels) {
    const regex = new RegExp(`${label}:\\s*(.+)`, "i");
    const match = desc.match(regex);
    if (match) {
      return match[1].split('\n')[0].trim();
    }
  }
  return null;
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
      const rawDescription = getTag("description");
      const description = cleanDescription(rawDescription);

      const date = extractField(description, ["Event date", "Event dates"]) || "TBA";
      const time = extractField(description, ["Event time"]) || "TBA";
      const location = extractField(description, ["Location", "Event location"]) || "TBA";

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
