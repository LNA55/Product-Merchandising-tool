import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BLOCKS, BLOCK_GROUPS, GROUPS, type Block } from '../data'
import { useStore } from '../store'
import { Badge, Button, Field, inputCls, Modal, SessionWord } from '../components/ui'

function SaveModal({ onClose }: { onClose: () => void }) {
  const { nextDraftId, saveDraft } = useStore()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)

  if (savedId) {
    return (
      <Modal title={`${savedId} saved`} subtitle="The version is now immutable. Any further modification will create a new version." onClose={onClose}>
        <div className="flex justify-end gap-2">
          <Link to="/versions" className="text-sm text-teal-700 underline underline-offset-2 self-center">View in Version History</Link>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </Modal>
    )
  }
  return (
    <Modal
      title="Save as new version"
      subtitle="Versions are immutable. Once saved, a version can never be edited or deleted — any modification creates a new version."
      onClose={onClose}
    >
      <Field label="Version ID (system generated)">
        <input className={`${inputCls} bg-neutral-100 font-semibold`} value={nextDraftId} readOnly />
      </Field>
      <Field label="Version name">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Increase behavioral personalization on PDP" />
      </Field>
      <Field label="Description / change note">
        <textarea className={inputCls} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Higher weighting for recently viewed and user affinity signals." />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => setSavedId(saveDraft(name, desc))}>Save {nextDraftId}</Button>
      </div>
    </Modal>
  )
}

function PublishModal({ onClose }: { onClose: () => void }) {
  const { latestDraft, liveVersion, nextPublishId, publishLive } = useStore()
  const [note, setNote] = useState('')
  const [publishedId, setPublishedId] = useState<string | null>(null)

  if (publishedId) {
    return (
      <Modal title={`${publishedId} is now live`} subtitle="Production traffic is now served by this Merchandising Mix (mock state only — no API call was made)." onClose={onClose}>
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </Modal>
    )
  }
  return (
    <Modal title="Publish live" subtitle="Publishing creates a new immutable production version." onClose={onClose}>
      <dl className="mb-4 divide-y divide-neutral-100 rounded-md border border-neutral-200 text-sm">
        <div className="flex justify-between px-3 py-2"><dt className="text-neutral-500">Publishing draft</dt><dd className="font-semibold">{latestDraft?.id ?? '—'}</dd></div>
        <div className="flex justify-between px-3 py-2"><dt className="text-neutral-500">Will generate</dt><dd className="font-semibold text-teal-700">{nextPublishId}</dd></div>
        <div className="flex justify-between px-3 py-2"><dt className="text-neutral-500">Current live (replaced)</dt><dd className="font-semibold">{liveVersion?.id ?? '—'}</dd></div>
      </dl>
      <Field label="Publication note (optional)">
        <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rolled out after merchandising review" />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => setPublishedId(publishLive(note))}>Publish {nextPublishId} live</Button>
      </div>
    </Modal>
  )
}

function cellBg(v: number): string {
  if (v === 0) return 'transparent'
  const alpha = 0.05 + Math.min(1, v / 60) * 0.4
  return `rgba(15, 118, 110, ${alpha.toFixed(3)})`
}

