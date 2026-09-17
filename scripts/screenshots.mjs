import { chromium } from "playwright";

const base = "http://127.0.0.1:4321";
const out = process.argv[2];
const shots = [
  ["home", "/", 1440, false],
  ["home-dark", "/", 1440, true],
  ["papers", "/papers/", 1440, false],
  ["paper", "/papers/dani-network-inference/", 1440, false],
  ["people", "/people/", 1440, false],
  ["person", "/people/maryam-ramezani/", 1440, false],
  ["research", "/research/", 1440, false],
  ["join", "/join/", 1440, false],
  ["news", "/news/", 1440, false],
  ["home-mobile", "/", 390, false],
  ["papers-mobile", "/papers/", 390, false],
];

const executablePath =
  process.env.CHROMIUM_PATH ??
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const browser = await chromium.launch({ executablePath });
for (const [name, path, width, dark] of shots) {
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  if (dark) {
    await page.addInitScript(() =>
      localStorage.setItem("daisy-theme", JSON.stringify({ state: { theme: "dark" }, version: 0 })),
    );
  }
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (errors.length) console.log(name, "ERRORS", errors);
  await context.close();
}
await browser.close();
console.log("done");
