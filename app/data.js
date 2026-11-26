// Singapore by the Numbers — data
// Every figure below is an official statistic, checked against the source
// named in `source` before it was written here (Nov 2026). Figures are
// shown with their reference period on the site; nothing here is estimated
// by us. Amounts are Singapore dollars unless a series says otherwise.

const DATA = {
  meta: {
    country: 'Singapore',
    compiled: 'November 2026',
    currency: 'SGD',
  },

  // --- Population: Department of Statistics / National Population and
  // Talent Division, Population in Brief 2024; DOS Sep 2026 release.
  population: {
    // Mid-year total population, millions.
    total: [
      { year: 2015, value: 5.54 }, { year: 2016, value: 5.61 },
      { year: 2017, value: 5.61 }, { year: 2018, value: 5.64 },
      { year: 2019, value: 5.70 }, { year: 2020, value: 5.69 },
      { year: 2021, value: 5.45 }, { year: 2022, value: 5.64 },
      { year: 2023, value: 5.92 }, { year: 2024, value: 6.04 },
    ],
    latest: {
      // End-June 2026, DOS release of 25 Sep 2026.
      total2026: 6.21, residents2026: 4.23, nonResidents2026: 1.98,
      // June 2024, Population in Brief 2024.
      total: 6.04, changePct: 2.0,
      citizens: 3.64, citizensChangePct: 0.7,
      pr: 0.5449, prChangePct: 1.2,
      nonResidents: 1.86, nonResidentsChangePct: 5.0,
      residents: 4.18, residentsChangePct: 0.8,
    },
    // Resident composition, June 2024, millions.
    composition2024: [
      { label: 'Citizens', value: 3.64 },
      { label: 'Permanent residents', value: 0.54 },
      { label: 'Non-residents', value: 1.86 },
    ],
    // Resident ethnic distribution, 2024, %.
    ethnic2024: [
      { label: 'Chinese', value: 74.0 },
      { label: 'Malay', value: 13.5 },
      { label: 'Indian', value: 9.0 },
      { label: 'Others', value: 3.5 },
    ],
    sexRatio2024: 948, // resident males per 1,000 females, 2024
  },

  // --- Economy: MTI Economic Survey of Singapore 2024; World Bank WDI.
  economy: {
    // Real GDP growth, % year on year.
    realGrowth: [
      { year: 2020, value: -3.9 }, { year: 2021, value: 9.7 },
      { year: 2022, value: 3.8 }, { year: 2023, value: 1.8 },
      { year: 2024, value: 4.4 },
    ],
    nominalGdpSgdBn: { 2023: 678.7, 2024: 731.4 },
    nominalGdpUsdBn: { 2024: 547.4 },
    gdpPerCapitaSgd: { 2023: 93592, 2024: 101464 },
    gdpPerCapitaUsd: { 2024: 90674 },
    q4Growth2024: 5.0,
  },

  // --- Labour: MOM Labour Force Survey / Labour Market reports.
  labour: {
    // Annual average unemployment rate, %.
    overall: [
      { year: 2016, value: 2.1 }, { year: 2017, value: 2.2 },
      { year: 2018, value: 2.1 }, { year: 2019, value: 2.2 },
      { year: 2020, value: 3.0 }, { year: 2021, value: 2.8 },
      { year: 2022, value: 2.1 }, { year: 2023, value: 1.9 },
      { year: 2024, value: 2.0 },
    ],
    resident: [
      { year: 2016, value: 3.0 }, { year: 2017, value: 3.1 },
      { year: 2018, value: 2.9 }, { year: 2019, value: 3.2 },
      { year: 2020, value: 4.1 }, { year: 2021, value: 3.6 },
      { year: 2022, value: 2.9 }, { year: 2023, value: 2.7 },
      { year: 2024, value: 2.7 },
    ],
    citizen: [
      { year: 2016, value: 3.1 }, { year: 2017, value: 3.3 },
      { year: 2018, value: 3.0 }, { year: 2019, value: 3.3 },
      { year: 2020, value: 4.2 }, { year: 2021, value: 3.9 },
      { year: 2022, value: 3.1 }, { year: 2023, value: 2.9 },
      { year: 2024, value: 2.9 },
    ],
    employmentGrowth2024: 45500, // persons, total employment
    residentEmploymentGrowth2024: 8800,
    vacanciesPerUnemployedSep2024: 1.39,
  },

  // --- Prices: MAS / MTI Consumer Price Developments; DOS CPI.
  prices: {
    // CPI-All Items inflation, annual average, %.
    headline: [
      { year: 2021, value: 2.3 }, { year: 2022, value: 6.1 },
      { year: 2023, value: 4.8 }, { year: 2024, value: 2.4 },
      { year: 2025, value: 0.9 },
    ],
    // MAS Core Inflation, annual average, %.
    core: [
      { year: 2023, value: 4.2 }, { year: 2024, value: 2.7 },
    ],
    dec2024: { headline: 1.6, core: 1.8 },
  },

  // --- Households: DOS Key Household Income Trends 2025 (market income)
  // and 2024 (employment income).
  income: {
    // Median monthly household market income, S$ per month.
    market: [
      { year: 2020, value: 9099 }, { year: 2021, value: 9731 },
      { year: 2022, value: 10305 }, { year: 2023, value: 11130 },
      { year: 2024, value: 11558 }, { year: 2025, value: 12446 },
    ],
    marketPerMember: { 2024: 3837, 2025: 4160 },
    marketChange2025: { nominal: 7.7, real: 6.8 },
    // Median monthly household income from work, incl. employer CPF,
    // resident employed households, KHIT 2024.
    employmentIncome2024: 11297,
    employmentIncomeRealChange2024: 1.4,
  },
};

