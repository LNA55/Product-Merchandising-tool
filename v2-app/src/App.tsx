import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store'
import { MixPage } from './pages/MixPage'
import { BlocksPage } from './pages/BlocksPage'
import { VersionsPage } from './pages/VersionsPage'
import { VersionDetailPage } from './pages/VersionDetailPage'
import { SessionPage } from './pages/SessionPage'

function Sidebar() {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `block rounded-md px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-teal-50 text-teal-800' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }`
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-4">
        <div className="text-[15px] font-semibold tracking-tight text-neutral-900">Merch Control</div>
        <div className="text-[11px] uppercase tracking-widest text-teal-700">Version 2 · prototype</div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavLink to="/merchandising-mix" className={linkCls}>Merchandising Mix</NavLink>
        <NavLink to="/merch-blocks" className={linkCls}>Merch Blocks</NavLink>
        <NavLink to="/versions" className={linkCls}>Version History</NavLink>
      </nav>
      <div className="border-t border-neutral-200 px-4 py-3">
        <a href="/" className="text-xs text-neutral-400 hover:text-teal-700">← pp.shoette.com</a>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter basename="/version-2">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/merchandising-mix" replace />} />
              <Route path="/merchandising-mix" element={<MixPage />} />
              <Route path="/merch-blocks" element={<BlocksPage />} />
              <Route path="/versions" element={<VersionsPage />} />
              <Route path="/versions/:versionId" element={<VersionDetailPage />} />
              <Route path="/session-definition" element={<SessionPage />} />
              <Route path="*" element={<Navigate to="/merchandising-mix" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </StoreProvider>
  )
}
