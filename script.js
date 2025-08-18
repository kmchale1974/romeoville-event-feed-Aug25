window.addEventListener('load', async () => {
  try {
    const res = await fetch('events.json');
    const events = await res.json();

    const eventsPerPage = 9;
    window.pages = [];

    for (let i = 0; i < events.length; i += eventsPerPage) {
      const pageItems = events.slice(i, i + eventsPerPage);
      const html = pageItems.map(event => `
        <div class="event">
          <div class="event-title">${event.title || 'Untitled Event'}</div>
          <div class="event-date">Date: ${event.date || 'TBA'}</div>
          <div class="event-time">Time: ${event.time || 'TBA'}</div>
          <div class="event-location">Location: ${event.location || 'TBA'}</div>
        </div>
      `).join('');
      window.pages.push(html);
    }

    window.currentPage = 0;
    const container = document.getElementById("event-container");
    container.innerHTML = window.pages[window.currentPage];

    // Auto-paginate every 12 seconds
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
