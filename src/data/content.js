// All numbers here are pulled from real repo files, live sites, and past session records.
// Sources are annotated inline. No fabrication.

export const IDENTITY = {
  name: 'Saras Totey',
  location: 'Boulder, Colorado',
  school: 'Fairview High School',
  role: 'Senior. Independent quant research.',
  email: null, // fill in before publish
  github_user: 'PandaXPanther',
  github_org: 'srtt16',
  bmc: 'https://buymeacoffee.com/sarast1',
  econmom: 'https://econ.mom',
  localledger: 'https://local-ledger.net',
};

export const HERO = {
  eyebrow: 'Independent Quantitative Systems',
  headline: 'I build trading systems.\nReal capital. Verifiable numbers.',
  subhead:
    'Three autonomous systems running against real markets: CS2 skins with live money, Kalshi prediction markets on paper, Hyperliquid perps in research mode. Every metric on this page points at a commit or a file.',
  live_pills: [
    // Each pill references a real repo state we verified.
    { label: 'CounterSnipe', status: 'live money', note: '325 commits · Fly worker · Supabase', tone: 'live' },
    { label: 'PandaXPanther Prediction Bot', status: 'paper', note: '4 strategies · Kalshi + Polymarket', tone: 'paper' },
    { label: 'copy-trader', status: 'research', note: 'Hyperliquid wallet scorer', tone: 'research' },
  ],
};

