const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 616, height: 960 });

  // Load your event display page directly
  await page.goto("https://kmchale1974.github.io/romeoville-event-feed-Aug25/index.html", {
    waitUntil: "networkidle2",
  });

  // Wait for your event container to load
  await page.waitForSelector("#event-container");

  // Wait a bit for animations, fonts, etc.
  await new Promise(resolve => setTimeout(resolve, 2000));

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
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  await browser.close();
})();
