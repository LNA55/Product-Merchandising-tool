import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BLOCKS, fmt, kpisFor, kpisLifetime, mixHistory, PERIODS, ranks, type Block, type PeriodId } from '../data'
import { Badge, Button, ExternalLink, Field, InfoTip, inputCls, Modal, SessionWord } from '../components/ui'
import { Wireframe } from '../components/Wireframe'

const DEFS = {
  displayed: 'Number of times a page was loaded with this Merch Block and its content available.',
  viewed: 'Number of times the Merch Block was actually visible to the visitor. For blocks above the fold, a valid page view can count as a view. For blocks below the fold, viewport/visibility tracking comparable to analytics or heatmap tools is used. Mobile and Desktop values are kept separate.',
  clicked: 'Number of clicks on products contained in the Merch Block.',
  atc: 'Take a customer within one session who clicks one or more products in this specific Merch Block. This is the proportion of those clicked products that are subsequently added to the cart during the same session.',
}

function Kpi({ label, value, tip, sub }: { label: string; value: string; tip?: string; sub?: React.ReactNode }) {
  return (
    <div className="min-w-[92px] rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-right">
      <div className="text-[14px] font-semibold tabular-nums text-neutral-900">{value}</div>
      <div className="text-[11px] text-neutral-500">{label}{tip && <InfoTip text={tip} />}</div>
      {sub && <div className="text-[10px] tabular-nums text-neutral-400">{sub}</div>}
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
    <Modal title="Add new block" subtitle="Declares a new merchandising placement. It will appear as a new column in the Merchandising Mix matrix." onClose={onClose}>
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

function BlockCard({ b, period }: { b: Block; period: PeriodId }) {
  const [open, setOpen] = useState(false)
  const k = kpisFor(b, period)
  const life = kpisLifetime(b)
  const r = ranks()[b.id]
  const history = mixHistory(b)

  return (
    <div className="mb-3 rounded-lg border border-neutral-200 bg-white">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50">
        <span className={`text-xs text-neutral-400 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        <span className="text-[14px] font-semibold text-neutral-900">{b.name}</span>
        <Badge>{b.group}</Badge>
        <span className="ml-auto flex flex-wrap items-end gap-2">
          <span className="self-center pr-1 text-[9px] uppercase tracking-widest text-neutral-400">Engagement</span>
          <Kpi label="Displayed" value={fmt(k.displayed)} tip={DEFS.displayed} />
          <Kpi label="Viewed" value={fmt(k.viewed)} tip={DEFS.viewed} sub={<>Desktop {fmt(k.viewedDesktop)} · Mobile {fmt(k.viewedMobile)}</>} />
          <Kpi label="Clicked" value={fmt(k.clicked)} tip={DEFS.clicked} />
          <span className="self-center pl-2 pr-1 text-[9px] uppercase tracking-widest text-neutral-400">Performance</span>
          <div className="min-w-[92px] rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-right">
            <div className="text-[14px] font-semibold tabular-nums text-teal-800">{k.atc.toFixed(1)}%</div>
            <div className="text-[11px] text-teal-700">Add to cart attributed<InfoTip text={DEFS.atc} /></div>
          </div>
        </span>
      </button>

      {open && (
        <div className="border-t border-neutral-200 px-5 py-5">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <div>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Placement</h4>
              <Wireframe kind={b.wire.kind} hl={b.wire.hl} fold={b.wire.fold} />
              <p className="mt-2 text-[13px] text-neutral-600">{b.placement}</p>
              <div className="mt-1"><ExternalLink href={`https://www.store.example/${b.id}`}>Open page</ExternalLink></div>

              <h4 className="mt-5 mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Analytics integration</h4>
              <p className="text-[13px] text-neutral-700">Adobe Analytics dashboard</p>
              <ExternalLink href={`https://analytics.adobe.com/#/workspace/merch-${b.id}`}>Open dashboard</ExternalLink>

              <h4 className="mt-5 mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Production information</h4>
              <dl className="text-[13px]">
                <div className="flex justify-between border-b border-dashed border-neutral-200 py-1"><dt className="text-neutral-500">Live since</dt><dd className="font-medium">{b.liveSince}</dd></div>
                <div className="flex justify-between border-b border-dashed border-neutral-200 py-1"><dt className="text-neutral-500">Product Manager</dt><dd className="font-medium">{b.pm}</dd></div>
                <div className="flex justify-between border-b border-dashed border-neutral-200 py-1"><dt className="text-neutral-500">Technical Lead</dt><dd className="font-medium">{b.tech}</dd></div>
                <div className="flex justify-between py-1"><dt className="text-neutral-500">Business Owner</dt><dd className="font-medium">{b.owner}</dd></div>
              </dl>
            </div>

            <div>
              <h4 className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Lifetime performance</h4>
              <p className="mb-2 text-[12px] text-neutral-400">Cumulative performance since this Merch Block was first launched. These values do not change with the date selector.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-400">
                      <th className="py-1.5 pr-4 font-medium">Displayed</th>
                      <th className="py-1.5 pr-4 font-medium">Viewed</th>
                      <th className="py-1.5 pr-4 font-medium">Viewed Mobile</th>
                      <th className="py-1.5 pr-4 font-medium">Viewed Desktop</th>
                      <th className="py-1.5 pr-4 font-medium">Clicked</th>
                      <th className="py-1.5 font-medium">Add to cart attributed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="tabular-nums">
                      <td className="py-2 pr-4">{fmt(life.displayed)}</td>
                      <td className="py-2 pr-4">{fmt(life.viewed)}</td>
                      <td className="py-2 pr-4">{fmt(life.viewedMobile)}</td>
                      <td className="py-2 pr-4">{fmt(life.viewedDesktop)}</td>
                      <td className="py-2 pr-4">{fmt(life.clicked)}</td>
                      <td className="py-2 font-semibold text-teal-800">{life.atc.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-md bg-neutral-900 px-4 py-2 text-white">
                  <div className="text-[15px] font-semibold">#{r.engagement} <span className="text-[12px] font-normal text-neutral-400">of {BLOCKS.length} Merch Blocks</span></div>
                  <div className="text-[10px] uppercase tracking-wide text-teal-400">Engagement Rank — Clicked / Viewed</div>
                </div>
                <div className="rounded-md bg-neutral-900 px-4 py-2 text-white">
                  <div className="text-[15px] font-semibold">#{r.atc} <span className="text-[12px] font-normal text-neutral-400">of {BLOCKS.length} Merch Blocks</span></div>
                  <div className="text-[10px] uppercase tracking-wide text-teal-400">Add-to-cart Performance Rank</div>
                </div>
              </div>

              <h4 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Merchandising Mix History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-400">
                      <th className="py-1.5 pr-4 font-medium">Mix version</th>
                      <th className="py-1.5 pr-4 font-medium">Version name</th>
                      <th className="py-1.5 pr-4 font-medium">Start</th>
                      <th className="py-1.5 pr-4 font-medium">End</th>
                      <th className="py-1.5 pr-4 font-medium">Traffic</th>
                      <th className="py-1.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i} className="border-b border-neutral-100">
                        <td className="py-2 pr-4"><Link to={`/versions/${h.versionId}`} className="font-semibold text-teal-700 hover:underline">{h.versionId}</Link></td>
                        <td className="py-2 pr-4 text-neutral-600">{h.versionName}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{h.start}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{h.end}</td>
                        <td className="py-2 pr-4 tabular-nums">{h.traffic}</td>
                        <td className="py-2">
                          <Badge tone={h.status === 'Full rollout' ? 'live' : h.status === 'Experiment rollout' ? 'amber' : 'prev'}>{h.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function BlocksPage() {
  const [period, setPeriod] = useState<PeriodId>('30d')
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Merch Blocks</h1>
      <p className="mt-1 text-sm text-neutral-500">Manage merchandising placements and monitor their performance across the commerce experience.</p>

      <div className="mt-5 mb-5 flex items-center gap-3 rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm">
        <label htmlFor="period" className="text-neutral-500">KPIs for the</label>
        <select id="period" value={period} onChange={(e) => setPeriod(e.target.value as PeriodId)} className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm focus:border-teal-600 focus:outline-none">
          {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <span className="ml-auto text-xs text-neutral-400">
          Add-to-cart attribution is computed within one <SessionWord />.
        </span>
      </div>

      {BLOCKS.map((b) => <BlockCard key={b.id} b={b} period={period} />)}

      <div className="mt-6 text-center">
        <Button variant="primary" onClick={() => setShowAdd(true)}>Add new block</Button>
      </div>

      {showAdd && <AddBlockModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
