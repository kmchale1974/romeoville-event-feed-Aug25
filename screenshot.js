const puppeteer = require('puppeteer');

const url = 'https://kmchale1974.github.io/romeoville-event-feed/';
const outputDir = './';
const viewports = [
  { width: 1080, height: 1920, name: 'output-1' },
  { width: 1080, height: 1920, name: 'output-2' },
  { width: 1080, height: 1920, name: 'output-3' },
  { width: 1080, height: 1920, name: 'output-4' }
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(url + `?page=${vp.name.split('-')[1]}`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${outputDir}${vp.name}.png` });
  }

  await browser.close();
})();