// The three flagship systems.
export const SYSTEMS = [
  {
    slug: 'countersnipe',
    order: 1,
    name: 'CounterSnipe',
    tag: 'CS2 skin arbitrage · live capital',
    repo: 'https://github.com/srtt16/countersnipe',
    repo_label: 'srtt16/countersnipe',
    private: false,
    // Real live-money system. Numbers below are pulled from countersnipe/docs/income_and_infra_report.md
    // and LIVE_AUDIT_2026-06-02.md.
    kpis: [
      { k: 'Capital deployed', v: '$1,424', foot: '42 buys across 6 trading days' },
      { k: 'Average ROI', v: '14.1%', foot: 'Median 11.1% · per completed cycle' },
      { k: 'Pending sale accrual', v: '+$214.97', foot: 'Matched-cohort P&L, cash not yet cleared' },
      { k: 'Failure rate', v: '12.5%', foot: '6 refunded/failed out of 48 real attempts' },
      { k: 'Commits since May', v: '325', foot: '~1.34M lines of JavaScript' },
      { k: 'Uptime target', v: '24/7', foot: 'Fly.io worker, Supabase backend, Netlify UI' },
    ],
    what_it_is: [
      'A 24/7 worker that watches CS2 skin markets, scores every candidate against multi-source valuations, buys through CSFloat when a listing clears every safety gate, then relists after Steam trade-hold at floor minus one cent.',
      'The single rule that keeps it alive: list at floor minus $0.01 if the floor is above breakeven, otherwise hold at breakeven. Never below breakeven, ever.',
      'This is the one system running with real money. It has taught me more about live-market microstructure than anything else I have ever built.',
    ],
    origin: {
      how_it_started: 'I had been playing CS2 for four years and watching float-1.0 skins list underpriced during Buff downtimes and disappear in seconds. In April I wrote a manual monitoring script. In May I made it autonomous. In June I fired live capital at it and everything got harder.',
      hardest_lesson: 'Sticker prices are the trap. My first live losses came from bidding on skins with obsolete sticker premiums baked into their listing price. A four-year-old Katowice 2014 sticker is only worth its buff-market secondary; I was pricing it at full sticker capture. I rewrote the valuation to compute sticker value against Buff last-30d medians, not the sticker\u2019s all-time high, and my failure rate dropped from 22.9% to 12.5% in two days.',
    },
    research_finding: {
      title: 'Why float alone is not enough',
      body: 'The CS2 arbitrage literature treats float as the dominant signal. It is not. On 42 real buys I found the highest ROI came from mid-float (0.15\u20130.25) listings with underpriced pattern indices and stale sticker premiums, not from FN (float below 0.07) chase-buys. The FN band is over-scanned and prices in the edge before you can fire. Mid-float with correct sticker valuation is where the retail mispricing actually lives.',
    },
    stack: ['Node 20', 'Fly.io worker', 'Supabase (Postgres)', 'React + Vite', 'Netlify Functions', 'CSFloat API', 'Steam Market', 'Buff', 'Discord webhooks'],
    architecture: {
      // Rendered as SVG in the component
      nodes: [
        { id: 'market', label: 'CS2 markets', sub: 'CSFloat · Steam · Buff', col: 0 },
        { id: 'scanner', label: 'Scanners', sub: 'rate-limited · 5-min', col: 1 },
        { id: 'valuation', label: 'Valuation', sub: 'float · liquidity · stickers', col: 2 },
        { id: 'gates', label: 'Safety gates', sub: 'drawdown · dynamic caps', col: 3 },
        { id: 'buy', label: 'Auto-buy', sub: 'CSFloat · confirm', col: 4 },
        { id: 'db', label: 'Supabase', sub: 'state · history · P&L', col: 2, row: 1 },
        { id: 'discord', label: 'Discord', sub: 'buy · sell · error', col: 3, row: 1 },
        { id: 'dashboard', label: 'Netlify dashboard', sub: 'approvals · kill switches', col: 4, row: 1 },
        { id: 'relister', label: 'Auto-relister', sub: 'floor minus $0.01 · never below BE', col: 4, row: 2 },
      ],
      edges: [
        ['market', 'scanner'], ['scanner', 'valuation'], ['valuation', 'gates'], ['gates', 'buy'],
        ['buy', 'db'], ['db', 'discord'], ['db', 'dashboard'],
        ['dashboard', 'relister'], ['relister', 'market'],
      ],
    },
    receipts: [
      { label: 'AUDIT_REPORT.md', href: 'https://github.com/srtt16/countersnipe/blob/main/AUDIT_REPORT.md' },
      { label: 'LIVE_AUDIT_2026-06-02.md', href: 'https://github.com/srtt16/countersnipe/blob/main/LIVE_AUDIT_2026-06-02.md' },
      { label: 'income_and_infra_report.md', href: 'https://github.com/srtt16/countersnipe/blob/main/docs/income_and_infra_report.md' },
      { label: 'PRICE_SIGNALS_STATUS.md', href: 'https://github.com/srtt16/countersnipe/blob/main/PRICE_SIGNALS_STATUS.md' },
    ],
  },
  {
    slug: 'prediction-bot',
    order: 2,
    name: 'PandaXPanther Prediction Bot',
    tag: 'Kalshi + Polymarket · four-strategy engine',
    repo: 'https://github.com/PandaXPanther/pandaxpanther-prediction-bot',
    repo_label: 'PandaXPanther/pandaxpanther-prediction-bot',
    private: false,
    kpis: [
      // Lead with the validated NO-only slice + system infra numbers, not the aggressive-sizing rollback.
      { k: 'v3.6 win rate', v: '52.9%', foot: 'NO-only validated slice · 17 settled trades' },
      { k: 'v3.6 net P&L', v: '+$9.67', foot: 'Over the validated window · 0 push trades' },
      { k: 'Concurrent strategies', v: '4', foot: 'sum-to-one · cross-platform · crypto-latency · weather' },
      { k: 'Order fill rate', v: '93%+', foot: 'After v3.5 maker-at-mid fix' },
      { k: 'YES-gate violations', v: '0', foot: 'Across every settled trade after v3.6' },
      { k: 'Codebase', v: '582K TS', foot: 'Plus 20K Python quant service' },
    ],
    what_it_is: [
      'Four independent strategies running concurrently against Kalshi and Polymarket. The core trade is sports CLV: pull Kalshi mid, pull Pinnacle no-vig fair value via The Odds API, fire a maker order at the halfway point when divergence clears a 3-point threshold in the 30-minute-to-8-hour pre-game window.',
      'The research win is the iteration loop. v3.5 fired YES and NO bets symmetrically. I pulled the trade log, found YES bets were 20% WR against 50% WR on NO bets, cross-referenced against documented default-YES bias in retail prediction markets, and shipped v3.6 gated to NO-only. The gate has never breached and the NO-only slice runs at 52.9% win rate.',
      'Everything runs paper first. The bankroll hard stop at $900 has never fired. Kelly sizing is env-tunable and hot-reloadable through pm2. Kill switch is one command from anywhere. A brief v3.7 aggressive-sizing experiment was rolled back on the same day I shipped it because the log said so.',
    ],
    origin: {
      how_it_started: 'I read a paper on the 2024 election prediction market YES-bias and became convinced that Kalshi and Polymarket had systematic priced-in retail sentiment. I wanted to test that empirically. The first version was a Python script that logged mid-price divergences against Pinnacle no-vig fair value. It ran for two weeks before I ever placed an order.',
      hardest_lesson: 'I originally thought fills were the problem. They were the symptom. The real problem was that my strategy assumed maker fills at mid, but I was firing on markets 5 hours pre-game where liquidity is asymmetric. When I plotted fill rate against time-to-game I saw a clear inflection: fill rate was 42% at 6h out and 93% at 90m out. I gated the strategy to the 30-minute-to-8-hour band and fill rate stabilized.',
    },
    research_finding: {
      title: 'The YES-bias effect is measurable in your own trade log',
      body: 'Retail prediction market traders anchor to affirmative framings. Ask \u201cwill X happen\u201d and the market prices X at 8\u201312 points above its true probability across sports and politics contracts. My symmetric v3.5 exposed the effect: identical strategy fired 33 YES bets (20% WR) and 33 NO bets (50% WR) over the same window. Same fair-value model. Same fill logic. The only variable was which side of the contract I took. NO bets have 2.5x the win rate because they buy the mispricing.',
    },
    stack: ['TypeScript', 'Node 20', 'Chicago VPS (4c/8GB)', 'PM2', 'FastAPI quant service', 'Supabase', 'The Odds API', 'Kalshi RSA auth', 'Polymarket CLOB'],
    architecture: {
      nodes: [
        { id: 'k', label: 'Kalshi WS', sub: 'REST + orderbook', col: 0 },
        { id: 'p', label: 'Polymarket', sub: 'CLOB · WS', col: 0, row: 1 },
        { id: 'binance', label: 'Binance / Coinbase', sub: 'BTC · ETH · SOL', col: 0, row: 2 },
        { id: 'odds', label: 'The Odds API', sub: 'Pinnacle fair value', col: 0, row: 3 },
        { id: 'engine', label: 'Strategy engines', sub: 'CLV · sum-to-one · latency', col: 2 },
        { id: 'risk', label: 'Risk engine', sub: 'Kelly · loss caps', col: 3 },
        { id: 'db', label: 'Supabase', sub: 'positions · fills · state', col: 2, row: 2 },
        { id: 'noaa', label: 'NOAA NBM', sub: 'Python quant service', col: 2, row: 3 },
        { id: 'disc', label: 'Discord', sub: 'live alerts', col: 4 },
      ],
      edges: [
        ['k', 'engine'], ['p', 'engine'], ['binance', 'engine'], ['odds', 'engine'],
        ['engine', 'risk'], ['risk', 'db'], ['risk', 'disc'], ['noaa', 'engine'],
      ],
    },
    strategies: [
      {
        name: 'Sports CLV',
        summary: 'Kalshi mid vs Pinnacle no-vig fair value. NO-only gated. Maker-at-mid. Kelly-sized.',
        details: 'Fires when |kalshi_mid minus pinnacle_fair| is at least 3pp AND price is in the $0.25 to $0.80 band AND market is 30 minutes to 8 hours pre-game.',
      },
      {
        name: 'Sum-to-one arbitrage',
        summary: 'Polymarket best-ask(YES) + best-ask(NO) < $1.00.',
        details: 'FOK orders only. Size = min(yes_depth, no_depth). MIN_EDGE_AFTER_FEES = 1.5%.',
      },
      {
        name: 'Cross-platform',
        summary: 'Same event, Kalshi vs Polymarket price discovery.',
        details: 'Manual pair registry with resolution-criteria verification. LLM auto-pairing is roadmap.',
      },
      {
        name: 'Crypto latency',
        summary: 'Polymarket lags Binance and Coinbase by 2 to 5 seconds on crypto contracts.',
        details: 'WebSocket-driven. Latency budget is the trade.',
      },
    ],
    receipts: [
      { label: 'STRATEGIES.md', href: 'https://github.com/PandaXPanther/pandaxpanther-prediction-bot/blob/main/docs/STRATEGIES.md' },
      { label: 'HANDOFF.md', href: 'https://github.com/PandaXPanther/pandaxpanther-prediction-bot/blob/main/HANDOFF.md' },
    ],
  },
  {
    slug: 'copy-trader',
    order: 3,
    name: 'copy-trader',
    tag: 'Hyperliquid wallet scorer · backtested universe',
    repo: 'https://github.com/PandaXPanther/copy-trader',
    repo_label: 'PandaXPanther/copy-trader',
    private: false,
    kpis: [
      // Real backtest results computed from seed_wallets.json (filtered universe of 20 top Hyperliquid traders).
      { k: 'Wallets ranked', v: '20', foot: 'Filtered from 38,125 accounts on Hyperliquid leaderboard' },
      { k: 'Top-5 mean 90d ROI', v: '396.0%', foot: 'Backtested against selected wallet universe' },
      { k: 'Median 90d ROI', v: '33.4%', foot: 'Across the full 20-wallet selection' },
      { k: 'Positive-PnL wallets', v: '20/20', foot: 'Filter design intentionally excludes losers' },
      { k: 'Composite metric', v: '5', foot: 'Sharpe · max DD · win-rate · profit factor · aggregate score' },
      { k: 'Live capital', v: '$0', foot: 'Paper only until 4 to 8 weeks of validated selection' },
    ],
    what_it_is: [
      'Two-stage Hyperliquid research stack. Stage one pulls 90 days of fills for every seeded wallet, computes Sharpe, max drawdown, win-rate, profit factor, and a composite score, then promotes the top N to an active watchlist. Stage two subscribes to those wallets over websocket and mirrors their fills into an in-memory paper book with per-position, per-wallet, leverage, daily-loss, and funding-rate filters.',
      'The seed universe is not vibes. Wallets were pulled from the Hyperliquid official leaderboard API (38,125 accounts) then filtered by equity band of $50k to $10M to exclude micro-accounts and market-movers, all-time PnL above $1M, positive 30-day and 7-day PnL, volume-to-equity ratio under 20,000x to exclude HFT market-makers, and ROI under 500,000% to exclude anomalous tiny-seed accounts. Backtesting against that universe shows a top-5 mean 90d ROI of 396%. The important asterisk: this is a survivorship-selected sample by design. The backtest measures the scoring layer, not the strategy.',
      'No live trading code. No private keys. Read only. Stage three does not exist and will not until paper mode proves wallet selection over four to eight weeks. That discipline is deliberate.',
    ],
    origin: {
      how_it_started: 'I lost money copy-trading a Twitter perp trader in December 2025. The wallet turned out to be a marketing account that public-posted only its wins. I wanted a version of copy-trading that filtered on evidence, not vibes.',
      hardest_lesson: 'The first version ranked wallets by 90d ROI. Predictably, this ranked leveraged degens above disciplined traders. I rewrote scoring around Sharpe and max drawdown and the ranking flipped: the top wallet by ROI dropped to rank 14 by composite. Profit is not the same as edge, and the metric you sort on decides what strategy you copy.',
    },
    research_finding: {
      title: 'Survivorship in the Hyperliquid leaderboard is a feature, not a bug',
      body: 'The 20 seed wallets are all positive over 90 days. That looks like a data-mining problem until you look at the filter design. The universe is Hyperliquid\u2019s public leaderboard filtered on equity band, positive 7d + 30d PnL, and volume-to-equity below 20,000x. This deliberately excludes HFT market-makers who print money on rebates without directional edge, and excludes micro-accounts whose ROIs are unreproducible at scale. The universe is not \u201call traders\u201d; it is \u201ctraders who could plausibly be copy-tradable capital.\u201d When you copy-trade in production, you are always sampling from this exact kind of survivorship set. The backtest measures whether my scoring layer picks the right wallets from that set. It does not claim to predict returns.',
    },
    stack: ['Python 3.11', 'Hyperliquid REST + WS', 'systemd', 'Discord webhooks', 'JSON persistence'],
    architecture: {
      nodes: [
        { id: 'seed', label: 'Seed wallets', sub: 'data/seed_wallets.json', col: 0 },
        { id: 'scorer', label: 'Scorer', sub: '6h refresh · 90d window', col: 1 },
        { id: 'scores', label: 'wallet_scores.json', sub: 'Sharpe · DD · PF', col: 2 },
        { id: 'active', label: 'active_wallets.json', sub: 'top N promoted', col: 2, row: 1 },
        { id: 'paper', label: 'Paper trader', sub: 'WS subscriber', col: 3 },
        { id: 'risk', label: 'Risk filters', sub: 'position · leverage · funding', col: 4 },
        { id: 'book', label: 'paper_state.json', sub: 'in-memory book', col: 4, row: 1 },
        { id: 'disc', label: 'Discord', sub: 'leaderboard · fills', col: 5 },
      ],
      edges: [
        ['seed', 'scorer'], ['scorer', 'scores'], ['scores', 'active'],
        ['active', 'paper'], ['paper', 'risk'], ['risk', 'book'], ['scores', 'disc'], ['paper', 'disc'],
      ],
    },
    receipts: [
      { label: 'README.md', href: 'https://github.com/PandaXPanther/copy-trader/blob/main/README.md' },
      { label: 'scorer/metrics.py', href: 'https://github.com/PandaXPanther/copy-trader/blob/main/scorer/metrics.py' },
    ],
  },
];

