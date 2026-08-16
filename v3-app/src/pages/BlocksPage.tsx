import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BLOCKS, FINAL_USER_GROUPS, fmt, hashStr, kpisFor, kpisLifetime, liveAudienceLines, PERIODS, PLACEMENT_CATEGORIES, ranks, rolloutHistory, type Block, type PeriodId } from '../data'
import { useStore } from '../store'
import { Badge, Button, ExternalLink, Field, inputCls, Modal, SessionWord } from '../components/ui'
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
/** One KPI cell — renders volume, percentages, or both, per the Values format option.
    Percentages are displayed prominently: bold value + light reference suffix. */
function KpiCell({ value, label, pcts, format, tone = 'neutral' }: {
  value: string
  label: string
  pcts: PctLine[]
  format: ValuesFormat
  tone?: 'neutral' | 'cyan'
}) {
  const showVolume = format !== 'percentage'
  const main = showVolume ? value : pcts[0]?.pct
  const mainSuffix = !showVolume ? pcts[0]?.of : undefined
  const lines = format === 'volume' ? [] : showVolume ? pcts : pcts.slice(1)
  return (
    <div className="min-w-[104px] text-right">
      <div className={`text-[15px] font-bold tabular-nums ${tone === 'cyan' ? 'text-cyan-800' : 'text-stone-900'}`}>{main}</div>
      {mainSuffix && <div className="-mt-0.5 text-[9.5px] text-stone-400">{mainSuffix}</div>}
      <div className={`text-[11px] ${tone === 'cyan' ? 'text-cyan-700' : 'text-stone-500'}`}>{label}</div>
      {lines.map((pl, i) => (
        <div key={i} title={pl.tip} className={`leading-snug tabular-nums ${pl.cls ?? 'text-stone-600'}`}>
          <span className="text-[12.5px] font-semibold">{pl.pct}</span>
          {pl.of && <span className="ml-1 text-[10px] font-normal opacity-75">{pl.of}</span>}
        </div>
      ))}
    </div>
  )
}

