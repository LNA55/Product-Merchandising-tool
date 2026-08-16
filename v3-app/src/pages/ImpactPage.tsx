import { Link } from 'react-router-dom'
import { BLOCKS } from '../data'
import { useStore } from '../store'
import { Badge } from '../components/ui'

export function ImpactPage() {
  const { releases, latestDraftOf } = useStore()

  const analyses = releases
    .filter((r) => r.status !== 'draft' && r.analysis)
    .sort((a, z) => z.sort - a.sort)

  return (
    <div className="px-8 py-8">
      <h1 className="text-[26px] font-bold tracking-tight text-stone-900">Impact</h1>
      <p className="mt-1 max-w-3xl text-sm text-stone-500">
        All impact material in one place: pre-launch <b className="text-stone-700">Impact Estimations</b> of the candidate configurations, and post-launch <b className="text-stone-700">Impact Analyses</b> of the live releases. Both are computed by the external Impact Suite (integrated) — results are sent back here.
      </p>

      <h2 className="mt-8 mb-1 text-[16px] font-bold tracking-tight text-stone-900">Impact Estimations <span className="ml-1 align-middle text-[11px] font-medium text-stone-400">pre-launch · candidate configuration per block</span></h2>
      <div className="soft-card mt-2 overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead>
            <tr className="border-b-2 border-cyan-600 text-left text-[11px] uppercase tracking-wide text-stone-400">
              <th className="px-4 py-2.5 font-semibold">Merch Block</th>
              <th className="px-4 py-2.5 font-semibold">Evaluated configuration</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Projected impact</th>
              <th className="px-4 py-2.5 font-semibold">Report</th>
            </tr>
          </thead>
          <tbody>
            {BLOCKS.map((b) => {
              const draft = latestDraftOf(b.id)
              const done = b.id === 'pdp'
              return (
                <tr key={b.id} className="border-b border-stone-100 align-middle last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-stone-800">{b.name}</span>
                    <span className="ml-2 font-mono text-[10.5px] font-bold text-cyan-700">{b.code}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-stone-600">{draft?.id ?? 'current working mix'}</td>
                  <td className="px-4 py-2.5">{done ? <Badge tone="live">Completed</Badge> : <Badge tone="amber">Queued</Badge>}</td>
                  <td className="px-4 py-2.5 tabular-nums text-stone-600">
                    {done ? <><b className="text-cyan-800">+4.2%</b> eng · <b className="text-cyan-800">+2.8%</b> ATC · <span className="text-stone-400">confidence 87%</span></> : <span className="text-stone-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link to={`/estimation/${b.id}`} className="rounded-full border border-cyan-300 px-3 py-0.5 text-[11px] font-semibold whitespace-nowrap text-cyan-700 hover:bg-cyan-50">
                      {done ? 'Open report' : 'View status'}
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 mb-1 text-[16px] font-bold tracking-tight text-stone-900">Live version Impact Analyses <span className="ml-1 align-middle text-[11px] font-medium text-stone-400">post-launch · published releases, estimated vs observed</span></h2>
      <div className="soft-card mt-2 overflow-x-auto">
        <table className="w-full min-w-[860px] text-[13px]">
          <thead>
            <tr className="border-b-2 border-cyan-600 text-left text-[11px] uppercase tracking-wide text-stone-400">
              <th className="px-4 py-2.5 font-semibold">Release</th>
              <th className="px-4 py-2.5 font-semibold">Merch Block</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Published</th>
              <th className="px-4 py-2.5 font-semibold">Engagement est → obs</th>
              <th className="px-4 py-2.5 font-semibold">ATC est → obs</th>
              <th className="px-4 py-2.5 font-semibold">Analysis</th>
            </tr>
          </thead>
          <tbody>
            {analyses.map((r) => {
              const b = BLOCKS.find((x) => x.id === r.blockId)!
              const a = r.analysis!
              return (
                <tr key={r.id} className={`border-b border-stone-100 align-middle last:border-0 ${r.status === 'live' ? 'bg-cyan-50/40' : ''}`}>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <Link to={`/versions/${r.id}`} className="font-mono text-[12px] font-bold text-cyan-700 hover:underline">{r.id}</Link>
                  </td>
                  <td className="max-w-[220px] px-4 py-2.5 text-stone-600">{b.name}</td>
                  <td className="px-4 py-2.5">{r.status === 'live' ? <Badge tone="live">Live</Badge> : <Badge tone="prev">Previously Live</Badge>}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-stone-600">{r.date}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
                    {a.engagement.est} → <b className="text-cyan-800">{a.engagement.obs}</b> <span className="text-[11px] text-stone-400">({a.engagement.variance})</span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
                    {a.atc.est} → <b className="text-cyan-800">{a.atc.obs}</b> <span className="text-[11px] text-stone-400">({a.atc.variance})</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link to={`/versions/${r.id}`} className="rounded-full border border-cyan-300 px-3 py-0.5 text-[11px] font-semibold whitespace-nowrap text-cyan-700 hover:bg-cyan-50">Open analysis</Link>
                  </td>
                </tr>
              )
            })}
            {analyses.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-stone-400">No post-launch analysis available yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[11px] text-stone-400">Sandbox — all figures are mock data; the external Impact Suite integration is simulated.</p>
    </div>
  )
}
