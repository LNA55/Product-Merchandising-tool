import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BLOCKS, type VersionStatus } from '../data'
import { useStore } from '../store'
import { Badge } from '../components/ui'

export function statusBadge(s: VersionStatus) {
  if (s === 'live') return <Badge tone="live">Live</Badge>
  if (s === 'previously-live') return <Badge tone="prev">Previously Live</Badge>
  return <Badge>Draft</Badge>
}

/** Release note — one line with an ellipsis; click to unfold the full text. */
function NoteCell({ name, desc }: { name: string; desc: string }) {
  const [open, setOpen] = useState(false)
  return (
    <td className="max-w-[280px] px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={open ? 'Collapse' : 'Show the full release note'}
        className={`w-full text-left ${open ? '' : 'truncate'}`}
      >
        <span className="font-medium text-stone-800">{name}</span>
        {desc && <span className="text-stone-500"> — {desc}</span>}
      </button>
    </td>
  )
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All statuses' },
  { id: 'live', label: 'Live' },
  { id: 'previously-live', label: 'Previously Live' },
  { id: 'draft', label: 'Draft' },
] as const

export function VersionsPage() {
  const { releases } = useStore()
  const [selected, setSelected] = useState<Set<string>>(new Set()) // block ids; empty = all
  const [status, setStatus] = useState<string>('all')

  function toggleBlock(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    let list = [...releases].sort((a, z) => z.sort - a.sort)
    if (selected.size > 0) list = list.filter((r) => selected.has(r.blockId))
    if (status !== 'all') list = list.filter((r) => r.status === status)
    return list
  }, [releases, selected, status])

  return (
    <div className="px-8 py-8">
      <h1 className="text-[26px] font-bold tracking-tight text-stone-900">Release History</h1>
      <p className="mt-1 max-w-3xl text-sm text-stone-500">
        All releases across all Merch Blocks, most recent first. Each block is versioned and published independently — release IDs follow <code className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-cyan-800">MERCH_BLOCK_ID_Vn.x</code>. Releases are immutable: once saved, they can never be edited or deleted.
        <span className="mt-1.5 block">
          The two Impact Estimation figures read as the variation this configuration is projected to produce against the one it replaces: <b className="text-stone-700">eng</b> is the expected change in engagement — clicks per actual view of the block — and <b className="text-stone-700">ATC</b> the expected change in the add-to-cart rate attributed to it.
        </span>
      </p>

      <div className="soft-card mt-5 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-stone-400">Blocks</span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${selected.size === 0 ? 'bg-cyan-700 text-white' : 'border border-stone-300 bg-white text-stone-500 hover:border-cyan-600 hover:text-cyan-700'}`}
          >
            All blocks
          </button>
          {BLOCKS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => toggleBlock(b.id)}
              title={b.name}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${selected.has(b.id) ? 'bg-cyan-700 text-white' : 'border border-stone-300 bg-white text-stone-500 hover:border-cyan-600 hover:text-cyan-700'}`}
            >
              {b.code}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-stone-300 bg-white px-3 py-1 text-[12px] font-medium text-stone-700 focus:border-cyan-600 focus:outline-none">
              {STATUS_FILTERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </span>
        </div>
        {selected.size > 0 && (
          <p className="mt-2 text-[11px] text-stone-400">
            Showing {filtered.length} release{filtered.length === 1 ? '' : 's'} for {selected.size} selected block{selected.size === 1 ? '' : 's'}.
          </p>
        )}
      </div>

      <div className="soft-card mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-[13px]">
          <thead>
            <tr className="border-b-2 border-cyan-600 text-left text-[11px] uppercase tracking-wide text-stone-400">
              <th className="px-4 py-2.5 font-semibold">Release ID</th>
              <th className="px-4 py-2.5 font-semibold">Block</th>
              <th className="px-4 py-2.5 font-semibold">Audience</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Date</th>
              <th className="px-4 py-2.5 font-semibold">Created by</th>
              <th className="px-4 py-2.5 font-semibold">Source</th>
              <th className="px-4 py-2.5 font-semibold">Impact Estimation</th>
              <th className="px-4 py-2.5 font-semibold">Release note</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const block = BLOCKS.find((b) => b.id === r.blockId)!
              return (
                <tr key={r.id} className={`border-b border-stone-100 align-top ${r.status !== 'draft' ? 'bg-cyan-50/40' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link to={`/versions/${r.id}`} className="font-mono text-[12px] font-bold text-cyan-700 hover:underline">{r.id}</Link>
                  </td>
                  <td className="max-w-[180px] px-4 py-3 text-stone-600">{block.name}</td>
                  <td className={`max-w-[180px] px-4 py-3 ${r.status === 'draft' ? 'text-stone-400' : 'text-stone-600'}`}
                    title={r.status === 'draft'
                      ? 'Planned audience — editable until this draft is published'
                      : 'Final user groups this release is (or was) served to'}>
                    {r.audience ?? 'All visitors'}{r.status === 'draft' && <span className="ml-1 text-[10.5px] italic">planned</span>}
                  </td>
                  <td className="px-4 py-3">{statusBadge(r.status)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-stone-600"
                    title={r.status === 'draft' ? 'Date this draft was saved' : 'Date this release was published'}>{r.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-stone-600">{r.by}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.source ? <Link to={`/versions/${r.source}`} className="font-mono text-[11px] text-stone-500 hover:text-cyan-700 hover:underline">{r.source}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.estimation
                      ? (
                        <>
                          <span className="block text-cyan-800">Completed</span>
                          <span className="block whitespace-nowrap tabular-nums text-stone-500">{r.estimation.engagement} eng · {r.estimation.atc} ATC</span>
                        </>
                      )
                      : <span className="text-stone-400">Not run</span>}
                  </td>
                  <NoteCell name={r.name} desc={r.desc} />
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-stone-400">No release matches the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
