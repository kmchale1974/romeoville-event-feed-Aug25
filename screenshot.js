const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 616, height: 960 });
  await page.goto("https://kmchale1974.github.io/romeoville-event-feed-Aug25/public/", { waitUntil: "networkidle0" });

  for (let i = 0; i < 4; i++) {
    await page.evaluate((pageNum) => window.showPage?.(pageNum), i);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `output/output-${i + 1}.png` });
  }
  await browser.close();
})();
