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

      // Parse the HTML inside the <description>
      const descDoc = new DOMParser().parseFromString(description, "text/html");
      const lines = descDoc.body.innerText.split('\n').map(line => line.trim());

      let date = "TBA";
      let time = "TBA";
      let location = "TBA";

      for (const line of lines) {
        if (/^Event date[s]?:/i.test(line)) {
          date = line.replace(/^Event date[s]?:\s*/i, '').trim();
        } else if (/^Event time:/i.test(line)) {
          time = line.replace(/^Event time:\s*/i, '').trim();
        } else if (/^Location:/i.test(line)) {
          location = line.replace(/^Location:\s*/i, '').trim();
        }
      }

      return { title, date, time, location };
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
