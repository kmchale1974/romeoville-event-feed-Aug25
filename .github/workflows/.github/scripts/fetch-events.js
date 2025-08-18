const fs = require('fs');
const fetch = require('node-fetch');
const xml2js = require('xml2js');

const FEED_URL = 'https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml';
const MAX_EVENTS = 20;

(async () => {
  try {
    const res = await fetch(FEED_URL);
    const xml = await res.text();

    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);
    const items = result.rss.channel.item || [];

    const events = items.map(item => {
      const title = item.title || "Untitled Event";
      const desc = item.description || "";

      const dateMatch = desc.match(/Event date[s]?:\s*([^\n<]+)/i);
      const timeMatch = desc.match(/Event time:\s*([^\n<]+)/i);
      const locationMatch = desc.match(/Location:\s*([^\n<]+)/i);

      return {
        title,
        date: dateMatch ? dateMatch[1].trim() : "TBA",
        time: timeMatch ? timeMatch[1].trim() : "TBA",
        location: locationMatch ? locationMatch[1].trim() : "TBA",
      };
    });

    const trimmed = events.slice(0, MAX_EVENTS);

    fs.writeFileSync('events.json', JSON.stringify(trimmed, null, 2));
    console.log(`✅ Saved ${trimmed.length} events to events.json`);
  } catch (err) {
    console.error("❌ Error generating events.json:", err);
    process.exit(1);
  }
})();
