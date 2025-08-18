window.addEventListener('load', async () => {
  try {
    const res = await fetch('events.json');
    const events = await res.json();

    const eventsPerPage = 5;
    window.pages = [];

    // Robust tag stripper + entity decoder using a <textarea>
    const stripHTML = html => {
      const div = document.createElement('div');
      div.innerHTML = html || '';
      return div.textContent?.trim() || "TBA";
    };

    for (let i = 0; i < events.length; i += eventsPerPage) {
      const pageItems = events.slice(i, i + eventsPerPage);
      const html = pageItems.map(event => `
        <div class="event">
          <div class="event-title">${stripHTML(event.title)}</div>
          <div class="event-date">Date: ${stripHTML(event.date)}</div>
          <div class="event-time">Time: ${stripHTML(event.time)}</div>
          <div class="event-location">Location: ${stripHTML(event.location)}</div>
        </div>
      `).join('');
      window.pages.push(html);
    }

    window.currentPage = 0;
    const container = document.getElementById("event-container");
    container.innerHTML = window.pages[window.currentPage];

    // Auto paginate every 12 seconds
    setInterval(() => {
      window.currentPage = (window.currentPage + 1) % window.pages.length;
      container.style.opacity = 0;
      setTimeout(() => {
        container.innerHTML = window.pages[window.currentPage];
        container.style.opacity = 1;
      }, 500);
    }, 12000);
  } catch (err) {
    document.getElementById("event-container").innerText = "❌ Failed to load events.";
    console.error("❌ Error loading events.json:", err);
  }
});
