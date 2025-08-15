const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 616, height: 960 });

  console.log("➡️ Loading page...");
  await page.goto("https://kmchale1974.github.io/romeoville-event-feed-Aug25/index.html", {
    waitUntil: "networkidle2",
  });

  // Manual wait to give JS time to load
  console.log("⏳ Waiting 5 seconds for scripts to run...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Check what window.pages looks like
  const debug = await page.evaluate(() => {
    return {
      pagesType: typeof window.pages,
      pagesLength: window.pages?.length || 0,
      currentPage: typeof window.currentPage,
      containerExists: !!document.getElementById("event-container"),
    };
  });

  console.log("🪵 Debug Info:", debug);

  if (debug.pagesLength === 0) {
    console.error("❌ No pages found. Check if window.pages is being populated.");
    await browser.close();
    process.exit(1);
  }

  for (let i = 0; i < debug.pagesLength; i++) {
    console.log(`📸 Capturing page ${i + 1} of ${debug.pagesLength}`);
    await page.screenshot({ path: `output/output-${i + 1}.png` });

    await page.evaluate(() => {
      if (Array.isArray(window.pages)) {
        window.currentPage = (window.currentPage + 1) % window.pages.length;
        const container = document.getElementById("event-container");
        container.style.opacity = 0;
        setTimeout(() => {
          container.innerHTML = window.pages[window.currentPage];
          container.style.opacity = 1;
        }, 500);
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1500)); // wait for transition to complete
  }

  await browser.close();
})();
