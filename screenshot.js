const puppeteer = require("puppeteer");
const fs = require("fs");

const VIEWPORT = { width: 616, height: 960 };
const PAGES = 4;
const DELAY = 15000;

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  await page.goto("https://kmchale1974.github.io/romeoville-event-feed/", { waitUntil: "networkidle0" });
  await page.waitForSelector(".event-page");

  for (let i = 0; i < PAGES; i++) {
    await page.evaluate((i) => {
      if (window.showPage) window.showPage(i);
    }, i);

    await page.waitForTimeout(1000); // Wait for fade
    await page.screenshot({ path: `output/output-${i + 1}.png` });
    await page.waitForTimeout(DELAY - 1000);
  }

  await browser.close();
})();
