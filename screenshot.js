const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 616, height: 960 });

  await page.goto('https://kmchale1974.github.io/romeoville-event-feed-Aug25/', {
    waitUntil: 'networkidle0'
  });

  // Helper function to wait for a given time
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < 4; i++) {
    await delay(1000); // wait for fade in to complete
    await page.screenshot({ path: `output/output-${i + 1}.png` });
    await delay(15000); // wait for page display time before next capture
  }

  await browser.close();
})();
