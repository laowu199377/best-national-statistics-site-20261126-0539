// Singapore by the Numbers — router, charts and controls.
// Plain JavaScript, no libraries, no network. All data lives in data.js.

'use strict';

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const fmtInt = (n) => n.toLocaleString('en-SG');
const fmtM = (n) => n.toFixed(2).replace(/\.?0+$/, '') + 'm';
const fmtPct = (n, digits) => (n > 0 ? '+' : '') + n.toFixed(digits === undefined ? 1 : digits) + '%';
const fmtMoney = (n) => 'S$' + fmtInt(n);

/* ---------- canvas helpers ---------- */

function setupCanvas(canvas, heightCss) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || canvas.parentElement.clientWidth || 800;
  const h = heightCss || 300;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w, h };
}

function niceTicks(min, max, count) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);
  return { lo, hi, ticks };
}

// One series, bars or a line. `series` = [{year, value}], `format` formats
// a value for labels, `highlightYear` tints one bar.
function drawSeries(canvas, series, opts) {
  const o = opts || {};
  const { ctx, w, h } = setupCanvas(canvas, o.height || 300);
  const padL = 58, padR = 14, padT = 16, padB = 30;
  const iw = w - padL - padR, ih = h - padT - padB;
  const vals = series.map((p) => p.value);
  let min = Math.min.apply(null, vals.concat(o.floor !== undefined ? [o.floor] : [0]));
  let max = Math.max.apply(null, vals);
  if (o.floor === 0 || min > 0) min = Math.min(0, min);
  const t = niceTicks(min, max, 4);
  const y = (v) => padT + ih - ((v - t.lo) / (t.hi - t.lo)) * ih;
  const fmt = o.format || ((v) => String(v));

  ctx.font = '12px -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  // gridlines + y labels
  t.ticks.forEach((tv) => {
    ctx.strokeStyle = '#e6ebef';
    ctx.beginPath(); ctx.moveTo(padL, y(tv)); ctx.lineTo(w - padR, y(tv)); ctx.stroke();
    ctx.fillStyle = '#5b6b7a'; ctx.textAlign = 'right';
    ctx.fillText(fmt(tv), padL - 8, y(tv));
  });
  // zero line
  if (t.lo < 0 && t.hi > 0) {
    ctx.strokeStyle = '#9aa8b5';
    ctx.beginPath(); ctx.moveTo(padL, y(0)); ctx.lineTo(w - padR, y(0)); ctx.stroke();
  }
  const slot = iw / series.length;
  const cx = (i) => padL + slot * (i + 0.5);
  if (o.type === 'line') {
    ctx.strokeStyle = '#0e7c7b'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    series.forEach((p, i) => { if (i === 0) ctx.moveTo(cx(i), y(p.value)); else ctx.lineTo(cx(i), y(p.value)); });
    ctx.stroke();
    series.forEach((p, i) => {
      ctx.fillStyle = '#0e7c7b';
      ctx.beginPath(); ctx.arc(cx(i), y(p.value), 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1c2733'; ctx.textAlign = 'center';
      ctx.fillText(fmt(p.value), cx(i), y(p.value) - 14);
    });
  } else {
    const bw = Math.min(56, slot * 0.62);
    series.forEach((p, i) => {
      const isHl = o.highlightYear === p.year;
      ctx.fillStyle = isHl ? '#e8a13a' : (p.value < 0 ? '#c25b4e' : '#0e7c7b');
      const top = y(Math.max(0, p.value)), bot = y(Math.min(0, p.value));
      ctx.fillRect(cx(i) - bw / 2, top, bw, Math.max(1, bot - top));
      ctx.textAlign = 'center';
      if (p.value < 0) {
        // Negative bar: label inside the bar just under the zero line,
        // so it never collides with the year labels below.
        ctx.fillStyle = '#fff';
        ctx.fillText(fmt(p.value), cx(i), top + 14);
      } else {
        ctx.fillStyle = '#1c2733';
        ctx.fillText(fmt(p.value), cx(i), top - 12);
      }
    });
  }
  // x labels
  ctx.fillStyle = '#5b6b7a'; ctx.textAlign = 'center';
  series.forEach((p, i) => ctx.fillText(String(p.year), cx(i), h - 12));
}

// Multi-line chart with a legend; each series: {label, color, points}.
function drawLines(canvas, list, opts) {
  const o = opts || {};
  const { ctx, w, h } = setupCanvas(canvas, o.height || 300);
  const padL = 58, padR = 14, padT = 16, padB = 30;
  const iw = w - padL - padR, ih = h - padT - padB;
  const all = list.flatMap((s) => s.points.map((p) => p.value));
  let min = Math.min.apply(null, all), max = Math.max.apply(null, all);
  if (min > 0) min = 0;
  const t = niceTicks(min, max, 4);
  const y = (v) => padT + ih - ((v - t.lo) / (t.hi - t.lo)) * ih;
  const fmt = o.format || ((v) => String(v));
  ctx.font = '12px -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  t.ticks.forEach((tv) => {
    ctx.strokeStyle = '#e6ebef';
    ctx.beginPath(); ctx.moveTo(padL, y(tv)); ctx.lineTo(w - padR, y(tv)); ctx.stroke();
    ctx.fillStyle = '#5b6b7a'; ctx.textAlign = 'right';
    ctx.fillText(fmt(tv), padL - 8, y(tv));
  });
  const years = list[0].points.map((p) => p.year);
  const slot = iw / years.length;
  const cx = (i) => padL + slot * (i + 0.5);
  list.forEach((s) => {
    ctx.strokeStyle = s.color; ctx.lineWidth = 2.5;
    ctx.beginPath();
    s.points.forEach((p, i) => { if (i === 0) ctx.moveTo(cx(i), y(p.value)); else ctx.lineTo(cx(i), y(p.value)); });
    ctx.stroke();
    s.points.forEach((p, i) => {
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(cx(i), y(p.value), 3.5, 0, Math.PI * 2); ctx.fill();
    });
  });
  ctx.fillStyle = '#5b6b7a'; ctx.textAlign = 'center';
  years.forEach((yr, i) => ctx.fillText(String(yr), cx(i), h - 12));
}

