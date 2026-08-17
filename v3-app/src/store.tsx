import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  audienceLabelOf, audienceToSet, BLOCKS, defaultDoorConfig, isAnonymousAudience, loginOnlyVariantIds, mockAnalysis, DEFAULT_DOOR_COLORS, defaultBlockLabel, defaultWeights, hashStr, parseNum,
  DOOR_OPTIONS, GROUPS, PLACEMENT_CATEGORIES, seedReleases,
  type Block, type BlockRelease, type DoorColor, type DoorConfig, type DoorOption, type DoorPlacement, type ImpactEstimation, type Weights,
} from './data'

export type DisplayMode = 'live' | 'latest-saved' | 'working'

export interface AudiencePart {
  num: string
  audience: string
  /** login-only data sources are forced to 0 in this release */
  zeroed: boolean
}
export interface AudiencePlan {
  parts: AudiencePart[]
  split: boolean
  /** login-only calls carrying a weight on this block — the ones dropped for anonymous audiences */
  ignoredVariants: string[]
}

interface Store {
  compact: boolean
  setCompact: (v: boolean) => void
  displayMode: DisplayMode
  setDisplayMode: (v: DisplayMode) => void
  doorColors: DoorColor[]
  addDoorColor: (bg: string, label: string) => void
  removeDoorColor: (id: string) => void
  /** Editable labels of the reference data (IDs are immutable). */
  blockLabels: Record<string, string>
  setBlockLabel: (blockId: string, label: string) => void
  categoryLabels: Record<string, string>
  setCategoryLabel: (categoryId: string, label: string) => void
  labelOf: (blockId: string) => string
  /* ---- merchandising doors: firm instructions carried by the block release ---- */
  /** Fixed door destinations offered per source group — edited in Preferences, read live by the matrix. */
  doorOptions: Record<string, DoorOption[]>
  setDoorOption: (groupId: string, optionId: string, patch: Partial<DoorOption>) => void
  /** Working door configuration of each source-group row. */
  doorConfigs: Record<string, DoorConfig>
  setDoorConfig: (groupId: string, patch: Partial<DoorConfig>) => void
  /** Blocks on which each door row is currently switched on (working state). */
  doorBlocks: Record<string, string[]>
  toggleDoorBlock: (groupId: string, blockId: string) => void
  /** Doors carried by a block in the working state. */
  doorsOfBlock: (blockId: string) => DoorPlacement[]
  /** Doors captured by a release — snapshotted whole at save/publish, like a firm instruction. */
  releaseDoors: (r: BlockRelease) => DoorPlacement[]
  weights: Weights
  setWeight: (key: string, value: number) => void
  dirtyOf: (blockId: string) => number
  releases: BlockRelease[]
  releasesOf: (blockId: string) => BlockRelease[]
  liveOf: (blockId: string) => BlockRelease | undefined
  latestDraftOf: (blockId: string) => BlockRelease | undefined
  /** Latest saved draft newer than the live release (pending publication), if any. */
  pendingDraftOf: (blockId: string) => BlockRelease | undefined
  /** The pending draft and, when it came from an audience split, its sibling — published together. */
  pendingDraftsOf: (blockId: string) => BlockRelease[]
  /** Publish every pending draft of a block, each with its own audience and its own weights. */
  publishPending: (blockId: string, note: string) => string[]
  /** The weight set of a given release for its block: real snapshot for releases
      created this session, deterministic mock for seed releases. */
  releaseWeights: (r: BlockRelease) => Weights
  nextDraftNum: (blockId: string) => string
  nextPublishNum: (blockId: string) => string
  /** How a save/publish splits per audience: one release, or two when the chosen audience
      mixes identified and anonymous groups while the mix uses login-only data sources. */
  audiencePlan: (blockId: string, audience: string | undefined, kind: 'draft' | 'publish') => AudiencePlan
  saveDraft: (blockId: string, name: string, desc: string, audience?: string) => string[]
  /** Edit the audience of a saved draft — allowed until it is published. */
  setReleaseAudience: (releaseId: string, audience: string) => void
  publishLive: (blockId: string, note: string, audience?: string) => string[]
  runEstimation: (releaseId: string) => void
  /** Generate the post-launch impact analysis of a release (mock) — its dedicated page then exists. */
  runAnalysis: (releaseId: string) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const defaults = useMemo(() => defaultWeights(), [])
  const seeds = useMemo(() => BLOCKS.flatMap((b) => seedReleases(b)), [])
  const [weights, setWeights] = useState<Weights>(defaults)
  const [baseline, setBaseline] = useState<Weights>(defaults)
  const [releases, setReleases] = useState<BlockRelease[]>(seeds)
  const [compact, setCompact] = useState(false)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('latest-saved')
  const [doorColors, setDoorColors] = useState<DoorColor[]>(DEFAULT_DOOR_COLORS)
  const [doorOptions, setDoorOptions] = useState<Record<string, DoorOption[]>>(DOOR_OPTIONS)
  const [doorConfigs, setDoorConfigs] = useState<Record<string, DoorConfig>>(
    () => Object.fromEntries(GROUPS.map((g) => [g.id, defaultDoorConfig(g.id)])),
  )
  const [doorBlocks, setDoorBlocks] = useState<Record<string, string[]>>(
    () => Object.fromEntries(GROUPS.map((g) => [g.id, [] as string[]])),
  )
  /* door state of each block at its last save — a door edit makes the column dirty */
  const [doorBaseline, setDoorBaseline] = useState<Record<string, string>>({})
  const [blockLabels, setBlockLabels] = useState<Record<string, string>>(
    () => Object.fromEntries(BLOCKS.map((b) => [b.id, defaultBlockLabel(b)])),
  )
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(
    () => Object.fromEntries(PLACEMENT_CATEGORIES.map((c) => [c.id, c.group])),
  )
  const setBlockLabel = (blockId: string, label: string) =>
    setBlockLabels((prev) => ({ ...prev, [blockId]: label }))
  const setCategoryLabel = (categoryId: string, label: string) =>
    setCategoryLabels((prev) => ({ ...prev, [categoryId]: label }))
  const labelOf = (blockId: string) => blockLabels[blockId] ?? blockId

