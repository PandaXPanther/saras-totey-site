# Saras Totey · Independent Quantitative Systems

Personal portfolio for my trading systems, economics projects, agency work, Roblox games, and side projects.

Live: [saras-totey.com](https://sarastotey.com/)

The trading page shows historical metrics and labeled simulation results. See [generated trade telemetry](docs/generated-trades.md) for the feed and refresh cadence.

The nightly workflow refreshes the Roblox catalog from both creator accounts and discovers communities by ownership. Run `npm run refresh:roblox` to fetch the same catalog locally.

Run `npm run dev` for local development. Run `npx playwright install chromium` once, then `npm run test:browser` to check the island, navigation, and trading feed updates.


Design + build by [Saras Totey](https://sarastotey.com).
