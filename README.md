# Singapore by the Numbers — a national statistics explorer

[![make.fun](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/c/best-national-statistics-site-20261126-0539)
[![Rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/laowu199377/best-national-statistics-site-20261126-0539/rank.svg)](https://make.fun/c/best-national-statistics-site-20261126-0539)
[![Reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/laowu199377/best-national-statistics-site-20261126-0539/reward.svg)](https://make.fun/c/best-national-statistics-site-20261126-0539)

An independent explorer of Singapore's official statistics: population,
economy, jobs, prices and household incomes — the real figures, with their
sources, in one place that works offline on a desktop and on a phone.

## What's inside

- **Overview** — the headline numbers (population 6.04m at June 2024, GDP
  S$731.4bn, +4.4% real growth, 2.0% unemployment, +2.4% CPI, S$11,297
  median household income from work) and a search box over every indicator.
- **Population** — the 2015–2024 trend with a year slider, the June 2024
  mix (citizens / permanent residents / non-residents), the resident ethnic
  mix and sex ratio, and a sortable data table.
- **Economy** — real GDP growth 2020–2024, nominal GDP and GDP per capita,
  with bar/line switching and CSV download.
- **Labour** — unemployment 2016–2024 for all workers, residents and
  citizens, plus how tight the market was (1.39 vacancies per unemployed
  person, September 2024).
- **Prices & Incomes** — CPI-All Items inflation 2021–2025, MAS Core
  Inflation, and median household market income 2020–2025, each with a
  working chart, a sortable table and a CSV download.
- **Sources & Notes** — where every figure comes from (Department of
  Statistics, MTI, MOM, MAS, World Bank) and what each measure does — and
  does not — mean.

Every control does what it says: the year slider, the series and chart-type
toggles, the value/index switch, table sorting, the indicator search and the
CSV downloads all work. Nothing is a placeholder.

## Run it

No build step, no network. Serve the folder and open it in a desktop
browser:

```sh
node serve.ts
# then open http://localhost:8080/
```

Or open `app/index.html` directly from a static server of your choice.
`?shot=overview|population|economy|phone` stages a screenshot scene and
sets `window.__shotReady` when the charts have drawn.

## Files

- `app/index.html` — the page shell and navigation.
- `app/style.css` — the whole design, no external assets.
- `app/data.js` — every figure, each checked against its official source.
- `app/app.js` — the router, the canvas charts and all the controls.
- `main.ts` — copies `app/` and `screenshots/` to `/output` and writes
  the dossier.
- `screenshots/` — four real renders of the site's own code, one at a
  phone's size.

Built for the [make.fun](https://make.fun/c/best-national-statistics-site-20261126-0539)
bounty "Make the best national statistics site". MIT licensed.
