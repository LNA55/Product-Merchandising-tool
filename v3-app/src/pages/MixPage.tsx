import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ALL_VARIANTS, BLOCKS, BLOCK_GROUPS, DOOR_OPTIONS, DOOR_TAGLINE, FINAL_USER_GROUPS, GROUPS, liveAudienceLines, type Block, type Source } from '../data'
import { useStore } from '../store'
import { Badge, Button, Field, inputCls, Modal, SessionWord } from '../components/ui'

function SaveModal({ block, onClose }: { block: Block; onClose: () => void }) {
  const { nextDraftNum, saveDraft } = useStore()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const num = nextDraftNum(block.id)

  return (
    <Modal
      title={`Save ${block.code} as new release`}
      subtitle={`Saves the current weights of “${block.name}” only.`}
      onClose={onClose}
    >
      <Field label="Release ID (system generated)">
        <input className={`${inputCls} bg-stone-100 font-semibold`} value={`${block.code}_${num}`} readOnly />
      </Field>
      <Field label="Release name">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Increase behavioral personalization" />
      </Field>
      <Field label="Description / change note">
        <textarea className={inputCls} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Higher weighting for recently viewed signals." />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => { saveDraft(block.id, name, desc); onClose() }}>Save {block.code}_{num}</Button>
      </div>
      <p className="mt-3 text-[11.5px] leading-snug text-stone-400">
        Once saved, the release {block.code}_{num} is immutable — the release ID is a unique, system-generated identifier, and any further modification of this block will create a new release.
      </p>
    </Modal>
  )
}

function PublishModal({ block, audience, onClose }: { block: Block; audience?: string; onClose: () => void }) {
  const { latestDraftOf, liveOf, nextPublishNum, publishLive } = useStore()
  const [note, setNote] = useState('')
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const num = nextPublishNum(block.id)
  const draft = latestDraftOf(block.id)
  const live = liveOf(block.id)

  if (publishedId) {
    return (
      <Modal title={`${publishedId} is now live`} subtitle={`Production traffic on “${block.name}” is now served by this release (mock state only — no API call was made). The other blocks are not affected.`} onClose={onClose}>
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </Modal>
    )
  }
  return (
    <Modal title={`Publish ${block.code} live`} subtitle={`Publishing affects this block only — every Merch Block is released independently.`} onClose={onClose}>
      <dl className="mb-4 divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm">
        <div className="flex justify-between px-3.5 py-2"><dt className="text-stone-500">Block</dt><dd className="font-semibold">{block.name}</dd></div>
        <div className="flex justify-between px-3.5 py-2"><dt className="text-stone-500">Publishing draft</dt><dd className="font-semibold">{draft?.id ?? '—'}</dd></div>
        <div className="flex justify-between px-3.5 py-2"><dt className="text-stone-500">Will generate</dt><dd className="font-semibold text-cyan-700">{block.code}_{num}</dd></div>
        <div className="flex justify-between px-3.5 py-2"><dt className="text-stone-500">Current live (replaced)</dt><dd className="font-semibold">{live?.id ?? '—'}</dd></div>
        <div className="flex justify-between gap-6 px-3.5 py-2"><dt className="shrink-0 text-stone-500">Will be shown to</dt><dd className="text-right font-semibold text-cyan-800">{audience ?? 'All visitors'}</dd></div>
      </dl>
      <Field label="Publication note (optional)">
        <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rolled out after merchandising review" />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => setPublishedId(publishLive(block.id, note, audience))}>Publish {block.code}_{num} live</Button>
      </div>
    </Modal>
  )
}

function cellBg(pct: number): string {
  if (pct === 0) return 'transparent'
  const alpha = 0.06 + Math.min(1, pct / 35) * 0.55
  return `rgba(14, 116, 144, ${alpha.toFixed(3)})`
}

function SaveIcon() {
  /* old-school floppy disk */
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 3.5a1 1 0 0 1 1-1h7.6l2.4 2.4v7.6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z" />
      <path d="M5.2 2.7v3h5.3v-3" />
      <path d="M4.8 13.3V9.8h6.4v3.5" />
    </svg>
  )
}
function PublishIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 13.5V7m0 0L5.2 9.8M8 7l2.8 2.8M3 3h10" />
    </svg>
  )
}

/** ColumnCard — the header card of one Merch Block column in the Merchandising Mix matrix.
    Clean fixed-slot layout so every row aligns across columns:
    head (name + code) · divider · mode body · footer (actions + status remark).
    - "live":         live versions per final user group; the FRAMED tag is the one
                      whose weights are displayed in the column below (click to switch)
    - "latest-saved": pending draft + Show to + Publish (enabled only if a draft is pending)
    - "working":      Show to + Save/Publish (enabled only once an edit created an unsaved draft)
    Renders a compact variant (code + mode-relevant icon CTAs) in compact view. */
