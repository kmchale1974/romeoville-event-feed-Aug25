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

// Utility: strip HTML tags
function stripTags(html) {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

// Utility: extract specific field from a line
function extractField(desc, label) {
  const regex = new RegExp(`${label}:\\s*(.*)`, "i");
  const match = desc.match(regex);
  return match ? stripTags(match[1]) : null;
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
        const m = itemXML.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
        return m ? m[1].trim() : "";
      };

      const title = stripTags(getTag("title"));
      const rawDescription = getTag("description");

      const descText = stripTags(rawDescription); // remove HTML tags
      const date = extractField(descText, "Event date") || extractField(descText, "Event dates") || "TBA";
      const time = extractField(descText, "Event time") || "TBA";
      const location = extractField(descText, "Location") || "TBA";

      items.push({ title, date, time, location });
    }

    console.log(`✅ Parsed ${items.length} events.`);
    fs.writeFileSync("events.json", JSON.stringify(items, null, 2));
    console.log("💾 events.json saved.");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
