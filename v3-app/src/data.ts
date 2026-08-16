/* V3 static mock data model — deterministic fake numbers everywhere.
   Foundation of V3: each Merch Block is saved & published independently.
   Release IDs follow the convention <MERCH_BLOCK_ID>_<version number>, e.g. PDP_V2.0. */

export function hashStr(s: string): number {
  let x = 7
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0
  return x
}
export function rnd(seed: string, min: number, max: number): number {
  return min + ((hashStr(seed) % 10000) / 10000) * (max - min)
}
export function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

/* ---------- data sources ---------- */
/** One parameterised call of the source's API. A source has 1..n variants;
    weights are held per variant (key = `${variant.id}|${block.id}`). */
export interface SourceVariant {
  id: string
  label: string
  explain: string
  api: string
}
export interface Source {
  id: string
  name: string
  desc: string
  api: string // base endpoint, shown in the collapsed row
  variants: SourceVariant[]
}
export interface SourceGroup {
  id: string
  title: string
  sub: string
  badge?: string
  sessionInSub?: boolean
  sources: Source[]
}

const API = 'https://api.store.example/v1'

export const GROUPS: SourceGroup[] = [
  {
    id: 'catalog',
    title: 'Catalog & Product Data',
    sub: 'Signals derived from product attributes, inventory and editorial metadata.',
    sources: [
      { id: 'new-products', name: 'New products', desc: 'Products recently added to the catalog.', api: `${API}/catalog/new-products`, variants: [
        { id: 'new-products-30d', label: 'In production for less than 1 month', explain: 'Returns products whose first publication date in the catalog is less than 30 days old. The window is a query parameter and can be adjusted per call.', api: `${API}/catalog/new-products?added_within=30d` },
        { id: 'new-products-7d', label: 'In production for less than 1 week', explain: 'Returns only products published within the last 7 days — the freshest arrivals, ideal for “just in” placements with a fast rotation.', api: `${API}/catalog/new-products?added_within=7d` },
      ] },
      { id: 'low-stock', name: 'Almost out of stock', desc: 'Products with low remaining inventory.', api: `${API}/inventory/low-stock`, variants: [
        { id: 'low-stock-10k', label: 'Less than 10K products in stock', explain: 'Broad scarcity signal: returns products whose remaining inventory across all warehouses is below 10,000 units. Useful to create urgency early on high-velocity references.', api: `${API}/inventory/low-stock?stock_below=10000` },
        { id: 'low-stock-1k', label: 'Less than 1K products in stock', explain: 'Strong scarcity signal: returns products whose remaining inventory is below 1,000 units. Best reserved for “last chance” placements — the products may sell out during the campaign.', api: `${API}/inventory/low-stock?stock_below=1000` },
      ] },
      { id: 'back-in-stock', name: 'Back in stock', desc: 'Products recently made available again.', api: `${API}/inventory/back-in-stock`, variants: [
        { id: 'back-in-stock-14d', label: 'Restocked within the last 14 days', explain: 'Returns products that went from out-of-stock to available during the last 14 days, ordered by restock date. The window is a query parameter.', api: `${API}/inventory/back-in-stock?restocked_within=14d` },
      ] },
      { id: 'on-promotion', name: 'On promotion', desc: 'Products currently associated with an active promotion.', api: `${API}/catalog/promotions`, variants: [
        { id: 'on-promotion-all', label: 'All active promotions', explain: 'Returns every product attached to a currently active promotion, whatever the mechanism (percentage, fixed price, bundle).', api: `${API}/catalog/promotions?type=all` },
        { id: 'on-promotion-flash', label: 'Flash sales only', explain: 'Restricted to time-boxed flash operations (end date within 48 hours). Higher urgency, much smaller product pool.', api: `${API}/catalog/promotions?type=flash` },
      ] },
      { id: 'award-winning', name: 'Award-winning products', desc: 'Products carrying an editorial or external award flag.', api: `${API}/catalog/award-winning`, variants: [
        { id: 'award-winning-flag', label: 'Products with an active award flag', explain: 'Returns products carrying at least one editorial or external award flag (industry prize, label, certification) maintained by the catalog team.', api: `${API}/catalog/award-winning?flag=active` },
      ] },
      { id: 'press-features', name: 'Featured in the press', desc: 'Products associated with recent press coverage.', api: `${API}/catalog/press-features`, variants: [
        { id: 'press-features-90d', label: 'Press coverage in the last 90 days', explain: 'Returns products linked to a press mention published within the last 90 days, ordered by media reach score.', api: `${API}/catalog/press-features?coverage_within=90d` },
      ] },
      { id: 'top-rated', name: 'Top-rated products', desc: 'Products with the strongest customer rating signals.', api: `${API}/catalog/top-rated`, variants: [
        { id: 'top-rated-strict', label: 'Rating ≥ 4.5 · at least 50 reviews', explain: 'Conservative quality signal: only products with an average rating of 4.5 or higher backed by at least 50 reviews. Small, very safe pool.', api: `${API}/catalog/top-rated?min_rating=4.5&min_reviews=50` },
        { id: 'top-rated-broad', label: 'Rating ≥ 4.0 · at least 10 reviews', explain: 'Broader quality signal: products rated 4.0 or higher with at least 10 reviews. Larger pool, useful to fill long-tail categories.', api: `${API}/catalog/top-rated?min_rating=4.0&min_reviews=10` },
      ] },
    ],
  },
  {
    id: 'market',
    title: 'Market & Site-wide Behavior',
    sub: 'Aggregated demand signals generated by customer behavior across the commerce platform. These signals are available for all visitors and are not based on the current user’s personal data.',
    badge: 'All visitors',
    sources: [
      { id: 'trending', name: 'Trending right now', desc: 'Products experiencing unusually strong current interest.', api: `${API}/trends/products`, variants: [
        { id: 'trending-24h', label: 'Trending over the past 24 hours', explain: 'Products whose view and add-to-cart velocity over the last 24 hours is abnormally high versus their own baseline. Very reactive, refreshed hourly.', api: `${API}/trends/products?window=24h` },
        { id: 'trending-7d', label: 'Trending over the past 7 days', explain: 'Same anomaly detection computed over a 7-day window: smoother, less sensitive to one-off spikes (TV mention, single campaign).', api: `${API}/trends/products?window=7d` },
      ] },
      { id: 'best-sellers', name: 'Best sellers', desc: 'Products generating the highest sales volume.', api: `${API}/performance/best-sellers`, variants: [
        { id: 'best-sellers-30d', label: 'Best sellers — past 30 days', explain: 'Highest sales volume over the last 30 rolling days. The standard commercial ranking for most placements.', api: `${API}/performance/best-sellers?window=30d` },
        { id: 'best-sellers-12m', label: 'Best sellers — past 12 months', explain: 'Highest sales volume over the last 12 rolling months: the structural catalog heroes, insensitive to seasonality spikes.', api: `${API}/performance/best-sellers?window=12m` },
      ] },
      { id: 'most-viewed', name: 'Most viewed', desc: 'Products generating the highest number of views.', api: `${API}/performance/most-viewed`, variants: [
        { id: 'most-viewed-7d', label: 'Most viewed — past 7 days', explain: 'Products with the highest product-page view counts over the last 7 rolling days, all traffic sources combined.', api: `${API}/performance/most-viewed?window=7d` },
      ] },
      { id: 'most-atc', name: 'Most added to cart', desc: 'Products with the highest add-to-cart activity.', api: `${API}/performance/most-added-to-cart`, variants: [
        { id: 'most-atc-7d', label: 'Most added to cart — past 7 days', explain: 'Products with the highest add-to-cart counts over the last 7 rolling days. Stronger purchase-intent signal than views.', api: `${API}/performance/most-added-to-cart?window=7d` },
      ] },
      { id: 'recent-purchases', name: 'Recently purchased', desc: 'Products recently purchased across the website.', api: `${API}/performance/recent-purchases`, variants: [
        { id: 'recent-purchases-24h', label: 'Purchased across the site — past 24 hours', explain: 'Products that appear in orders placed site-wide during the last 24 hours, weighted by order count. Social-proof style signal.', api: `${API}/performance/recent-purchases?window=24h` },
      ] },
    ],
  },
  {
    id: 'preferences',
    title: 'User Preferences',
    sub: 'Personal preference signals available when the customer is identified and personal data is available.',
    badge: 'Logged-in users',
    sources: [
      { id: 'affinities', name: 'Preferred brands & categories', desc: 'Brands and categories with the strongest affinity for this customer.', api: `${API}/users/{userId}/affinities`, variants: [
        { id: 'affinities-top5', label: 'Top 5 brand & category affinities', explain: 'Returns products from the customer’s five strongest brand and category affinities, computed from views, purchases and wishlist over the customer lifetime.', api: `${API}/users/{userId}/affinities?top=5` },
      ] },
      { id: 'wishlist', name: 'Wishlist & favorites', desc: 'Products explicitly saved by the customer.', api: `${API}/users/{userId}/wishlist`, variants: [
        { id: 'wishlist-all', label: 'Full wishlist', explain: 'Every product currently saved by the customer, most recently added first.', api: `${API}/users/{userId}/wishlist?scope=all` },
        { id: 'wishlist-recent', label: 'Wishlisted in the last 30 days', explain: 'Only products saved during the last 30 days — the wishlist items the customer is most likely still actively considering.', api: `${API}/users/{userId}/wishlist?scope=recent&window=30d` },
      ] },
      { id: 'personal-affinity', name: 'Personalized product affinity', desc: 'Products ranked according to the customer’s long-term preference profile.', api: `${API}/users/{userId}/recommendations`, variants: [
        { id: 'personal-affinity-longterm', label: 'Long-term preference profile ranking', explain: 'Products scored by the recommendation model against the customer’s long-term preference profile (styles, price bands, brands, sizes).', api: `${API}/users/{userId}/recommendations?model=longterm` },
      ] },
    ],
  },
  {
    id: 'commercial',
    title: 'Customer Commercial History',
    sub: 'Signals generated from the customer’s historical purchasing activity.',
    badge: 'Logged-in customers',
    sources: [
      { id: 'purchases', name: 'Previously purchased', desc: 'Products purchased by this customer.', api: `${API}/users/{userId}/purchases`, variants: [
        { id: 'purchases-lifetime', label: 'Purchases over customer lifetime', explain: 'Every product the customer has ever purchased, most recent order first. Mostly used on account and reorder placements.', api: `${API}/users/{userId}/purchases?scope=lifetime` },
      ] },
      { id: 'replenishment', name: 'Buy again / replenishment', desc: 'Products the customer may reasonably need to purchase again.', api: `${API}/users/{userId}/replenishment`, variants: [
        { id: 'replenishment-now', label: 'Due for replenishment now', explain: 'Consumable products whose predicted depletion date (purchase date + typical usage cycle) is already passed. Highest reorder intent.', api: `${API}/users/{userId}/replenishment?due=now` },
        { id: 'replenishment-30d', label: 'Due within 30 days', explain: 'Consumables predicted to run out within the next 30 days — a good anticipation window for reminder placements.', api: `${API}/users/{userId}/replenishment?due=30d` },
      ] },
      { id: 'similar-purchases', name: 'Similar to previously purchased', desc: 'Products similar to products previously purchased by the customer.', api: `${API}/users/{userId}/similar-to-purchases`, variants: [
        { id: 'similar-purchases-last10', label: 'Similarity to the last 10 purchases', explain: 'Products similar (category, style, price band) to the customer’s ten most recent purchases, deduplicated against what they already own.', api: `${API}/users/{userId}/similar-to-purchases?basis=last10` },
      ] },
      { id: 'purchase-cross-sell', name: 'Complements previous purchases', desc: 'Products commonly purchased with products previously purchased by this customer.', api: `${API}/users/{userId}/purchase-cross-sell`, variants: [
        { id: 'purchase-cross-sell-90d', label: 'Cross-sell on the last 90 days of purchases', explain: 'Co-purchase recommendations computed on the products bought during the last 90 days — accessories, refills and companion products.', api: `${API}/users/{userId}/purchase-cross-sell?window=90d` },
      ] },
    ],
  },
  {
    id: 'browsing',
    title: 'Current & Recent Browsing Activity',
    sub: 'Signals generated by the customer’s current or recent browsing activity.',
    sessionInSub: true,
    sources: [
      { id: 'recently-viewed', name: 'Recently viewed', desc: 'Products viewed during the relevant session window.', api: `${API}/session/recently-viewed`, variants: [
        { id: 'recently-viewed-current', label: 'Current session only', explain: 'Products viewed during the current browsing session on this device — the most immediate re-engagement signal.', api: `${API}/session/recently-viewed?scope=current` },
        { id: 'recently-viewed-48h', label: 'Rolling 48h logged sessions', explain: 'For identified customers: products viewed across all devices during the rolling 48-hour session window (see the session definition).', api: `${API}/session/recently-viewed?scope=48h` },
      ] },
      { id: 'recent-searches', name: 'Recent search intent', desc: 'Products or categories inferred from recent searches.', api: `${API}/session/recent-searches`, variants: [
        { id: 'recent-searches-session', label: 'Searches in the current session window', explain: 'Products and categories matched against the queries typed during the session window, most recent query weighted highest.', api: `${API}/session/recent-searches?scope=session` },
      ] },
      { id: 'recent-categories', name: 'Recently browsed categories', desc: 'Categories recently explored by the visitor.', api: `${API}/session/recent-categories`, variants: [
        { id: 'recent-categories-48h', label: 'Categories browsed in the past 48 hours', explain: 'Top products drawn from the categories the visitor spent the most time in during the past 48 hours.', api: `${API}/session/recent-categories?window=48h` },
      ] },
      { id: 'cart', name: 'Already in your cart', desc: 'Products currently present in the customer’s cart.', api: `${API}/session/cart`, variants: [
        { id: 'cart-current', label: 'Products currently in the cart', explain: 'The live content of the cart, used mainly to remind, not to recommend — and to exclude these products from other signals.', api: `${API}/session/cart?scope=current` },
      ] },
      { id: 'cart-fbt', name: 'Often purchased with products already in your cart', desc: 'Frequently bought together recommendations based on cart contents.', api: `${API}/session/cart/frequently-bought-together`, variants: [
        { id: 'cart-fbt-strong', label: 'Strong co-purchase affinity — top 3', explain: 'Only the three strongest co-purchase associations per cart item, with a high support threshold. Very safe, small pool.', api: `${API}/session/cart/frequently-bought-together?top=3&support=high` },
        { id: 'cart-fbt-broad', label: 'Broad co-purchase affinity — top 10', explain: 'Up to ten associations per cart item with a lower support threshold — wider discovery at the cost of precision.', api: `${API}/session/cart/frequently-bought-together?top=10&support=low` },
      ] },
      { id: 'recent-view-fbt', name: 'Often purchased with the most recently viewed product', desc: 'Frequently bought together recommendations based on the most recently viewed product.', api: `${API}/session/recent-view/frequently-bought-together`, variants: [
        { id: 'recent-view-fbt-last', label: 'Co-purchases of the last viewed product', explain: 'Products most frequently found in the same orders as the last product the visitor viewed.', api: `${API}/session/recent-view/frequently-bought-together?basis=last-viewed` },
      ] },
      { id: 'recent-view-similar', name: 'Similar to the most recently viewed product', desc: 'Products similar to the most recently viewed product.', api: `${API}/session/recent-view/similar`, variants: [
        { id: 'recent-view-similar-category', label: 'Same-category similarity', explain: 'Products from the same category as the last viewed product, ranked by attribute similarity (price band, style, brand tier).', api: `${API}/session/recent-view/similar?model=category` },
        { id: 'recent-view-similar-visual', label: 'Visual similarity', explain: 'Products visually similar to the last viewed product according to the image-embedding model, across categories.', api: `${API}/session/recent-view/similar?model=visual` },
      ] },
    ],
  },
]