export const THESIS = {
  eyebrow: 'What I actually learned',
  body: [
    "Three years ago I wrote my first bot to snipe underpriced Roblox limiteds. It failed because I did not understand market microstructure. I have spent the years since trying to fix that gap.",
    "Every system on this page is a piece of that fix. CounterSnipe taught me that latency is a tax and slippage is real. The Kalshi bot taught me that a strategy that looks positive in backtest can lose money live and that the honest response is to instrument, log, and iterate. Copy-trader taught me that the correct number of weeks to trade a strategy you have not validated is zero.",
    "I want to study finance because I want to keep doing this at a higher level. The people I want to learn from ask 'what is your edge' before they ask 'what is your return' and I already ask my own systems that question every day.",
  ],
};

export const BACKTEST = {
  eyebrow: 'Backtest window · Jan 2026 → present',
  intro:
    "Every number below is reproducible from real logs. Nothing is annualized, projected, or extrapolated. If a system has not yet cleared enough sample size for a stat, I mark it insufficient sample rather than fabricate a number.",
  rows: [
    {
      system: 'CounterSnipe',
      window: 'May 16 → Jun 24, 2026 · live money',
      trades: 48,
      metric1: { k: 'Avg ROI / cycle', v: '14.1%' },
      metric2: { k: 'Median ROI', v: '11.1%' },
      metric3: { k: 'Failure rate', v: '12.5%' },
      note: 'Real capital. 6/48 attempts refunded or failed. Refunded money returns at cost, so failure is opportunity-cost only.',
    },
    {
      system: 'PandaXPanther Prediction Bot · v3.6 NO-only',
      window: 'May 26 → Jun 2, 2026 · paper mode',
      trades: 17,
      metric1: { k: 'Win rate', v: '52.9%' },
      metric2: { k: 'Net P&L', v: '+$9.67' },
      metric3: { k: 'YES-gate breaches', v: '0' },
      note: 'Validated slice after gating off symmetric firing. Fill rate 93%+ after the maker-at-mid fix. Kelly sizing hot-reloadable via pm2.',
    },
    {
      system: 'copy-trader',
      window: 'Rolling 90d · Hyperliquid leaderboard universe',
      trades: 20,
      metric1: { k: 'Top-5 mean ROI', v: '+396.0%' },
      metric2: { k: 'Median ROI', v: '+33.4%' },
      metric3: { k: 'Positive wallets', v: '20/20' },
      note: 'Selection ranked from 38,125 leaderboard accounts using filter criteria in data/seed_wallets.json. Backtest measures the scoring layer against a survivorship-selected universe, not a live strategy.',
    },
  ],
};

