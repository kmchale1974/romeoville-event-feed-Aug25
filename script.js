window.addEventListener('load', async () => {
  const feedUrl = "https://soft-madeleine-2c2c86.netlify.app/.netlify/functions/cors-proxy/https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";

  try {
    const response = await fetch(feedUrl);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const items = Array.from(xmlDoc.querySelectorAll("item")).map(item => {
      const title = item.querySelector("title")?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";

      const dateMatch = description.match(/Event date[s]?: (.+?)<br/i);
      const timeMatch = description.match(/Event time: (.+?)<br/i);
      const locationMatch = description.match(/Location: (.+?)<br/i);

      return {
        title,
        date: dateMatch ? dateMatch[1].trim() : "TBA",
        time: timeMatch ? timeMatch[1].trim() : "TBA",
        location: locationMatch ? locationMatch[1].trim() : "TBA"
      };
    });

    const upcoming = items.filter(item => {
      const datePart = item.date.split("-")[0].trim(); // handles date ranges
      const parsed = new Date(datePart);
      return !isNaN(parsed) && parsed >= new Date();
    });

    const eventsPerPage = 5;
    window.pages = [];
    for (let i = 0; i < upcoming.length; i += eventsPerPage) {
      const group = upcoming.slice(i, i + eventsPerPage);
      const html = group.map(event => `
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
    container.innerHTML = window.pages[0];

    setInterval(() => {
      window.currentPage = (window.currentPage + 1) % window.pages.length;
      container.style.opacity = 0;
      setTimeout(() => {
        container.innerHTML = window.pages[window.currentPage];
        container.style.opacity = 1;
      }, 500);
    }, 5000);

  } catch (e) {
    console.error("❌ Failed to load events:", e);
    document.getElementById("event-container").innerHTML = "<p>Error loading events</p>";
  }
});
