import { useState } from 'react'
import { GROUPS, hashStr, type Source, type SourceVariant } from '../data'
import { useStore } from '../store'
import { Badge } from '../components/ui'

const API_BASE = 'https://api.store.example/v1'

const PARAM_DESC: Record<string, string> = {
  window: 'Rolling time window used for the computation.',
  added_within: 'Maximum age of the first catalog publication date.',
  restocked_within: 'Maximum age of the restock event.',
  stock_below: 'Inventory threshold, in units, across all warehouses.',
  type: 'Promotion mechanism filter.',
  flag: 'Editorial flag filter maintained by the catalog team.',
  coverage_within: 'Maximum age of the press mention.',
  min_rating: 'Minimum average customer rating.',
  min_reviews: 'Minimum number of reviews backing the rating.',
  top: 'Maximum number of items or associations returned.',
  support: 'Minimum co-occurrence support threshold.',
  scope: 'Scope of the dataset used for the computation.',
  due: 'Predicted depletion horizon for replenishment.',
  basis: 'Reference products the computation is based on.',
  model: 'Ranking / similarity model applied.',
}

interface ApiParam {
  name: string
  example: string
  type: string
}

function paramsOf(s: Source): ApiParam[] {
  const seen = new Map<string, string>()
  for (const v of s.variants) {
    const q = v.api.split('?')[1]
    if (!q) continue
    for (const pair of q.split('&')) {
      const [k, val] = pair.split('=')
      if (!seen.has(k)) seen.set(k, val ?? '')
    }
  }
  return [...seen.entries()].map(([name, example]) => ({
    name,
    example,
    type: /^\d+$/.test(example) ? 'integer' : 'string',
  }))
}

function mockResponse(v: SourceVariant): string {
  const n = 3
  const skus = Array.from({ length: n }, (_, i) => `SKU-${1000 + (hashStr(v.id + i) % 9000)}`)
  return JSON.stringify(
    { products: skus, count: 24 + (hashStr(v.id) % 240), refresh: 'hourly', sandbox: true },
    null,
    2,
  )
}