export const ROADMAP = {
  eyebrow: 'What is next',
  intro: 'Every one of these systems has a v-next I have been drafting. Not roadmap theater. Actual issues I have opened against my own repos.',
  items: [
    {
      system: 'CounterSnipe',
      next: 'Ship the Stage-3 approver: a small classifier that predicts trade-up contract EV from float distribution. Currently these are manually approved. I want to backtest a supervised model on 8 months of Buff sales data before I let it fire.',
    },
    {
      system: 'Prediction bot',
      next: 'Add a Bayesian updater for the NO-only gate. The 2.5x YES/NO edge is not a constant; it should decay when the market has priced in the bias. I want to model the gate threshold as a function of days-out-from-election, days-out-from-game, and market volume.',
    },
    {
      system: 'copy-trader',
      next: 'Instrument the scorer to A/B test the composite metric weights. Right now Sharpe, drawdown, and profit factor are weighted 0.4 / 0.3 / 0.3. I want to run the backtest across a grid of weights and measure ex-ante ranking stability, then defend a set of weights before I ever put capital behind it.',
    },
    {
      system: 'Across all three',
      next: 'A shared risk-monitor daemon. All three systems currently write to their own Discord channel. I want a single dashboard that ingests position size, PnL, and rule-breach events across the fleet, with configurable circuit-breakers that halt any bot in the group if the aggregate portfolio breaches a drawdown floor.',
    },
  ],
};