export const SOURCES: Source[] = GROUPS.flatMap((g) => g.sources)
export const ALL_VARIANTS: SourceVariant[] = SOURCES.flatMap((s) => s.variants)

/* ---------- merchandising doors ---------- */
/** A "Merchandising door" is not a product feed: it is a curated link tile placed
    inside a Merch Block, sending the customer to a curated list of products. */
export interface DoorOption {
  id: string
  label: string
  defaultText: string
  defaultUrl: string
}
export const DOOR_TAGLINE =
  'Merchandising door to a selected curated list of products — like “Check all the promotions”, “Go to my wishlist” or “Discover the latest arrivals”.'

/* ---------- final user groups ---------- */
/** Audience segments of the e-commerce site itself. Managed in Preferences;
    each group will eventually see its own Merchandising Mix. */
export interface FinalUserGroup {
  name: string
  criteria: string
  identification: 'Anonymous' | 'Cookie' | 'Signed in'
  share: string
}
export const FINAL_USER_GROUPS: FinalUserGroup[] = [
  { name: 'Prospects', criteria: 'Signed out · no cookie history — first contact with the site.', identification: 'Anonymous', share: '34%' },
  { name: 'Returning visitors', criteria: 'Signed out · known first-party cookie, no account.', identification: 'Cookie', share: '22%' },
  { name: 'Signed in, no purchase', criteria: 'Identified account · zero purchases to date.', identification: 'Signed in', share: '12%' },
  { name: 'Active customers', criteria: 'Signed in · one or more purchases in the past 13 months.', identification: 'Signed in', share: '21%' },
  { name: 'Lapsed customers', criteria: 'Signed in · last purchase more than 13 months ago.', identification: 'Signed in', share: '8%' },
  { name: 'VIP customers', criteria: 'Signed in · top 5% by revenue over the past 24 months.', identification: 'Signed in', share: '3%' },
]