function drawDonut(canvas, parts, colors) {
  const dpr = window.devicePixelRatio || 1;
  const size = 180;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const total = parts.reduce((a, p) => a + p.value, 0);
  let a0 = -Math.PI / 2;
  parts.forEach((p, i) => {
    const a1 = a0 + (p.value / total) * Math.PI * 2;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath(); ctx.moveTo(size / 2, size / 2);
    ctx.arc(size / 2, size / 2, size / 2 - 4, a0, a1); ctx.closePath(); ctx.fill();
    a0 = a1;
  });
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(size / 2, size / 2, 52, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0f2a43'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '700 22px -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(fmtM(total), size / 2, size / 2 - 10);
  ctx.font = '12px -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#5b6b7a';
  ctx.fillText('million people', size / 2, size / 2 + 12);
}

/* ---------- shared bits ---------- */

function kpi(label, value, sub) {
  return '<div class="kpi"><div class="label">' + label + '</div>' +
    '<div class="value">' + value + '</div><div class="sub">' + sub + '</div></div>';
}

function chartCard(title, canvasId, note, extraControls) {
  return '<section class="card"><h3>' + title + '</h3>' +
    (extraControls || '') +
    '<div class="chart-box"><canvas class="chart" id="' + canvasId + '"></canvas></div>' +
    '<p class="chart-note">' + note + '</p></section>';
}

function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

// Click a table header to sort that column (numbers sort numerically).
function makeSortable(table) {
  const ths = $$('th', table);
  ths.forEach((th, idx) => {
    th.addEventListener('click', () => {
      const tbody = table.tBodies[0];
      const rows = Array.from(tbody.rows);
      const asc = th.dataset.dir !== 'asc';
      rows.sort((a, b) => {
        const av = a.cells[idx].textContent.trim();
        const bv = b.cells[idx].textContent.trim();
        const an = parseFloat(av.replace(/[^0-9.\-]/g, ''));
        const bn = parseFloat(bv.replace(/[^0-9.\-]/g, ''));
        if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
      rows.forEach((r) => tbody.appendChild(r));
      ths.forEach((t) => { delete t.dataset.dir; t.textContent = t.textContent.replace(/ [▲▼]$/, ''); });
      th.dataset.dir = asc ? 'asc' : 'desc';
      th.textContent = th.textContent + (asc ? ' ▲' : ' ▼');
    });
  });
}

function dataTable(id, head, rows, hlYear) {
  let html = '<section class="card"><h3>Data table</h3>' +
    '<p class="chart-note">Click a column heading to sort. The highlighted row is the selected year.</p>' +
    '<div style="overflow-x:auto"><table class="data" id="' + id + '"><thead><tr>' +
    head.map((h) => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>';
  rows.forEach((r) => {
    html += '<tr' + (hlYear !== undefined && r[0] === hlYear ? ' class="hl"' : '') + '>' +
      r.map((c, i) => '<td>' + c + '</td>').join('') + '</tr>';
  });
  return html + '</tbody></table></div></section>';
}

// Indexed series: first year = 100.
function indexed(series) {
  const base = series[0].value;
  return series.map((p) => ({ year: p.year, value: +(p.value / base * 100).toFixed(1) }));
}

/* ---------- views ---------- */

const state = {
  popYear: 2024,
  popSeries: 'total',   // total | indexed
  popChart: 'bar',      // bar | line
  unemSeries: 'overall', // overall | resident | citizen
  unemChart: 'line',
  cpiChart: 'bar',
  incChart: 'bar',
  incMode: 'value',     // value | indexed
  search: '',
};

function viewOverview() {
  const p = DATA.population.latest, e = DATA.economy, l = DATA.labour;
  let html = '<h2>Singapore at a glance</h2>' +
    '<p class="lede">The headline numbers for the country, from the latest official ' +
    'releases. Every figure links to the section that shows it in full, with its source.</p>' +
    '<div class="kpis">' +
    kpi('Total population', '6.21 million', 'End-June 2026 · residents 4.23m, non-residents 1.98m') +
    kpi('Nominal GDP', 'S$731.4 bn', '2024 · <b>+4.4%</b> real growth') +
    kpi('GDP per capita', 'S$101,464', '2024 · US$90,674') +
    kpi('Unemployment (overall)', '2.0%', '2024 annual average · residents 2.7%') +
    kpi('CPI-All Items inflation', '+2.4%', '2024 · MAS Core +2.7%') +
    kpi('Median household income', 'S$11,297 / mo', 'From work, 2024 · incl. employer CPF') +
    '</div>' +
    '<section class="card"><h3>Population, 2015–2024</h3>' +
    '<div class="chart-box"><canvas class="chart" id="ovChart"></canvas></div>' +
    '<p class="chart-note">Total population at mid-year, millions. The 2021 dip follows the ' +
    'pandemic outflow of non-residents; the population passed 6 million in June 2024. ' +
    'Source: Department of Statistics, Population in Brief 2024.</p></section>' +
    '<div class="note-box"><b>Latest:</b> at end-June 2026 the total population stood at ' +
    '<b>6.21 million</b> (4.23 million residents, 1.98 million non-residents), ' +
    'according to the Department of Statistics release of 25 September 2026. The detailed ' +
    'breakdowns on this site use June 2024, the latest fully published breakdown.</div>' +
    '<section class="card"><h3>Find an indicator</h3>' +
    '<input type="search" id="idxSearch" placeholder="Search indicators — try “income”, “GDP”, “unemployment”…"' +
    ' value="' + state.search.replace(/"/g, '&quot;') + '" aria-label="Search indicators">' +
    '<ul class="index-list" id="idxList" style="margin-top:8px"></ul></section>' +
    '<h3 style="margin-top:22px">Browse by topic</h3><div class="sections">' +
    '<a href="#/population"><b>Population</b><span>Who lives here, how the mix is changing, and the 2015–2024 trend.</span></a>' +
    '<a href="#/economy"><b>Economy</b><span>GDP, growth and output per person, 2020–2024.</span></a>' +
    '<a href="#/labour"><b>Labour</b><span>Unemployment for all workers, residents and citizens, 2016–2024.</span></a>' +
    '<a href="#/prices"><b>Prices &amp; Incomes</b><span>Inflation and what households actually earn.</span></a>' +
    '<a href="#/sources"><b>Sources &amp; Notes</b><span>Where every figure comes from, and what it does — and does not — mean.</span></a>' +
    '</div>';
  $('#view').innerHTML = html;
  drawSeries($('#ovChart'), DATA.population.total, {
    format: (v) => v.toFixed(2), highlightYear: 2024, type: 'bar', height: 180,
  });
  renderIndexList();
  $('#idxSearch').addEventListener('input', (ev) => {
    state.search = ev.target.value;
    renderIndexList();
  });
}

function renderIndexList() {
  const q = state.search.trim().toLowerCase();
  const list = INDICATORS.filter((it) =>
    !q || (it.name + ' ' + it.value + ' ' + it.note).toLowerCase().includes(q));
  const ul = $('#idxList');
  if (!ul) return;
  ul.innerHTML = list.length ? list.map((it) =>
    '<li><a href="' + it.route + '"><span class="iname">' + it.name + '</span>' +
    '<span class="ival">' + it.value + '</span><span class="inote">' + it.note + '</span></a></li>'
  ).join('') : '<li class="empty-note">No indicator matches “' + state.search + '”. Try “GDP”, “income” or “unemployment”.</li>';
}

function viewPopulation() {
  const p = DATA.population, latest = p.latest;
  const series = p.total;
  const row = series.find((r) => r.year === state.popYear);
  const prev = series.find((r) => r.year === state.popYear - 1);
  const chg = prev ? ((row.value - prev.value) / prev.value * 100) : null;
  const shown = state.popSeries === 'indexed' ? indexed(series) : series;
  let html = '<h2>Population</h2>' +
    '<p class="lede">Who lives in Singapore, and how the population has moved over the ' +
    'last decade. Drag the year slider to inspect any year from 2015 to 2024.</p>' +
    '<div class="controls"><span class="group-label">Year</span>' +
    '<input type="range" id="popYear" min="2015" max="2024" step="1" value="' + state.popYear + '" aria-label="Year">' +
    '<span class="year-readout" id="popYearOut">' + state.popYear + '</span></div>' +
    '<div class="kpis">' +
    kpi('Total population', '<span id="popKpiVal">' + fmtM(row.value) + '</span><span id="popKpiExtra"' + (state.popYear === 2024 ? '' : ' style="display:none"') + '> <span style="font-size:15px">(June 2024)</span></span>',
      '<span id="popKpiSub">' + (chg === null ? 'First year in the series' : 'Change on ' + (state.popYear - 1) + ': <b>' + fmtPct(chg) + '</b>') + '</span>') +
    (state.popYear === 2024
      ? kpi('Residents', fmtM(latest.residents), 'Citizens ' + fmtM(latest.citizens) + ' · PR ' + fmtM(latest.pr)) +
        kpi('Non-residents', fmtM(latest.nonResidents), '<b>' + fmtPct(latest.nonResidentsChangePct) + '</b> on June 2023')
      : kpi('Residents', '4.18 million', 'June 2024 breakdown — see composition below') +
        kpi('Non-residents', '1.86 million', 'June 2024 breakdown — see composition below')) +
    '</div>' +
    chartCard('Total population, 2015–2024', 'popChart',
      'Mid-year total population, millions. Source: Department of Statistics, Population in Brief 2024.',
      '<div class="controls"><span class="group-label">Show</span>' +
      '<button class="btn' + (state.popSeries === 'total' ? ' on' : '') + '" data-ps="total">Millions</button>' +
      '<button class="btn' + (state.popSeries === 'indexed' ? ' on' : '') + '" data-ps="indexed">Indexed (2015 = 100)</button>' +
      '<span class="group-label">Chart</span>' +
      '<button class="btn' + (state.popChart === 'bar' ? ' on' : '') + '" data-pc="bar">Bars</button>' +
      '<button class="btn' + (state.popChart === 'line' ? ' on' : '') + '" data-pc="line">Line</button>' +
      '<button class="btn" id="popCsv">Download CSV ↓</button></div>') +
    '<div class="split">' +
    '<section class="card"><h3>Who makes up the 6.04 million? — June 2024</h3>' +
    '<div class="donut-wrap"><canvas class="donut" id="popDonut"></canvas>' +
    '<div class="legend">' +
    '<div><i style="background:#0e7c7b"></i>Citizens — 3.64m (60.3%)</div>' +
    '<div><i style="background:#e8a13a"></i>Permanent residents — 0.54m (9.0%)</div>' +
    '<div><i style="background:#7ba7bc"></i>Non-residents — 1.86m (30.8%)</div>' +
    '</div></div>' +
    '<p class="src">Source: National Population and Talent Division, Population in Brief 2024.</p></section>' +
    '<section class="card"><h3>Resident ethnic mix, 2024</h3>' +
    p.ethnic2024.map((e) =>
      '<div class="hbar-row"><span>' + e.label + '</span><span class="track"><span class="fill" style="display:block;width:' + e.value + '%"></span></span><span class="num">' + e.value.toFixed(1) + '%</span></div>'
    ).join('') +
    '<p class="src">Share of the resident population. Resident sex ratio, 2024: <b>' +
    p.sexRatio2024 + ' males per 1,000 females</b>. Source: Department of Statistics.</p></section>' +
    '</div>' +
    dataTable('popTable', ['Year', 'Total population (m)', 'Change on previous year'],
      series.map((r, i) => {
        const pv = i ? series[i - 1].value : null;
        return [r.year, r.value.toFixed(2), pv === null ? '—' : fmtPct((r.value - pv) / pv * 100)];
      }), state.popYear);
  $('#view').innerHTML = html;
  const draw = () => drawSeries($('#popChart'), shown, {
    format: (v) => state.popSeries === 'indexed' ? v.toFixed(0) : v.toFixed(2),
    highlightYear: state.popYear, type: state.popChart,
  });
  draw();
  drawDonut($('#popDonut'), p.composition2024, ['#0e7c7b', '#e8a13a', '#7ba7bc']);
  makeSortable($('#popTable'));
  // The slider updates in place (chart, readout, KPI, table highlight) so a
  // drag is never interrupted by a re-render of the whole view.
  $('#popYear').addEventListener('input', (ev) => {
    state.popYear = +ev.target.value;
    const r = series.find((x) => x.year === state.popYear);
    const pv = series.find((x) => x.year === state.popYear - 1);
    $('#popYearOut').textContent = String(state.popYear);
    $('#popKpiVal').textContent = fmtM(r.value);
    $('#popKpiExtra').style.display = state.popYear === 2024 ? '' : 'none';
    $('#popKpiSub').innerHTML = pv
      ? 'Change on ' + (state.popYear - 1) + ': <b>' + fmtPct((r.value - pv.value) / pv.value * 100) + '</b>'
      : 'First year in the series';
    draw();
    $$('#popTable tbody tr').forEach((tr) => {
      tr.classList.toggle('hl', +tr.cells[0].textContent.trim() === state.popYear);
    });
  });
  $$('[data-ps]').forEach((b) => b.addEventListener('click', () => { state.popSeries = b.dataset.ps; viewPopulation(); }));
  $$('[data-pc]').forEach((b) => b.addEventListener('click', () => { state.popChart = b.dataset.pc; viewPopulation(); }));
  $('#popCsv').addEventListener('click', () => downloadCsv('singapore-population-2015-2024.csv',
    [['Year', 'Total population (millions)']].concat(series.map((r) => [r.year, r.value]))));
}

function viewEconomy() {
  const e = DATA.economy;
  let html = '<h2>Economy</h2>' +
    '<p class="lede">Output, growth and what it means per person. Singapore’s economy ' +
    'grew 4.4% in real terms in 2024, faster than the 1.8% of 2023.</p>' +
    '<div class="kpis">' +
    kpi('Nominal GDP', 'S$731.4 bn', '2024 · 2023: S$678.7 bn') +
    kpi('Real GDP growth', '+4.4%', '2024 · 4Q 2024: <b>+5.0%</b> year on year') +
    kpi('GDP per capita', 'S$101,464', '2024 · 2023: S$93,592') +
    kpi('GDP, US dollars', 'US$547.4 bn', '2024 · US$90,674 per capita') +
    '</div>' +
    chartCard('Real GDP growth, 2020–2024', 'gdpChart',
      'Annual change in real GDP, %. The 2020 contraction (−3.9%) and the 2021 rebound (+9.7%) ' +
      'are the pandemic cycle. Source: MTI, Economic Survey of Singapore 2024.',
      '<div class="controls"><span class="group-label">Chart</span>' +
      '<button class="btn on" data-gc="bar">Bars</button>' +
      '<button class="btn" data-gc="line">Line</button>' +
      '<button class="btn" id="gdpCsv">Download CSV ↓</button></div>') +
    dataTable('gdpTable', ['Year', 'Real GDP growth', 'Nominal GDP (S$ bn)', 'GDP per capita (S$)'],
      e.realGrowth.map((r) => [
        r.year, fmtPct(r.value),
        e.nominalGdpSgdBn[r.year] ? fmtInt(e.nominalGdpSgdBn[r.year]) : '—',
        e.gdpPerCapitaSgd[r.year] ? fmtInt(e.gdpPerCapitaSgd[r.year]) : '—',
      ]), 2024);
  $('#view').innerHTML = html;
  let type = 'bar';
  const draw = () => drawSeries($('#gdpChart'), e.realGrowth, { format: (v) => fmtPct(v, 1), type });
  draw();
  makeSortable($('#gdpTable'));
  $$('[data-gc]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-gc]').forEach((x) => x.classList.remove('on'));
    b.classList.add('on'); type = b.dataset.gc; draw();
  }));
  $('#gdpCsv').addEventListener('click', () => downloadCsv('singapore-real-gdp-growth-2020-2024.csv',
    [['Year', 'Real GDP growth (%)']].concat(e.realGrowth.map((r) => [r.year, r.value]))));
}

function viewLabour() {
  const l = DATA.labour;
  const seriesMap = { overall: l.overall, resident: l.resident, citizen: l.citizen };
  const labels = { overall: 'Overall', resident: 'Resident', citizen: 'Citizen' };
  const colors = { overall: '#0e7c7b', resident: '#e8a13a', citizen: '#7ba7bc' };
  let html = '<h2>Labour</h2>' +
    '<p class="lede">Unemployment stayed low through 2024: 2.0% overall, 2.7% for residents ' +
    'and 2.9% for citizens on the annual average — all within the range of a non-recession year.</p>' +
    '<div class="kpis">' +
    kpi('Unemployment — overall', '2.0%', '2024 annual average · 2023: 1.9%') +
    kpi('Unemployment — residents', '2.7%', '2024 annual average · 2023: 2.7%') +
    kpi('Unemployment — citizens', '2.9%', '2024 annual average · 2023: 2.9%') +
    kpi('Employment growth', '+45,500', 'Persons, 2024 · residents +8,800') +
    '</div>' +
    chartCard('Unemployment rate, 2016–2024', 'unemChart',
      'Annual average unemployment rate, %. Switch series to compare overall, resident and citizen ' +
      'rates — the resident rate runs higher because it excludes non-resident workers. ' +
      'Source: MOM, Labour Force Survey.',
      '<div class="controls"><span class="group-label">Series</span>' +
      Object.keys(seriesMap).map((k) =>
        '<button class="btn' + (state.unemSeries === k ? ' on' : '') + '" data-us="' + k + '">' + labels[k] + '</button>').join('') +
      '<span class="group-label">Chart</span>' +
      '<button class="btn' + (state.unemChart === 'line' ? ' on' : '') + '" data-uc="line">Line</button>' +
      '<button class="btn' + (state.unemChart === 'bar' ? ' on' : '') + '" data-uc="bar">Bars</button>' +
      '<button class="btn" id="unemCsv">Download CSV ↓</button></div>') +
    '<section class="card"><h3>How tight was the labour market?</h3>' +
    '<ul class="updates"><li>There were <b>1.39 job vacancies for every unemployed person</b> in September 2024 — vacancies still outnumbered job seekers.</li>' +
    '<li>Total employment grew by <b>45,500</b> in 2024, slower than the 78,800 of 2023, when work-permit holders increased sharply.</li>' +
    '<li>Resident employment grew in 2024 after a decline in 2023, led by higher-skilled sectors such as professional services, financial services and health &amp; social services.</li></ul>' +
    '<p class="src">Source: MOM, Labour Market Advance Release, Fourth Quarter 2024.</p></section>' +
    dataTable('unemTable', ['Year', 'Overall (%)', 'Resident (%)', 'Citizen (%)'],
      l.overall.map((r, i) => [r.year, r.value.toFixed(1), l.resident[i].value.toFixed(1), l.citizen[i].value.toFixed(1)]), 2024);
  $('#view').innerHTML = html;
  const draw = () => {
    const s = seriesMap[state.unemSeries];
    if (state.unemChart === 'line') {
      drawLines($('#unemChart'), [{ label: labels[state.unemSeries], color: colors[state.unemSeries], points: s }], { format: (v) => v.toFixed(1) + '%' });
    } else {
      drawSeries($('#unemChart'), s, { format: (v) => v.toFixed(1) + '%', type: 'bar' });
    }
  };
  draw();
  makeSortable($('#unemTable'));
  $$('[data-us]').forEach((b) => b.addEventListener('click', () => { state.unemSeries = b.dataset.us; viewLabour(); }));
  $$('[data-uc]').forEach((b) => b.addEventListener('click', () => { state.unemChart = b.dataset.uc; viewLabour(); }));
  $('#unemCsv').addEventListener('click', () => downloadCsv('singapore-unemployment-2016-2024.csv',
    [['Year', 'Overall (%)', 'Resident (%)', 'Citizen (%)']].concat(
      l.overall.map((r, i) => [r.year, r.value, l.resident[i].value, l.citizen[i].value]))));
}

function viewPrices() {
  const pr = DATA.prices, inc = DATA.income;
  const incShown = state.incMode === 'indexed' ? indexed(inc.market) : inc.market;
  let html = '<h2>Prices &amp; Incomes</h2>' +
    '<p class="lede">Inflation cooled sharply in 2024 while household incomes kept rising ' +
    'in real terms — the two sides of the cost of living.</p>' +
    '<div class="kpis">' +
    kpi('CPI-All Items inflation', '+2.4%', '2024 average · 2023: +4.8%') +
    kpi('MAS Core Inflation', '+2.7%', '2024 average · 2023: +4.2%') +
    kpi('Median household market income', 'S$12,446 / mo', '2025 · +7.7% nominal, +6.8% real') +
    kpi('Median income from work', 'S$11,297 / mo', '2024 · +1.4% in real terms') +
    '</div>' +
    chartCard('CPI-All Items inflation, 2021–2025', 'cpiChart',
      'Annual average change in consumer prices, %. MAS Core Inflation — which leaves out ' +
      'accommodation and private transport — averaged 2.7% in 2024 (4.2% in 2023). ' +
      'Source: MAS / MTI, Consumer Price Developments, December 2024.',
      '<div class="controls"><span class="group-label">Chart</span>' +
      '<button class="btn' + (state.cpiChart === 'bar' ? ' on' : '') + '" data-cc="bar">Bars</button>' +
      '<button class="btn' + (state.cpiChart === 'line' ? ' on' : '') + '" data-cc="line">Line</button>' +
      '<button class="btn" id="cpiCsv">Download CSV ↓</button></div>') +
    chartCard('Median monthly household market income, 2020–2025', 'incChart',
      'S$ per month, all resident households. Per household member: S$3,837 in 2024 and ' +
      'S$4,160 in 2025. Source: DOS, Key Household Income Trends 2025. (The 2024 ' +
      'employment-income median for resident employed households, incl. employer CPF, was S$11,297.)',
      '<div class="controls"><span class="group-label">Show</span>' +
      '<button class="btn' + (state.incMode === 'value' ? ' on' : '') + '" data-im="value">S$ per month</button>' +
      '<button class="btn' + (state.incMode === 'indexed' ? ' on' : '') + '" data-im="indexed">Indexed (2020 = 100)</button>' +
      '<span class="group-label">Chart</span>' +
      '<button class="btn' + (state.incChart === 'bar' ? ' on' : '') + '" data-ic="bar">Bars</button>' +
      '<button class="btn' + (state.incChart === 'line' ? ' on' : '') + '" data-ic="line">Line</button>' +
      '<button class="btn" id="incCsv">Download CSV ↓</button></div>') +
    dataTable('cpiTable', ['Year', 'CPI-All Items (%)', 'MAS Core (%)'],
      pr.headline.map((r) => {
        const c = pr.core.find((x) => x.year === r.year);
        return [r.year, fmtPct(r.value), c ? fmtPct(c.value) : '—'];
      }), 2024);
  $('#view').innerHTML = html;
  const drawCpi = () => drawSeries($('#cpiChart'), pr.headline, { format: (v) => fmtPct(v, 1), type: state.cpiChart });
  const drawInc = () => drawSeries($('#incChart'), incShown, {
    format: (v) => state.incMode === 'indexed' ? v.toFixed(0) : fmtInt(v), type: state.incChart,
  });
  drawCpi(); drawInc();
  makeSortable($('#cpiTable'));
  $$('[data-cc]').forEach((b) => b.addEventListener('click', () => { state.cpiChart = b.dataset.cc; viewPrices(); }));
  $$('[data-ic]').forEach((b) => b.addEventListener('click', () => { state.incChart = b.dataset.ic; viewPrices(); }));
  $$('[data-im]').forEach((b) => b.addEventListener('click', () => { state.incMode = b.dataset.im; viewPrices(); }));
  $('#cpiCsv').addEventListener('click', () => downloadCsv('singapore-cpi-inflation-2021-2025.csv',
    [['Year', 'CPI-All Items inflation (%)']].concat(pr.headline.map((r) => [r.year, r.value]))));
  $('#incCsv').addEventListener('click', () => downloadCsv('singapore-median-household-income-2020-2025.csv',
    [['Year', 'Median monthly household market income (S$)']].concat(inc.market.map((r) => [r.year, r.value]))));
}

function viewSources() {
  $('#view').innerHTML = '<h2>Sources &amp; Notes</h2>' +
    '<p class="lede">Every number on this site comes from an official release. ' +
    'Figures are shown as published; nothing has been estimated, forecast or rounded beyond the source.</p>' +
    '<section class="card"><h3>Sources</h3><ol class="source-list">' +
    '<li><b>Population</b> — Department of Statistics &amp; National Population and Talent Division, <i>Population in Brief 2024</i> (total 6.04m, citizens 3.64m, PR 544,900, non-residents 1.86m, June 2024); DOS release of 25 September 2026 (total 6.21m, June 2026); DOS ethnic distribution and sex ratio, 2024.</li>' +
    '<li><b>Economy</b> — Ministry of Trade and Industry, <i>Economic Survey of Singapore 2024</i> (nominal GDP S$731.4bn, real growth +4.4%, GDP per capita S$101,464); World Bank, World Development Indicators (GDP US$547.4bn, GDP per capita US$90,674, 2024).</li>' +
    '<li><b>Labour</b> — Ministry of Manpower, Labour Force Survey and <i>Labour Market Advance Release, Fourth Quarter 2024</i> (unemployment 2016–2024; employment growth +45,500; 1.39 vacancies per unemployed person, September 2024).</li>' +
    '<li><b>Prices</b> — Monetary Authority of Singapore &amp; MTI, <i>Consumer Price Developments in December 2024</i> (CPI-All Items +2.4%, MAS Core +2.7% in 2024); FocusEconomics / World Bank series for 2021–2025 headline inflation.</li>' +
    '<li><b>Household incomes</b> — Department of Statistics, <i>Key Household Income Trends 2025</i> (median monthly household market income 2020–2025; per-member figures) and <i>Key Household Income Trends 2024</i> (median household income from work S$11,297, incl. employer CPF).</li>' +
    '</ol></section>' +
    '<section class="card"><h3>Notes on the figures</h3><ul class="updates">' +
    '<li><b>Residents</b> means Singapore citizens plus permanent residents. <b>Non-residents</b> are foreigners living, working or studying here.</li>' +
    '<li><b>Real GDP growth</b> is the change in GDP after removing price changes; <b>nominal GDP</b> is at current market prices.</li>' +
    '<li><b>MAS Core Inflation</b> leaves out accommodation and private transport, the two most volatile CPI components.</li>' +
    '<li>The income headline changed with the 2025 report: the <b>market income</b> series covers all resident households, while the older <b>employment income</b> figure covers only households with at least one employed person. The two are not the same measure, so they are shown separately.</li>' +
    '<li>Unemployment rates are annual averages from the Labour Force Survey, which covers private households and excludes workers in dormitories and worksites.</li>' +
    '</ul></section>' +
    '<section class="card"><h3>About this site</h3>' +
    '<p>Singapore by the Numbers was built as an entry for the make.fun “best national statistics site” competition (November 2026). It is an independent work: the design, text and charts are original, and the figures are official statistics reproduced with their sources. The site runs entirely from its own files, with no network requests.</p></section>';
}

/* ---------- router ---------- */

const ROUTES = {
  '/': viewOverview,
  '/population': viewPopulation,
  '/economy': viewEconomy,
  '/labour': viewLabour,
  '/prices': viewPrices,
  '/sources': viewSources,
};

function route() {
  const path = (location.hash.replace(/^#/, '') || '/').split('?')[0];
  const fn = ROUTES[path] || viewOverview;
  $$('nav.mainnav a').forEach((a) => a.classList.toggle('active', a.dataset.route === path));
  fn();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);

// Screenshot staging: ?shot=overview|population|economy|phone picks a view,
// then signals readiness once the charts have drawn.
function stageShot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return;
  const map = { overview: '/', population: '/population', economy: '/economy', phone: '/' };
  if (map[shot] !== undefined && location.hash.replace(/^#/, '') !== map[shot]) {
    location.hash = '#' + map[shot];
  }
  setTimeout(() => { window.__shotReady = true; }, 600);
}

route();
stageShot();
