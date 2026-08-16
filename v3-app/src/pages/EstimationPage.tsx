import { Link, useParams } from 'react-router-dom'
import { BLOCKS } from '../data'
import { useStore } from '../store'
import { Badge, ExternalLink } from '../components/ui'

function BigKpi({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="soft-card flex-1 basis-44 px-6 py-5 text-center">
      <div className="text-[44px] font-bold leading-none tracking-tight text-cyan-700 tabular-nums">{value}</div>
      <div className="mt-2 text-[13px] font-semibold text-stone-700">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-stone-400">{sub}</div>}
    </div>
  )
}

const SEGMENTS = [
  { seg: 'New visitors', share: '31%', ctrNow: '2.1%', ctrProj: '2.4%', atcNow: '11.8%', atcProj: '12.6%', delta: '+0.8 pt' },
  { seg: 'Returning, identified', share: '24%', ctrNow: '3.8%', ctrProj: '4.6%', atcNow: '19.2%', atcProj: '22.1%', delta: '+2.9 pt' },
  { seg: 'Returning, anonymous', share: '18%', ctrNow: '2.9%', ctrProj: '3.2%', atcNow: '15.4%', atcProj: '16.1%', delta: '+0.7 pt' },
  { seg: 'High-intent (cart not empty)', share: '14%', ctrNow: '5.2%', ctrProj: '6.4%', atcNow: '27.6%', atcProj: '31.9%', delta: '+4.3 pt' },
  { seg: 'Mobile — all', share: '58%', ctrNow: '2.6%', ctrProj: '3.0%', atcNow: '14.1%', atcProj: '15.6%', delta: '+1.5 pt' },
  { seg: 'Desktop — all', share: '42%', ctrNow: '3.4%', ctrProj: '3.9%', atcNow: '18.9%', atcProj: '20.8%', delta: '+1.9 pt' },
]

const CONTRIB = [
  { signal: 'Similar to the most recently viewed product', change: 'weight 7 → 9', effect: '+1.4 pt ATC on identified returners' },
  { signal: 'Often purchased with the most recently viewed product', change: 'weight 6 → 8', effect: '+0.9 pt ATC on high-intent sessions' },
  { signal: 'Personalized product affinity', change: 'weight 2 → 4', effect: '+0.6 pt CTR on identified traffic' },
  { signal: 'Best sellers — past 30 days', change: 'weight 5 → 3', effect: '−0.3 pt CTR on new visitors (acceptable trade-off)' },
]