export interface DoorColor {
  id: string
  label: string
  bg: string
  ink: string
  border: string
}
export const DEFAULT_DOOR_COLORS: DoorColor[] = [
  { id: 'white', label: 'White', bg: '#ffffff', ink: '#0e7490', border: '#d6d3d1' },
  { id: 'cream', label: 'Cream', bg: '#faf7f2', ink: '#44403c', border: '#e7e5e4' },
  { id: 'cyan-light', label: 'Light cyan', bg: '#ecfeff', ink: '#0e7490', border: '#a5f3fc' },
  { id: 'cyan', label: 'Cyan', bg: '#0e7490', ink: '#ffffff', border: '#0e7490' },
  { id: 'dark', label: 'Dark', bg: '#1c1917', ink: '#ffffff', border: '#1c1917' },
  { id: 'amber', label: 'Amber', bg: '#fef3c7', ink: '#92400e', border: '#fde68a' },
]

export const DOOR_OPTIONS: Record<string, DoorOption[]> = {
  catalog: [
    { id: 'promotions', label: 'Check all the promotions', defaultText: 'Check all the promotions →', defaultUrl: 'https://www.store.example/promotions' },
    { id: 'new-in', label: 'Discover the latest arrivals', defaultText: 'New in — discover the latest arrivals', defaultUrl: 'https://www.store.example/new-in' },
    { id: 'awards', label: 'Shop award-winning products', defaultText: 'Shop our award-winning selection', defaultUrl: 'https://www.store.example/award-winning' },
    { id: 'back-in-stock', label: 'See what is back in stock', defaultText: 'They’re back — restocked favorites', defaultUrl: 'https://www.store.example/back-in-stock' },
  ],
  market: [
    { id: 'best-sellers', label: 'Shop the best sellers', defaultText: 'Shop the best sellers', defaultUrl: 'https://www.store.example/best-sellers' },
    { id: 'trending', label: 'See what is trending today', defaultText: 'Trending right now — see what everyone’s after', defaultUrl: 'https://www.store.example/trending' },
    { id: 'most-viewed', label: 'Browse the most viewed products', defaultText: 'The most viewed products this week', defaultUrl: 'https://www.store.example/most-viewed' },
  ],
  preferences: [
    { id: 'wishlist', label: 'Go to my wishlist', defaultText: 'Go to my wishlist ♡', defaultUrl: 'https://www.store.example/account/wishlist' },
    { id: 'favorite-brands', label: 'Shop your favorite brands', defaultText: 'Your favorite brands, all in one place', defaultUrl: 'https://www.store.example/account/brands' },
    { id: 'for-you', label: 'Your personalized selection', defaultText: 'Picked for you — your personalized selection', defaultUrl: 'https://www.store.example/for-you' },
  ],
  commercial: [
    { id: 'buy-again', label: 'Buy again — your essentials', defaultText: 'Buy again — restock your essentials', defaultUrl: 'https://www.store.example/account/buy-again' },
    { id: 'orders', label: 'Your order history', defaultText: 'Review your orders', defaultUrl: 'https://www.store.example/account/orders' },
    { id: 'complete-purchase', label: 'Complete your last purchase', defaultText: 'Complete the look — goes well with your last order', defaultUrl: 'https://www.store.example/account/cross-sell' },
  ],
  browsing: [
    { id: 'recently-viewed', label: 'Back to your recently viewed', defaultText: 'Pick up where you left off', defaultUrl: 'https://www.store.example/recently-viewed' },
    { id: 'resume-search', label: 'Resume your last search', defaultText: 'Back to your search results', defaultUrl: 'https://www.store.example/search/recent' },
    { id: 'cart', label: 'Your cart is waiting', defaultText: 'Your cart is waiting for you →', defaultUrl: 'https://www.store.example/cart' },
  ],
}

