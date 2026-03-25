import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, "temporary screenshots");

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Find Chrome executable from Puppeteer cache
function findChrome() {
  const cacheDir = path.join(process.env.USERPROFILE || process.env.HOME, ".cache", "puppeteer", "chrome");
  if (!fs.existsSync(cacheDir)) return undefined;
  const versions = fs.readdirSync(cacheDir).sort().reverse();
  for (const ver of versions) {
    const exe = path.join(cacheDir, ver, "chrome-win64", "chrome.exe");
    if (fs.existsSync(exe)) return exe;
    const exeLinux = path.join(cacheDir, ver, "chrome-linux64", "chrome");
    if (fs.existsSync(exeLinux)) return exeLinux;
  }
  return undefined;
}

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";

// Find next available screenshot number
function getNextNumber() {
  const files = fs.readdirSync(SCREENSHOTS_DIR);
  let max = 0;
  for (const file of files) {
    const match = file.match(/^screenshot-(\d+)/);
    if (match) {
      max = Math.max(max, parseInt(match[1], 10));
    }
  }
  return max + 1;
}

const num = getNextNumber();
const suffix = label ? `-${label}` : "";
const filename = `screenshot-${num}${suffix}.png`;
const outputPath = path.join(SCREENSHOTS_DIR, filename);

async function takeScreenshot() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: findChrome(),
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  // Wait a moment for any animations/fonts to settle
  await new Promise((r) => setTimeout(r, 500));

  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`Screenshot saved: ${outputPath}`);

  await browser.close();
}

takeScreenshot().catch((err) => {
  console.error("Screenshot failed:", err.message);
  process.exit(1);
});
