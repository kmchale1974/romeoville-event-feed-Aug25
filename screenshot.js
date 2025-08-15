const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 616, height: 960 });

  // ✅ Directly load the real event viewer, not the repo homepage
  await page.goto("https://kmchale1974.github.io/romeoville-event-feed-Aug25/index.html", {
    waitUntil: "networkidle2",
  });

  // Wait for events to render — adjust this if needed
  await page.waitForSelector(".event-page");
  await page.waitForTimeout(2000); // Let animations and fonts load

  for (let i = 0; i < 4; i++) {
    await page.screenshot({ path: `output/output-${i + 1}.png` });
    await page.evaluate(() => {
      window.currentPage = (window.currentPage + 1) % window.pages.length;
      document.getElementById("event-container").style.opacity = 0;
      setTimeout(() => {
        document.getElementById("event-container").innerHTML = window.pages[window.currentPage];
        document.getElementById("event-container").style.opacity = 1;
      }, 500);
    });
    await page.waitForTimeout(1500); // Let fade transition complete
  }

  await browser.close();
})();