/* ---------- merch blocks ---------- */
export interface Block {
  id: string
  code: string // short ID used in release IDs, e.g. PDP → PDP_V2.0
  name: string
  group: string
  placement: string
  liveSince: string
  pm: string
  tech: string
  owner: string
  wire: { kind: string; hl: [number, number]; fold?: boolean }
}

const PEOPLE = {
  pm: ['Maya Chen', 'Louis Fabre', 'Nadia Benali', 'Marc Aubert'],
  tech: ['Alex Rivera', 'Sarah Kaminsky', 'Théo Girard', 'Anna Kovacs'],
  owner: ['Sarah Klein', 'Olivier Petit', 'Rachel Cohen', 'Hugo Lambert'],
}

export const BLOCK_GROUPS = ['Homepage', 'Browsing', 'Product & Purchase Journey'] as const

/** Placement categories — immutable IDs, editable labels (managed in Reference). */
export const PLACEMENT_CATEGORIES = [
  { id: 'HOMEPAGE', group: 'Homepage' },
  { id: 'BROWSING', group: 'Browsing' },
  { id: 'JOURNEY', group: 'Product & Purchase Journey' },
] as const

/** Default editable label of a block — e.g. “HP — above the fold”. */
export function defaultBlockLabel(b: { name: string }): string {
  return b.name.replace('Merch Block — ', '— ').replace(' Merch Block', '')
}

