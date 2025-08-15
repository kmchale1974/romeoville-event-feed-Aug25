const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 616, height: 960 });

  await page.goto("https://kmchale1974.github.io/romeoville-event-feed-Aug25/index.html", {
    waitUntil: "networkidle2",
  });

  // Wait for container to load
  await page.waitForSelector("#event-container");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get the number of pages safely
  const totalPages = await page.evaluate(() => {
    return (typeof window.pages !== 'undefined' && Array.isArray(window.pages)) ? window.pages.length : 0;
  });

  if (totalPages === 0) {
    console.error("❌ No pages found. Check if window.pages is being populated.");
    await browser.close();
    process.exit(1);
  }

  for (let i = 0; i < totalPages; i++) {
    await page.screenshot({ path: `output/output-${i + 1}.png` });
    await page.evaluate(() => {
      if (typeof window.pages !== 'undefined' && Array.isArray(window.pages)) {
        window.currentPage = (window.currentPage + 1) % window.pages.length;
        document.getElementById("event-container").style.opacity = 0;
        setTimeout(() => {
          document.getElementById("event-container").innerHTML = window.pages[window.currentPage];
          document.getElementById("event-container").style.opacity = 1;
        }, 500);
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  await browser.close();
})();
