import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { Badge } from '../components/ui'
import type { VersionStatus } from '../data'

export function statusBadge(s: VersionStatus) {
  if (s === 'live') return <Badge tone="live">Live</Badge>
  if (s === 'previously-live') return <Badge tone="prev">Previously Live</Badge>
  return <Badge>Draft</Badge>
}

export function VersionsPage() {
  const { versions } = useStore()
  const ordered = [...versions].reverse()

  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Version History</h1>
      <p className="mt-1 max-w-3xl text-sm text-neutral-500">
        Every saved state of the Merchandising Mix, most recent first. Versions are immutable: once saved, a version can never be edited or deleted. Major “.0” versions have been published to production; decimal versions are internal drafts.
      </p>

      <div className="mt-6 overflow-x-auto rounded-md border border-neutral-200 bg-white">
        <table className="w-full min-w-[900px] text-[13px]">
          <thead>
            <tr className="border-b-2 border-teal-600 text-left text-[11px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-2.5 font-medium">Version</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Created</th>
              <th className="px-4 py-2.5 font-medium">Created by</th>
              <th className="px-4 py-2.5 font-medium">Source version</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium">Impact Estimation</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((v) => (
              <tr key={v.id} className={`border-b border-neutral-100 align-top ${v.status !== 'draft' ? 'bg-teal-50/40' : ''}`}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link to={`/versions/${v.id}`} className="font-semibold text-teal-700 hover:underline">{v.id}</Link>
                </td>
                <td className="px-4 py-3 font-medium text-neutral-800">{v.name}</td>
                <td className="px-4 py-3">{statusBadge(v.status)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{v.date}</td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{v.by}</td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{v.source ?? '—'}</td>
                <td className="px-4 py-3 max-w-md text-neutral-500">{v.desc}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {v.estimation
                    ? <span className="text-teal-800">Completed <span className="tabular-nums text-neutral-500">({v.estimation.engagement} eng · {v.estimation.atc} ATC)</span></span>
                    : <span className="text-neutral-400">Not run</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
