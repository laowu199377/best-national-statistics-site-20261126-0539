// Screenshot helper for the stats site (own tooling, not kit code).
// Uses Playwright-core from the spaces runtime + the Hatch sandbox launcher,
// the same launch path the artifact audit uses.
const { chromium } = require('/opt/hatch/skills/spaces/ts-runtime/dist/node_modules/playwright-core');
const fs = require('node:fs');

const POLICY = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
const SHA = require('node:crypto').createHash('sha256').update(fs.readFileSync(POLICY)).digest('hex');

const APP = process.argv[3] || '/home/hatch/workspace/goals/make-fun/work/best-national-statistics-site-20261126-0539/app';
const SHOTS = [
  { file: '01-overview.jpg', url: `file://${APP}/index.html?shot=overview`, width: 1280, height: 800 },
  { file: '02-population.jpg', url: `file://${APP}/index.html?shot=population`, width: 1280, height: 800 },
  { file: '03-economy.jpg', url: `file://${APP}/index.html?shot=economy`, width: 1280, height: 800 },
  { file: '04-overview-phone.jpg', url: `file://${APP}/index.html?shot=phone`, width: 390, height: 844 },
];

(async () => {
  const outDir = process.argv[2] || '.';
  const browser = await chromium.launch({
    executablePath: '/opt/hatch/bin/hatch-chromium-sandbox',
    chromiumSandbox: true,
    headless: true,
    args: [
      '--disable-sync', '--disable-domain-reliability', '--disable-component-update',
      `--hatch-sandbox-read=${APP}`,
      `--hatch-webgl-allowed-domains-file=${POLICY}`,
      `--hatch-webgl-allowed-domains-sha256=${SHA}`,
    ],
  });
  for (const s of SHOTS) {
    const page = await browser.newPage({ viewport: { width: s.width, height: s.height } });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(s.url, { waitUntil: 'load', timeout: 30000 });
    try {
      await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 10000 });
    } catch { console.log(s.file, 'shotReady TIMEOUT'); }
    await page.screenshot({ path: `${outDir}/${s.file}`, type: 'jpeg', quality: 82 });
    console.log(s.file, 'ok', errors.length ? 'console errors: ' + errors.join(' | ') : 'no console errors');
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
