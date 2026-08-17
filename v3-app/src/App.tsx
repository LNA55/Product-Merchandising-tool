import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './store'
import { MixPage } from './pages/MixPage'
import { BlocksPage } from './pages/BlocksPage'
import { VersionsPage } from './pages/VersionsPage'
import { VersionDetailPage } from './pages/VersionDetailPage'
import { SessionPage } from './pages/SessionPage'
import { SwaggerPage } from './pages/SwaggerPage'
import { EstimationPage } from './pages/EstimationPage'
import { ImpactPage } from './pages/ImpactPage'
import { HomePage } from './pages/HomePage'
import { PreferencesPage } from './pages/PreferencesPage'
import { BLOCKS } from './data'

/** Thin subdomain bar with the breadcrumb, like the rest of pp.shoette.com. */
function Breadcrumb() {
  const { pathname } = useLocation()
  let label = 'Merchandising Mix'
  if (pathname === '/') label = 'Home'
  else if (pathname.startsWith('/swagger')) label = 'Swagger'
  else if (pathname.startsWith('/estimation/')) {
    const blk = BLOCKS.find((b) => b.id === pathname.split('/')[2])
    label = `Impact Estimation — ${blk?.code ?? '?'}`
  }
  else if (pathname.startsWith('/impact')) label = 'Impact'
  else if (pathname.startsWith('/preferences')) label = 'Preferences'
  else if (pathname.startsWith('/merch-blocks')) label = 'Merch Blocks'
  else if (pathname.startsWith('/versions/')) label = decodeURIComponent(pathname.split('/')[2] ?? '')
  else if (pathname.startsWith('/versions')) label = 'Release History'
  else if (pathname.startsWith('/session-definition')) label = '“Session” definition'

  const sep = <span className="mx-2 text-stone-500">›</span>
  return (
    <div className="border-b border-black bg-black px-6 py-2.5">
      <nav className="text-[12.5px] text-white" aria-label="Fil d'Ariane">
        <a href="https://shoette.com/" className="hover:text-cyan-300">shoette.com</a>{sep}
        <a href="/" className="hover:text-cyan-300">pp</a>{sep}
        <a href="/" className="hover:text-cyan-300">Product Personnalisation</a>{sep}
        <NavLink to="/merchandising-mix" className="hover:text-cyan-300">Version 3</NavLink>{sep}
        <span aria-current="page" className="font-semibold text-white">{label}</span>
      </nav>
    </div>
  )
}

/** Traditional horizontal app header with pill navigation. */
function AppHeader() {
  const { pathname } = useLocation()
  const { compact, setCompact } = useStore()
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-cyan-700 text-white shadow-sm' : 'text-stone-600 hover:bg-cyan-50 hover:text-cyan-800'
    }`
  return (
    <header className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-stone-200/70 bg-white px-6 py-3.5">
      <NavLink to="/" title="Merch Control — home" className="block rounded-xl px-1 transition-opacity hover:opacity-70">
        <div className="text-[16px] font-bold leading-tight tracking-tight text-stone-900">Merch Control</div>
      </NavLink>
      <nav className="flex gap-1 rounded-full border border-stone-200/80 bg-stone-50 p-1">
        <NavLink to="/merchandising-mix" className={linkCls}>Merchandising Mix</NavLink>
        <NavLink to="/swagger" className={linkCls}>Swagger</NavLink>
        <NavLink to="/merch-blocks" className={linkCls}>Merch Blocks</NavLink>
        <NavLink to="/versions" className={linkCls}>Release History</NavLink>
        <NavLink to="/impact" className={linkCls}>Impact</NavLink>
        <NavLink to="/preferences" className={linkCls}>Preferences</NavLink>
      </nav>
      {pathname === '/merchandising-mix' && compact && (
        <h1 className="text-[17px] font-bold tracking-tight text-stone-900">Merchandising Mix</h1>
      )}
      <div className="ml-auto flex items-center gap-5">
        {pathname === '/merchandising-mix' && (
          <button
            type="button"
            onClick={() => setCompact(!compact)}
            className="text-xs text-stone-400 underline underline-offset-2 hover:text-cyan-700"
          >
            {compact ? 'Full view' : 'Compact view'}
          </button>
        )}
        <div className="flex items-center gap-2" title="Signed in as admin (front-only — user accounts are coming later)">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-100 text-stone-500">
            <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
              <circle cx="10" cy="7" r="3.2" />
              <path d="M3.8 16.2a6.2 6.2 0 0 1 12.4 0v.3H3.8z" />
            </svg>
          </span>
          <span className="text-sm font-medium text-stone-700">admin</span>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter basename="/version-3">
        <Breadcrumb />
        <AppHeader />
        <main className="min-w-0">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/merchandising-mix" element={<MixPage />} />
            <Route path="/swagger" element={<SwaggerPage />} />
            <Route path="/estimation/:blockId" element={<EstimationPage />} />
            <Route path="/impact" element={<ImpactPage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
            <Route path="/merch-blocks" element={<BlocksPage />} />
            <Route path="/versions" element={<VersionsPage />} />
            <Route path="/versions/:releaseId" element={<VersionDetailPage />} />
            <Route path="/session-definition" element={<SessionPage />} />
            <Route path="*" element={<Navigate to="/merchandising-mix" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </StoreProvider>
  )
}
