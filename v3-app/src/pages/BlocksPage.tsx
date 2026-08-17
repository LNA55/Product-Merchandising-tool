import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BLOCKS, FINAL_USER_GROUPS, fmt, hashStr, kpisFor, kpisLifetime, liveAudienceLines, PERIODS, PLACEMENT_CATEGORIES, ranks, rolloutHistory, type Block, type PeriodId } from '../data'
import { useStore } from '../store'
import { Badge, Button, ExternalLink, Field, InfoTip, inputCls, Modal, SessionWord } from '../components/ui'
import { Wireframe } from '../components/Wireframe'

const DEVICES = [
  { id: 'all', label: 'All devices', factor: 1, atcShift: 0 },
  { id: 'desktop', label: 'Desktop only', factor: 0.4, atcShift: 1.2 },
  { id: 'mobile-web', label: 'Mobile web only', factor: 0.45, atcShift: -1.6 },
  { id: 'website', label: 'All website', factor: 0.85, atcShift: -0.3 },
  { id: 'apps', label: 'Mobile Apps only', factor: 0.15, atcShift: 3.1 },
] as const
type DeviceId = (typeof DEVICES)[number]['id']

const FORMATS = [
  { id: 'both', label: 'Both' },
  { id: 'volume', label: 'Volume' },
  { id: 'percentage', label: 'Percentage' },
] as const
type ValuesFormat = (typeof FORMATS)[number]['id']

interface PctLine {
  pct: string
  of?: string
  cls?: string
  tip?: string
}
/** One KPI cell — slim layout: overline label, big value, prominent percentages.
    Renders volume, percentages, or both, per the Values format option. */
function KpiCell({ value, label, pcts, format, tone = 'neutral', w = 'w-[118px]' }: {
  value: string
  label: string
  pcts: PctLine[]
  format: ValuesFormat
  tone?: 'neutral' | 'cyan' | 'muted'
  w?: string
}) {
  const showVolume = format !== 'percentage'
  const main = showVolume ? value : pcts[0]?.pct
  const mainSuffix = !showVolume ? pcts[0]?.of : undefined
  const lines = format === 'volume' ? [] : showVolume ? pcts : pcts.slice(1)
  return (
    <div className={`${w} shrink-0 text-right`}>
      <div className={`whitespace-nowrap text-[9px] font-bold uppercase tracking-wide ${tone === 'cyan' ? 'text-cyan-700' : 'text-stone-400'}`}>{label}</div>
      <div className={`text-[19px] leading-tight font-bold tabular-nums ${tone === 'cyan' ? 'text-cyan-800' : tone === 'muted' ? 'text-stone-500' : 'text-stone-900'}`}>{main}</div>
      {mainSuffix && <div className="-mt-0.5 text-[9.5px] text-stone-400">{mainSuffix}</div>}
      {lines.map((pl, i) => (
        <div key={i} title={pl.tip} className={`leading-tight tabular-nums ${pl.cls ?? 'text-stone-600'}`}>
          <span className="text-[12px] font-semibold">{pl.pct}</span>
          {pl.of && <span className="ml-1 text-[9.5px] font-normal opacity-75">{pl.of}</span>}
        </div>
      ))}
    </div>
  )
}

function AddBlockModal({ onClose }: { onClose: () => void }) {
  const [created, setCreated] = useState(false)
  const [name, setName] = useState('')
  if (created) {
    return (
      <Modal title="Block created" subtitle={`“${name || 'New Merch Block'}” was created as a draft placement (mock only — nothing is persisted in this prototype).`} onClose={onClose}>
        <div className="flex justify-end"><Button variant="primary" onClick={onClose}>Done</Button></div>
      </Modal>
    )
  }
  return (
    <Modal title="Add new block" subtitle="Declares a new merchandising placement. It will appear as a new column in the Merchandising Mix matrix, with its own independent release line." onClose={onClose}>
      <Field label="Block name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blog Article Merch Block" /></Field>
      <Field label="Page">
        <select className={inputCls}>
          <option>Homepage</option><option>Category</option><option>Catalog</option><option>Search</option>
          <option>Product</option><option>Cart</option><option>Account</option><option>Checkout</option><option>Other</option>
        </select>
      </Field>
      <Field label="Placement description"><textarea className={inputCls} rows={2} placeholder="Where does it sit in the page?" /></Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => setCreated(true)}>Create block</Button>
      </div>
    </Modal>
  )
}