export const BLOCKS: Block[] = [
  { id: 'hp-above-fold', code: 'HP-TOP', name: 'HP Merch Block — above the fold', group: 'Homepage', placement: 'Homepage — first merchandising slot, fully visible above the fold.', liveSince: 'March 12, 2025', wire: { kind: 'hp', hl: [38, 20], fold: true }, pm: '', tech: '', owner: '' },
  { id: 'hp-below-hero', code: 'HP-HERO', name: 'HP Merch Block — right below hero banner', group: 'Homepage', placement: 'Homepage — below hero banner.', liveSince: 'March 12, 2025', wire: { kind: 'hp-hero', hl: [86, 20], fold: true }, pm: '', tech: '', owner: '' },
  { id: 'hp-below-content', code: 'HP-CONTENT', name: 'HP Merch Block — below content section', group: 'Homepage', placement: 'Homepage — after the editorial content section, mid-page.', liveSince: 'April 2, 2025', wire: { kind: 'hp-hero', hl: [132, 20], fold: true }, pm: '', tech: '', owner: '' },
  { id: 'hp-bottom', code: 'HP-BOTTOM', name: 'HP Merch Block — bottom of page', group: 'Homepage', placement: 'Homepage — last section before the footer.', liveSince: 'April 2, 2025', wire: { kind: 'hp-hero', hl: [168, 20], fold: true }, pm: '', tech: '', owner: '' },
  { id: 'category', code: 'CATEGORY', name: 'Category Page Merch Block', group: 'Browsing', placement: 'Category landing page — between the category header and the sub-category tiles.', liveSince: 'May 6, 2025', wire: { kind: 'category', hl: [70, 20] }, pm: '', tech: '', owner: '' },
  { id: 'catalog', code: 'CATALOG', name: 'Catalog, above product list', group: 'Browsing', placement: 'Catalog / product-list page — horizontal strip right above the filtered product grid.', liveSince: 'May 6, 2025', wire: { kind: 'catalog', hl: [64, 18] }, pm: '', tech: '', owner: '' },
  { id: 'search', code: 'SEARCH', name: 'Search Results Merch Block', group: 'Browsing', placement: 'Search results page — strip above the result grid.', liveSince: 'June 18, 2025', wire: { kind: 'catalog', hl: [64, 18] }, pm: '', tech: '', owner: '' },
  { id: 'pdp', code: 'PDP', name: 'Product Page Merch Block', group: 'Product & Purchase Journey', placement: 'Product detail page — recommendations below product information, above the reviews section.', liveSince: 'March 12, 2025', wire: { kind: 'product', hl: [128, 22] }, pm: '', tech: '', owner: '' },
  { id: 'cart', code: 'CART', name: 'Cart Page Merch Block', group: 'Product & Purchase Journey', placement: 'Cart page — under the line items, above the checkout call to action.', liveSince: 'March 28, 2025', wire: { kind: 'cart', hl: [126, 22] }, pm: '', tech: '', owner: '' },
  { id: 'mini-cart', code: 'MINICART', name: 'Mini-cart / Cart Drawer Merch Block', group: 'Product & Purchase Journey', placement: 'Mini-cart drawer — compact vertical module under the drawer line items.', liveSince: 'September 9, 2025', wire: { kind: 'drawer', hl: [118, 40] }, pm: '', tech: '', owner: '' },
  { id: 'account', code: 'ACCOUNT', name: 'Account Page Merch Block', group: 'Product & Purchase Journey', placement: 'My-account dashboard — right column, under the order status card.', liveSince: 'July 22, 2025', wire: { kind: 'account', hl: [96, 34] }, pm: '', tech: '', owner: '' },
  { id: 'wishlist-block', code: 'WISHLIST', name: 'Wishlist Merch Block', group: 'Product & Purchase Journey', placement: 'Wishlist page — below the saved items list.', liveSince: 'October 14, 2025', wire: { kind: 'cart', hl: [126, 22] }, pm: '', tech: '', owner: '' },
  { id: 'confirmation', code: 'CONFIRM', name: 'Order Confirmation Merch Block', group: 'Product & Purchase Journey', placement: 'Order confirmation page — under the order summary.', liveSince: 'October 14, 2025', wire: { kind: 'cart', hl: [126, 22] }, pm: '', tech: '', owner: '' },
]
BLOCKS.forEach((b, i) => {
  b.pm = PEOPLE.pm[i % 4]
  b.tech = PEOPLE.tech[(i + 1) % 4]
  b.owner = PEOPLE.owner[(i + 2) % 4]
})