export function MixPage() {
  const { weights, setWeight, dirtyCount, liveVersion, nextDraftId, lastSaved } = useStore()
  const [showSave, setShowSave] = useState(false)
  const [showPublish, setShowPublish] = useState(false)

  const colTotals = useMemo(() => {
    const t: Record<string, number> = {}
    for (const b of BLOCKS) {
      t[b.id] = GROUPS.flatMap((g) => g.sources).reduce((acc, s) => acc + (weights[`${s.id}|${b.id}`] ?? 0), 0)
    }
    return t
  }, [weights])

  const blockGroupSpans = BLOCK_GROUPS.map((g) => ({ g, span: BLOCKS.filter((b) => b.group === g).length }))
  const orderedBlocks: Block[] = BLOCK_GROUPS.flatMap((g) => BLOCKS.filter((b) => b.group === g))

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Merchandising Mix</h1>
          <p className="mt-1 text-sm text-neutral-500">Control how product signals influence merchandising across the commerce experience.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSave(true)}>Save as new version</Button>
          <Button variant="primary" onClick={() => setShowPublish(true)}>Publish live</Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm">
        <span className="text-neutral-500">Working version <b className="ml-1 font-semibold text-neutral-900">{nextDraftId} (unsaved)</b></span>
        <Badge tone="amber">Draft</Badge>
        <span className="text-neutral-500">Last saved <b className="ml-1 font-medium text-neutral-700">{lastSaved}</b></span>
        <span className="text-neutral-500">Last published <b className="ml-1 font-medium text-neutral-700">{liveVersion?.id ?? '—'}</b> <Badge tone="live">Live</Badge></span>
        <span className="text-neutral-500">{dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}</span>
        <Link to="/versions" className="ml-auto text-xs text-neutral-400 underline underline-offset-2 hover:text-teal-700">Version History</Link>
      </div>

      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Data Sources × Merch Blocks</h2>
        <Link to="/merch-blocks" className="text-xs text-neutral-400 underline underline-offset-2 hover:text-teal-700">Manage Merch Blocks</Link>
      </div>

      <div className="max-h-[72vh] overflow-auto rounded-md border border-neutral-200 bg-white">
        <table className="border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-40 min-w-[290px] border-r border-b border-neutral-200 bg-neutral-900 px-4 py-2 text-left align-bottom text-[11px] font-medium text-neutral-400" rowSpan={2}>
                Data Sources ↓ · Merch Blocks →<br />
                <span className="font-normal">cell = weight (%) of the source in the block</span>
              </th>
              {blockGroupSpans.map(({ g, span }) => (
                <th key={g} colSpan={span} className="sticky top-0 z-30 border-b border-r border-neutral-700 bg-neutral-900 px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-teal-400">
                  {g}
                </th>
              ))}
            </tr>
            <tr>
              {orderedBlocks.map((b) => (
                <th key={b.id} className="sticky top-[25px] z-30 min-w-[104px] max-w-[120px] border-b border-r border-neutral-800 bg-neutral-900 px-2 py-2 text-center align-bottom text-[11px] leading-tight font-medium text-white">
                  <Link to="/merch-blocks" className="hover:underline">{b.name.replace('Merch Block — ', '— ').replace(' Merch Block', '')}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => (
              <GroupRows key={g.id} groupId={g.id} orderedBlocks={orderedBlocks} weights={weights} setWeight={setWeight} />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="sticky bottom-0 left-0 z-40 border-t-2 border-r border-neutral-300 bg-neutral-50 px-4 py-2 text-left text-xs font-semibold text-neutral-700">
                Column total <span className="font-normal text-neutral-400">(expected 100%)</span>
              </th>
              {orderedBlocks.map((b) => {
                const t = colTotals[b.id]
                const ok = t === 100
                return (
                  <td key={b.id} className={`sticky bottom-0 z-30 border-t-2 border-r border-neutral-300 px-2 py-2 text-center text-xs font-semibold ${ok ? 'bg-neutral-50 text-neutral-600' : 'bg-amber-50 text-amber-800'}`}>
                    {t}%{!ok && <span className="block text-[10px] font-normal">≠ 100%</span>}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-2 text-xs text-neutral-400">Weights are not automatically redistributed — column totals different from 100% only raise a warning.</p>

      <p className="mt-6 max-w-4xl text-xs leading-relaxed text-neutral-400">
        <b className="text-neutral-500">Versioning</b> — the complete matrix is one <i>Merchandising Mix</i>. Versioning is strictly immutable: once saved, a version can never be edited or deleted; any modification creates a new version, and version numbers are unique IDs. Major “.0” versions are configurations that have been published to production; decimal versions are saved internal drafts that have never themselves been published.
      </p>

      {showSave && <SaveModal onClose={() => setShowSave(false)} />}
      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
    </div>
  )
}

function GroupRows({ groupId, orderedBlocks, weights, setWeight }: {
  groupId: string
  orderedBlocks: Block[]
  weights: Record<string, number>
  setWeight: (key: string, value: number) => void
}) {
  const g = GROUPS.find((x) => x.id === groupId)!
  return (
    <>
      <tr>
        <th className="sticky left-0 z-20 border-b border-r border-teal-100 bg-teal-50/90 px-4 py-2 text-left align-top">
          <span className="text-[13px] font-semibold text-teal-900">{g.title}</span>
          {g.badge && <span className="ml-2"><Badge tone="teal">{g.badge}</Badge></span>}
          <span className="mt-0.5 block max-w-[250px] text-[11px] font-normal leading-snug text-teal-800/80">
            {g.sessionInSub ? (
              <>Signals generated by the customer’s current or recent browsing activity — see the <SessionWord /> definition.</>
            ) : g.sub}
          </span>
        </th>
        <td colSpan={orderedBlocks.length} className="border-b border-neutral-100 bg-teal-50/40" />
      </tr>
      {g.sources.map((s) => (
        <tr key={s.id}>
          <th className="sticky left-0 z-20 border-b border-r border-neutral-200 bg-white px-4 py-1.5 text-left font-normal">
            <span className="block text-[13px] font-medium text-neutral-900">{s.name}</span>
            <span className="block text-[11px] leading-snug text-neutral-400">
              {s.id === 'recently-viewed'
                ? <>Products viewed during the relevant <SessionWord /> window.</>
                : s.desc}
            </span>
            <code className="mt-0.5 inline-block rounded border border-neutral-200 bg-neutral-50 px-1.5 py-px font-mono text-[9.5px] text-teal-800">{s.api}</code>
          </th>
          {orderedBlocks.map((b) => {
            const key = `${s.id}|${b.id}`
            const v = weights[key] ?? 0
            return (
              <td key={b.id} className="border-b border-r border-neutral-100 p-0 text-center" style={{ background: cellBg(v) }}>
                <div className="flex items-center justify-center">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={v}
                    onChange={(e) => setWeight(key, Number(e.target.value))}
                    title={`${s.name} × ${b.name}`}
                    className={`w-12 bg-transparent py-1.5 text-right text-[12.5px] font-semibold tabular-nums focus:outline-2 focus:outline-teal-600 ${v > 40 ? 'text-white' : 'text-neutral-800'} ${v === 0 ? 'text-neutral-300' : ''}`}
                  />
                  <span className={`pl-0.5 pr-1 text-[10px] ${v > 40 ? 'text-white/80' : 'text-neutral-400'}`}>%</span>
                </div>
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
