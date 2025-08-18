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

// Strip tags and clean text
function cleanText(html) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

// Get only the first clean match of the label
function extractField(description, labels) {
  for (const label of labels) {
    const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(<br\\s*\\/?>|</p>|\\n|$)`, "i");
    const match = description.match(regex);
    if (match) return cleanText(match[1]);
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
        const m = itemXML.match(new RegExp(`<${tag}>(.*?)</${tag}>`, "i"));
        return m ? m[1].trim() : "";
      };

      const title = cleanText(getTag("title"));
      const description = getTag("description");

      const date = extractField(description, ["Event date", "Event dates"]) || "TBA";
      const time = extractField(description, ["Event time", "Time"]) || "TBA";
      const location = extractField(description, ["Location"]) || "TBA";

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