export function blockByCode(code: string): Block | undefined {
  return BLOCKS.find((b) => b.code === code)
}

/* ---------- default weights (percent, columns sum to 100) ---------- */
const BOOSTS: Record<string, number> = {
  'trending|hp-above-fold': 3, 'recently-viewed|hp-above-fold': 3, 'best-sellers|hp-above-fold': 2,
  'best-sellers|hp-below-hero': 3, 'new-products|hp-below-hero': 3,
  'on-promotion|hp-below-content': 2, 'press-features|hp-below-content': 2,
  'wishlist|hp-bottom': 2, 'replenishment|hp-bottom': 2,
  'on-promotion|category': 3, 'trending|category': 2,
  'top-rated|catalog': 2, 'best-sellers|catalog': 2,
  'recent-searches|search': 4, 'recently-viewed|search': 2,
  'recent-view-similar|pdp': 4, 'recent-view-fbt|pdp': 3, 'top-rated|pdp': 1,
  'cart-fbt|cart': 4, 'replenishment|cart': 2,
  'cart-fbt|mini-cart': 4,
  'replenishment|account': 4, 'purchases|account': 2, 'similar-purchases|account': 2,
  'back-in-stock|wishlist-block': 3, 'wishlist|wishlist-block': 0, 'similar-purchases|wishlist-block': 2,
  'purchase-cross-sell|confirmation': 3, 'replenishment|confirmation': 3,
}

export type Weights = Record<string, number>

/** Weights are points on a 1–10 scale (0 = variant not used in this block),
    held PER VARIANT (key = `${variant.id}|${block.id}`).
    The displayed percentage is computed per column: points / sum of column points. */
export function defaultWeights(): Weights {
  const w: Weights = {}
  for (const b of BLOCKS) {
    for (const v of ALL_VARIANTS) w[`${v.id}|${b.id}`] = 0
    const scored = SOURCES.map((s) => {
      const key = `${s.id}|${b.id}`
      const base = (hashStr(key) % 100) / 100
      const boost = BOOSTS[key] ?? 0
      return { s, score: base + boost }
    }).sort((a, z) => z.score - a.score)
    const chosen = scored.slice(0, 7)
    const total = chosen.reduce((acc, c) => acc + c.score, 0)
    for (const c of chosen) {
      const exact = (c.score / total) * 100
      const pts = Math.max(1, Math.min(10, Math.round(exact / 4)))
      const vs = c.s.variants
      if (vs.length === 1) {
        w[`${vs[0].id}|${b.id}`] = pts
      } else {
        // deterministic split: the second variant gets ~1/3 of the points
        const second = Math.floor(pts / 3)
        w[`${vs[0].id}|${b.id}`] = pts - second
        w[`${vs[1].id}|${b.id}`] = second
      }
    }
  }
  return w
}