/** Mock of the future AI-generated summary of what each user group sees at this placement. */
function aiPlacementSummary(b: Block): string {
  const h = hashStr(b.id)
  const lead = ['Recently viewed', 'Best sellers', 'Trending right now'][h % 3]
  const mixA = ['Top-rated products', 'New in', 'On promotion'][(h >> 2) % 3]
  const mixB = ['New in stock', 'Back in stock', 'Award-winning products'][(h >> 4) % 3]
  const dedicatedActive = ['their Wishlist & favorites picks', 'their personalized affinity selection'][(h >> 6) % 2]
  const dedicatedVip = ['Goes with what you recently purchased', 'Buy again — your essentials'][(h >> 7) % 2]
  return `At this placement, Prospects, Returning visitors, Signed in (no purchase) and Lapsed customers generally see content led by ${lead}, blended with ${mixA} and ${mixB} in varying weights. The other groups get dedicated content: Active customers generally see ${dedicatedActive}, while VIP customers get “${dedicatedVip}”.`
}

function BlockCard({ b, period, device, format, userGroup }: { b: Block; period: PeriodId; device: DeviceId; format: ValuesFormat; userGroup: string }) {
  const { releasesOf, labelOf } = useStore()
  const [open, setOpen] = useState(false)
  const dev = DEVICES.find((d) => d.id === device)!
  const raw = kpisFor(b, period)
  const k = {
    ...raw,
    displayed: raw.displayed * dev.factor,
    viewed: raw.viewed * dev.factor,
    clicked: raw.clicked * dev.factor,
    atc: Math.max(1, raw.atc + dev.atcShift),
  }
  const life = kpisLifetime(b)
  const r = ranks()[b.id]
  const pctOf = (n: number, d: number) => (d > 0 ? (100 * n) / d : 0)
  const atcVolume = (k.clicked * k.atc) / 100
  /* split of block clicks: products vs other destinations (category, filtered search, landing, promo…) */
  const clicksProductsShare = 0.72 + (hashStr(b.id + 'cps') % 18) / 100
  const clicksProducts = k.clicked * clicksProductsShare
  const clicksOther = k.clicked - clicksProducts
  /* conversion (add-to-cart → purchase) on the products of this block, vs site average */
  const cvr = 18 + (hashStr(b.id + 'cvr' + period + device) % 160) / 10
  const AVG_CVR = 24.1
  const attributedRevenue = atcVolume * (cvr / 100) * (45 + (hashStr(b.id + 'aov') % 750) / 10)
  /* website baseline — same days, same sum of visitor segments, this block excluded (mock) */
  const sh = hashStr(b.id + 'site' + period + device)
  const site = (() => {
    const pageViews = k.displayed * (10 + (sh % 8))
    const clicked = pageViews * (0.012 + ((sh >> 5) % 130) / 10000)
    const atcRate = 7 + ((sh >> 7) % 70) / 10
    const atcVol = (clicked * atcRate) / 100
    const revenue = atcVol * (AVG_CVR / 100) * (52 + ((sh >> 9) % 400) / 10)
    return { pageViews, clicked, atcRate, atcVol, revenue }
  })()
  const lifts = [
    { label: 'Click rate', v: pctOf(k.clicked, k.viewed) - pctOf(site.clicked, site.pageViews), tip: 'Block: clicks per actual view of the block · Website: product clicks per page view' },
    { label: 'ATC rate:', v: k.atc - site.atcRate },
    { label: 'CVR', v: cvr - AVG_CVR },
  ]
  /* cumulated business results since launch */
  const lifeAtcVol = (life.clicked * life.atc) / 100
  const lifeProductsSold = lifeAtcVol * (cvr / 100)
  const lifeRevenueAttributed = lifeProductsSold * (45 + (hashStr(b.id + 'aov') % 750) / 10)
  const history = rolloutHistory(releasesOf(b.id))
  const allLiveLines = liveAudienceLines(releasesOf(b.id))
  const liveLines = userGroup === 'all'
    ? allLiveLines
    : allLiveLines.filter((l) => l.groups === 'All visitors' || l.groups.includes(userGroup))

  return (
    <div className="soft-card mb-2 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="group flex w-full flex-wrap items-start gap-4 px-5 py-2.5 text-left hover:bg-stone-50">
        <span className={`mt-0.5 text-xs text-stone-400 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        <span className="min-w-0 max-w-[240px]">
          <span className="block truncate text-[13.5px] font-bold leading-tight text-stone-900" title={labelOf(b.id)}>{labelOf(b.id)}</span>
          <span className="mt-0.5 flex items-center gap-1.5">
            <span className="font-mono text-[9.5px] font-bold tracking-wider text-cyan-700">{b.code}</span>
            <span className="text-[9.5px] text-stone-400">{b.group}</span>
          </span>
          {liveLines.map((l) => (
            <span key={l.r.id} className="mt-0.5 flex items-center gap-1.5">
              <Link to={`/versions/${l.r.id}`} onClick={(e) => e.stopPropagation()} className="shrink-0 rounded-full bg-cyan-50 px-1.5 py-px font-mono text-[9px] font-semibold text-cyan-800 hover:bg-cyan-100">live {l.r.num}</Link>
              <span className="truncate text-[9.5px] text-stone-400" title={`seen by ${l.groups}`}>{l.groups}</span>
            </span>
          ))}
          {liveLines.length === 0 && <span className="mt-0.5 block text-[9.5px] text-stone-300">nothing live for this group</span>}
        </span>
        <span className="ml-auto flex items-start gap-5">
          <span className="flex items-start gap-5">
            <KpiCell format={format} label="Block Display" value={fmt(k.displayed)}
              pcts={[{ pct: '100%', tip: 'Reference base — every other percentage is relative to displayed' }]} />
            <KpiCell format={format} label="Block Views" value={fmt(k.viewed)}
              pcts={[{ pct: `${pctOf(k.viewed, k.displayed).toFixed(1)}%`, of: 'of displayed' }]} />
            <KpiCell format={format} label="Block Clicks" value={fmt(k.clicked)}
              pcts={[
                { pct: `${pctOf(k.clicked, k.displayed).toFixed(1)}%`, of: 'of displayed' },
                { pct: `${pctOf(k.clicked, k.viewed).toFixed(1)}%`, of: 'of viewed', cls: 'text-cyan-700' },
              ]} />
            <span className="flex w-[110px] shrink-0 flex-col gap-1.5 text-right">
              <span>
                <span className="block whitespace-nowrap text-[8.5px] font-bold uppercase tracking-wide text-stone-400">Clicks on products</span>
                <span className="block text-[13px] leading-tight font-bold tabular-nums text-stone-700">{fmt(clicksProducts)} <span className="text-[9.5px] font-normal text-stone-400">· {pctOf(clicksProducts, k.clicked).toFixed(0)}% of clicks</span></span>
              </span>
              <span>
                <span className="block whitespace-nowrap text-[8.5px] font-bold uppercase tracking-wide text-stone-400">Clicks on other<InfoTip text="Clicks toward a category name, a filtered search result page, a landing page, a promotion page, etc." /></span>
                <span className="block text-[13px] leading-tight font-bold tabular-nums text-stone-700">{fmt(clicksOther)} <span className="text-[9.5px] font-normal text-stone-400">· {pctOf(clicksOther, k.clicked).toFixed(0)}% of clicks</span></span>
              </span>
            </span>
          </span>
          <span className="w-px self-stretch bg-stone-200" />
          <span className="flex items-start gap-4">
            <KpiCell format={format} tone="cyan" w="w-[140px]" label="Add to cart attributed" value={fmt(atcVolume)}
              pcts={[
                { pct: `${pctOf(atcVolume, k.displayed).toFixed(1)}%`, of: 'of displayed', tip: 'Share of displayed impressions where a product click led to an add-to-cart of that product in the same session (rolling 48h window counted as one session for identified users)' },
                { pct: `${k.atc.toFixed(1)}%`, of: 'of clicked', cls: 'font-bold text-cyan-800', tip: 'Share of clicked products subsequently added to cart in the same session — the historical Add-to-cart attributed rate' },
              ]} />
            <span className="w-[124px] shrink-0 text-right">
              <span className="block whitespace-nowrap text-[8.5px] font-bold uppercase tracking-wide text-stone-400" title="Conversion rate (add to cart → purchase) on the products added to cart from this block">CVR on those products</span>
              <span className={`block text-[14px] leading-tight font-bold tabular-nums ${cvr >= AVG_CVR ? 'text-cyan-800' : 'text-amber-600'}`}>{cvr.toFixed(1)}%</span>
              <span className="block text-[9.5px] leading-tight text-stone-400">vs {AVG_CVR}% avg · ATC → purchase</span>
            </span>
            <span className="w-[104px] shrink-0 text-right">
              <span className="block whitespace-nowrap text-[8.5px] font-bold uppercase tracking-wide text-stone-400" title="Revenue from purchases attributed to this block">Attributed revenue</span>
              <span className="block text-[14px] leading-tight font-bold tabular-nums text-cyan-800">${fmt(attributedRevenue)}</span>
            </span>
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-stone-200">
          {/* website mirror — SAME row geometry as the collapsed header (px-5, chevron spacer,
              identical cell widths & gaps, ghost cells under columns without a site equivalent) */}
          <div className="flex w-full flex-wrap items-start gap-4 bg-stone-50/50 px-5 py-2.5">
            <span className="w-[12px]" aria-hidden="true" />
            <span className="min-w-0 max-w-[240px]">
              <span className="block text-[13.5px] font-bold leading-tight text-stone-500">Website KPIs</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-stone-500">same days · same sum of visitor segments · this Merch Block excluded</span>
            </span>
            <span className="ml-auto flex items-start gap-5">
              <span className="flex items-start gap-5">
                <span className="w-[118px] shrink-0" aria-hidden="true" />
                <KpiCell format={format} tone="muted" label="All Page views" value={fmt(site.pageViews)}
                  pcts={[{ pct: '100%', tip: 'A loaded page is a viewed page at site level — no displayed/viewed distinction here' }]} />
                <KpiCell format={format} tone="muted" label="Product page views" value={fmt(site.clicked)}
                  pcts={[{ pct: `${pctOf(site.clicked, site.pageViews).toFixed(1)}%`, of: 'of page views' }]} />
                <span className="w-[110px] shrink-0" aria-hidden="true" />
              </span>
              <span className="w-px self-stretch bg-stone-200" />
              <span className="flex items-start gap-4">
                <KpiCell format={format} tone="muted" w="w-[140px]" label="Total add to cart rate" value={fmt(site.atcVol)}
                  pcts={[
                    { pct: `${pctOf(site.atcVol, site.pageViews).toFixed(1)}%`, of: 'of page views' },
                    { pct: `${site.atcRate.toFixed(1)}%`, of: 'of clicked', cls: 'font-semibold text-stone-500' },
                  ]} />
                <span className="w-[124px] shrink-0 text-right">
                  <span className="block whitespace-nowrap text-[8.5px] font-bold uppercase tracking-wide text-stone-400">Total conversion rate</span>
                  <span className="block text-[14px] leading-tight font-bold tabular-nums text-stone-500">{AVG_CVR}%</span>
                  <span className="block text-[9.5px] leading-tight text-stone-400">site average · ATC → purchase</span>
                </span>
                <span className="w-[104px] shrink-0 text-right">
                  <span className="block whitespace-nowrap text-[8.5px] font-bold uppercase tracking-wide text-stone-400">Total revenue</span>
                  <span className="block text-[14px] leading-tight font-bold tabular-nums text-stone-500">${fmt(site.revenue)}</span>
                </span>
              </span>
            </span>
          </div>
          {/* lift — same geometry again, each badge exactly under its column */}
          <div className="flex w-full flex-wrap items-center gap-4 border-b border-stone-100 bg-stone-50/50 px-5 pt-0.5 pb-2">
            <span className="w-[12px]" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Lift vs website</span>
            <span className="ml-auto flex items-start gap-5">
              <span className="flex items-start gap-5">
                <span className="w-[118px] shrink-0" aria-hidden="true" />
                <span className="w-[118px] shrink-0" aria-hidden="true" />
                <span className="w-[118px] shrink-0 text-right">
                  <span title={lifts[0].tip ?? ''} className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums ${lifts[0].v >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {lifts[0].label} {lifts[0].v >= 0 ? '+' : '−'}{Math.abs(lifts[0].v).toFixed(1)} pt
                  </span>
                </span>
                <span className="w-[110px] shrink-0" aria-hidden="true" />
              </span>
              <span className="w-px self-stretch" aria-hidden="true" />
              <span className="flex items-start gap-4">
                <span className="w-[140px] shrink-0 text-right">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums ${lifts[1].v >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {lifts[1].label} {lifts[1].v >= 0 ? '+' : '−'}{Math.abs(lifts[1].v).toFixed(1)} pt
                  </span>
                </span>
                <span className="w-[124px] shrink-0 text-right">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums ${lifts[2].v >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {lifts[2].label} {lifts[2].v >= 0 ? '+' : '−'}{Math.abs(lifts[2].v).toFixed(1)} pt
                  </span>
                </span>
                <span className="w-[104px] shrink-0" aria-hidden="true" />
              </span>
            </span>
          </div>
          <div className="px-6 pt-4 pb-5">
            <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50/40 px-4 py-3">
                <span className="mb-1 flex items-center gap-1.5">
                  <span className="rounded-full bg-cyan-700 px-2 py-px text-[8.5px] font-bold uppercase tracking-widest text-white">AI summary</span>
                  <span className="text-[10px] text-stone-400">sample — will be generated by AI</span>
                </span>
                <p className="text-[13px] leading-relaxed text-stone-600">{aiPlacementSummary(b)}</p>
              </div>
              <div className="mt-3 rounded-xl border border-stone-200 p-3.5">
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">Release history of this block</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-stone-400">
                      <th className="py-1.5 pr-4 font-semibold">Block Version</th>
                      <th className="py-1.5 pr-4 font-semibold">Release note</th>
                      <th className="py-1.5 pr-4 font-semibold">Audience</th>
                      <th className="py-1.5 pr-4 font-semibold">Start</th>
                      <th className="py-1.5 pr-4 font-semibold">End</th>
                      <th className="py-1.5 pr-4 font-semibold">Rollout</th>
                      <th className="py-1.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="py-2 pr-4"><Link to={`/versions/${h.releaseId}`} className="font-mono text-[12px] font-bold text-cyan-700 hover:underline">{h.releaseId}</Link></td>
                        <td className="py-2 pr-4 text-stone-600">{h.releaseName}</td>
                        <td className="py-2 pr-4 text-stone-600" title={`Final user groups this release was published to (the “Audience” chosen at publish time)`}>{h.audience}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{h.start}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{h.end}</td>
                        <td className="py-2 pr-4 whitespace-nowrap tabular-nums">{h.rollout}</td>
                        <td className="py-2">
                          <Badge tone={h.status === 'Full rollout' ? 'live' : h.status === 'Experiment rollout' ? 'amber' : 'prev'}>{h.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] text-stone-400">
                  Weights are edited and published from the <Link to="/merchandising-mix" className="text-cyan-700 underline underline-offset-2">Merchandising Mix</Link> matrix — this page is monitoring only. Full list in the <Link to="/versions" className="text-cyan-700 underline underline-offset-2">Release History</Link>.
                </p>
              </div>
              </div>
            <div className="mt-4 grid items-start gap-3 lg:grid-cols-[320px_1fr]">
              <div className="rounded-xl border border-stone-200 p-3.5">
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">Placement</h4>
                <Wireframe kind={b.wire.kind} hl={b.wire.hl} fold={b.wire.fold} />
                <p className="mt-2 text-[13px] text-stone-600">{b.placement}</p>
                <div className="mt-1"><ExternalLink href={`https://www.store.example/${b.id}`}>Open page</ExternalLink></div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-stone-200 p-3.5">
              <h4 className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">Lifetime performance</h4>
              <p className="mb-2 text-[12px] text-stone-400">Cumulative performance since this Merch Block was first launched. These values do not change with the date selector.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-stone-400">
                      <th className="py-1.5 pr-4 font-semibold">Displayed</th>
                      <th className="py-1.5 pr-4 font-semibold">Viewed</th>
                      <th className="py-1.5 pr-4 font-semibold">Clicked</th>
                      <th className="py-1.5 font-semibold">Add to cart attributed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top tabular-nums">
                      <td className="py-2 pr-4">
                        <span className="block text-[15px] font-bold text-stone-900">{fmt(life.displayed)}</span>
                        <span className="block text-stone-600"><span className="text-[12.5px] font-semibold">100%</span></span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="block text-[15px] font-bold text-stone-900">{fmt(life.viewed)}</span>
                        <span className="block text-stone-600"><span className="text-[12.5px] font-semibold">{pctOf(life.viewed, life.displayed).toFixed(1)}%</span><span className="ml-1 text-[10px] opacity-75">of displayed</span></span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="block text-[15px] font-bold text-stone-900">{fmt(life.clicked)}</span>
                        <span className="block text-stone-600"><span className="text-[12.5px] font-semibold">{pctOf(life.clicked, life.displayed).toFixed(1)}%</span><span className="ml-1 text-[10px] opacity-75">of displayed</span></span>
                        <span className="block text-cyan-700"><span className="text-[12.5px] font-semibold">{pctOf(life.clicked, life.viewed).toFixed(1)}%</span><span className="ml-1 text-[10px] opacity-75">of viewed</span></span>
                      </td>
                      <td className="py-2">
                        <span className="block text-[15px] font-bold text-cyan-800">{fmt((life.clicked * life.atc) / 100)}</span>
                        <span className="block text-stone-600"><span className="text-[12.5px] font-semibold">{pctOf((life.clicked * life.atc) / 100, life.displayed).toFixed(1)}%</span><span className="ml-1 text-[10px] opacity-75">of displayed</span></span>
                        <span className="block text-cyan-700"><span className="text-[12.5px] font-semibold">{pctOf((life.clicked * life.atc) / 100, life.viewed).toFixed(1)}%</span><span className="ml-1 text-[10px] opacity-75">of viewed</span></span>
                        <span className="block font-bold text-cyan-800"><span className="text-[12.5px]">{life.atc.toFixed(1)}%</span><span className="ml-1 text-[10px] font-normal opacity-75">of clicked</span></span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <div className="min-w-[150px] rounded-xl border border-stone-200 bg-white px-4 py-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-wide text-stone-400">Engagement rank</div>
                  <div className="text-[17px] font-bold tabular-nums text-stone-900">#{r.engagement} <span className="text-[11px] font-normal text-stone-400">of {BLOCKS.length}</span></div>
                  <div className="text-[9.5px] text-stone-400">clicked / viewed</div>
                </div>
                <div className="min-w-[150px] rounded-xl border border-stone-200 bg-white px-4 py-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-wide text-stone-400">Add-to-cart rank</div>
                  <div className="text-[17px] font-bold tabular-nums text-stone-900">#{r.atc} <span className="text-[11px] font-normal text-stone-400">of {BLOCKS.length}</span></div>
                  <div className="text-[9.5px] text-stone-400">add to cart attributed</div>
                </div>
                <div className="min-w-[170px] rounded-xl border border-stone-200 bg-white px-4 py-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-wide text-stone-400">Cumulated products sold attributed</div>
                  <div className="text-[17px] font-bold tabular-nums text-cyan-800">{fmt(lifeProductsSold)}</div>
                  <div className="text-[9.5px] text-stone-400">since launch · ATC → purchase</div>
                </div>
                <div className="min-w-[150px] rounded-xl border border-stone-200 bg-white px-4 py-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-wide text-stone-400">Cumulated revenue attributed</div>
                  <div className="text-[17px] font-bold tabular-nums text-cyan-800">${fmt(lifeRevenueAttributed)}</div>
                  <div className="text-[9.5px] text-stone-400">since launch</div>
                </div>
              </div>
              </div>
                <div className="grid items-start gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 p-3.5">
              <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-stone-500">Production information</h4>
              <dl className="text-[13px]">
                <div className="flex justify-between border-b border-dashed border-stone-200 py-1"><dt className="text-stone-500">Live since</dt><dd className="font-medium">{b.liveSince}</dd></div>
                <div className="flex justify-between border-b border-dashed border-stone-200 py-1"><dt className="text-stone-500">Product Manager</dt><dd className="font-medium">{b.pm}</dd></div>
                <div className="flex justify-between border-b border-dashed border-stone-200 py-1"><dt className="text-stone-500">Technical Lead</dt><dd className="font-medium">{b.tech}</dd></div>
                <div className="flex justify-between py-1"><dt className="text-stone-500">Business Owner</dt><dd className="font-medium">{b.owner}</dd></div>
              </dl>
              </div>
                  <div className="rounded-xl border border-stone-200 p-3.5">
                <h4 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">Useful links</h4>
                <ul className="space-y-2 text-[13px]">
                  <li>
                    <span className="text-stone-700">Adobe Analytics dashboard</span>{' — '}<ExternalLink href={`https://analytics.adobe.com/#/workspace/merch-${b.id}`}>Open dashboard</ExternalLink>
                  </li>
                  <li>
                    <span className="text-stone-700">Documentation</span>{' — '}<ExternalLink href={`https://confluence.example.com/display/MERCH/${b.code}`}>Open in Confluence</ExternalLink>
                  </li>
                  <li>
                    <span className="text-stone-700">Impact analyses of this placement</span>{' — '}<Link to={`/impact?placement=${b.code}`} title="All impact analyses of the merch mixes released on this placement — the placement filter on the Impact page is coming next" className="text-[12.5px] font-medium text-cyan-700 underline decoration-cyan-300 underline-offset-2 hover:decoration-cyan-600">Open the Impact page</Link>
                  </li>
                </ul>
              </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function BlocksPage() {
  const { categoryLabels } = useStore()
  const [period, setPeriod] = useState<PeriodId>('30d')
  const [device, setDevice] = useState<DeviceId>('all')
  const [format, setFormat] = useState<ValuesFormat>('both')
  const [category, setCategory] = useState('all')
  const [userGroup, setUserGroup] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showDefs, setShowDefs] = useState(false)
  return (
    <div className="px-8 py-8">
      <h1 className="text-[26px] font-bold tracking-tight text-stone-900">Merch Blocks</h1>
      <p className="mt-1 text-sm text-stone-500">
        Here are the Merchandising placements and their merchandising blocks. Here are the Engagement performances, and the Business performances.{' '}
        <button
          type="button"
          onClick={() => setShowDefs(!showDefs)}
          className="text-cyan-700 underline decoration-cyan-300 underline-offset-2 hover:decoration-cyan-600"
        >
          detail
        </button>
      </p>
      {showDefs && (
        <div className="soft-card mt-3 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">KPI definitions</p>
          <dl className="mt-2 space-y-2.5 text-[13px] leading-relaxed">
            <div>
              <dt className="font-semibold text-stone-800">Displayed</dt>
              <dd className="text-stone-500">Number of times a page was loaded with this Merch Block and its content available.</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-800">Viewed</dt>
              <dd className="text-stone-500">Number of times the Merch Block was actually visible to the visitor. For blocks above the fold, a valid page view can count as a view; for blocks below the fold, viewport/visibility tracking comparable to analytics or heatmap tools is used. Mobile and desktop values are kept separate.</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-800">Clicked</dt>
              <dd className="text-stone-500">Number of clicks on the products contained in the Merch Block.</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-800">Add to cart attributed</dt>
              <dd className="text-stone-500">Take a customer who, within one <SessionWord />, clicks one or more products in this specific Merch Block: this is the proportion of those clicked products that are subsequently added to the cart during the same <SessionWord />.</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="soft-card mt-5 mb-5 flex flex-wrap items-center gap-x-7 gap-y-3 px-5 py-3 text-sm">
        <span className="flex items-center gap-2 whitespace-nowrap">
          <label htmlFor="period" className="whitespace-nowrap text-stone-500">KPIs for the</label>
          <select id="period" value={period} onChange={(e) => setPeriod(e.target.value as PeriodId)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-cyan-600 focus:outline-none">
            {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <label htmlFor="device" className="whitespace-nowrap text-stone-500">on</label>
          <select id="device" value={device} onChange={(e) => setDevice(e.target.value as DeviceId)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-cyan-600 focus:outline-none">
            {DEVICES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <label htmlFor="format" className="whitespace-nowrap text-stone-500">Values format</label>
          <select id="format" value={format} onChange={(e) => setFormat(e.target.value as ValuesFormat)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-cyan-600 focus:outline-none">
            {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <label htmlFor="category" className="whitespace-nowrap text-stone-500">Placement category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-cyan-600 focus:outline-none">
            <option value="all">All categories</option>
            {PLACEMENT_CATEGORIES.map((c) => <option key={c.id} value={c.group}>{categoryLabels[c.id] ?? c.group}</option>)}
          </select>
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <label htmlFor="usergroup" className="whitespace-nowrap text-stone-500">User group</label>
          <select id="usergroup" value={userGroup} onChange={(e) => setUserGroup(e.target.value)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-cyan-600 focus:outline-none">
            <option value="all">All groups</option>
            {FINAL_USER_GROUPS.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
          </select>
        </span>
      </div>

      {BLOCKS.filter((b) => category === 'all' || b.group === category).map((b) => (
        <BlockCard key={b.id} b={b} period={period} device={device} format={format} userGroup={userGroup} />
      ))}

      <div className="mt-6 text-center">
        <Button variant="primary" onClick={() => setShowAdd(true)}>Add new block</Button>
      </div>

      {showAdd && <AddBlockModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
