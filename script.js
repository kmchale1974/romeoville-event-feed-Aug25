window.addEventListener('load', () => {
  // ✅ Sample pages — replace this with real logic later
  window.pages = Array.from({ length: 4 }).map((_, i) => {
    let eventsHTML = '';
    for (let j = 1; j <= 5; j++) {
      const num = i * 5 + j;
      eventsHTML += `
        <div class="event">
          <div class="event-title">Sample Event ${num}</div>
          <div class="event-date">Date: August ${num}, 2025</div>
          <div class="event-time">Time: 12:00 PM</div>
          <div class="event-location">Location: Romeoville, IL</div>
        </div>
      `;
    }
    return eventsHTML;
  });

  window.currentPage = 0;

  const container = document.getElementById('event-container');
  container.innerHTML = window.pages[window.currentPage];

  // Optional: start auto-rotation in browser
  setInterval(() => {
    window.currentPage = (window.currentPage + 1) % window.pages.length;
    container.style.opacity = 0;
    setTimeout(() => {
      container.innerHTML = window.pages[window.currentPage];
      container.style.opacity = 1;
    }, 500);
  }, 5000); // every 5 seconds
});
