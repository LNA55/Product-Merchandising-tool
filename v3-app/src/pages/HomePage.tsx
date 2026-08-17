import { BLOCKS, fmt, hashStr, kpisLifetime } from '../data'

/** User home page of the app (not a marketing site). Content being built iteratively. */
export function HomePage() {
  /* aggregated performance across all merch blocks (same mock engine as Merch Blocks page) */
  const totals = BLOCKS.reduce(
    (acc, b) => {
      const l = kpisLifetime(b)
      const atcVol = (l.clicked * l.atc) / 100
      const cvr = 18 + (hashStr(b.id + 'cvr30dall') % 160) / 10
      const sold = atcVol * (cvr / 100)
      const revenue = sold * (45 + (hashStr(b.id + 'aov') % 750) / 10)
      return { clicked: acc.clicked + l.clicked, atcVol: acc.atcVol + atcVol, sold: acc.sold + sold, revenue: acc.revenue + revenue }
    },
    { clicked: 0, atcVol: 0, sold: 0, revenue: 0 },
  )
  const atcRate = (100 * totals.atcVol) / totals.clicked

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-8">
      <div className="max-w-4xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700">Unique Value Proposition</p>
        <p className="mt-5 text-[26px] font-bold leading-snug tracking-tight text-stone-900">
          Maximize the <span className="text-cyan-700">add-to-cart rate</span><br className="hidden sm:block" />
          {' '}of e-commerce websites with a large catalog.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-stone-500">
          We do so by improving the <b className="font-semibold text-stone-700">relevance of the products displayed</b> in front of the final user's eyes.
        </p>

        <p className="mt-14 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700">Performance</p>
        <div className="mt-6 flex flex-wrap items-start justify-center gap-x-12 gap-y-6">
          <div>
            <p className="text-[27px] font-bold leading-none tracking-tight text-stone-900 tabular-nums">{BLOCKS.length}</p>
            <p className="mt-1.5 text-[12px] leading-snug text-stone-500">Merch block positions<br />incl. inactive ones</p>
          </div>
          <div>
            <p className="text-[27px] font-bold leading-none tracking-tight text-cyan-700 tabular-nums">{atcRate.toFixed(1)}%</p>
            <p className="mt-1.5 text-[12px] leading-snug text-stone-500">Add to cart rate<br />attributed to those blocks</p>
          </div>
          <div>
            <p className="text-[27px] font-bold leading-none tracking-tight text-cyan-700 tabular-nums">{fmt(totals.sold)}</p>
            <p className="mt-1.5 text-[12px] leading-snug text-stone-500">Products sold<br />attributed to those blocks</p>
          </div>
          <div>
            <p className="text-[27px] font-bold leading-none tracking-tight text-cyan-700 tabular-nums">${fmt(totals.revenue)}</p>
            <p className="mt-1.5 text-[12px] leading-snug text-stone-500">Revenue<br />attributed to those blocks</p>
          </div>
        </div>
        <p className="mt-6 text-[11px] text-stone-400">since 12/03/2025, the launch of the first merch block with this tool.</p>
      </div>
    </div>
  )
}
