
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 1440, height: 900});
  await page.goto('http://localhost:3000/index.html', {waitUntil: 'networkidle2'});
  await page.screenshot({path: 'd:/AC service/temporary screenshots/screenshot-about-index.png', fullPage: true});
  await page.goto('http://localhost:3000/services.html', {waitUntil: 'networkidle2'});
  await page.screenshot({path: 'd:/AC service/temporary screenshots/screenshot-about-services.png', fullPage: true});
  await browser.close();
  console.log('done');
})();
