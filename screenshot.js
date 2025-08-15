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

  // Wait for scripts to finish loading
  console.log("⏳ Waiting 5 seconds for scripts to run...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Check window.pages
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

    // Update the page content and wait until it appears
    await page.evaluate((i) => {
      return new Promise((resolve) => {
        window.currentPage = i;
        const container = document.getElementById("event-container");
        container.style.opacity = 0;
        setTimeout(() => {
          container.innerHTML = window.pages[window.currentPage];
          container.style.opacity = 1;
          resolve();
        }, 500); // Delay matches your CSS fade-in timing
      });
    }, i);

    // Wait a bit longer to ensure DOM + animation settle
    await page.waitForTimeout(1000);

    await page.screenshot({ path: `output/output-${i + 1}.png` });
  }

  await browser.close();
})();