/** Thin framed group of KPIs — the label sits on the border, fieldset-style. */
function KpiFrame({ label, tone = 'neutral', children }: { label: string; tone?: 'neutral' | 'cyan'; children: React.ReactNode }) {
  return (
    <span className={`relative flex items-end gap-4 rounded-xl border px-3.5 pt-3 pb-2 ${tone === 'cyan' ? 'border-cyan-200' : 'border-stone-200'}`}>
      <span className={`absolute -top-[7px] left-2.5 bg-white px-1.5 text-[8.5px] font-bold uppercase tracking-widest transition-colors group-hover:bg-stone-50 ${tone === 'cyan' ? 'text-cyan-700' : 'text-stone-400'}`}>
        {label}
      </span>
      {children}
    </span>
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
  const history = rolloutHistory(releasesOf(b.id))
  const allLiveLines = liveAudienceLines(releasesOf(b.id))
  const liveLines = userGroup === 'all'
    ? allLiveLines
    : allLiveLines.filter((l) => l.groups === 'All visitors' || l.groups.includes(userGroup))

  return (
    <div className="soft-card mb-3.5 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="group flex w-full flex-wrap items-center gap-3 px-5 py-3.5 text-left hover:bg-stone-50">
        <span className={`text-xs text-stone-400 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        <span className="min-w-0">
          <span className="block text-[14px] font-bold text-stone-900">{labelOf(b.id)}</span>
          <span className="mt-0.5 block font-mono text-[10px] font-bold tracking-wider text-cyan-700">{b.code}</span>
          {liveLines.map((l) => (
            <span key={l.r.id} className="mt-1 flex items-center gap-1.5">
              <Link to={`/versions/${l.r.id}`} onClick={(e) => e.stopPropagation()} className="shrink-0 rounded-full bg-cyan-50 px-2 py-px font-mono text-[10px] font-semibold text-cyan-800 hover:bg-cyan-100">live {l.r.num}</Link>
              <span className="max-w-[300px] truncate text-[10.5px] text-stone-400" title={`seen by ${l.groups}`}>{l.groups}</span>
            </span>
          ))}
          {liveLines.length === 0 && <span className="mt-1 block text-[10.5px] text-stone-300">nothing live for this group</span>}
        </span>
        <Badge>{b.group}</Badge>
        <span className="ml-auto flex flex-wrap items-stretch gap-3">
          <KpiFrame label="Engagement">
            <KpiCell format={format} label="Displayed" value={fmt(k.displayed)}
              pcts={[{ pct: '100%', tip: 'Reference base — every other percentage is relative to displayed' }]} />
            <KpiCell format={format} label="Viewed" value={fmt(k.viewed)}
              pcts={[{ pct: `${pctOf(k.viewed, k.displayed).toFixed(1)}%`, of: 'of displayed' }]} />
            <KpiCell format={format} label="Clicked" value={fmt(k.clicked)}
              pcts={[
                { pct: `${pctOf(k.clicked, k.displayed).toFixed(1)}%`, of: 'of displayed' },
                { pct: `${pctOf(k.clicked, k.viewed).toFixed(1)}%`, of: 'of viewed', cls: 'text-cyan-700' },
              ]} />
          </KpiFrame>
          <KpiFrame label="Performance" tone="cyan">
            <KpiCell format={format} tone="cyan" label="Add to cart attributed" value={fmt(atcVolume)}
              pcts={[
                { pct: `${pctOf(atcVolume, k.displayed).toFixed(1)}%`, of: 'of displayed', tip: 'Share of displayed impressions where a product click led to an add-to-cart of that product in the same session (rolling 48h window counted as one session for identified users)' },
                { pct: `${pctOf(atcVolume, k.viewed).toFixed(1)}%`, of: 'of viewed', cls: 'text-cyan-700', tip: 'Share of actual views of the block that led to an attributed add-to-cart' },
                { pct: `${k.atc.toFixed(1)}%`, of: 'of clicked', cls: 'font-bold text-cyan-800', tip: 'Share of clicked products subsequently added to cart in the same session — the historical Add-to-cart attributed rate' },
              ]} />
          </KpiFrame>
        </span>
      </button>

      {open && (
        <div className="border-t border-stone-200 px-6 py-5">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <div>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">Placement</h4>
              <Wireframe kind={b.wire.kind} hl={b.wire.hl} fold={b.wire.fold} />
              <p className="mt-2 text-[13px] text-stone-600">{b.placement}</p>
              <div className="mt-1"><ExternalLink href={`https://www.store.example/${b.id}`}>Open page</ExternalLink></div>

              <h4 className="mt-5 mb-1 text-[11px] font-bold uppercase tracking-wide text-stone-500">Analytics integration</h4>
              <p className="text-[13px] text-stone-700">Adobe Analytics dashboard</p>
              <ExternalLink href={`https://analytics.adobe.com/#/workspace/merch-${b.id}`}>Open dashboard</ExternalLink>

              <h4 className="mt-5 mb-1 text-[11px] font-bold uppercase tracking-wide text-stone-500">Production information</h4>
              <dl className="text-[13px]">
                <div className="flex justify-between border-b border-dashed border-stone-200 py-1"><dt className="text-stone-500">Live since</dt><dd className="font-medium">{b.liveSince}</dd></div>
                <div className="flex justify-between border-b border-dashed border-stone-200 py-1"><dt className="text-stone-500">Product Manager</dt><dd className="font-medium">{b.pm}</dd></div>
                <div className="flex justify-between border-b border-dashed border-stone-200 py-1"><dt className="text-stone-500">Technical Lead</dt><dd className="font-medium">{b.tech}</dd></div>
                <div className="flex justify-between py-1"><dt className="text-stone-500">Business Owner</dt><dd className="font-medium">{b.owner}</dd></div>
              </dl>
            </div>

            <div>
              <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50/40 px-4 py-3">
                <span className="mb-1 flex items-center gap-1.5">
                  <span className="rounded-full bg-cyan-700 px-2 py-px text-[8.5px] font-bold uppercase tracking-widest text-white">AI summary</span>
                  <span className="text-[10px] text-stone-400">sample — will be generated by AI</span>
                </span>
                <p className="text-[13px] leading-relaxed text-stone-600">{aiPlacementSummary(b)}</p>
              </div>
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

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-cyan-950 px-4 py-2.5 text-white">
                  <div className="text-[15px] font-bold">#{r.engagement} <span className="text-[12px] font-normal text-cyan-200/60">of {BLOCKS.length} Merch Blocks</span></div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-400">Engagement Rank — Clicked / Viewed</div>
                </div>
                <div className="rounded-2xl bg-cyan-950 px-4 py-2.5 text-white">
                  <div className="text-[15px] font-bold">#{r.atc} <span className="text-[12px] font-normal text-cyan-200/60">of {BLOCKS.length} Merch Blocks</span></div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-400">Add-to-cart Performance Rank</div>
                </div>
              </div>

              <h4 className="mt-6 mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">Release history of this block</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-stone-400">
                      <th className="py-1.5 pr-4 font-semibold">Release</th>
                      <th className="py-1.5 pr-4 font-semibold">Name</th>
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
        Manage merchandising placements and monitor their performance across the commerce experience.{' '}
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

      <div className="soft-card mt-5 mb-5 flex items-center gap-3 px-5 py-3 text-sm">
        <label htmlFor="period" className="text-stone-500">KPIs for the</label>
        <select id="period" value={period} onChange={(e) => setPeriod(e.target.value as PeriodId)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-cyan-600 focus:outline-none">
          {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <label htmlFor="device" className="text-stone-500">on</label>
        <select id="device" value={device} onChange={(e) => setDevice(e.target.value as DeviceId)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-cyan-600 focus:outline-none">
          {DEVICES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        <label htmlFor="format" className="text-stone-500">· Values format</label>
        <select id="format" value={format} onChange={(e) => setFormat(e.target.value as ValuesFormat)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-cyan-600 focus:outline-none">
          {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <label htmlFor="category" className="text-stone-500">· Placement category</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-cyan-600 focus:outline-none">
          <option value="all">All categories</option>
          {PLACEMENT_CATEGORIES.map((c) => <option key={c.id} value={c.group}>{categoryLabels[c.id] ?? c.group}</option>)}
        </select>
        <label htmlFor="usergroup" className="text-stone-500">· User group</label>
        <select id="usergroup" value={userGroup} onChange={(e) => setUserGroup(e.target.value)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-cyan-600 focus:outline-none">
          <option value="all">All groups</option>
          {FINAL_USER_GROUPS.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
        </select>
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
