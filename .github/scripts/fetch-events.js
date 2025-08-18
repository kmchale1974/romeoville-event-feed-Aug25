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

function cleanHTML(input) {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?strong>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
}

function extractField(description, label) {
  const regex = new RegExp(`${label}:\\s*([^\n]+)`, "i");
  const match = description.match(regex);
  return match ? match[1].trim() : null;
}

function extractLocation(description) {
  const locStart = description.indexOf("Location:");
  if (locStart === -1) return "TBA";

  const afterLoc = description.slice(locStart + 9); // skip "Location:"
  const lines = afterLoc
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.toLowerCase().startsWith("time:"));

  // Limit to 2–3 lines max, avoid repeats
  const uniqueLines = [...new Set(lines)];
  return uniqueLines.slice(0, 3).join(", ");
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

      const title = getTag("title");
      let description = cleanHTML(getTag("description"));

      const date = extractField(description, "Event date") ||
                   extractField(description, "Event dates") || "TBA";

      const time = extractField(description, "Event time") || "TBA";
      const location = extractLocation(description);

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
