import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Field, inputCls, Modal } from '../components/ui'
import { useStore } from '../store'
import { BLOCKS, CONTENT_ENDPOINTS, FINAL_USER_GROUPS, GROUPS, MIX_TITLES, PLACEMENT_CATEGORIES, PURE_BLOCK_RULES, PURE_BLOCK_TITLES } from '../data'

/* ---------- mock data ---------- */
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

function AddPlacementModal({ onClose }: { onClose: () => void }) {
  const [created, setCreated] = useState(false)
  const [name, setName] = useState('')
  if (created) {
    return (
      <Modal title="Placement created" subtitle={`“${name || 'New Merch Block placement'}” was created as a draft placement (mock only — nothing is persisted in this prototype).`} onClose={onClose}>
        <div className="flex justify-end"><Button variant="primary" onClick={onClose}>Done</Button></div>
      </Modal>
    )
  }
  return (
    <Modal title="Add new merchandising block placement" subtitle="Declares a new merchandising placement. It will appear as a new column in the Merchandising Mix matrix, with its own independent release line." onClose={onClose}>
      <Field label="Block name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blog Article Merch Block" /></Field>
      <Field label="Page">
        <select className={inputCls}>
          <option>Homepage</option><option>Category</option><option>Catalog</option><option>Search</option>
          <option>Product</option><option>Cart</option><option>Account</option><option>Checkout</option><option>Other</option>
        </select>
      </Field>
      <Field label="Placement description"><textarea className={inputCls} rows={2} placeholder="Where does it sit in the page?" /></Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => setCreated(true)}>Create placement</Button>
      </div>
    </Modal>
  )
}

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

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-cyan-700' : 'bg-stone-300'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

function Perm({ ok }: { ok: boolean }) {
  return ok
    ? <span className="font-bold text-cyan-700">✓</span>
    : <span className="text-stone-300">—</span>
}