/* ---------- KPIs (unchanged from V2) ---------- */
export const PERIODS = [
  { id: '24h', label: 'Past 24 hours', factor: 1 / 30 },
  { id: '30d', label: 'Past 30 rolling days', factor: 1 },
  { id: 'cmonth', label: 'Current calendar month', factor: 14 / 30 },
  { id: 'cyear', label: 'Current calendar year', factor: 7.47 },
  { id: '12m', label: 'Past rolling 12 months', factor: 12.17 },
] as const
export type PeriodId = (typeof PERIODS)[number]['id']

export interface Kpis {
  displayed: number
  viewed: number
  viewedDesktop: number
  viewedMobile: number
  clicked: number
  atc: number
}

function base30d(b: Block): Kpis {
  const displayed = rnd(b.id + 'D', 180_000, 1_400_000)
  const viewed = displayed * rnd(b.id + 'V', 0.45, 0.78)
  const deskShare = rnd(b.id + 'ds', 0.46, 0.66)
  const clicked = viewed * rnd(b.id + 'C', 0.02, 0.09)
  const atc = rnd(b.id + 'A', 8, 35)
  return { displayed, viewed, viewedDesktop: viewed * deskShare, viewedMobile: viewed * (1 - deskShare), clicked, atc }
}

export function kpisFor(b: Block, period: PeriodId): Kpis {
  const f = PERIODS.find((p) => p.id === period)!.factor
  const k = base30d(b)
  return {
    displayed: k.displayed * f,
    viewed: k.viewed * f,
    viewedDesktop: k.viewedDesktop * f,
    viewedMobile: k.viewedMobile * f,
    clicked: k.clicked * f,
    atc: Math.max(1, k.atc + rnd(b.id + period, -1.5, 1.5)),
  }
}

export function kpisLifetime(b: Block): Kpis {
  const months = rnd(b.id + 'life', 10, 17)
  const k = base30d(b)
  return {
    displayed: k.displayed * months,
    viewed: k.viewed * months,
    viewedDesktop: k.viewedDesktop * months,
    viewedMobile: k.viewedMobile * months,
    clicked: k.clicked * months,
    atc: k.atc,
  }
}

export function ranks(): Record<string, { engagement: number; atc: number }> {
  const eng = BLOCKS.map((b) => {
    const k = base30d(b)
    return { id: b.id, v: k.clicked / k.viewed }
  }).sort((a, z) => z.v - a.v)
  const perf = BLOCKS.map((b) => ({ id: b.id, v: base30d(b).atc })).sort((a, z) => z.v - a.v)
  const out: Record<string, { engagement: number; atc: number }> = {}
  for (const b of BLOCKS) {
    out[b.id] = {
      engagement: eng.findIndex((x) => x.id === b.id) + 1,
      atc: perf.findIndex((x) => x.id === b.id) + 1,
    }
  }
  return out
}

/* ---------- per-block releases ---------- */
export type VersionStatus = 'draft' | 'live' | 'previously-live'
export interface ImpactEstimation {
  engagement: string
  atc: string
}
export interface ImpactAnalysis {
  engagement: { est: string; obs: string; variance: string }
  atc: { est: string; obs: string; variance: string }
}
export interface BlockRelease {
  id: string // e.g. PDP_V2.0
  blockId: string
  blockCode: string
  num: string // e.g. V2.0
  name: string
  status: VersionStatus
  date: string
  sort: number
  by: string
  source: string | null // e.g. PDP_V1.1
  desc: string
  estimation: ImpactEstimation | null
  analysis?: ImpactAnalysis
  /** Final user groups this release is shown to (decided at publish time). */
  audience?: string
}

export function parseNum(num: string): [number, number] {
  const m = num.match(/V(\d+)\.(\d+)/)
  return m ? [Number(m[1]), Number(m[2])] : [0, 0]
}

function mockEstimation(seed: string): ImpactEstimation {
  const e = 0.5 + (hashStr(seed + 'e') % 45) / 10
  const a = 0.3 + (hashStr(seed + 'a') % 32) / 10
  return { engagement: `+${e.toFixed(1)}%`, atc: `+${a.toFixed(1)}%` }
}
function mockAnalysis(seed: string, est: ImpactEstimation): ImpactAnalysis {
  const shift = (v: string, s: string) => {
    const n = parseFloat(v)
    const d = ((hashStr(s) % 13) - 6) / 10
    const obs = n + d
    return { obs: `+${obs.toFixed(1)}%`, variance: `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} pt` }
  }
  const e = shift(est.engagement, seed + 'oe')
  const a = shift(est.atc, seed + 'oa')
  return {
    engagement: { est: est.engagement, obs: e.obs, variance: e.variance },
    atc: { est: est.atc, obs: a.obs, variance: a.variance },
  }
}

