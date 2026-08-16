import { BLOCKS, PLACEMENT_CATEGORIES } from '../data'
import { useStore } from '../store'

/** Reference — the workspace's reference data. IDs are immutable system identifiers;
    labels are editable and used across the tool. */
export function ReferencePage() {
  const { blockLabels, setBlockLabel, categoryLabels, setCategoryLabel } = useStore()

  return (
    <div className="max-w-4xl px-8 py-8">
      <h1 className="text-[26px] font-bold tracking-tight text-stone-900">Reference</h1>
      <p className="mt-1 max-w-3xl text-sm text-stone-500">
        Reference data of the workspace. <b className="text-stone-700">IDs are immutable</b> — they are system identifiers used in release names, API calls and integrations. <b className="text-stone-700">Labels are editable</b> and used for display across the tool.
      </p>

      <h2 className="mt-8 text-[16px] font-bold tracking-tight text-stone-900">Placement categories &amp; placements</h2>
      <p className="mt-0.5 text-[13px] text-stone-500">Merch Blocks live in placements, grouped in three placement categories.</p>

      {PLACEMENT_CATEGORIES.map((cat) => {
        const blocks = BLOCKS.filter((b) => b.group === cat.group)
        return (
          <div key={cat.id} className="soft-card mt-4 overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 bg-stone-50/60 px-5 py-3">
              <span className="rounded-md border border-stone-300 bg-white px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-stone-500" title="Immutable category ID">
                {cat.id}
              </span>
              <input
                value={categoryLabels[cat.id] ?? ''}
                onChange={(e) => setCategoryLabel(cat.id, e.target.value)}
                title="Editable category label"
                className="min-w-[240px] flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-[14px] font-bold text-stone-900 hover:border-stone-300 focus:border-cyan-600 focus:bg-white focus:outline-none"
              />
              <span className="text-[11px] text-stone-400">{blocks.length} placement{blocks.length > 1 ? 's' : ''}</span>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-stone-100 text-left text-[10.5px] uppercase tracking-wide text-stone-400">
                  <th className="w-[160px] px-5 py-2 font-semibold">ID <span className="font-normal normal-case">— immutable</span></th>
                  <th className="px-3 py-2 font-semibold">Label <span className="font-normal normal-case">— editable</span></th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((b) => (
                  <tr key={b.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-5 py-1.5">
                      <span className="font-mono text-[11.5px] font-bold tracking-wider text-cyan-700" title="Immutable placement ID — used in release names (e.g. HP-TOP_V2.0)">
                        {b.code}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        value={blockLabels[b.id] ?? ''}
                        onChange={(e) => setBlockLabel(b.id, e.target.value)}
                        title="Editable label — displayed across the tool"
                        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13px] text-stone-800 hover:border-stone-300 focus:border-cyan-600 focus:bg-white focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      <p className="mt-4 text-[11px] text-stone-400">Sandbox — label edits apply live across the tool but are not persisted (in-memory prototype state).</p>
    </div>
  )
}
