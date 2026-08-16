import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  BLOCKS, DEFAULT_DOOR_COLORS, defaultWeights, parseNum, seedReleases,
  type Block, type BlockRelease, type DoorColor, type ImpactEstimation, type Weights,
} from './data'

interface Store {
  compact: boolean
  setCompact: (v: boolean) => void
  doorColors: DoorColor[]
  addDoorColor: (bg: string, label: string) => void
  removeDoorColor: (id: string) => void
  weights: Weights
  setWeight: (key: string, value: number) => void
  dirtyOf: (blockId: string) => number
  releases: BlockRelease[]
  releasesOf: (blockId: string) => BlockRelease[]
  liveOf: (blockId: string) => BlockRelease | undefined
  latestDraftOf: (blockId: string) => BlockRelease | undefined
  nextDraftNum: (blockId: string) => string
  nextPublishNum: (blockId: string) => string
  saveDraft: (blockId: string, name: string, desc: string) => string
  publishLive: (blockId: string, note: string) => string
  runEstimation: (releaseId: string) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const defaults = useMemo(() => defaultWeights(), [])
  const seeds = useMemo(() => BLOCKS.flatMap((b) => seedReleases(b)), [])
  const [weights, setWeights] = useState<Weights>(defaults)
  const [baseline, setBaseline] = useState<Weights>(defaults)
  const [releases, setReleases] = useState<BlockRelease[]>(seeds)
  const [compact, setCompact] = useState(false)
  const [doorColors, setDoorColors] = useState<DoorColor[]>(DEFAULT_DOOR_COLORS)

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

  function setWeight(key: string, value: number) {
    setWeights((w) => ({ ...w, [key]: Math.max(0, Math.min(10, Math.round(value))) }))
  }

  const dirtyOf = (blockId: string) =>
    Object.keys(weights).filter((k) => k.endsWith(`|${blockId}`) && weights[k] !== baseline[k]).length

  const releasesOf = (blockId: string) =>
    releases.filter((r) => r.blockId === blockId).sort((a, z) => a.sort - z.sort)

  const liveOf = (blockId: string) => releasesOf(blockId).find((r) => r.status === 'live')

  const latestDraftOf = (blockId: string) => {
    const d = releasesOf(blockId).filter((r) => r.status === 'draft')
    return d[d.length - 1]
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

  function resetBaselineFor(blockId: string) {
    setBaseline((base) => {
      const next = { ...base }
      for (const k of Object.keys(weights)) if (k.endsWith(`|${blockId}`)) next[k] = weights[k]
      return next
    })
  }

  function saveDraft(blockId: string, name: string, desc: string): string {
    const b = BLOCKS.find((x) => x.id === blockId) as Block
    const num = nextDraftNum(blockId)
    const id = `${b.code}_${num}`
    const prev = releasesOf(blockId).pop()
    setReleases((rs) => [...rs, {
      id, blockId, blockCode: b.code, num, name: name || 'Untitled draft', status: 'draft',
      date: 'Aug 14, 2026', sort: 814 + rs.length / 1000, by: 'You',
      source: prev?.id ?? null, desc, estimation: null,
    }])
    resetBaselineFor(blockId)
    return id
  }

  function publishLive(blockId: string, note: string): string {
    const b = BLOCKS.find((x) => x.id === blockId) as Block
    const num = nextPublishNum(blockId)
    const id = `${b.code}_${num}`
    const src = latestDraftOf(blockId)?.id ?? liveOf(blockId)?.id ?? null
    setReleases((rs) => rs
      .map((r) => (r.blockId === blockId && r.status === 'live' ? { ...r, status: 'previously-live' as const } : r))
      .concat({
        id, blockId, blockCode: b.code, num,
        name: latestDraftOf(blockId)?.name ?? 'Production release', status: 'live',
        date: 'Aug 14, 2026', sort: 814 + rs.length / 1000, by: 'You',
        source: src,
        desc: `Published release created from ${src ?? '—'}. Configuration identical to ${src ?? '—'} at publication.` + (note ? ` — ${note}` : ''),
        estimation: latestDraftOf(blockId)?.estimation ?? null,
      }))
    resetBaselineFor(blockId)
    return id
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

  return (
    <Ctx.Provider value={{
      compact, setCompact,
      doorColors, addDoorColor, removeDoorColor,
      weights, setWeight, dirtyOf, releases, releasesOf, liveOf, latestDraftOf,
      nextDraftNum, nextPublishNum, saveDraft, publishLive, runEstimation,
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