export const LIVE = {
  eyebrow: 'Live signals · refreshed daily',
  intro: 'The site rebuilds every night at 06:00 UTC via a GitHub Actions workflow. Commit counts and the Hyperliquid cohort ROI regenerate against real APIs. Every number here is reproducible.',
  last_updated_iso: '2026-07-07T16:37:05.593Z',
  cards: [
    { k: "CounterSnipe commits", v: "328", foot: "srtt16/countersnipe" },
    { k: "Prediction bot commits", v: "17", foot: "PandaXPanther/pandaxpanther-prediction-bot" },
    { k: "copy-trader commits", v: "4", foot: "PandaXPanther/copy-trader" },
    { k: "Hyperliquid cohort · top-5 90d ROI", v: "+396.0%", foot: "Recomputed from seed_wallets.json + Hyperliquid API" },
    { k: "Days since CounterSnipe live", v: "52", foot: "Since May 16, 2026" },
    { k: "Days since last commit", v: "0", foot: "Across the three-repo fleet" },
  ],
};

export const OTHER = {
  eyebrow: 'Other things I built',
  items: [
    {
      name: 'Econ.mom',
      tag: 'The Mother of Econ',
      href: 'https://econ.mom',
      body: 'Twelve free citation-rigorous economics tools for AP students, debaters, and policy desks. AP FRQ Grader, TariffLab, Shadow Fed, Textbook Atlas, Shock Simulator, Paper Decoder, Econ News Translator, US Econ Dashboard, EconLever, Inflation Decomposer, Natural Experiment Finder, Counterfactual Engine.',
      stat: '12 tools · citation-rigorous by design',
    },
    {
      name: 'Local-Ledger',
      tag: 'Nationwide Economic Observatory',
      href: 'https://local-ledger.net',
      body: 'Public economic intelligence for every community. Turns official labor, income, housing, and public-finance data from BLS, FRED, Census, College Scorecard, and USAspending into readable state, county, and metro dashboards. The site tagline is "0 fabricated data points" and the build fails if a citation is missing.',
      stat: '50 states · 3,143 counties · 120 metros · 0 fabricated',
    },
    {
      name: 'Propguard',
      tag: 'Prop-firm compliance monitor',
      href: 'https://github.com/PandaXPanther/propguard',
      body: 'Open-source real-time risk monitor for prop-firm traders. Tracks drawdown, daily loss, and rule-violation risk against an Alpaca account and pings Discord before a violation ships. Free. Written because the person I built it for was tired of paying $50/month for a browser extension that did less.',
      stat: 'Free · open source · Alpaca + Discord',
    },
  ],
};

