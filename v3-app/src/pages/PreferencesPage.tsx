import { useState } from 'react'
import { Badge, Button } from '../components/ui'
import { useStore } from '../store'

/* ---------- mock data ---------- */
/** Final user groups = audience segments of the e-commerce site itself.
    Each group will eventually see its own Merchandising Mix (not wired to the matrix yet). */
const FINAL_USER_GROUPS = [
  { name: 'Prospects', criteria: 'Signed out · no cookie history — first contact with the site.', identification: 'Anonymous', share: '34%' },
  { name: 'Returning visitors', criteria: 'Signed out · known first-party cookie, no account.', identification: 'Cookie', share: '22%' },
  { name: 'Signed in, no purchase', criteria: 'Identified account · zero purchases to date.', identification: 'Signed in', share: '12%' },
  { name: 'Active customers', criteria: 'Signed in · one or more purchases in the past 13 months.', identification: 'Signed in', share: '21%' },
  { name: 'Lapsed customers', criteria: 'Signed in · last purchase more than 13 months ago.', identification: 'Signed in', share: '8%' },
  { name: 'VIP customers', criteria: 'Signed in · top 5% by revenue over the past 24 months.', identification: 'Signed in', share: '3%' },
]

const USER_GROUPS = [
  { name: 'Administrators', members: 3, canEdit: true, canPublish: true, canManageBlocks: true, canConfigure: true },
  { name: 'Merchandisers', members: 11, canEdit: true, canPublish: true, canManageBlocks: false, canConfigure: false },
  { name: 'Product team', members: 8, canEdit: true, canPublish: false, canManageBlocks: false, canConfigure: false },
  { name: 'Analysts', members: 6, canEdit: false, canPublish: false, canManageBlocks: false, canConfigure: false },
  { name: 'Viewers', members: 24, canEdit: false, canPublish: false, canManageBlocks: false, canConfigure: false },
]

const ACCENTS = [
  { id: 'cyan', label: 'Cyan', hex: '#0e7490' },
  { id: 'teal', label: 'Teal', hex: '#0f766e' },
  { id: 'indigo', label: 'Indigo', hex: '#4338ca' },
  { id: 'plum', label: 'Plum', hex: '#86198f' },
  { id: 'black', label: 'Black', hex: '#1c1917' },
]

function IntegrationRow({ name, desc, placeholder, initialUrl, initiallyConnected }: {
  name: string
  desc: string
  placeholder: string
  initialUrl?: string
  initiallyConnected?: boolean
}) {
  const [url, setUrl] = useState(initialUrl ?? '')
  const [connected, setConnected] = useState(initiallyConnected ?? false)
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="min-w-[220px] flex-1">
        <div className="text-[13.5px] font-semibold text-stone-800">{name}</div>
        <div className="text-[12px] text-stone-400">{desc}</div>
      </div>
      {connected ? (
        <div className="flex items-center gap-3">
          <Badge tone="live">Connected</Badge>
          <span className="font-mono text-[11px] text-stone-500">{url || placeholder}</span>
          <Button variant="secondary" onClick={() => setConnected(false)}>Disconnect</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="w-72 rounded-xl border border-stone-300 bg-white px-3 py-1.5 font-mono text-[11.5px] text-cyan-800 focus:border-cyan-600 focus:outline-none"
          />
          <Button variant="primary" onClick={() => setConnected(true)} disabled={!url}>Connect</Button>
        </div>
      )}
    </div>
  )
}

function Perm({ ok }: { ok: boolean }) {
  return ok
    ? <span className="font-bold text-cyan-700">✓</span>
    : <span className="text-stone-300">—</span>
}