  function addDoorColor(bg: string, label: string) {
    const r = parseInt(bg.slice(1, 3), 16), g = parseInt(bg.slice(3, 5), 16), b = parseInt(bg.slice(5, 7), 16)
    const light = 0.299 * r + 0.587 * g + 0.114 * b > 150
    setDoorColors((cs) => [...cs, {
      id: `custom-${cs.length}-${bg.slice(1)}`,
      label: label || bg,
      bg,
      ink: light ? '#1c1917' : '#ffffff',
      border: light ? '#d6d3d1' : bg,
    }])
  }
  function removeDoorColor(id: string) {
    setDoorColors((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs))
  }

  function setDoorOption(groupId: string, optionId: string, patch: Partial<DoorOption>) {
    setDoorOptions((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
    }))
  }
  function setDoorConfig(groupId: string, patch: Partial<DoorConfig>) {
    setDoorConfigs((prev) => ({ ...prev, [groupId]: { ...prev[groupId], ...patch } }))
  }
  function toggleDoorBlock(groupId: string, blockId: string) {
    setDoorBlocks((prev) => {
      const cur = prev[groupId] ?? []
      return { ...prev, [groupId]: cur.includes(blockId) ? cur.filter((b) => b !== blockId) : [...cur, blockId] }
    })
  }
  const doorsOfBlock = (blockId: string): DoorPlacement[] =>
    GROUPS.filter((g) => (doorBlocks[g.id] ?? []).includes(blockId))
      .map((g) => ({ groupId: g.id, config: doorConfigs[g.id] }))
  const doorSig = (blockId: string) => JSON.stringify(doorsOfBlock(blockId))

  function setWeight(key: string, value: number) {
    setWeights((w) => ({ ...w, [key]: Math.max(0, Math.min(10, Math.round(value))) }))
  }

  const dirtyOf = (blockId: string) => {
    const w = Object.keys(weights).filter((k) => k.endsWith(`|${blockId}`) && weights[k] !== baseline[k]).length
    const doorsChanged = doorSig(blockId) !== (doorBaseline[blockId] ?? JSON.stringify([]))
    return w + (doorsChanged ? 1 : 0)
  }

  const releasesOf = (blockId: string) =>
    releases.filter((r) => r.blockId === blockId).sort((a, z) => a.sort - z.sort)

  const liveOf = (blockId: string) => {
    const lives = releasesOf(blockId).filter((r) => r.status === 'live')
    return lives[lives.length - 1]
  }

  const latestDraftOf = (blockId: string) => {
    const d = releasesOf(blockId).filter((r) => r.status === 'draft')
    return d[d.length - 1]
  }

  const pendingDraftOf = (blockId: string) => {
    const latest = latestDraftOf(blockId)
    const live = liveOf(blockId)
    return latest && (!live || latest.sort > live.sort) ? latest : undefined
  }

  const pendingDraftsOf = (blockId: string) => {
    const latest = pendingDraftOf(blockId)
    if (!latest) return []
    if (!latest.batch) return [latest]
    return releasesOf(blockId).filter((r) => r.status === 'draft' && r.batch === latest.batch)
  }

  const releaseSnapshots = useRef<Record<string, Weights>>({})
  const doorSnapshots = useRef<Record<string, DoorPlacement[]>>({})
  const releaseDoors = (r: BlockRelease): DoorPlacement[] => doorSnapshots.current[r.id] ?? []
  function snapshotBlock(blockId: string, releaseId: string) {
    const snap: Weights = {}
    for (const k of Object.keys(weights)) if (k.endsWith(`|${blockId}`)) snap[k] = weights[k]
    releaseSnapshots.current[releaseId] = snap
    doorSnapshots.current[releaseId] = doorsOfBlock(blockId)
  }
  function snapshotBlockZeroed(blockId: string, releaseId: string, zeroSet: Set<string>) {
    const snap: Weights = {}
    for (const k of Object.keys(weights)) {
      if (!k.endsWith(`|${blockId}`)) continue
      snap[k] = zeroSet.has(k.split('|')[0]) ? 0 : weights[k]
    }
    releaseSnapshots.current[releaseId] = snap
    doorSnapshots.current[releaseId] = doorsOfBlock(blockId)
  }
  function releaseWeights(r: BlockRelease): Weights {
    const snap = releaseSnapshots.current[r.id]
    if (snap) return snap
    // deterministic mock: the block's default weights, slightly perturbed per release
    const out: Weights = {}
    for (const k of Object.keys(defaults)) {
      if (!k.endsWith(`|${r.blockId}`)) continue
      const base = defaults[k]
      out[k] = base === 0 ? 0 : Math.max(1, Math.min(10, base + ((hashStr(r.id + k) % 3) - 1)))
    }
    return out
  }

  function maxNum(blockId: string): [number, number] {
    const nums = releasesOf(blockId).map((r) => parseNum(r.num)).sort((a, z) => a[0] - z[0] || a[1] - z[1])
    return nums[nums.length - 1] ?? [0, 0]
  }
  const nextDraftNum = (blockId: string) => {
    const [maj, min] = maxNum(blockId)
    return `V${maj}.${min + 1}`
  }
  const nextPublishNum = (blockId: string) => {
    const [maj] = maxNum(blockId)
    return `V${maj + 1}.0`
  }

  /** login-only calls actually weighted on this block — dropped for anonymous audiences */
  function ignoredVariantsOn(blockId: string): string[] {
    const loginOnly = loginOnlyVariantIds()
    return Object.keys(weights)
      .filter((k) => k.endsWith(`|${blockId}`) && weights[k] > 0 && loginOnly.has(k.split('|')[0]))
      .map((k) => k.split('|')[0])
  }

  function audiencePlan(blockId: string, audience: string | undefined, kind: 'draft' | 'publish'): AudiencePlan {
    const set = audienceToSet(audience)
    const anon = new Set([...set].filter((g) => isAnonymousAudience(g)))
    const ident = new Set([...set].filter((g) => !isAnonymousAudience(g)))
    const ignoredVariants = ignoredVariantsOn(blockId)
    const [maj, min] = maxNum(blockId)
    const num = (i: number) => (kind === 'draft' ? `V${maj}.${min + 1 + i}` : `V${maj + 1 + i}.0`)
    if (ignoredVariants.length > 0 && anon.size > 0 && ident.size > 0) {
      // one release per data-access profile, from the very same working mix
      return {
        split: true,
        ignoredVariants,
        parts: [
          { num: num(0), audience: audienceLabelOf(ident), zeroed: false },
          { num: num(1), audience: audienceLabelOf(anon), zeroed: true },
        ],
      }
    }
    const zeroed = ignoredVariants.length > 0 && anon.size > 0 && ident.size === 0
    return { split: false, ignoredVariants, parts: [{ num: num(0), audience: audience ?? 'All visitors', zeroed }] }
  }

  function resetBaselineFor(blockId: string) {
    setDoorBaseline((prev) => ({ ...prev, [blockId]: doorSig(blockId) }))
    setBaseline((base) => {
      const next = { ...base }
      for (const k of Object.keys(weights)) if (k.endsWith(`|${blockId}`)) next[k] = weights[k]
      return next
    })
  }

  function saveDraft(blockId: string, name: string, desc: string, audience?: string): string[] {
    const b = BLOCKS.find((x) => x.id === blockId) as Block
    const plan = audiencePlan(blockId, audience, 'draft')
    const zeroSet = new Set(plan.ignoredVariants)
    const prev = releasesOf(blockId).pop()
    const created = plan.parts.map((part) => {
      const id = `${b.code}_${part.num}`
      if (part.zeroed) snapshotBlockZeroed(blockId, id, zeroSet)
      else snapshotBlock(blockId, id)
      return { part, id }
    })
    setReleases((rs) => [...rs, ...created.map(({ part, id }, i) => ({
      id, blockId, blockCode: b.code, num: part.num,
      name: name || 'Untitled draft', status: 'draft' as const,
      date: 'Aug 14, 2026', sort: 814 + (rs.length + i) / 1000, by: 'You',
      source: prev?.id ?? null,
      batch: plan.split ? `${b.code}_${plan.parts[0].num}` : undefined,
      zeroedForAudience: part.zeroed,
      desc: desc + (part.zeroed
        ? ` — variant generated automatically for ${part.audience}: the login-only data sources of the mix are set to 0 (no identified customer, no usable endpoint).`
        : plan.split ? ` — full mix, kept for ${part.audience}.` : ''),
      estimation: null,
      audience: part.audience,
    }))])
    resetBaselineFor(blockId)
    return created.map((c) => c.id)
  }

  function setReleaseAudience(releaseId: string, audience: string) {
    setReleases((rs) => rs.map((r) => (r.id === releaseId && r.status === 'draft' ? { ...r, audience } : r)))
  }

  function publishLive(blockId: string, note: string, audience?: string): string[] {
    const b = BLOCKS.find((x) => x.id === blockId) as Block
    const plan = audiencePlan(blockId, audience, 'publish')
    const zeroSet = new Set(plan.ignoredVariants)
    const draft = latestDraftOf(blockId)
    const src = draft?.id ?? liveOf(blockId)?.id ?? null
    const created = plan.parts.map((part) => {
      const id = `${b.code}_${part.num}`
      if (part.zeroed) snapshotBlockZeroed(blockId, id, zeroSet)
      else snapshotBlock(blockId, id)
      return { part, id }
    })
    /* every group covered by this publication, across both releases */
    const covered = new Set(plan.parts.flatMap((p) => [...audienceToSet(p.audience)]))
    setReleases((rs) => rs
      .map((r) => {
        if (r.blockId !== blockId || r.status !== 'live') return r
        const remaining = new Set([...audienceToSet(r.audience)].filter((g) => !covered.has(g)))
        if (remaining.size === 0) return { ...r, status: 'previously-live' as const }
        // partial replacement — this release keeps serving the groups not covered by the new ones
        return { ...r, audience: audienceLabelOf(remaining) }
      })
      .concat(created.map(({ part, id }, i) => ({
        id, blockId, blockCode: b.code, num: part.num,
        name: draft?.name ?? 'Production release', status: 'live' as const,
        date: 'Aug 14, 2026', sort: 814 + (rs.length + i) / 1000, by: 'You',
        source: src, zeroedForAudience: part.zeroed,
        desc: `Published release created from ${src ?? '—'}.`
          + (part.zeroed
            ? ` Same mix as ${b.code}_${plan.parts[0].num}, with the login-only data sources set to 0 — ${part.audience} is never identified.`
            : plan.split ? ` Full mix, served to ${part.audience}.` : ` Configuration identical to ${src ?? '—'} at publication.`)
          + (note ? ` — ${note}` : ''),
        estimation: draft?.estimation ?? null,
        audience: part.audience,
      }))))
    resetBaselineFor(blockId)
    return created.map((c) => c.id)
  }

  /** Publish the pending draft(s) of a block: each keeps its own audience and its own weights,
      so an audience-split pair goes live as two releases at once. */
  function publishPending(blockId: string, note: string): string[] {
    const b = BLOCKS.find((x) => x.id === blockId) as Block
    const drafts = pendingDraftsOf(blockId)
    if (drafts.length === 0) return []
    const [maj] = maxNum(blockId)
    const created = drafts.map((d, i) => {
      const num = `V${maj + 1 + i}.0`
      const id = `${b.code}_${num}`
      releaseSnapshots.current[id] = releaseWeights(d)
      doorSnapshots.current[id] = releaseDoors(d)
      return { d, id, num }
    })
    const covered = new Set(created.flatMap(({ d }) => [...audienceToSet(d.audience)]))
    const batch = created.length > 1 ? created[0].id : undefined
    setReleases((rs) => rs
      .map((r) => {
        if (r.blockId !== blockId || r.status !== 'live') return r
        const remaining = new Set([...audienceToSet(r.audience)].filter((g) => !covered.has(g)))
        if (remaining.size === 0) return { ...r, status: 'previously-live' as const }
        return { ...r, audience: audienceLabelOf(remaining) }
      })
      .concat(created.map(({ d, id, num }, i) => ({
        id, blockId, blockCode: b.code, num,
        name: d.name, status: 'live' as const,
        date: 'Aug 14, 2026', sort: 814 + (rs.length + i) / 1000, by: 'You',
        source: d.id, batch, zeroedForAudience: d.zeroedForAudience,
        desc: `Published release created from ${d.id}. Configuration identical to ${d.id} at publication, served to ${d.audience ?? 'All visitors'}.`
          + (note ? ` — ${note}` : ''),
        estimation: d.estimation,
        audience: d.audience ?? 'All visitors',
      }))))
    resetBaselineFor(blockId)
    return created.map((c) => c.id)
  }

  function mockEstimation(seed: string): ImpactEstimation {
    const h = (s: string) => { let x = 7; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x }
    const e = 0.5 + (h(seed + 'e') % 45) / 10
    const a = 0.3 + (h(seed + 'a') % 32) / 10
    return { engagement: `+${e.toFixed(1)}%`, atc: `+${a.toFixed(1)}%` }
  }

  function runEstimation(releaseId: string) {
    setReleases((rs) => rs.map((r) => (r.id === releaseId && !r.estimation ? { ...r, estimation: mockEstimation(releaseId) } : r)))
  }

  function runAnalysis(releaseId: string) {
    setReleases((rs) => rs.map((r) => {
      if (r.id !== releaseId || r.analysis) return r
      const est = r.estimation ?? mockEstimation(releaseId)
      return { ...r, estimation: est, analysis: mockAnalysis(releaseId, est) }
    }))
  }

  return (
    <Ctx.Provider value={{
      compact, setCompact,
      displayMode, setDisplayMode,
      doorColors, addDoorColor, removeDoorColor,
      doorOptions, setDoorOption, doorConfigs, setDoorConfig, doorBlocks, toggleDoorBlock, doorsOfBlock, releaseDoors,
      blockLabels, setBlockLabel, categoryLabels, setCategoryLabel, labelOf,
      weights, setWeight, dirtyOf, releases, releasesOf, liveOf, latestDraftOf, pendingDraftOf, pendingDraftsOf, releaseWeights,
      nextDraftNum, nextPublishNum, audiencePlan, saveDraft, setReleaseAudience, publishLive, publishPending, runEstimation, runAnalysis,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}
