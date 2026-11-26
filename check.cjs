// Interaction smoke test for the stats site (own tooling).
const { chromium } = require('/opt/hatch/skills/spaces/ts-runtime/dist/node_modules/playwright-core');
const fs = require('node:fs');
const POLICY = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
const SHA = require('node:crypto').createHash('sha256').update(fs.readFileSync(POLICY)).digest('hex');
const APP = '/home/hatch/workspace/goals/make-fun/work/best-national-statistics-site-20261126-0539/app';
const OUT = '/home/hatch/workspace/goals/make-fun/work/best-national-statistics-site-20261126-0539/screenshots';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/hatch/bin/hatch-chromium-sandbox',
    chromiumSandbox: true, headless: true,
    args: ['--disable-sync', '--disable-domain-reliability', '--disable-component-update',
      `--hatch-sandbox-read=${APP}`,
      `--hatch-webgl-allowed-domains-file=${POLICY}`,
      `--hatch-webgl-allowed-domains-sha256=${SHA}`],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));
  const check = (name, ok) => console.log((ok ? 'PASS' : 'FAIL') + ' ' + name);

  await page.goto(`file://${APP}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__shotReady === true).catch(() => {});
  check('overview renders', await page.locator('h2').first().innerText().then((t) => t.includes('at a glance')));
  // search
  await page.fill('#idxSearch', 'unemployment');
  check('search filters to unemployment rows', (await page.locator('#idxList li').count()) === 3);
  await page.fill('#idxSearch', 'zzzz');
  check('search no-match note', (await page.locator('#idxList li').first().innerText()).includes('No indicator matches'));
  await page.fill('#idxSearch', '');

  // population: slider + toggles + sort + csv button presence
  await page.goto(`file://${APP}/index.html#/population`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.fill('#popYear', '2020');
  await page.dispatchEvent('#popYear', 'input');
  await page.waitForTimeout(300);
  check('slider 2020 shows 5.69m', (await page.locator('.kpi .value').first().innerText()).includes('5.69'));
  await page.click('[data-pc="line"]');
  await page.waitForTimeout(200);
  check('line toggle active', await page.locator('[data-pc="line"]').evaluate((el) => el.classList.contains('on')));
  await page.click('[data-ps="indexed"]');
  await page.waitForTimeout(200);
  check('indexed toggle active', await page.locator('[data-ps="indexed"]').evaluate((el) => el.classList.contains('on')));
  const firstBefore = await page.locator('#popTable tbody tr').first().locator('td').first().innerText();
  await page.click('#popTable th:nth-child(2)');
  await page.waitForTimeout(200);
  const firstAfter = await page.locator('#popTable tbody tr').first().locator('td').first().innerText();
  check(`table sort changes order (${firstBefore} -> ${firstAfter})`, firstBefore !== firstAfter);
  check('donut drawn', await page.locator('#popDonut').evaluate((c) => c.width > 0));

  // labour
  await page.goto(`file://${APP}/index.html#/labour`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  check('labour renders', (await page.locator('h2').innerText()).includes('Labour'));
  await page.click('[data-us="resident"]');
  await page.waitForTimeout(200);
  check('resident series active', await page.locator('[data-us="resident"]').evaluate((el) => el.classList.contains('on')));
  await page.screenshot({ path: `${OUT}/05-labour-check.jpg`, type: 'jpeg', quality: 82 });

  // prices
  await page.goto(`file://${APP}/index.html#/prices`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  check('prices renders', (await page.locator('h2').innerText()).includes('Prices'));
  await page.click('[data-im="indexed"]');
  await page.waitForTimeout(200);
  check('income indexed active', await page.locator('[data-im="indexed"]').evaluate((el) => el.classList.contains('on')));
  await page.screenshot({ path: `${OUT}/06-prices-check.jpg`, type: 'jpeg', quality: 82 });

  // sources
  await page.goto(`file://${APP}/index.html#/sources`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  check('sources renders', (await page.locator('h2').innerText()).includes('Sources'));

  // no external requests: collect request URLs
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO CONSOLE/PAGE ERRORS');
  await browser.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
