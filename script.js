<script>
window.addEventListener('load', async () => {
  const feedUrl = 'https://soft-madeleine-2c2c86.netlify.app/.netlify/functions/cors-proxy/https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml';

  try {
    console.log("➡️ Fetching and parsing RSS feed...");
    const response = await fetch(feedUrl);
    const text = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    const items = Array.from(xmlDoc.querySelectorAll("item")).map((item, index) => {
      const title = item.querySelector("title")?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";

      // ✅ DEBUG LOG: Print the raw description content
      console.log(`📄 RAW DESCRIPTION FOR ITEM ${index + 1}:\n${description}\n`);

      // Try to extract fields with broad regexes
      const dateMatch = description.match(/Event date[s]?:\s*([^\n<]+)/i);
      const timeMatch = description.match(/Event time:\s*([^\n<]+)/i);
      const locationMatch = description.match(/Location:\s*([^\n<]+)/i);

      return {
        title,
        date: dateMatch ? dateMatch[1].trim() : "TBA",
        time: timeMatch ? timeMatch[1].trim() : "TBA",
        location: locationMatch ? locationMatch[1].trim() : "TBA",
      };
    });

    // Pagination
    const eventsPerPage = 5;
    window.pages = [];
    for (let i = 0; i < items.length; i += eventsPerPage) {
      const pageItems = items.slice(i, i + eventsPerPage);
      const html = pageItems.map(event => `
        <div class="event">
          <div class="event-title">${event.title}</div>
          <div class="event-date">Date: ${event.date}</div>
          <div class="event-time">Time: ${event.time}</div>
          <div class="event-location">Location: ${event.location}</div>
        </div>
      `).join('');
      window.pages.push(html);
    }

    window.currentPage = 0;
    const container = document.getElementById("event-container");
    container.innerHTML = window.pages[window.currentPage];

    // Auto-paginate in browser for visual testing
    setInterval(() => {
      window.currentPage = (window.currentPage + 1) % window.pages.length;
      container.style.opacity = 0;
      setTimeout(() => {
        container.innerHTML = window.pages[window.currentPage];
        container.style.opacity = 1;
      }, 500);
    }, 5000);

  } catch (err) {
    console.error("❌ Failed to load or parse RSS feed:", err);
  }
});
</script>
