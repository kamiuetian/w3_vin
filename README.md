# w3.vin — Confidential Acquisition Landing Page

This folder contains a self-contained, static landing page designed to position **w3.vin** as a premium, category-defining Web3 domain asset.

## Quick start
Upload the contents of this folder to the web root of the domain (or serve locally).

## Inquiry routing
- This page **displays**: `inquiries@w3.vin`
- All inquiry actions **route to**: `inquiries@ranzotech.com` (editable in `index.html` and `assets/js/main.js` via `W3_CONFIG.contactEmail`)

## Price / CTA rules (already implemented)
- Price is withheld: **"Price upon request to qualified buyers."**
- Primary CTA: **"Confidential Inquiry"** (email-only)

## Market strip (ticker) — API-ready, no external calls by default
The footer includes a premium market strip UI with placeholders.  
Your developer can inject data by setting:

```js
window.W3_MARKET_DATA = {
  BTC: "$67,123",
  ETH: "$3,421",
  AUX: "$2,035" // GOLD or S&P 500, depending on the page
};
```

No fetch calls are included by default.

## Files
- `index.html` — main page
- `assets/css/styles.css` — styling
- `assets/js/main.js` — interaction + mailto builder
- `assets/w3-one-pager.pdf` — one-page acquisition memo
- `assets/img/*` — hero + social share assets
- `.well-known/security.txt` — security contact

