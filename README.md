# Product Merchandising tool

Prototypes of a SaaS merchandising control tool for large e-commerce sites, deployed at [pp.shoette.com](http://pp.shoette.com/).

The tool lets Product / E-commerce teams configure which data signals (catalog, market, user preferences, purchase history, session browsing) determine the products displayed in each merchandising block of the site, through a weighted **Data Sources × Merch Blocks** matrix.

## Versions

| Folder | Description |
|---|---|
| `version-1/` | Static HTML/CSS/JS mockup — full concept: weighted matrix, merch blocks with KPIs, mix versioning, impact estimation. |
| `version-2/` + `v2-app/` | React + TypeScript + Vite prototype (built output + source). Percent-based matrix, immutable global versioning (V0.x drafts / Vn.0 published), impact estimation & analysis. |
| `version-3/` + `v3-app/` | Current prototype (built output + source). Per-block releases (`MERCH_BLOCK_ID_Vn.x`), 1–10 weights with computed % shares, parameterised API calls per data source, Display modes (live / latest saved / working) wired to the matrix, per-audience live versions, Swagger sandbox, impact reports, merchandising doors, Reference data (placement categories, immutable IDs / editable labels), preferences (final user groups, roles & permissions, integrations). |

`index.html` + `assets/` are the subdomain landing page listing the versions.

## Development (v3)

```bash
cd v3-app
npm install
npm run dev      # local dev server
npm run build    # builds into ../version-3
```

Deployment is done via FTP to the pp.shoette.com subdomain (not through GitHub).

All data in the prototypes is deterministic mock/sandbox data — no backend, no real API calls.