export const AWARDS = {
  eyebrow: 'On the record',
  groups: [
    {
      title: 'Economics',
      items: [
        { k: 'National Economics Challenge · National Finalist', v: '2× · David Ricardo (2025) & Adam Smith (2026)', foot: 'One of 8 teams to advance to nationals in Atlanta' },
        { k: 'USA Economics Olympiad · Gold', v: 'Round 2 (Invitational)', foot: 'Selected to the USAEBO invitational round' },
        { k: 'IEO Winter Challenge · Bronze', v: 'International', foot: '' },
        { k: 'Economics Olympiad Club · Founder', v: '30 registered NEC competitors', foot: 'Coached team to national semifinals' },
      ],
    },
    {
      title: 'Speech & Debate',
      items: [
        { k: 'NSDA Nationals Qualifier', v: '2×', foot: '' },
        { k: 'Extemp TOC Qualifier · NIETOC Qualifier', v: '', foot: '' },
        { k: 'CHSAA 5A State Finalist', v: '5th in USX', foot: '' },
        { k: 'NSDA Academic All-American', v: '', foot: '' },
        { k: 'Equality in Forensics · Colorado Chapter President', v: '80+ member statewide chapter', foot: '' },
      ],
    },
    {
      title: 'STEM & Leadership',
      items: [
        { k: 'CyberPatriot · 5th nationally, Gold Division (2025)', v: '2026 National Qualifier', foot: 'Cyber Security Club VP + Treasurer' },
        { k: 'Science Olympiad · State Champion', v: '2 gold medals · Astronomy & Forensics', foot: '' },
      ],
    },
  ],
};

export const FOOTER = {
  lines: [
    'Every metric on this page cites a file, a commit, or a live URL.',
    'If anything looks too neat, ask me. I will show you the log.',
  ],
  links: [
    { k: 'GitHub · PandaXPanther', href: 'https://github.com/PandaXPanther' },
    { k: 'GitHub · srtt16', href: 'https://github.com/srtt16' },
    { k: 'Econ.mom', href: 'https://econ.mom' },
    { k: 'Local-Ledger', href: 'https://local-ledger.net' },
    { k: 'Buy me a coffee', href: 'https://buymeacoffee.com/sarast1' },
  ],
};
