const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto("https://kmchale1974.github.io/romeoville-event-feed/", { waitUntil: "networkidle0" });

  if (!fs.existsSync('./output')) fs.mkdirSync('./output');

  for (let i = 0; i < 4; i++) {
    await page.evaluate((index) => {
      window.showPage(index);
    }, i);
    await page.waitForTimeout(2000); // wait for fade animation
    await page.screenshot({ path: `output/page-${i + 1}.png`, fullPage: true });
  }

  await browser.close();
})();