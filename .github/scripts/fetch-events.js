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

function stripHTMLandWhitespace(text) {
  return text
    .replace(/<[^>]+>/g, "")       // Remove HTML tags like <strong>, <br>
    .replace(/\s*\n\s*/g, " ")     // Normalize newlines
    .replace(/\s{2,}/g, " ")       // Collapse extra spaces
    .trim();
}

function extractField(description, labels) {
  const plain = stripHTMLandWhitespace(description);

  for (const label of labels) {
    const regex = new RegExp(`${label}:\\s*(.*?)(?=\\s{2,}|$)`, "i");
    const match = plain.match(regex);
    if (match) return match[1].trim();
  }
  return null;
}

function dedupe(value) {
  return [...new Set(value.split(/\s*\|\s*|\n/).map(s => s.trim()))].join(" | ");
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
        const tagMatch = itemXML.match(new RegExp(`<${tag}>(.*?)</${tag}>`, "i"));
        return tagMatch ? tagMatch[1].trim() : "";
      };

      const title = getTag("title");
      const description = getTag("description");

      const date = extractField(description, ["Event date", "Event dates"]) || "TBA";
      let time = extractField(description, ["Event time", "Time"]) || "TBA";
      let location = extractField(description, ["Location"]) || "TBA";

      // Deduplicate repeated values
      time = dedupe(time);
      location = dedupe(location);

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