// Indicator index for the overview search box: name, value, blurb, route.
const INDICATORS = [
  { name: 'Total population', value: '6.04 million', note: 'June 2024, +2.0% on a year earlier', route: '#/population' },
  { name: 'Resident population', value: '4.18 million', note: 'Citizens 3.64m, permanent residents 0.54m, June 2024', route: '#/population' },
  { name: 'Non-resident population', value: '1.86 million', note: 'June 2024, +5.0% on a year earlier', route: '#/population' },
  { name: 'Nominal GDP', value: 'S$731.4 billion', note: '2024, at current market prices', route: '#/economy' },
  { name: 'Real GDP growth', value: '+4.4%', note: '2024, after +1.8% in 2023', route: '#/economy' },
  { name: 'GDP per capita', value: 'S$101,464', note: '2024, US$90,674 at market exchange rates', route: '#/economy' },
  { name: 'Unemployment rate, overall', value: '2.0%', note: '2024 annual average', route: '#/labour' },
  { name: 'Unemployment rate, residents', value: '2.7%', note: '2024 annual average', route: '#/labour' },
  { name: 'Unemployment rate, citizens', value: '2.9%', note: '2024 annual average', route: '#/labour' },
  { name: 'Total employment growth', value: '+45,500', note: 'Persons employed, 2024', route: '#/labour' },
  { name: 'CPI-All Items inflation', value: '+2.4%', note: '2024 annual average, after +4.8% in 2023', route: '#/prices' },
  { name: 'MAS Core Inflation', value: '+2.7%', note: '2024 annual average, after +4.2% in 2023', route: '#/prices' },
  { name: 'Median household market income', value: 'S$12,446 / month', note: '2025, +7.7% nominal on 2024', route: '#/prices' },
  { name: 'Median household income from work', value: 'S$11,297 / month', note: '2024, incl. employer CPF, resident employed households', route: '#/prices' },
  { name: 'Resident sex ratio', value: '948 males : 1,000 females', note: '2024', route: '#/population' },
];