function ColumnCard({ b, compact, onSave, onPublish, liveSelection, onSelectLive }: {
  b: Block
  compact: boolean
  onSave: () => void
  onPublish: (audience: string) => void
  liveSelection?: string
  onSelectLive: (releaseId: string) => void
}) {
  const { dirtyOf, liveOf, nextDraftNum, releasesOf, pendingDraftOf, displayMode, labelOf } = useStore()
  const [showToOpen, setShowToOpen] = useState(false)
  const [showTo, setShowTo] = useState<Set<string>>(new Set(FINAL_USER_GROUPS.map((g) => g.name)))
  const dirty = dirtyOf(b.id)
  const live = liveOf(b.id)
  const pendingDraft = pendingDraftOf(b.id)

  const allSelected = showTo.size === FINAL_USER_GROUPS.length
  const showToSummary = allSelected ? 'All visitors' : showTo.size === 0 ? 'Nobody — hidden' : `${showTo.size} group${showTo.size > 1 ? 's' : ''}`
  const audienceLabel = allSelected
    ? 'All visitors'
    : showTo.size === 0
      ? 'Nobody — hidden'
      : FINAL_USER_GROUPS.filter((g) => showTo.has(g.name)).map((g) => g.name).join(' · ')
  function toggleShowTo(name: string) {
    setShowTo((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  /* ---- compact variant ---- */
  if (compact) {
    const pubDisabled = displayMode === 'latest-saved' ? !pendingDraft : dirty === 0
    const saveDisabled = dirty === 0
    return (
      <th className="sticky top-0 z-30 min-w-[84px] max-w-[96px] border-b border-stone-200/80 bg-white px-1 py-1.5 align-bottom font-normal">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-stone-200/80 bg-white px-1.5 py-2 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_6px_16px_-8px_rgba(28,25,23,0.12)]">
          <span className="text-center font-mono text-[10.5px] font-bold leading-tight tracking-wider text-cyan-600" title={`${b.name} — live ${live?.num ?? '—'}${dirty ? ` · ${dirty} unsaved change(s)` : ''}`}>{b.code}</span>
          {displayMode !== 'live' && (
            <span className="flex items-center gap-1">
              {displayMode === 'working' && (
                <button type="button" onClick={saveDisabled ? undefined : onSave} disabled={saveDisabled}
                  title={saveDisabled ? 'No unsaved draft — edit a weight to enable' : `Save ${b.code}_${nextDraftNum(b.id)}`}
                  className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${saveDisabled ? 'cursor-not-allowed border border-stone-200 text-stone-300' : 'border border-stone-300 text-stone-500 hover:border-cyan-600 hover:text-cyan-700'}`}>
                  <SaveIcon />
                </button>
              )}
              <button type="button" onClick={pubDisabled ? undefined : () => onPublish(audienceLabel)} disabled={pubDisabled}
                title={pubDisabled ? (displayMode === 'latest-saved' ? 'No saved draft' : 'No unsaved draft — edit a weight to enable') : `Publish ${b.code} live`}
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${pubDisabled ? 'cursor-not-allowed bg-stone-200 text-stone-400' : 'bg-cyan-700 text-white hover:bg-cyan-600'}`}>
                <PublishIcon />
              </button>
            </span>
          )}
        </div>
      </th>
    )
  }

  /* ---- full view — shared skeleton ---- */
  const head = (
    <>
      <span className="flex h-[38px] items-end justify-center">
        <Link to="/merch-blocks" className="line-clamp-2 text-center text-[12.5px] font-semibold leading-tight text-stone-800 hover:text-cyan-700">
          {labelOf(b.id)}
        </Link>
      </span>
      <span className="mt-1 block text-center font-mono text-[10px] font-bold tracking-wider text-cyan-600">{b.code}</span>
      <span className="block h-4" />
    </>
  )
  const label = (t: string) => (
    <span className="block text-[8.5px] font-bold uppercase tracking-wide text-stone-400">{t}</span>
  )
  const showToUI = (
    <span className="relative block text-left">
      {label('Show to')}
      <button
        type="button"
        onClick={() => setShowToOpen(!showToOpen)}
        title="Choose which final user groups this version of the mix is shown to"
        className="mt-0.5 flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-1.5 py-1 text-[10.5px] font-medium text-stone-700 hover:border-cyan-600"
      >
        <span className={showTo.size === 0 ? 'text-amber-600' : ''}>{showToSummary}</span>
        <span className={`text-[8px] text-stone-400 transition-transform ${showToOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {showToOpen && (
        <span className="absolute top-full left-0 z-50 mt-1 block w-[176px] rounded-xl border border-stone-200 bg-white p-1.5 text-left shadow-xl">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 text-[10.5px] font-semibold text-stone-700 hover:bg-cyan-50">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setShowTo(allSelected ? new Set() : new Set(FINAL_USER_GROUPS.map((g) => g.name)))}
              className="h-3 w-3 accent-cyan-700"
            />
            All visitors
          </label>
          <span className="my-1 block border-t border-stone-100" />
          {FINAL_USER_GROUPS.map((g) => (
            <label key={g.name} className="flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 text-[10.5px] text-stone-600 hover:bg-cyan-50">
              <input
                type="checkbox"
                checked={showTo.has(g.name)}
                onChange={() => toggleShowTo(g.name)}
                className="h-3 w-3 accent-cyan-700"
              />
              {g.name}
            </label>
          ))}
        </span>
      )}
    </span>
  )
  const thCls = 'sticky top-[84px] z-30 min-w-[150px] max-w-[166px] border-b border-stone-200/80 bg-white px-1.5 pb-2.5 align-bottom font-normal'
  const cardCls = 'flex h-[260px] flex-col rounded-2xl border border-stone-200/80 bg-white px-2.5 pt-3 pb-3 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_6px_16px_-8px_rgba(28,25,23,0.12)]'
  const btnPrimary = (enabled: boolean) =>
    `w-full rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-colors ${enabled ? 'bg-cyan-700 text-white hover:bg-cyan-600' : 'cursor-not-allowed bg-stone-200 text-stone-400'}`
  const btnSecondary = (enabled: boolean) =>
    `w-full rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors ${enabled ? 'border border-stone-300 text-stone-600 hover:border-cyan-600 hover:text-cyan-700' : 'cursor-not-allowed border border-stone-200 text-stone-300'}`
  const remark = (active: boolean, activeText: string, idleText: string) => (
    <span className={`mt-1.5 block text-center text-[10px] ${active ? 'font-semibold text-amber-600' : 'text-stone-300'}`}>
      {active ? activeText : idleText}
    </span>
  )

  /* ---- live mode ---- */
  if (displayMode === 'live') {
    const liveLines = liveAudienceLines(releasesOf(b.id))
    const effectiveLive = liveSelection && liveLines.some((l) => l.r.id === liveSelection) ? liveSelection : live?.id
    return (
      <th className={thCls}>
        <div className={cardCls}>
          {head}
          {liveLines.length === 0 && (
            <span className="mt-1 block text-left text-[10px] text-stone-300">nothing live yet</span>
          )}
          {liveLines.map(({ r, groups }) => (
            <span key={r.id} className="mt-2 block text-left">
              <button
                type="button"
                onClick={() => onSelectLive(r.id)}
                title={effectiveLive === r.id
                  ? 'This version is displayed in the column below'
                  : 'Click to display this version in the column below'}
                className={`inline-block rounded-full bg-cyan-50 px-1.5 py-px font-mono text-[9px] font-semibold text-cyan-800 transition-shadow ${effectiveLive === r.id ? 'ring-1 ring-cyan-600 ring-offset-1' : 'hover:ring-1 hover:ring-cyan-200'}`}
              >
                live {r.num}
              </button>
              <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-stone-400" title={`seen by ${groups}`}>seen by {groups}</span>
            </span>
          ))}
          <span className="mt-auto block text-center text-[9px] text-stone-300">read-only view</span>
        </div>
      </th>
    )
  }

  /* ---- latest-saved mode ---- */
  if (displayMode === 'latest-saved') {
    return (
      <th className={thCls}>
        <div className={cardCls}>
          {head}
          <span className="block text-left">
            {label('Version')}
            <span className="mt-0.5 block">
              {pendingDraft ? (
                <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-800" title={`Latest saved draft — ${pendingDraft.date} · ${pendingDraft.name}`}>
                  {pendingDraft.num} · draft
                </span>
              ) : (
                <span className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-400">no saved draft</span>
              )}
            </span>
          </span>
          <span className="mt-2.5 block">{showToUI}</span>
          <span className="mt-auto flex flex-col items-stretch pt-3">
            <button type="button" onClick={pendingDraft ? () => onPublish(audienceLabel) : undefined} disabled={!pendingDraft}
              title={pendingDraft ? `Publish ${b.code} live` : 'No saved draft to publish'}
              className={btnPrimary(!!pendingDraft)}>
              Publish
            </button>
            {remark(!!pendingDraft, 'pending publication', 'up to date with live')}
          </span>
        </div>
      </th>
    )
  }

  /* ---- working mode ---- */
  const hasUnsaved = dirty > 0
  return (
    <th className={thCls}>
      <div className={cardCls}>
        {head}
        <span className="block">{showToUI}</span>
        <span className="mt-auto flex flex-col items-stretch gap-1.5 pt-3">
          <button type="button" onClick={hasUnsaved ? onSave : undefined} disabled={!hasUnsaved}
            title={hasUnsaved ? `Save ${b.code}_${nextDraftNum(b.id)}` : 'No unsaved draft — edit a weight in this column to enable'}
            className={btnPrimary(hasUnsaved)}>
            Save
          </button>
          <button type="button" onClick={hasUnsaved ? () => onPublish(audienceLabel) : undefined} disabled={!hasUnsaved}
            title={hasUnsaved ? `Publish ${b.code} live` : 'No unsaved draft — edit a weight in this column to enable'}
            className={btnSecondary(hasUnsaved)}>
            Publish
          </button>
          {remark(hasUnsaved, 'one unsaved draft', 'no unsaved draft')}
        </span>
      </div>
    </th>
  )
}

function BulkPublishModal({ pending, onClose }: {
  pending: { block: Block; draftId: string; nextId: string }[]
  onClose: () => void
}) {
  const { publishLive } = useStore()
  const [done, setDone] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (done) {
    return (
      <Modal title={`${pending.length} block${pending.length > 1 ? 's' : ''} published live`} subtitle="Each block generated its own new production release (mock state only — no API call was made)." onClose={onClose}>
        <div className="flex justify-end"><Button variant="primary" onClick={onClose}>Done</Button></div>
      </Modal>
    )
  }
  return (
    <Modal title="Publish all latest versions saved" subtitle="Publishes, for every block with a saved draft newer than its live release, that latest draft. Each block keeps its own independent release line." onClose={onClose}>
      {pending.length === 0 ? (
        <p className="text-sm text-stone-500">No saved draft is pending publication — every block is already live on its latest saved configuration.</p>
      ) : (
        <ul className="max-h-64 divide-y divide-stone-100 overflow-auto rounded-xl border border-stone-200 text-sm">
          {pending.map((p) => (
            <li key={p.block.id} className="flex items-center justify-between px-3.5 py-2">
              <span className="text-stone-600">{p.block.name}</span>
              <span className="font-mono text-[12px] font-semibold text-stone-700">{p.draftId} <span className="text-stone-300">→</span> <span className="text-cyan-700">{p.nextId}</span></span>
            </li>
          ))}
        </ul>
      )}
      {pending.length > 0 && (
        <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
          <input type="checkbox" checked={confirmed} onChange={() => setConfirmed(!confirmed)} className="mt-0.5 h-3.5 w-3.5 accent-cyan-700" />
          <span>I confirm the publication of <b>{pending.length} block{pending.length > 1 ? 's' : ''} to production</b> — this replaces what customers currently see on the site.</span>
        </label>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        {pending.length > 0 && (
          <Button variant="primary" disabled={!confirmed} onClick={() => { pending.forEach((p) => publishLive(p.block.id, 'Bulk publish — all latest saved drafts')); setDone(true) }}>
            Publish {pending.length} block{pending.length > 1 ? 's' : ''} live
          </Button>
        )}
      </div>
    </Modal>
  )
}

export function MixPage() {
  const { weights, setWeight, dirtyOf, liveOf, nextDraftNum, nextPublishNum, releases, releasesOf, pendingDraftOf, releaseWeights, compact, displayMode, setDisplayMode } = useStore()
  const [saveFor, setSaveFor] = useState<Block | null>(null)
  const [publishFor, setPublishFor] = useState<{ block: Block; audience?: string } | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showBulk, setShowBulk] = useState(false)
  const [userGroup, setUserGroup] = useState('__default__')
  /* which live release is displayed per block (live mode) — framed tag in the ColumnCard */
  const [liveSelections, setLiveSelections] = useState<Record<string, string>>({})

  /* the weights the matrix displays, resolved per Display mode:
     working → the editable working weights; latest-saved → each block's pending draft
     (or its live release when up to date); live → the framed live release per block */
  const displayedWeights = useMemo(() => {
    if (displayMode === 'working') return weights
    const out: Record<string, number> = { ...weights }
    for (const b of BLOCKS) {
      const r = displayMode === 'latest-saved'
        ? pendingDraftOf(b.id) ?? liveOf(b.id)
        : (liveSelections[b.id] ? releasesOf(b.id).find((x) => x.id === liveSelections[b.id]) : undefined) ?? liveOf(b.id)
      if (r) Object.assign(out, releaseWeights(r))
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weights, displayMode, liveSelections, releases])

  const lastRelease = [...releases].filter((r) => r.status !== 'draft').sort((a, z) => z.sort - a.sort)[0]
  const pending = BLOCKS.flatMap((b) => {
    const drafts = releasesOf(b.id).filter((r) => r.status === 'draft')
    const latestDraft = drafts[drafts.length - 1]
    const live = liveOf(b.id)
    if (latestDraft && (!live || latestDraft.sort > live.sort)) {
      return [{ block: b, draftId: latestDraft.id, nextId: `${b.code}_${nextPublishNum(b.id)}` }]
    }
    return []
  })

  function toggleSource(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const colTotals = useMemo(() => {
    const t: Record<string, number> = {}
    for (const b of BLOCKS) {
      t[b.id] = ALL_VARIANTS.reduce((acc, v) => acc + (displayedWeights[`${v.id}|${b.id}`] ?? 0), 0)
    }
    return t
  }, [displayedWeights])

  const blockGroupSpans = BLOCK_GROUPS.map((g) => ({ g, span: BLOCKS.filter((b) => b.group === g).length }))
  const orderedBlocks: Block[] = BLOCK_GROUPS.flatMap((g) => BLOCKS.filter((b) => b.group === g))

  return (
    <div className={`px-8 ${compact ? 'py-4' : 'py-8'}`}>
      {/* in compact view the page title moves into the app header to save vertical space */}
      {!compact && (
        <div className="mb-6">
          <h1 className="text-[26px] font-bold tracking-tight text-stone-900">Merchandising Mix</h1>
          <p className="mt-1 text-sm text-stone-500">
            Control how product signals influence merchandising across the commerce experience. In this version, <b className="text-stone-700">each Merch Block is saved and published independently</b> — use the actions in each column header. Expand a data source (▸) to weight each parameterised API call separately.
          </p>
        </div>
      )}

      <div className="soft-card max-h-[76vh] overflow-auto">
        <table className="border-separate border-spacing-0 text-[13px]">
          <thead>
            {!compact && (
              <tr>
                <th className="sticky top-0 left-0 z-40 w-[320px] min-w-[320px] max-w-[320px] bg-white px-4 pt-3 pb-3 text-left align-top font-normal" rowSpan={3}>
                  <div className="flex h-full min-h-[250px] flex-col justify-between gap-3">
                    <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 px-3.5 py-3">
                      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-stone-400">Display</div>
                      <select
                        value={displayMode}
                        onChange={(e) => setDisplayMode(e.target.value as 'live' | 'latest-saved' | 'working')}
                        title="Which state of the mixes the matrix displays — drives the column cards and cell editability"
                        className="mt-0.5 mb-2.5 w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-stone-800 focus:border-cyan-600 focus:outline-none"
                      >
                        <option value="live">Live mix — in production</option>
                        <option value="latest-saved">Latest saved mixes — not published</option>
                        <option value="working">Working view — unsaved changes</option>
                      </select>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-stone-400">Final user group</div>
                      <select
                        value={userGroup}
                        onChange={(e) => setUserGroup(e.target.value)}
                        title="Displays the mix of a specific final user group (defined in Preferences) — not wired yet, the full behaviour is being specified"
                        className="mt-0.5 mb-2.5 w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-stone-800 focus:border-cyan-600 focus:outline-none"
                      >
                        <option value="__default__">Default — working view</option>
                        <option value="__all__">All visitors</option>
                        {FINAL_USER_GROUPS.map((g) => (
                          <option key={g.name} value={g.name}>{g.name}</option>
                        ))}
                      </select>
                      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-stone-400">Last parameter-set release</div>
                      <div className="mt-0.5 text-[13px] font-semibold text-stone-800">
                        {lastRelease?.date}
                        {lastRelease && <Link to={`/versions/${lastRelease.id}`} className="ml-2 font-mono text-[11px] font-bold text-cyan-700 hover:underline">{lastRelease.id}</Link>}
                      </div>
                      <div className="mt-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-stone-400">Saved, not deployed</div>
                      <div className="mt-0.5 text-[13px] font-semibold text-stone-800">
                        {pending.length} release{pending.length === 1 ? '' : 's'} <span className="font-normal text-stone-400">pending publication</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBulk(true)}
                        className="mt-2.5 w-full rounded-full bg-cyan-700 px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-cyan-600"
                      >
                        Publish all latest versions saved
                      </button>
                    </div>
                    <span className="text-[19px] font-bold tracking-tight text-stone-900">Data Sources</span>
                  </div>
                </th>
                <th colSpan={orderedBlocks.length} className="sticky top-0 z-30 h-12 bg-white px-2 pt-4 pb-1 text-left align-middle">
                  <span className="sticky left-[332px] inline-block text-[19px] font-bold tracking-tight text-stone-900">
                    Merch Blocks
                    <span className="ml-3 align-middle text-[11px] font-medium normal-case tracking-normal text-stone-400">{orderedBlocks.length} placements · released independently</span>
                  </span>
                </th>
              </tr>
            )}
            {!compact && (
              <tr>
                {blockGroupSpans.map(({ g, span }) => (
                  <th key={g} colSpan={span} className="sticky top-12 z-30 h-9 bg-white px-1.5 pb-1.5 align-middle">
                    <div className="rounded-full border border-cyan-100 bg-cyan-50 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-cyan-700">
                      {g}
                    </div>
                  </th>
                ))}
              </tr>
            )}
            <tr>
              {compact && <th className="sticky top-0 left-0 z-40 w-[320px] min-w-[320px] max-w-[320px] border-b border-stone-200/80 bg-white" />}
              {orderedBlocks.map((b) => (
                <ColumnCard key={b.id} b={b} compact={compact} onSave={() => setSaveFor(b)} onPublish={(audience) => setPublishFor({ block: b, audience })}
                  liveSelection={liveSelections[b.id]} onSelectLive={(id) => setLiveSelections((p) => ({ ...p, [b.id]: id }))} />
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => (
              <GroupRows key={g.id} groupId={g.id} orderedBlocks={orderedBlocks} weights={displayedWeights} setWeight={setWeight} colTotals={colTotals} expanded={expanded} toggleSource={toggleSource} readOnly={displayMode !== 'working'} />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="sticky bottom-[35px] left-0 z-40 border-t-2 border-r border-stone-300 bg-stone-50 px-4 py-2 text-left text-xs font-semibold text-stone-600">
                Column total <span className="font-normal text-stone-400">(points → always 100%)</span>
              </th>
              {orderedBlocks.map((b) => {
                const t = colTotals[b.id]
                return (
                  <td key={b.id} className={`sticky bottom-[35px] z-30 border-t-2 border-r border-stone-300 px-2 py-1.5 text-center text-xs font-semibold ${t > 0 ? 'bg-stone-50 text-stone-500' : 'bg-amber-50 text-amber-800'}`}>
                    {t > 0 ? <>Σ {t} pts<span className="block text-[10px] font-normal text-cyan-700">= 100%</span></> : <>Σ 0 pt<span className="block text-[10px] font-normal">empty</span></>}
                  </td>
                )
              })}
            </tr>
            <tr>
              <th className="sticky bottom-0 left-0 z-40 border-t border-r border-stone-200 bg-white px-4 py-1.5 text-left text-xs font-semibold text-stone-600">
                Run Estimation <span className="font-normal text-stone-400">impact per block</span>
              </th>
              {orderedBlocks.map((b) => (
                <td key={b.id} className="sticky bottom-0 z-30 border-t border-r border-stone-200 bg-white px-1 py-1.5 text-center">
                  <Link
                    to={`/estimation/${b.id}`}
                    title={`Run the impact estimation of ${b.name}`}
                    className="inline-block rounded-full border border-cyan-300 px-2.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap text-cyan-700 transition-colors hover:bg-cyan-50"
                  >
                    Run
                  </Link>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-2 text-xs text-stone-400">Each weight is an editable 1–10 (0 = not used). A data source with several parameterised API calls holds one weight per call: its collapsed row shows the read-only total, expand it (▸) to weight each call. Shares (%) are computed automatically per block and always sum to 100%.</p>

      <p className="mt-6 max-w-4xl text-xs leading-relaxed text-stone-400">
        <b className="text-stone-500">Per-block releases</b> — each Merch Block has its own immutable release line. Release IDs follow the convention <code className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[10.5px] text-cyan-800">MERCH_BLOCK_ID_Vn.x</code> (e.g. PDP_V2.0): major “.0” numbers are configurations published to production for that block, decimals are saved internal drafts. Once saved, a release can never be edited or deleted. See the <Link to="/versions" className="text-cyan-700 underline underline-offset-2">Release History</Link>.
      </p>

      {saveFor && <SaveModal block={saveFor} onClose={() => setSaveFor(null)} />}
      {publishFor && <PublishModal block={publishFor.block} audience={publishFor.audience} onClose={() => setPublishFor(null)} />}
      {showBulk && <BulkPublishModal pending={pending} onClose={() => setShowBulk(false)} />}
    </div>
  )
}

function WeightCell({ vKey, title, weights, setWeight, total, readOnly }: {
  vKey: string
  title: string
  weights: Record<string, number>
  setWeight: (key: string, value: number) => void
  total: number
  readOnly: boolean
}) {
  const v = weights[vKey] ?? 0
  const pct = v > 0 && total > 0 ? (v / total) * 100 : 0
  const dark = pct >= 28
  if (readOnly) {
    return (
      <td className="border-b border-r border-stone-100 p-0 text-center" style={{ background: cellBg(pct) }}
          title={`${title} — read-only in this view; switch Display to “Working view” to edit`}>
        <div className="flex flex-col items-center py-1">
          <span className={`text-[14.5px] font-bold tabular-nums ${dark ? 'text-white' : 'text-stone-800'} ${v === 0 ? 'text-stone-300' : ''}`}>{v}</span>
          <span className={`text-[11px] font-medium tabular-nums ${v === 0 ? 'text-stone-300' : dark ? 'text-white/80' : 'text-cyan-800/80'}`}>
            {v > 0 ? `${pct.toFixed(0)}%` : '—'}
          </span>
        </div>
      </td>
    )
  }
  return (
    <td className="border-b border-r border-stone-100 p-0 text-center" style={{ background: cellBg(pct) }}>
      <div className="flex flex-col items-center py-1">
        <input
          type="number"
          min={0}
          max={10}
          value={v}
          onChange={(e) => setWeight(vKey, Number(e.target.value))}
          title={`${title} — weight 1–10 (0 = not used); the % share is computed automatically`}
          className={`w-11 rounded-md bg-transparent text-center text-[14.5px] font-bold tabular-nums focus:outline-2 focus:outline-cyan-600 ${dark ? 'text-white' : 'text-stone-800'} ${v === 0 ? 'text-stone-300' : ''}`}
        />
        <span title="Computed share — not editable" className={`text-[11px] font-medium tabular-nums ${v === 0 ? 'text-stone-300' : dark ? 'text-white/80' : 'text-cyan-800/80'}`}>
          {v > 0 ? `${pct.toFixed(0)}%` : '—'}
        </span>
      </div>
    </td>
  )
}

function AggregateCell({ pts, total, onOpen }: { pts: number; total: number; onOpen: () => void }) {
  const pct = pts > 0 && total > 0 ? (pts / total) * 100 : 0
  const dark = pct >= 28
  return (
    <td
      className="cursor-pointer border-b border-r border-stone-100 p-0 text-center"
      style={{ background: cellBg(pct) }}
      title="Total of this source’s API-call weights — read-only. Click to expand and edit each call."
      onClick={onOpen}
    >
      <div className="flex flex-col items-center py-1">
        <span className={`text-[14.5px] font-bold tabular-nums ${dark ? 'text-white' : 'text-stone-800'} ${pts === 0 ? 'text-stone-300' : ''}`}>{pts}</span>
        <span className={`text-[11px] font-medium tabular-nums ${pts === 0 ? 'text-stone-300' : dark ? 'text-white/80' : 'text-cyan-800/80'}`}>
          {pts > 0 ? `${pct.toFixed(0)}%` : '—'}
        </span>
      </div>
    </td>
  )
}

function SourceRows({ s, orderedBlocks, weights, setWeight, colTotals, open, onToggle, readOnly }: {
  s: Source
  orderedBlocks: Block[]
  weights: Record<string, number>
  setWeight: (key: string, value: number) => void
  colTotals: Record<string, number>
  open: boolean
  onToggle: () => void
  readOnly: boolean
}) {
  const multi = s.variants.length > 1
  return (
    <>
      <tr>
        <th className="sticky left-0 z-20 w-[320px] min-w-[320px] max-w-[320px] border-b border-r border-stone-200 bg-white px-3 py-1.5 text-left font-normal">
          <div className="flex items-start gap-1.5">
            <button type="button" onClick={onToggle} aria-expanded={open}
              title={open ? 'Collapse the API calls of this source' : `Expand — ${s.variants.length} parameterised API call${s.variants.length > 1 ? 's' : ''}`}
              className={`mt-0.5 shrink-0 text-[10px] text-stone-400 transition-transform hover:text-cyan-700 ${open ? 'rotate-90' : ''}`}>
              ▶
            </button>
            <div>
              <span className="block text-[13px] font-medium text-stone-900">
                {s.name}
                {multi && <span className="ml-1.5 align-middle font-mono text-[9px] font-bold text-cyan-600">×{s.variants.length}</span>}
              </span>
              <span className="block text-[11px] leading-snug text-stone-400">
                {s.id === 'recently-viewed'
                  ? <>Products viewed during the relevant <SessionWord /> window.</>
                  : s.desc}
              </span>
              <code className="mt-0.5 inline-block rounded-md border border-stone-200 bg-stone-50 px-1.5 py-px text-left font-mono text-[9.5px] break-all whitespace-normal text-cyan-800">{s.api}</code>
            </div>
          </div>
        </th>
        {orderedBlocks.map((b) => {
          const total = colTotals[b.id]
          if (multi) {
            const pts = s.variants.reduce((acc, v) => acc + (weights[`${v.id}|${b.id}`] ?? 0), 0)
            return <AggregateCell key={b.id} pts={pts} total={total} onOpen={() => { if (!open) onToggle() }} />
          }
          return (
            <WeightCell key={b.id} vKey={`${s.variants[0].id}|${b.id}`} title={`${s.name} × ${b.name}`}
              weights={weights} setWeight={setWeight} total={total} readOnly={readOnly} />
          )
        })}
      </tr>
      {open && s.variants.map((v) => (
        <tr key={v.id}>
          <th className="sticky left-0 z-20 w-[320px] min-w-[320px] max-w-[320px] border-b border-r border-stone-200 bg-stone-50/90 py-2 pl-8 pr-3 text-left font-normal">
            <div className="border-l-2 border-cyan-200 pl-2.5">
              <span className="block text-[12px] font-medium text-stone-700">{v.label}</span>
              <span className="block text-[10.5px] leading-snug text-stone-400">{v.explain}</span>
              <code className="mt-0.5 inline-block rounded-md border border-cyan-100 bg-white px-1.5 py-px text-left font-mono text-[9.5px] break-all whitespace-normal text-cyan-800">{v.api}</code>
            </div>
          </th>
          {multi ? (
            orderedBlocks.map((b) => (
              <WeightCell key={b.id} vKey={`${v.id}|${b.id}`} title={`${s.name} · ${v.label} × ${b.name}`}
                weights={weights} setWeight={setWeight} total={colTotals[b.id]} readOnly={readOnly} />
            ))
          ) : (
            <td colSpan={orderedBlocks.length} className="border-b border-stone-100 bg-stone-50/40 px-3 text-left text-[10.5px] italic text-stone-300">
              single API call — weighted directly in the row above
            </td>
          )}
        </tr>
      ))}
    </>
  )
}

function DoorRows({ groupId, orderedBlocks }: { groupId: string; orderedBlocks: Block[] }) {
  const { doorColors, displayMode } = useStore()
  const opts = DOOR_OPTIONS[groupId] ?? []
  const [open, setOpen] = useState(false)
  const [optionId, setOptionId] = useState(opts[0]?.id ?? 'other')
  const [otherLabel, setOtherLabel] = useState('')
  const [text, setText] = useState(opts[0]?.defaultText ?? '')
  const [url, setUrl] = useState(opts[0]?.defaultUrl ?? 'https://www.store.example/')
  const [colorId, setColorId] = useState('cyan-light')
  const [mode, setMode] = useState<'slot' | 'last-visible' | 'end'>('last-visible')
  const [slot, setSlot] = useState(4)
  const [enabled, setEnabled] = useState<Set<string>>(new Set())

  const color = doorColors.find((c) => c.id === colorId) ?? doorColors[0]

  function pickOption(id: string) {
    setOptionId(id)
    const o = opts.find((x) => x.id === id)
    if (o) {
      setText(o.defaultText)
      setUrl(o.defaultUrl)
    }
  }
  function toggleBlock(blockId: string) {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }

  return (
    <>
      <tr>
        <th className="sticky left-0 z-20 w-[320px] min-w-[320px] max-w-[320px] border-b border-r border-stone-200 bg-cyan-50/30 px-3 py-1.5 text-left font-normal">
          <div className="flex items-start gap-1.5">
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
              title={open ? 'Collapse the door settings' : 'Expand — configure this merchandising door'}
              className={`mt-0.5 shrink-0 text-[10px] text-stone-400 transition-transform hover:text-cyan-700 ${open ? 'rotate-90' : ''}`}>
              ▶
            </button>
            <div>
              <span className="block text-[13px] font-medium text-stone-900">
                Merchandising door
                <span className="ml-1.5 rounded-full bg-cyan-700 px-1.5 py-px align-middle text-[8.5px] font-bold uppercase tracking-wide text-white">link</span>
              </span>
              <span className="block text-[11px] leading-snug text-stone-400">{DOOR_TAGLINE}</span>
            </div>
          </div>
        </th>
        {orderedBlocks.map((b) => {
          const on = enabled.has(b.id)
          return (
            <td key={b.id} className="border-b border-r border-stone-100 bg-cyan-50/20 p-0 text-center">
              <button
                type="button"
                onClick={displayMode === 'working' ? () => toggleBlock(b.id) : undefined}
                disabled={displayMode !== 'working'}
                title={displayMode !== 'working' ? 'Doors are edited in Working view' : `${on ? 'Remove' : 'Show'} this door in ${b.name}`}
                className={`my-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${displayMode !== 'working' ? (on ? 'cursor-not-allowed bg-cyan-700/40 text-white' : 'cursor-not-allowed border border-stone-200 text-stone-200') : on ? 'bg-cyan-700 text-white hover:bg-cyan-600' : 'border border-stone-300 text-stone-300 hover:border-cyan-600 hover:text-cyan-700'}`}
              >
                {on ? 'On' : 'Off'}
              </button>
            </td>
          )
        })}
      </tr>
      {open && (
        <tr>
          <td colSpan={1 + orderedBlocks.length} className="border-b border-cyan-100 bg-cyan-50/20 px-0 py-3">
            <div className="sticky left-0 inline-block w-full max-w-[880px] px-5 text-left align-top">
              <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-wide text-stone-400">Door option (for this group)</span>
                  <select value={optionId} onChange={(e) => pickOption(e.target.value)} className="w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-[13px] focus:border-cyan-600 focus:outline-none">
                    {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    <option value="other">Other…</option>
                  </select>
                  {optionId === 'other' && (
                    <input value={otherLabel} onChange={(e) => setOtherLabel(e.target.value)} placeholder="Describe the custom destination"
                      className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-[13px] focus:border-cyan-600 focus:outline-none" />
                  )}
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-wide text-stone-400">Display text <span className="font-normal normal-case text-stone-300">— suggested default, editable</span></span>
                  <input value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-[13px] focus:border-cyan-600 focus:outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-wide text-stone-400">Link <span className="font-normal normal-case text-stone-300">— this door is just a link</span></span>
                  <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 font-mono text-[11.5px] text-cyan-800 focus:border-cyan-600 focus:outline-none" />
                </label>
                <div>
                  <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-wide text-stone-400">Background color <span className="font-normal normal-case text-stone-300">— palette managed in Preferences</span></span>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {doorColors.map((c) => (
                      <button key={c.id} type="button" onClick={() => setColorId(c.id)} title={c.label}
                        className={`h-7 w-7 rounded-full border-2 transition-transform ${colorId === c.id ? 'scale-110 border-cyan-600' : 'border-stone-200 hover:scale-105'}`}
                        style={{ background: c.bg }} />
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-wide text-stone-400">Position in the Merch Block</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-[13px] focus:border-cyan-600 focus:outline-none">
                      <option value="last-visible">Always the last visible slot (per device)</option>
                      <option value="slot">Fixed slot — item #N in the list</option>
                      <option value="end">Last item of the list</option>
                    </select>
                    {mode === 'slot' && (
                      <label className="flex items-center gap-1.5 text-[13px] text-stone-600">
                        item #
                        <input type="number" min={1} max={12} value={slot} onChange={(e) => setSlot(Number(e.target.value))}
                          className="w-16 rounded-xl border border-stone-300 bg-white px-2 py-1.5 text-center text-[13px] focus:border-cyan-600 focus:outline-none" />
                      </label>
                    )}
                  </div>
                  <p className="mt-1.5 max-w-[720px] text-[11px] leading-snug text-stone-400">
                    Desktop renders the block as a row of visible slots, mobile as a swipeable carousel. “Fixed slot” counts items identically on both devices. “Always the last visible slot” resolves per device: the door takes the last slot that fits the viewport without scrolling (e.g. 4th slot on a 4-wide desktop row, 2nd slot on mobile), and the products after it move into the overflow.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-wide text-stone-400">Preview</span>
                  <span className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-[13.5px] font-semibold"
                    style={{ background: color.bg, color: color.ink, borderColor: color.border }}>
                    {optionId === 'other' && otherLabel && !text ? otherLabel : text || 'Door text…'}
                  </span>
                  <span className="ml-3 align-middle text-[11px] text-stone-400">shown in {enabled.size} block{enabled.size === 1 ? '' : 's'} (toggle On/Off per column)</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function GroupRows({ groupId, orderedBlocks, weights, setWeight, colTotals, expanded, toggleSource, readOnly }: {
  groupId: string
  orderedBlocks: Block[]
  weights: Record<string, number>
  setWeight: (key: string, value: number) => void
  colTotals: Record<string, number>
  expanded: Set<string>
  toggleSource: (id: string) => void
  readOnly: boolean
}) {
  const g = GROUPS.find((x) => x.id === groupId)!
  return (
    <>
      <tr>
        <td colSpan={1 + orderedBlocks.length} className="border-b border-cyan-100 bg-cyan-50/70 px-0 py-2">
          <div className="sticky left-0 inline-block max-w-[860px] px-4 text-left">
            <span className="text-[13px] font-bold text-cyan-900">{g.title}</span>
            {g.badge && <span className="ml-2 align-middle"><Badge tone="teal">{g.badge}</Badge></span>}
            <span className="mt-0.5 block text-[11px] font-normal leading-snug text-cyan-800/80">
              {g.sessionInSub ? (
                <>Signals generated by the customer’s current or recent browsing activity — see the <SessionWord /> definition.</>
              ) : g.sub}
            </span>
          </div>
        </td>
      </tr>
      {g.sources.map((s) => (
        <SourceRows key={s.id} s={s} orderedBlocks={orderedBlocks} weights={weights} setWeight={setWeight}
          colTotals={colTotals} open={expanded.has(s.id)} onToggle={() => toggleSource(s.id)} readOnly={readOnly} />
      ))}
      <DoorRows groupId={g.id} orderedBlocks={orderedBlocks} />
    </>
  )
}
