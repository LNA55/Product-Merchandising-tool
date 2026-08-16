import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  defaultWeights, parseV, SEED_VERSIONS,
  type ImpactEstimation, type MixVersion, type Weights,
} from './data'

interface Store {
  weights: Weights
  setWeight: (key: string, value: number) => void
  dirtyCount: number
  versions: MixVersion[]
  liveVersion: MixVersion | undefined
  latestDraft: MixVersion | undefined
  nextDraftId: string
  nextPublishId: string
  lastSaved: string
  saveDraft: (name: string, desc: string) => string
  publishLive: (note: string) => string
  runEstimation: (versionId: string) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const defaults = useMemo(() => defaultWeights(), [])
  const [weights, setWeights] = useState<Weights>(defaults)
  const [baseline, setBaseline] = useState<Weights>(defaults)
  const [versions, setVersions] = useState<MixVersion[]>(SEED_VERSIONS)
  const [lastSaved, setLastSaved] = useState('Aug 12, 2026 — 14:32')

  const dirtyCount = useMemo(
    () => Object.keys(weights).filter((k) => weights[k] !== baseline[k]).length,
    [weights, baseline],
  )

  const liveVersion = versions.find((v) => v.status === 'live')
  const drafts = versions.filter((v) => v.status === 'draft')
  const latestDraft = drafts[drafts.length - 1]

  const maxV = versions.map((v) => parseV(v.id)).sort((a, b) => a[0] - b[0] || a[1] - b[1]).pop() ?? [0, 0]
  const nextDraftId = `V${maxV[0]}.${maxV[1] + 1}`
  const nextPublishId = `V${maxV[0] + 1}.0`

  function setWeight(key: string, value: number) {
    setWeights((w) => ({ ...w, [key]: Math.max(0, Math.min(100, Math.round(value))) }))
  }

  function mockEstimation(id: string): ImpactEstimation {
    const h = (s: string) => { let x = 7; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x }
    const e = 0.5 + (h(id + 'e') % 45) / 10
    const a = 0.3 + (h(id + 'a') % 32) / 10
    return { engagement: `+${e.toFixed(1)}%`, atc: `+${a.toFixed(1)}%` }
  }

  function saveDraft(name: string, desc: string): string {
    const id = nextDraftId
    setVersions((vs) => [...vs, {
      id, name: name || 'Untitled draft', status: 'draft', date: 'Aug 14, 2026', by: 'You',
      source: vs[vs.length - 1].id, desc, estimation: null,
    }])
    setBaseline(weights)
    setLastSaved('Aug 14, 2026 — just now')
    return id
  }

  function publishLive(note: string): string {
    const id = nextPublishId
    const src = latestDraft?.id ?? liveVersion?.id ?? 'V0.0'
    setVersions((vs) => vs
      .map((v) => (v.status === 'live' ? { ...v, status: 'previously-live' as const } : v))
      .concat({
        id, name: latestDraft?.name ?? 'Production publication', status: 'live', date: 'Aug 14, 2026', by: 'You',
        source: src,
        desc: `Published version created from ${src}. Configuration identical to ${src} at publication.` + (note ? ` — ${note}` : ''),
        estimation: latestDraft?.estimation ?? null,
      }))
    setBaseline(weights)
    setLastSaved('Aug 14, 2026 — just now')
    return id
  }

  function runEstimation(versionId: string) {
    setVersions((vs) => vs.map((v) => (v.id === versionId && !v.estimation ? { ...v, estimation: mockEstimation(versionId) } : v)))
  }

  return (
    <Ctx.Provider value={{
      weights, setWeight, dirtyCount, versions, liveVersion, latestDraft,
      nextDraftId, nextPublishId, lastSaved, saveDraft, publishLive, runEstimation,
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
