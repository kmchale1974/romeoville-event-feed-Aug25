window.addEventListener('load', async () => {
  try {
    const response = await fetch('events.json');
    const events = await response.json();

    const eventsPerPage = 5;
    window.pages = [];

    for (let i = 0; i < events.length; i += eventsPerPage) {
      const pageItems = events.slice(i, i + eventsPerPage);
      const pageHTML = pageItems.map(event => `
        <div class="event">
          <div class="event-title">${event.title}</div>
          <div class="event-date">Date: ${event.date}</div>
          <div class="event-time">Time: ${event.time}</div>
          <div class="event-location">Location: ${event.location}</div>
        </div>
      `).join('');
      window.pages.push(pageHTML);
    }

    window.currentPage = 0;
    const container = document.getElementById("event-container");
    container.innerHTML = window.pages[window.currentPage];

    setInterval(() => {
      window.currentPage = (window.currentPage + 1) % window.pages.length;
      container.style.opacity = 0;
      setTimeout(() => {
        container.innerHTML = window.pages[window.currentPage];
        container.style.opacity = 1;
      }, 500);
    }, 20000);
  } catch (err) {
    console.error("❌ Failed to load events.json", err);
    document.getElementById("event-container").innerHTML = "Failed to load events.";
  }
});