export function PreferencesPage() {
  const { doorColors, addDoorColor, removeDoorColor } = useStore()
  const [accent, setAccent] = useState('cyan')
  const [dsUrl, setDsUrl] = useState('')
  const [dsConnected, setDsConnected] = useState(false)
  const [newColor, setNewColor] = useState('#7dd3fc')
  const [newColorName, setNewColorName] = useState('')

  return (
    <div className="max-w-5xl px-8 py-8">
      <h1 className="text-[26px] font-bold tracking-tight text-stone-900">Preferences</h1>
      <p className="mt-1 max-w-3xl text-sm text-stone-500">
        Workspace-level settings of Merch Control. Changes here are mock state only — nothing is persisted in this prototype.
      </p>

      {/* ---------- Final user groups ---------- */}
      <h2 className="mt-9 text-[16px] font-bold tracking-tight text-stone-900">Final user groups</h2>
      <p className="mt-0.5 max-w-3xl text-[13px] text-stone-500">
        Audience segments of the e-commerce site itself — the shoppers. Each group will be able to see its own Merchandising Mix (e.g. Prospects get one mix, Active customers another).
      </p>
      <div className="soft-card mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-b-2 border-cyan-600 text-left text-[11px] uppercase tracking-wide text-stone-400">
              <th className="px-4 py-2.5 font-semibold">Group</th>
              <th className="px-4 py-2.5 font-semibold">Definition</th>
              <th className="px-4 py-2.5 font-semibold">Identification</th>
              <th className="px-4 py-2.5 text-right font-semibold">Traffic share</th>
            </tr>
          </thead>
          <tbody>
            {FINAL_USER_GROUPS.map((g) => (
              <tr key={g.name} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-2.5 font-medium whitespace-nowrap text-stone-800">{g.name}</td>
                <td className="px-4 py-2.5 text-stone-600">{g.criteria}</td>
                <td className="px-4 py-2.5"><Badge tone={g.identification === 'Signed in' ? 'teal' : 'neutral'}>{g.identification}</Badge></td>
                <td className="px-4 py-2.5 text-right tabular-nums text-stone-600">{g.share}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="secondary">Add final user group</Button>
        <span className="text-[11.5px] text-amber-700">Not linked to the Merchandising Mix yet — per-group mixes are a planned evolution.</span>
      </div>

      {/* ---------- Roles & permissions ---------- */}
      <h2 className="mt-10 text-[16px] font-bold tracking-tight text-stone-900">Roles &amp; permissions</h2>
      <p className="mt-0.5 text-[13px] text-stone-500">Who can do what in the Merch Control workspace. Permissions apply per role; a user inherits the union of their roles.</p>
      <div className="soft-card mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-b-2 border-cyan-600 text-left text-[11px] uppercase tracking-wide text-stone-400">
              <th className="px-4 py-2.5 font-semibold">Role</th>
              <th className="px-4 py-2.5 text-right font-semibold">Members</th>
              <th className="px-4 py-2.5 text-center font-semibold">Edit weights</th>
              <th className="px-4 py-2.5 text-center font-semibold">Publish live</th>
              <th className="px-4 py-2.5 text-center font-semibold">Manage blocks</th>
              <th className="px-4 py-2.5 text-center font-semibold">Preferences</th>
            </tr>
          </thead>
          <tbody>
            {USER_GROUPS.map((g) => (
              <tr key={g.name} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-stone-800">{g.name}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-stone-600">{g.members}</td>
                <td className="px-4 py-2.5 text-center"><Perm ok={g.canEdit} /></td>
                <td className="px-4 py-2.5 text-center"><Perm ok={g.canPublish} /></td>
                <td className="px-4 py-2.5 text-center"><Perm ok={g.canManageBlocks} /></td>
                <td className="px-4 py-2.5 text-center"><Perm ok={g.canConfigure} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <Button variant="secondary">Add role</Button>
      </div>

      {/* ---------- Advanced features ---------- */}
      <h2 className="mt-10 text-[16px] font-bold tracking-tight text-stone-900">Advanced features</h2>
      <p className="mt-0.5 text-[13px] text-stone-500">External tools integrated with the workspace.</p>
      <div className="soft-card mt-3 divide-y divide-stone-100">
        <IntegrationRow
          name="Link to the Impact Analysis tool"
          desc="The external Impact Suite computing the pre-launch Impact Estimations and the post-launch Impact Analyses shown across the app."
          placeholder="https://impact-suite.example.com"
          initialUrl="https://impact-suite.example.com"
          initiallyConnected
        />
        <IntegrationRow
          name="Link to Data tool"
          desc="The data platform serving the product feeds and the KPI collection (displayed, viewed, clicked, add-to-cart attributed)."
          placeholder="https://data.your-platform.example"
        />
      </div>

      {/* ---------- Design preferences ---------- */}
      <h2 className="mt-10 text-[16px] font-bold tracking-tight text-stone-900">Design preferences</h2>
      <p className="mt-0.5 text-[13px] text-stone-500">How Merch Control looks for you. Personal settings — they do not affect other users.</p>
      <div className="soft-card mt-3 divide-y divide-stone-100">
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <div className="min-w-[220px] flex-1">
            <div className="text-[13.5px] font-semibold text-stone-800">Accent color</div>
            <div className="text-[12px] text-stone-400">Used for actions, badges and highlights across the app.</div>
          </div>
          <div className="flex items-center gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                title={a.label}
                onClick={() => setAccent(a.id)}
                className={`h-8 w-8 rounded-full border-2 transition-transform ${accent === a.id ? 'scale-110 border-stone-800' : 'border-stone-200 hover:scale-105'}`}
                style={{ background: a.hex }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <div className="min-w-[220px] flex-1">
            <div className="text-[13.5px] font-semibold text-stone-800">Design system</div>
            <div className="text-[12px] text-stone-400">Link Merch Control to your design system to inherit its tokens (colors, radii, typography). Tokens override the local design preferences above.</div>
          </div>
          {dsConnected ? (
            <div className="flex items-center gap-3">
              <Badge tone="live">Connected</Badge>
              <span className="text-[12px] tabular-nums text-stone-500">42 tokens imported · synced just now</span>
              <Button variant="secondary" onClick={() => setDsConnected(false)}>Disconnect</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={dsUrl}
                onChange={(e) => setDsUrl(e.target.value)}
                placeholder="https://tokens.your-ds.example/tokens.json"
                className="w-72 rounded-xl border border-stone-300 bg-white px-3 py-1.5 font-mono text-[11.5px] text-cyan-800 focus:border-cyan-600 focus:outline-none"
              />
              <Button variant="primary" onClick={() => setDsConnected(true)} disabled={!dsUrl}>Connect</Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-start gap-4 px-5 py-4">
          <div className="min-w-[220px] flex-1">
            <div className="text-[13.5px] font-semibold text-stone-800">Merchandising door backgrounds</div>
            <div className="text-[12px] text-stone-400">The background colors offered in every Merchandising door editor of the matrix. Remove a swatch or add your own.</div>
          </div>
          <div className="max-w-[380px]">
            <div className="flex flex-wrap items-center gap-2">
              {doorColors.map((c) => (
                <span key={c.id} className="group relative inline-block" title={`${c.label} · ${c.bg}`}>
                  <span className="block h-8 w-8 rounded-full border-2 border-stone-200" style={{ background: c.bg }} />
                  <button
                    type="button"
                    onClick={() => removeDoorColor(c.id)}
                    title={`Remove ${c.label}`}
                    className="absolute -top-1.5 -right-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-stone-800 text-[9px] font-bold text-white group-hover:flex"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                title="Pick a new background color"
                className="h-8 w-10 cursor-pointer rounded-lg border border-stone-300 bg-white p-0.5"
              />
              <input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Color name (optional)"
                className="w-44 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-[12.5px] focus:border-cyan-600 focus:outline-none"
              />
              <Button variant="secondary" onClick={() => { addDoorColor(newColor, newColorName); setNewColorName('') }}>Add color</Button>
            </div>
            <p className="mt-1.5 text-[11px] text-stone-400">The text color of each door adapts automatically to the background’s luminance.</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-stone-400">Sandbox — groups, features and design settings are illustrative; only the accent “Cyan” is actually implemented in this prototype.</p>
    </div>
  )
}
