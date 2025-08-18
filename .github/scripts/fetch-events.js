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

function extractFirstMatch(description, label) {
  const regex = new RegExp(`${label}:\\s*([^\n\r<]+)`, "i");
  const match = description.match(regex);
  return match ? match[1].trim() : null;
}

function extractLocation(description) {
  const lines = description.split(/\r?\n/).map(l => l.trim());
  let index = lines.findIndex(line => /^Location:/i.test(line));
  if (index === -1 || index >= lines.length - 1) return "TBA";

  const locationLines = [];
  for (let i = index + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || /^Event time:/i.test(line) || /^Time:/i.test(line) || /^Location:/i.test(line)) break;
    locationLines.push(line);
  }

  return [...new Set(locationLines)].join(", ") || "TBA";
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
      const rawDescription = getTag("description");
      const description = cleanHTML(rawDescription);

      const date = extractFirstMatch(description, "Event date") || extractFirstMatch(description, "Event dates") || "TBA";
      const time = extractFirstMatch(description, "Event time") || "TBA";
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