export function PreferencesPage() {
  const { doorColors, addDoorColor, removeDoorColor, blockLabels, setBlockLabel, categoryLabels, setCategoryLabel, doorOptions, setDoorOption } = useStore()
  const [accent, setAccent] = useState('cyan')
  const [dsUrl, setDsUrl] = useState('')
  const [userCanRemove, setUserCanRemove] = useState(false)
  const [showFavoritesSign, setShowFavoritesSign] = useState(true)
  const [dsConnected, setDsConnected] = useState(false)
  const [newColor, setNewColor] = useState('#7dd3fc')
  const [newColorName, setNewColorName] = useState('')
  const [showAddPlacement, setShowAddPlacement] = useState(false)
  const [pureTitles, setPureTitles] = useState<Record<string, string>>(PURE_BLOCK_TITLES)
  const [pureRules, setPureRules] = useState<Record<string, string>>(PURE_BLOCK_RULES)
  const [mixRows, setMixRows] = useState(MIX_TITLES)
  const [banDuplicates, setBanDuplicates] = useState(true)
  const [showProductLabels, setShowProductLabels] = useState(true)
  const [boostPurchaseIntent, setBoostPurchaseIntent] = useState(false)

  return (
    <div className="max-w-5xl px-8 py-8">
      <h1 className="text-[26px] font-bold tracking-tight text-stone-900">Preferences</h1>
      <p className="mt-1 max-w-3xl text-sm text-stone-500">
        Workspace-level settings of Merch Control. Changes here are mock state only — nothing is persisted in this prototype.
      </p>

      {/* ---------- Placement categories & placements (reference data) ---------- */}
      <h2 className="mt-9 text-[16px] font-bold tracking-tight text-stone-900">Placement categories &amp; placements</h2>
      <p className="mt-0.5 max-w-3xl text-[13px] text-stone-500">
        Merch Blocks live in placements, grouped in three placement categories. <b className="text-stone-700">IDs are immutable</b> — system identifiers used in release names, API calls and integrations. <b className="text-stone-700">Labels are editable</b> and used for display across the tool.
      </p>
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
      <div className="mt-4">
        <Button variant="primary" onClick={() => setShowAddPlacement(true)}>Add new merchandising block placement</Button>
      </div>
      {showAddPlacement && <AddPlacementModal onClose={() => setShowAddPlacement(false)} />}

      {/* ---------- Block titles ---------- */}
      <h2 className="mt-9 text-[16px] font-bold tracking-tight text-stone-900">Block titles</h2>
      <p className="mt-0.5 max-w-3xl text-[13px] text-stone-500">
        The headline displayed above a Merch Block, as the shopper reads it. A block driven by a single data source gets that source’s own title; a block mixing several sources gets a generic one.
        The last column is where you tell the model <b className="text-stone-700">when</b> a title applies — written in your own words.
      </p>
      <p className="mt-2 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] text-amber-800">
        <span className="rounded-full bg-amber-600 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">Beta</span>
        The instructions written for the model are an early feature: it reads them as guidance, so expect it to get some calls wrong while we tune it.
      </p>

      <div className="soft-card mt-3 overflow-x-auto">
        <table className="w-full min-w-[900px] text-[13px]">
          <thead>
            <tr className="border-b-2 border-cyan-600 text-left text-[10.5px] uppercase tracking-wide text-stone-400">
              <th className="w-[260px] px-4 py-2.5 font-semibold">Data source <span className="font-normal normal-case">— not editable</span></th>
              <th className="w-[280px] px-3 py-2.5 font-semibold">Title of a pure-player block</th>
              <th className="px-3 py-2.5 font-semibold">When to apply it <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-bold tracking-wide text-amber-700">Beta — told to the AI</span></th>
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => (
              <Fragment key={g.id}>
                <tr>
                  <td colSpan={3} className="border-b border-stone-100 bg-stone-50/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">{g.title}</td>
                </tr>
                {g.sources.map((src) => (
                  <tr key={src.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-1.5 text-stone-600">{src.name}</td>
                    <td className="px-3 py-1.5">
                      <input
                        value={pureTitles[src.id] ?? ''}
                        onChange={(e) => setPureTitles((p) => ({ ...p, [src.id]: e.target.value }))}
                        placeholder="Title shown to the shopper"
                        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13px] font-medium text-stone-800 hover:border-stone-300 focus:border-cyan-600 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        value={pureRules[src.id] ?? ''}
                        onChange={(e) => setPureRules((p) => ({ ...p, [src.id]: e.target.value }))}
                        placeholder="e.g. only if at least 6 products qualify — otherwise use a generic title"
                        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-[12.5px] text-stone-600 hover:border-stone-300 focus:border-cyan-600 focus:bg-white focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="soft-card mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-[13px]">
          <thead>
            <tr className="border-b-2 border-cyan-600 text-left text-[10.5px] uppercase tracking-wide text-stone-400">
              <th className="w-[260px] px-4 py-2.5 font-semibold">Composition of the block <span className="font-normal normal-case">— editable</span></th>
              <th className="w-[280px] px-3 py-2.5 font-semibold">Generic title</th>
              <th className="px-3 py-2.5 font-semibold">When to apply it <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-bold tracking-wide text-amber-700">Beta — told to the AI</span></th>
            </tr>
          </thead>
          <tbody>
            {mixRows.map((row, i) => (
              <tr key={row.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-1.5">
                  <input
                    value={row.when}
                    onChange={(e) => setMixRows((p) => p.map((r, j) => (j === i ? { ...r, when: e.target.value } : r)))}
                    placeholder="e.g. A mix leaning on promotions"
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13px] text-stone-600 hover:border-stone-300 focus:border-cyan-600 focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    value={row.title}
                    onChange={(e) => setMixRows((p) => p.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13px] font-medium text-stone-800 hover:border-stone-300 focus:border-cyan-600 focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    value={row.rule}
                    onChange={(e) => setMixRows((p) => p.map((r, j) => (j === i ? { ...r, rule: e.target.value } : r)))}
                    placeholder="e.g. never on a product page"
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-[12.5px] text-stone-600 hover:border-stone-300 focus:border-cyan-600 focus:bg-white focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- Options for Merchandising Doors ---------- */}
      <h2 className="mt-9 text-[16px] font-bold tracking-tight text-stone-900">Options for Merchandising Doors</h2>
      <p className="mt-0.5 max-w-3xl text-[13px] text-stone-500">
        A door is the fixed link-card placed inside a Merch Block, opening the full curated list the block only samples.
        Each data-source group of the Merchandising Mix offers its own destinations — the door panels of the matrix read this list live.
        Display texts and links are the suggested defaults; both stay editable in the matrix, and the whole door is captured in the block release.
      </p>
      {GROUPS.map((g) => {
        const opts = doorOptions[g.id] ?? []
        return (
          <div key={g.id} className="soft-card mt-4 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-stone-50/60 px-5 py-2.5">
              <span className="text-[13px] font-bold text-stone-800">{g.title}</span>
              <span className="text-[11px] text-stone-400">{opts.length} option{opts.length > 1 ? 's' : ''}</span>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-stone-100 text-left text-[10.5px] uppercase tracking-wide text-stone-400">
                  <th className="w-[240px] px-5 py-2 font-semibold">Option</th>
                  <th className="w-[300px] px-3 py-2 font-semibold">Default display text</th>
                  <th className="px-3 py-2 font-semibold">Default link</th>
                </tr>
              </thead>
              <tbody>
                {opts.map((o) => (
                  <tr key={o.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-5 py-1">
                      <input
                        value={o.label}
                        onChange={(e) => setDoorOption(g.id, o.id, { label: e.target.value })}
                        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13px] font-medium text-stone-800 hover:border-stone-300 focus:border-cyan-600 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-1">
                      <input
                        value={o.defaultText}
                        onChange={(e) => setDoorOption(g.id, o.id, { defaultText: e.target.value })}
                        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13px] text-stone-700 hover:border-stone-300 focus:border-cyan-600 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-1">
                      <input
                        value={o.defaultUrl}
                        onChange={(e) => setDoorOption(g.id, o.id, { defaultUrl: e.target.value })}
                        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-mono text-[11.5px] text-cyan-800 hover:border-stone-300 focus:border-cyan-600 focus:bg-white focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
      <div className="soft-card mt-4 divide-y divide-stone-100">
        {CONTENT_ENDPOINTS.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
            <div className="min-w-[240px] flex-1">
              <div className="text-[13.5px] font-semibold text-stone-800">
                {e.id === 'categories' ? 'Entries to category pages' : 'Entries to marketing landing pages'}
                <span className="ml-2 rounded-full bg-cyan-50 px-2 py-px align-middle text-[9.5px] font-bold uppercase tracking-wide text-cyan-700">live from API</span>
              </div>
              <div className="mt-0.5 text-[12px] text-stone-400">{e.usedFor}</div>
            </div>
            <Link to="/swagger" className="rounded-full border border-cyan-300 px-3 py-1 text-[11px] font-semibold whitespace-nowrap text-cyan-700 hover:bg-cyan-50">
              GET {e.api.replace('https://api.store.example/v1', '')} — see Swagger
            </Link>
          </div>
        ))}
      </div>

      {/* ---------- Audience (final-user groups) ---------- */}
      <h2 className="mt-9 text-[16px] font-bold tracking-tight text-stone-900">Audience, the final-user groups</h2>
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
        <IntegrationRow
          name="Link to Preview tool"
          desc="Renders a Merch Block with the products a given mix would actually select, so a release can be reviewed on the real page layout before publication."
          placeholder="https://preview.your-platform.example"
        />
      </div>

      <h3 className="mt-6 text-[13.5px] font-bold tracking-tight text-stone-800">Featured in all merch blocks</h3>
      <p className="mt-0.5 text-[13px] text-stone-500">Rules applied to every Merch Block of the site, whatever its mix.</p>
      <div className="soft-card mt-3 divide-y divide-stone-100">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="min-w-[220px] flex-1">
            <div className="text-[13.5px] font-semibold text-stone-800">Ban duplicates in one merch block</div>
            <div className="text-[12px] text-stone-400">A product selected by several data sources is displayed once only — the remaining slots are filled by the next-ranked products.</div>
          </div>
          <Toggle on={banDuplicates} onClick={() => setBanDuplicates(!banDuplicates)} />
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="min-w-[220px] flex-1">
            <div className="text-[13.5px] font-semibold text-stone-800">Show label on each product (best seller, new, back in stock, etc)</div>
            <div className="text-[12px] text-stone-400">Displays the badge matching the data source that selected the product, on the product card inside the block.</div>
          </div>
          <Toggle on={showProductLabels} onClick={() => setShowProductLabels(!showProductLabels)} />
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="min-w-[220px] flex-1">
            <div className="text-[13.5px] font-semibold text-stone-800">Display the Favorites icon on each product (to add to favorites)</div>
            <div className="text-[12px] text-stone-400">Shows the wishlist/favorites heart on every product card rendered inside a Merch Block.</div>
          </div>
          <Toggle on={showFavoritesSign} onClick={() => setShowFavoritesSign(!showFavoritesSign)} />
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="min-w-[220px] flex-1">
            <div className="text-[13.5px] font-semibold text-stone-800">Enable the final user to remove a product from the merchandising blocks we present to him</div>
            <div className="text-[12px] text-stone-400">Adds a discreet dismiss control on each product of the Merch Blocks; removed products are excluded from that user's future selections.</div>
          </div>
          <Toggle on={userCanRemove} onClick={() => setUserCanRemove(!userCanRemove)} />
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="min-w-[220px] flex-1">
            <div className="text-[13.5px] font-semibold text-stone-800">Boost the merchandising presence of products with purchase intent</div>
            <div className="text-[12px] text-stone-400">Products showing a strong purchase-intent signal for the visitor (cart, wishlist, repeated views) are ranked higher across every block.</div>
          </div>
          <Toggle on={boostPurchaseIntent} onClick={() => setBoostPurchaseIntent(!boostPurchaseIntent)} />
        </div>
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
