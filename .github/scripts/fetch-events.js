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

function stripHTML(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')         // convert <br> to newlines
    .replace(/<\/?[^>]+(>|$)/g, '')         // remove all HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

function extractField(text, label) {
  const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?:\\n|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
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
        const tagMatch = itemXML.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
        return tagMatch ? tagMatch[1].trim() : "";
      };

      const title = stripHTML(getTag("title"));
      const rawDesc = getTag("description");
      const cleanedDesc = stripHTML(rawDesc);

      const date = extractField(cleanedDesc, "Event date") || extractField(cleanedDesc, "Event dates") || "TBA";
      const time = extractField(cleanedDesc, "Event time") || "TBA";
      const location = extractField(cleanedDesc, "Location") || "TBA";

      items.push({ title, date, time, location });
    }

    console.log(`✅ Parsed ${items.length} events`);
    fs.writeFileSync("events.json", JSON.stringify(items, null, 2));
    console.log("💾 Saved events.json");
  } catch (err) {
    console.error("❌ Failed to fetch or parse events:", err);
    process.exit(1);
  }
})();
