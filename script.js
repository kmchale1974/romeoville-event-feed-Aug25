console.log("Romeoville Events script is running...");
const rssFeedUrl = "https://soft-madeleine-2c2c86.netlify.app/.netlify/functions/cors-proxy/https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";
const EVENTS_PER_PAGE = 5;
const PAGE_DURATION = 15000;

async function fetchAndDisplayEvents() {
  try {
    const response = await fetch(rssFeedUrl);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const items = xml.querySelectorAll("item");

    const allEvents = [];

    items.forEach((item) => {
      const title = item.querySelector("title")?.textContent?.trim() || "No Title";
      const description = item.querySelector("description")?.textContent || "";
      const link = item.querySelector("link")?.textContent?.trim() || "";

      const summaryText = description.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const dateMatch = summaryText.match(/Event date[s]*:\s*(.+?)\s*(?=Event Time|Location|$)/i);
      const timeMatch = summaryText.match(/Event Time:\s*(.+?)(?=Location|$)/i);
      const locationMatch = summaryText.match(/Location:\s*(.+)$/i);

      let startDate = null;
      let endDate = null;
      if (dateMatch) {
        const rawDate = dateMatch[1].trim();
        if (rawDate.includes("-")) {
          const [startRaw, endRaw] = rawDate.split("-").map(d => d.trim());
          startDate = new Date(startRaw + " 00:00");
          endDate = new Date(endRaw + " 23:59");
        } else {
          startDate = new Date(rawDate + " 00:00");
          endDate = new Date(rawDate + " 23:59");
        }
      }

      if (startDate && endDate) {
        allEvents.push({
          title,
          dateText: dateMatch ? dateMatch[1].trim() : "Date TBD",
          time: timeMatch ? timeMatch[1].trim() : "Time TBD",
          location: locationMatch ? locationMatch[1].replace(/Romeoville, IL ?60446/i, "").trim() : "",
          startDate,
          endDate,
          link,
        });
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = allEvents.filter(event => event.endDate >= today);
    upcomingEvents.sort((a, b) => a.startDate - b.startDate);

    const container = document.getElementById("event-container");
    if (!container) throw new Error("Missing container");

    const pages = [];
    for (let i = 0; i < upcomingEvents.length && pages.length < 4; i += EVENTS_PER_PAGE) {
      const pageEvents = upcomingEvents.slice(i, i + EVENTS_PER_PAGE);
      const pageHTML = pageEvents.map(event => \`
        <div class="event">
          <div class="event-title">\${event.title}</div>
          <div class="event-details">\${event.dateText} • \${event.time}<br>\${event.location}</div>
        </div>\`).join("");
      pages.push(`<div class="event-page" style="opacity: 0;">${pageHTML}</div>`);
    }

    container.innerHTML = pages.join("");
    const pageEls = Array.from(container.children);
    let currentPage = 0;
    function showPage(index) {
      pageEls.forEach((el, i) => el.style.opacity = i === index ? "1" : "0");
    }
    showPage(currentPage);
    setInterval(() => {
      currentPage = (currentPage + 1) % pageEls.length;
      showPage(currentPage);
    }, PAGE_DURATION);

  } catch (error) {
    console.error("Error loading events:", error);
  }
}
fetchAndDisplayEvents();