function EndpointCard({ s }: { s: Source }) {
  const { weights } = useStore()
  const [open, setOpen] = useState(false)
  const [tryOut, setTryOut] = useState<string | null>(null)
  const path = s.api.replace(API_BASE, '')
  const params = paramsOf(s)
  const hasUserId = s.api.includes('{userId}')

  const usedIn = (v: SourceVariant) =>
    Object.keys(weights).filter((k) => k.startsWith(`${v.id}|`) && weights[k] > 0).length

  return (
    <div className="soft-card mb-2.5 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-stone-50/70">
        <span className="rounded-lg bg-cyan-700 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-white">GET</span>
        <code className="font-mono text-[13px] font-semibold text-stone-800">{path}</code>
        <span className="hidden text-[12.5px] text-stone-400 sm:inline">{s.desc}</span>
        <span className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10.5px] font-semibold text-stone-500">{s.variants.length} configured call{s.variants.length > 1 ? 's' : ''}</span>
          <span className={`text-xs text-stone-400 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-stone-200 px-5 py-4">
          <p className="text-[13px] text-stone-600">{s.desc}</p>

          <h4 className="mt-4 mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">Parameters</h4>
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-left text-[10.5px] uppercase tracking-wide text-stone-400">
                  <th className="px-3 py-1.5 font-semibold">Name</th>
                  <th className="px-3 py-1.5 font-semibold">In</th>
                  <th className="px-3 py-1.5 font-semibold">Type</th>
                  <th className="px-3 py-1.5 font-semibold">Example</th>
                  <th className="px-3 py-1.5 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {hasUserId && (
                  <tr className="border-b border-stone-100">
                    <td className="px-3 py-1.5 font-mono font-semibold text-stone-800">userId <span className="ml-1 rounded bg-amber-50 px-1 text-[9.5px] font-sans font-semibold text-amber-700">required</span></td>
                    <td className="px-3 py-1.5 text-stone-500">path</td>
                    <td className="px-3 py-1.5 text-stone-500">string</td>
                    <td className="px-3 py-1.5 font-mono text-stone-500">u_88412</td>
                    <td className="px-3 py-1.5 text-stone-500">Resolved customer identifier — requires an identified session.</td>
                  </tr>
                )}
                {params.map((p) => (
                  <tr key={p.name} className="border-b border-stone-100 last:border-0">
                    <td className="px-3 py-1.5 font-mono font-semibold text-cyan-800">{p.name}</td>
                    <td className="px-3 py-1.5 text-stone-500">query</td>
                    <td className="px-3 py-1.5 text-stone-500">{p.type}</td>
                    <td className="px-3 py-1.5 font-mono text-stone-500">{p.example}</td>
                    <td className="px-3 py-1.5 text-stone-500">{PARAM_DESC[p.name] ?? 'Backoffice-configured parameter.'}</td>
                  </tr>
                ))}
                {!hasUserId && params.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-2 text-stone-400">No parameters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h4 className="mt-5 mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">
            Configured calls <span className="font-normal normal-case tracking-normal text-stone-400">— parameter sets maintained by the backoffice team</span>
          </h4>
          <div className="space-y-2">
            {s.variants.map((v) => (
              <div key={v.id} className="rounded-xl border border-cyan-100 bg-cyan-50/40 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px] font-semibold text-stone-800">{v.label}</span>
                  <span className="rounded-full bg-white px-2 py-px text-[10px] font-semibold text-cyan-700" title="Merch Blocks using this call in the current working mix">
                    used in {usedIn(v)} block{usedIn(v) === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTryOut(tryOut === v.id ? null : v.id)}
                    className="ml-auto rounded-full border border-cyan-300 px-2.5 py-0.5 text-[10.5px] font-semibold text-cyan-700 hover:bg-cyan-50"
                  >
                    {tryOut === v.id ? 'Hide response' : 'Try it out'}
                  </button>
                </div>
                <p className="mt-1 text-[11.5px] leading-snug text-stone-500">{v.explain}</p>
                <code className="mt-1.5 inline-block rounded-md border border-cyan-200 bg-white px-2 py-0.5 font-mono text-[10.5px] break-all whitespace-normal text-cyan-800">{v.api}</code>
                {tryOut === v.id && (
                  <pre className="mt-2 overflow-x-auto rounded-xl bg-stone-900 p-3 font-mono text-[10.5px] leading-relaxed text-cyan-100">{mockResponse(v)}</pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function SwaggerPage() {
  return (
    <div className="px-8 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold tracking-tight text-stone-900">Swagger</h1>
        <Badge tone="teal">sandbox</Badge>
      </div>
      <p className="mt-1 max-w-3xl text-sm text-stone-500">
        All product-feed endpoints available to the Merch Blocks, and the parameter sets configured by the backoffice team. Sandbox documentation only — “Try it out” returns mock data, no live call is made.
      </p>
      <p className="mt-3 text-[13px]">
        <span className="mr-2 text-[11px] font-bold uppercase tracking-wide text-stone-400">Base URL</span>
        <code className="rounded-md border border-stone-200 bg-white px-2 py-0.5 font-mono text-[12px] text-cyan-800">{API_BASE}</code>
      </p>

      {GROUPS.map((g) => (
        <section key={g.id} className="mt-8">
          <div className="mb-2.5 flex flex-wrap items-baseline gap-2">
            <h2 className="text-[16px] font-bold tracking-tight text-stone-900">{g.title}</h2>
            {g.badge && <Badge tone="teal">{g.badge}</Badge>}
            <span className="text-[12px] text-stone-400">{g.sources.length} endpoint{g.sources.length > 1 ? 's' : ''}</span>
          </div>
          {g.sources.map((s) => <EndpointCard key={s.id} s={s} />)}
        </section>
      ))}
    </div>
  )
}