const DRAFT_NAMES = ['Initial configuration', 'Signal rebalance', 'Personalization pass', 'Seasonal adjustment', 'Stock-signal tuning']
const PUB_NAMES = ['First production release', 'Personalization increase', 'Conversion tuning']

/** Deterministic seed releases for one block. */
export function seedReleases(b: Block): BlockRelease[] {
  const h = hashStr(b.id)
  const out: BlockRelease[] = []
  const mk = (num: string, name: string, status: VersionStatus, month: string, mIdx: number, day: number, by: string, source: string | null, desc: string, withEst: boolean): BlockRelease => {
    const id = `${b.code}_${num}`
    const est = withEst ? mockEstimation(id) : null
    const r: BlockRelease = {
      id, blockId: b.id, blockCode: b.code, num, name, status,
      date: `${month} ${day}, 2026`, sort: mIdx * 100 + day, by, source, desc, estimation: est,
    }
    if (status !== 'draft' && est) r.analysis = mockAnalysis(id, est)
    return r
  }
  const d1 = 2 + (h % 24)
  const d2 = 1 + ((h >> 3) % 26)
  const d3 = 1 + ((h >> 5) % 24)
  const d4 = 1 + ((h >> 7) % 26)
  const d5 = 1 + ((h >> 9) % 12)
  const p1 = PEOPLE.pm[h % 4]
  const p2 = PEOPLE.pm[(h + 1) % 4]

  out.push(mk('V0.1', DRAFT_NAMES[h % 5], 'draft', 'Apr', 4, d1, p1, null, 'Initial weighting draft for this block.', (h % 3) !== 0))
  const hasV02 = h % 2 === 0
  if (hasV02) out.push(mk('V0.2', DRAFT_NAMES[(h + 2) % 5], 'draft', 'May', 5, d2, p2, `${b.code}_V0.1`, 'Second internal draft after merchandising review.', true))
  const srcPub1 = hasV02 ? `${b.code}_V0.2` : `${b.code}_V0.1`
  const onV2 = h % 3 !== 0
  out.push(mk('V1.0', PUB_NAMES[0], onV2 ? 'previously-live' : 'live', 'Jun', 6, d3, p1, srcPub1, `Published release created from ${srcPub1}. Configuration identical to ${srcPub1} at publication.`, true))
  if (onV2) {
    out.push(mk('V1.1', DRAFT_NAMES[(h + 3) % 5], 'draft', 'Jul', 7, d4, p2, `${b.code}_V1.0`, 'Draft iteration on the live configuration.', (h % 4) !== 0))
    out.push(mk('V2.0', PUB_NAMES[1 + (h % 2)], 'live', 'Aug', 8, d5, p1, `${b.code}_V1.1`, `Published release created from ${b.code}_V1.1. Configuration identical to ${b.code}_V1.1 at publication.`, true))
  } else {
    // saved after the live release, never deployed → pending publication
    out.push(mk('V1.1', DRAFT_NAMES[(h + 3) % 5], 'draft', 'Jul', 7, d4, p2, `${b.code}_V1.0`, 'Draft iteration on the live configuration — not deployed yet.', (h % 4) !== 0))
  }
  return out
}

/** The live versions currently served by a block, one line per audience —
    recorded audience when available, deterministic mock split otherwise. */
export interface LiveAudienceLine { r: BlockRelease; groups: string }
export function liveAudienceLines(releases: BlockRelease[]): LiveAudienceLine[] {
  const live = releases.find((r) => r.status === 'live')
  const prevs = releases.filter((r) => r.status === 'previously-live')
  const prevLive = prevs[prevs.length - 1]
  if (!live) return []
  if (prevLive) {
    return [
      { r: live, groups: live.audience ?? 'Prospects · Returning visitors · Signed in, no purchase · Lapsed customers' },
      { r: prevLive, groups: prevLive.audience ?? 'Active customers · VIP customers' },
    ]
  }
  return [{ r: live, groups: live.audience ?? 'All visitors' }]
}

/* ---------- rollout history per block, derived from releases ---------- */
export interface MixHistoryEntry {
  releaseId: string
  releaseName: string
  start: string
  end: string
  rollout: string
  status: 'Experiment rollout' | 'Full rollout' | 'Replaced'
}
export function rolloutHistory(releases: BlockRelease[]): MixHistoryEntry[] {
  const pubs = releases.filter((r) => r.status !== 'draft').sort((a, z) => a.sort - z.sort)
  const out: MixHistoryEntry[] = []
  pubs.forEach((p, i) => {
    const next = pubs[i + 1]
    out.push({
      releaseId: p.id,
      releaseName: p.name,
      start: p.date,
      end: next ? next.date : 'Present',
      rollout: '10% × 2 weeks → 100%',
      status: next ? 'Replaced' : p.status === 'live' ? 'Full rollout' : 'Replaced',
    })
  })
  return out.reverse()
}
