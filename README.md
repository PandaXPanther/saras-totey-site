# Saras Totey · Independent Quantitative Systems

Portfolio site for my college applications. Documents three trading systems (CounterSnipe, PandaXPanther Prediction Bot, copy-trader) plus supporting projects.

Live: [saras-totey.pplx.app](https://saras-totey.pplx.app)

Every metric on the site is sourced from real repo files, live sites, or logged trade history. No fabricated numbers.

## Stack

- Vite + React 18
- Framer Motion for reveals
- React Three Fiber for the hero orderbook visualization
- Boska (display) + Switzer (body) via Fontshare
- JetBrains Mono for numerals

## Local development

```bash
npm install
npm run dev
```

Dev server runs on `http://localhost:5173`.

## Build

```bash
npm run build
```

Static output lands in `dist/`. Deploy anywhere that serves static files (Netlify, Vercel, Cloudflare Pages).

## Deploy to Netlify

Site publishes as static HTML. Set:

- Build command: `npm run build`
- Publish directory: `dist`

## Deploy to Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

## Cloudflare Pages `www` setup

To make `www.sarastotey.com` resolve cleanly:

1. Open Cloudflare Dashboard -> Websites -> `sarastotey.com` -> DNS -> Records.
2. Add a CNAME record:
   - Name: `www`
   - Target: `sarastotey.com`
   - Proxy status: Proxied
   - TTL: Auto
3. Open Rules -> Redirect Rules -> Create rule.
4. Set the rule name to `Redirect www to apex`.
5. If incoming requests match:
   - Field: `Hostname`
   - Operator: `equals`
   - Value: `www.sarastotey.com`
6. Then:
   - Type: `Dynamic`
   - Expression: `concat("https://sarastotey.com", http.request.uri.path)`
   - Status code: `301`
   - Preserve query string: enabled
7. Deploy the rule and verify with `curl -I https://www.sarastotey.com/`.

## Content

All copy and numbers live in `src/data/content.js`. Edit that file to update the site.

## Attribution

Design + build by Saras Totey. CounterSnipe co-owned with Ryder Thomas.
