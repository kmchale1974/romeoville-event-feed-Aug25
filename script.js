window.addEventListener("load", async () => {
  const feedUrl = "https://soft-madeleine-2c2c86.netlify.app/.netlify/functions/cors-proxy/https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";

  try {
    console.log("📡 Fetching RSS...");
    const response = await fetch(feedUrl);
    const xmlText = await response.text();

    console.log("📜 RSS length:", xmlText.length);
    console.log("📦 Raw XML preview:", xmlText.slice(0, 300));

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

    console.log("📆 Parsed items:", items.length);
    if (items.length === 0) {
      console.warn("⚠️ No events found in RSS feed. Check formatting or proxy.");
    }

    // Chunk into pages of 5
    const pageSize = 5;
    const pages = [];
    for (let i = 0; i < items.length; i += pageSize) {
      const chunk = items.slice(i, i + pageSize);
      const eventsHTML = chunk.map(event => `
        <div class="event">
          <div class="event-title">${event.title}</div>
          <div class="event-date">Date: ${event.date}</div>
          <div class="event-time">Time: ${event.time}</div>
          <div class="event-location">Location: ${event.location}</div>
        </div>
      `).join("");
      pages.push(eventsHTML);
    }

    window.pages = pages;
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
  } catch (error) {
    console.error("❌ Failed to fetch or parse RSS feed:", error);
  }
});