function FullReport() {
  const b = BLOCKS.find((x) => x.id === 'pdp')!
  return (
    <div className="max-w-5xl px-8 py-8">
      <Link to="/merchandising-mix" className="text-xs text-stone-400 underline underline-offset-2 hover:text-cyan-700">← Merchandising Mix</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold tracking-tight text-stone-900">Impact Estimation — {b.name}</h1>
        <Badge tone="live">Completed</Badge>
      </div>
      <p className="mt-1 text-sm text-stone-500">
        Report <span className="font-mono text-[12px] text-cyan-700">EST-PDP-2026-0814-03</span> · generated Aug 14, 2026 · evaluates the current working configuration of <span className="font-mono text-[12px] text-cyan-700">{b.code}</span> against its live release <span className="font-mono text-[12px]">PDP_V2.0</span>.
        Computed by the external Impact Suite (integrated) — <ExternalLink href="https://impact-suite.example.com/report/EST-PDP-2026-0814-03">open in Impact Suite</ExternalLink>
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <BigKpi value="+4.2%" label="Projected engagement" sub="clicks / viewed, all traffic" />
        <BigKpi value="+2.8%" label="Projected add-to-cart attributed" sub="same-session attribution" />
        <BigKpi value="+1.9%" label="Projected revenue per session" sub="PDP-attributed" />
        <BigKpi value="87%" label="Model confidence" sub="60-day traffic replay" />
      </div>

      <h2 className="mt-9 text-[15px] font-bold text-stone-900">Summary</h2>
      <div className="mt-2 max-w-3xl space-y-3 text-[14px] leading-relaxed text-stone-600">
        <p>
          The evaluated configuration strengthens behavioral personalization on the Product Page block: similarity and co-purchase signals computed from the most recently viewed product gain weight, personalized affinity is introduced for identified customers, and the generic best-seller signal loses ground. The estimation replays the last 60 days of traffic (14.2M product-page views, 384K attributed add-to-carts) through the candidate mix and compares the simulated block content with what was actually served.
        </p>
        <p>
          The uplift is concentrated where personal context exists: identified returning customers (+2.9 pt add-to-cart attributed) and sessions with a non-empty cart (+4.3 pt). New visitors see a marginal dilution on click-through (−0.3 pt from the reduced best-seller weight), more than compensated at site level. Mobile benefits slightly less than desktop, because the block sits lower in the mobile viewport and similarity carousels get fewer visible slots.
        </p>
        <p>
          Main risk: the similarity model’s coverage. 8% of product-page views concern items with fewer than 3 similar candidates in catalog; for those, the block falls back on co-purchase and best-seller content, which caps the downside. No cannibalization of the Cart page block is detected in the replay (cross-block substitution below 0.2 pt).
        </p>
      </div>

      <h2 className="mt-8 text-[15px] font-bold text-stone-900">Projected performance by segment</h2>
      <p className="mt-1 text-xs text-stone-400">Traffic replay, last 60 days. CTR = clicked / viewed on this block; ATC = add-to-cart attributed.</p>
      <div className="soft-card mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-b-2 border-cyan-600 text-left text-[11px] uppercase tracking-wide text-stone-400">
              <th className="px-4 py-2 font-semibold">Segment</th>
              <th className="px-4 py-2 text-right font-semibold">Traffic share</th>
              <th className="px-4 py-2 text-right font-semibold">CTR current</th>
              <th className="px-4 py-2 text-right font-semibold">CTR projected</th>
              <th className="px-4 py-2 text-right font-semibold">ATC current</th>
              <th className="px-4 py-2 text-right font-semibold">ATC projected</th>
              <th className="px-4 py-2 text-right font-semibold">ATC delta</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {SEGMENTS.map((s) => (
              <tr key={s.seg} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-2 font-medium text-stone-800">{s.seg}</td>
                <td className="px-4 py-2 text-right text-stone-500">{s.share}</td>
                <td className="px-4 py-2 text-right">{s.ctrNow}</td>
                <td className="px-4 py-2 text-right font-semibold text-cyan-800">{s.ctrProj}</td>
                <td className="px-4 py-2 text-right">{s.atcNow}</td>
                <td className="px-4 py-2 text-right font-semibold text-cyan-800">{s.atcProj}</td>
                <td className="px-4 py-2 text-right font-bold">{s.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-[15px] font-bold text-stone-900">What drives the change</h2>
      <div className="soft-card mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-stone-400">
              <th className="px-4 py-2 font-semibold">Signal</th>
              <th className="px-4 py-2 font-semibold">Weight change</th>
              <th className="px-4 py-2 font-semibold">Estimated effect</th>
            </tr>
          </thead>
          <tbody>
            {CONTRIB.map((c) => (
              <tr key={c.signal} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-2 font-medium text-stone-800">{c.signal}</td>
                <td className="px-4 py-2 font-mono text-[12px] text-cyan-800">{c.change}</td>
                <td className="px-4 py-2 text-stone-600">{c.effect}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-9 rounded-2xl border-2 border-cyan-600 bg-cyan-50 px-6 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-cyan-700 px-4 py-1.5 text-[13px] font-bold uppercase tracking-wide text-white">Favorable</span>
          <span className="text-[15px] font-bold text-stone-900">Recommended to try this configuration.</span>
        </div>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-stone-700">
          Expected impact is positive on every aggregate KPI, with high model confidence and a capped downside on the low-coverage tail. Recommended rollout: <b>10% of traffic for 2 weeks</b>, monitoring add-to-cart attributed on new visitors (guardrail: no more than −0.5 pt), then full rollout. Publishing this configuration will create the next production release of <span className="font-mono text-[12px]">PDP</span>.
        </p>
      </div>

      <p className="mt-4 text-[11px] text-stone-400">Sandbox report — all figures are mock data generated for the prototype; no analysis was actually run.</p>
    </div>
  )
}

export function EstimationPage() {
  const { blockId } = useParams()
  const { latestDraftOf } = useStore()
  const b = BLOCKS.find((x) => x.id === blockId)

  if (!b) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-stone-500">Unknown Merch Block “{blockId}”.</p>
        <Link to="/merchandising-mix" className="text-sm text-cyan-700 underline underline-offset-2">Back to the Merchandising Mix</Link>
      </div>
    )
  }

  if (b.id === 'pdp') return <FullReport />

  const draft = latestDraftOf(b.id)
  return (
    <div className="max-w-3xl px-8 py-8">
      <Link to="/merchandising-mix" className="text-xs text-stone-400 underline underline-offset-2 hover:text-cyan-700">← Merchandising Mix</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold tracking-tight text-stone-900">Impact Estimation — {b.name}</h1>
        <Badge tone="amber">Queued</Badge>
      </div>
      <p className="mt-1 text-sm text-stone-500">
        Evaluates the current working configuration of <span className="font-mono text-[12px] text-cyan-700">{b.code}</span>{draft ? <> (latest saved draft: <span className="font-mono text-[12px]">{draft.id}</span>)</> : null}.
      </p>

      <div className="soft-card mt-6 px-6 py-6">
        <p className="text-[15px] font-semibold text-stone-800">The estimation request has been queued in the external Impact Suite.</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-stone-600">
          Impact reports are generated asynchronously by the integrated external tool: it replays the recent traffic of this block through the candidate configuration and sends the full report back here (projected engagement, add-to-cart, revenue per session, per-segment breakdown and a final recommendation). Typical turnaround in production: a few minutes.
        </p>
        <p className="mt-3 text-[13px] text-stone-500">
          In this sandbox, one finished report sample is available: see the <Link to="/estimation/pdp" className="font-semibold text-cyan-700 underline underline-offset-2">Product Page Merch Block report</Link>.
        </p>
      </div>
    </div>
  )
}
