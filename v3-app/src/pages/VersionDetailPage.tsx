import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BLOCKS } from '../data'
import { useStore } from '../store'
import { Button, ExternalLink } from '../components/ui'
import { statusBadge } from './VersionsPage'

export function VersionDetailPage() {
  const { releaseId } = useParams()
  const { releases, runEstimation } = useStore()
  const [running, setRunning] = useState(false)
  const r = releases.find((x) => x.id === releaseId)

  if (!r) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-stone-500">Unknown release “{releaseId}”.</p>
        <Link to="/versions" className="text-sm text-cyan-700 underline underline-offset-2">Back to Release History</Link>
      </div>
    )
  }

  const block = BLOCKS.find((b) => b.id === r.blockId)!
  const isPublished = r.num.endsWith('.0')

  function handleRun() {
    setRunning(true)
    setTimeout(() => { runEstimation(r!.id); setRunning(false) }, 900)
  }

  return (
    <div className="max-w-4xl px-8 py-8">
      <Link to="/versions" className="text-xs text-stone-400 underline underline-offset-2 hover:text-cyan-700">← Release History</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-stone-900">{r.id}</h1>
        {statusBadge(r.status)}
      </div>
      <p className="mt-0.5 text-[15px] font-medium text-stone-700">{r.name}</p>
      <p className="mt-1 text-sm text-stone-500">Release of <b className="text-stone-700">{block.name}</b> — this block is versioned and published independently of the other Merch Blocks.</p>

      <dl className="soft-card mt-5 divide-y divide-stone-100 text-sm">
        <div className="flex justify-between px-4 py-2.5"><dt className="text-stone-500">Merch Block</dt><dd className="font-medium">{block.name} <span className="font-mono text-[11px] text-cyan-700">({block.code})</span></dd></div>
        <div className="flex justify-between px-4 py-2.5"><dt className="text-stone-500">Version</dt><dd className="font-medium">{r.num}</dd></div>
        <div className="flex justify-between px-4 py-2.5"><dt className="text-stone-500">Created</dt><dd className="font-medium">{r.date}</dd></div>
        <div className="flex justify-between px-4 py-2.5"><dt className="text-stone-500">Created by</dt><dd className="font-medium">{r.by}</dd></div>
        <div className="flex justify-between px-4 py-2.5"><dt className="text-stone-500">Created from</dt>
          <dd className="font-medium">{r.source ? <Link to={`/versions/${r.source}`} className="font-mono text-[12px] text-cyan-700 hover:underline">{r.source}</Link> : '—'}</dd></div>
        <div className="flex justify-between gap-8 px-4 py-2.5"><dt className="shrink-0 text-stone-500">Description</dt><dd className="text-right text-stone-700">{r.desc}</dd></div>
      </dl>

      <h2 className="mt-8 text-[13px] font-bold uppercase tracking-wide text-stone-500">Impact Estimation</h2>
      <p className="mt-1 text-xs text-stone-400">Pre-launch projection performed by an external system — this SaaS only integrates the results. The estimation covers this block only.</p>
      <div className="soft-card mt-3 p-4">
        {r.estimation ? (
          <>
            <p className="text-sm font-medium text-cyan-800">Impact Estimation completed</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-2.5">
                <div className="text-lg font-bold tabular-nums text-cyan-800">{r.estimation.engagement}</div>
                <div className="text-[11px] text-cyan-700">Estimated engagement impact</div>
              </div>
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-2.5">
                <div className="text-lg font-bold tabular-nums text-cyan-800">{r.estimation.atc}</div>
                <div className="text-[11px] text-cyan-700">Estimated add-to-cart impact</div>
              </div>
            </div>
            <div className="mt-3">
              <ExternalLink href={`https://impact-suite.example.com/estimate?release=${r.id}`}>Open full Impact Estimation</ExternalLink>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-stone-500">Impact Estimation: <b className="text-stone-700">Not run</b></p>
            <div className="mt-3">
              <Button variant="primary" onClick={handleRun} disabled={running}>
                {running ? 'Running estimation…' : 'Run Impact Estimation'}
              </Button>
            </div>
          </>
        )}
      </div>

      {isPublished && (
        <>
          <h2 className="mt-8 text-[13px] font-bold uppercase tracking-wide text-stone-500">Impact Analysis</h2>
          <p className="mt-1 text-xs text-stone-400">Comparison of the pre-launch Impact Estimation against the post-launch Impact Analysis. The post-launch analysis is also generated by an external tool.</p>
          <div className="soft-card mt-3 overflow-x-auto">
            {r.analysis ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-stone-400">
                    <th className="px-4 py-2 font-semibold">Metric</th>
                    <th className="px-4 py-2 text-right font-semibold">Estimated pre-launch</th>
                    <th className="px-4 py-2 text-right font-semibold">Observed post-launch</th>
                    <th className="px-4 py-2 text-right font-semibold">Variance</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  <tr className="border-b border-stone-100">
                    <td className="px-4 py-2.5 font-medium">Engagement</td>
                    <td className="px-4 py-2.5 text-right">{r.analysis.engagement.est}</td>
                    <td className="px-4 py-2.5 text-right">{r.analysis.engagement.obs}</td>
                    <td className="px-4 py-2.5 text-right font-bold">{r.analysis.engagement.variance}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium">Add to cart</td>
                    <td className="px-4 py-2.5 text-right">{r.analysis.atc.est}</td>
                    <td className="px-4 py-2.5 text-right">{r.analysis.atc.obs}</td>
                    <td className="px-4 py-2.5 text-right font-bold">{r.analysis.atc.variance}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-3 text-sm text-stone-500">Post-launch Impact Analysis: <b className="text-stone-700">pending</b> — the post-launch observation window is still open.</p>
            )}
          </div>
          <div className="mt-3 flex gap-6">
            <ExternalLink href={`https://impact-suite.example.com/estimate?release=${r.id}`}>Open Impact Estimation</ExternalLink>
            <ExternalLink href={`https://impact-suite.example.com/analysis?release=${r.id}`}>Open Post-launch Impact Analysis</ExternalLink>
          </div>
        </>
      )}
    </div>
  )
}
