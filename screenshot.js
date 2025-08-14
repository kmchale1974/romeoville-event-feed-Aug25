import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE_URL = 'https://kmchale1974.github.io/romeoville-event-feed-Aug25/index.html?page=';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'] // <-- this is the fix
});

const page = await browser.newPage();
if (!fs.existsSync('./output')) fs.mkdirSync('./output');

// Loop through pages 1–4
for (let i = 1; i <= 4; i++) {
  const url = `${BASE_URL}${i}`;
  console.log(`Capturing ${url}`);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForTimeout(2000); // let content fully render
  await page.screenshot({ path: `output/page-${i}.png`, fullPage: true });
}

await browser.close();
