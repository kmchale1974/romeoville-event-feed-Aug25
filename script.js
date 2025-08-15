async function fetchEvents() {
  const response = await fetch(
    "https://soft-madeleine-2c2c86.netlify.app/.netlify/functions/cors-proxy/https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml"
  );
  const text = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  const items = Array.from(xmlDoc.querySelectorAll("item")).map(item => {
    const title = item.querySelector("title")?.textContent || "";
    const description = item.querySelector("description")?.textContent || "";

    // Updated pattern with robust fallback
    const dateMatch = description.match(/Event date[s]?:\s*([^\n<]*)/i);
    const timeMatch = description.match(/Event time:\s*([^\n<]*)/i);
    const locationMatch = description.match(/Location:\s*([^\n<]*)/i);

    return {
      title,
      date: dateMatch ? dateMatch[1].trim() : "TBA",
      time: timeMatch ? timeMatch[1].trim() : "TBA",
      location: locationMatch ? locationMatch[1].trim() : "TBA"
    };
  });

  return items;
}

function groupEvents(events, perPage = 5) {
  const pages = [];
  for (let i = 0; i < events.length; i += perPage) {
    const chunk = events.slice(i, i + perPage);
    const html = chunk
      .map(
        ev => `
        <div class="event">
          <div class="event-title">${ev.title}</div>
          <div class="event-date">Date: ${ev.date}</div>
          <div class="event-time">Time: ${ev.time}</div>
          <div class="event-location">Location: ${ev.location}</div>
        </div>
      `
      )
      .join("");
    pages.push(html);
  }
  return pages;
}

async function start() {
  const events = await fetchEvents();
  const upcomingEvents = events.filter(ev => {
    const dateText = ev.date;
    const parsed = Date.parse(dateText);
    return !isNaN(parsed) ? parsed >= Date.now() : true;
  });

  window.pages = groupEvents(upcomingEvents, 5);
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
  }, 20000); // every 20 seconds
}

window.addEventListener("load", start);
