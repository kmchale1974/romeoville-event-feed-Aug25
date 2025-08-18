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

// Decode HTML entities
function decodeHTMLEntities(str) {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

// Strip HTML tags
function stripTags(str) {
  return str.replace(/<[^>]*>/g, "").trim();
}

// Better extraction for multi-line fields
function extractField(desc, label) {
  const regex = new RegExp(`${label}:\\s*(.*?)((<br\\s*/?>\\s*){1,5})`, "i");
  const match = desc.match(regex);
  if (!match) return null;

  const start = match.index + match[0].length;
  const rest = desc.slice(start);
  const stopLabels = ["Event date", "Event dates", "Event time", "Location"];
  const lines = rest.split(/<br\s*\/?>/i);
  const valueLines = [];

  for (const line of lines) {
    const clean = stripTags(decodeHTMLEntities(line)).trim();
    if (!clean || stopLabels.some(lbl => clean.toLowerCase().startsWith(lbl.toLowerCase()))) break;
    valueLines.push(clean);
  }

  return valueLines.join(", ");
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
      const desc = decodeHTMLEntities(rawDescription);

      const date = extractField(desc, "Event date") || extractField(desc, "Event dates") || "TBA";
      const time = extractField(desc, "Event time") || "TBA";
      let locationRaw = extractField(desc, "Location");

      if (locationRaw) {
        locationRaw = locationRaw
          .replace(/Romeoville,\s*IL\s*\d{5}/i, "") // Remove city/state
          .replace(/\s+/g, " ")                     // Normalize spacing
          .trim()
          .replace(/,$/, "");                       // Remove trailing commas
      }

      const location = locationRaw || "TBA";

      items.push({ title, date, time, location });
    }

    console.log(`✅ Parsed ${items.length} events.`);
    fs.writeFileSync("events.json", JSON.stringify(items, null, 2));
    console.log("💾 events.json written.");
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  }
})();
