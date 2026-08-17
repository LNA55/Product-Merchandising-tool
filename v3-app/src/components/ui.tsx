import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Button({ children, variant = 'secondary', size = 'md', onClick, disabled, type = 'button' }: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'sm'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const base = 'inline-flex items-center gap-1.5 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { md: 'px-4 py-2 text-sm', sm: 'px-2.5 py-1 text-[11px]' }
  const styles = {
    primary: 'bg-cyan-700 text-white hover:bg-cyan-600 shadow-sm hover:shadow',
    secondary: 'border border-stone-300 bg-white text-stone-700 hover:border-cyan-600 hover:text-cyan-700',
    ghost: 'text-cyan-700 hover:bg-cyan-50',
  }
  return (
    <button type={type} className={`${base} ${sizes[size]} ${styles[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'teal' | 'live' | 'prev' | 'amber' }) {
  const styles = {
    neutral: 'border border-stone-200 text-stone-500 bg-stone-50',
    teal: 'bg-cyan-50 text-cyan-800 border border-cyan-100',
    live: 'bg-cyan-700 text-white border border-cyan-700',
    prev: 'bg-stone-100 text-stone-500 border border-stone-200',
    amber: 'bg-amber-50 text-amber-800 border border-amber-100',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap ${styles[tone]}`}>
      {children}
    </span>
  )
}

export function Modal({ title, subtitle, children, onClose }: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-[2px]" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
        <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-semibold tracking-wide text-stone-500">{label}</span>
      {children}
    </label>
  )
}

export const inputCls = 'w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-600/20'

/** The word "session" — always a subtle link to /session-definition. */
export function SessionWord({ plural = false }: { plural?: boolean }) {
  return (
    <Link
      to="/session-definition"
      className="text-inherit underline decoration-cyan-500 decoration-dotted underline-offset-2 hover:text-cyan-700"
      title="How we define a session — click for the full definition"
    >
      session{plural ? 's' : ''}
    </Link>
  )
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.preventDefault()}
      title="External system (mock link — not wired in this prototype)"
      className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-2 hover:text-cyan-700 hover:decoration-cyan-500"
    >
      {children} ↗
    </a>
  )
}

/** Discreet info popin — opens on hover and on click (click does not bubble,
    so it is safe inside clickable card headers). */
export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="relative ml-1 inline-block align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label="More information"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(!open) }}
        className={`inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border text-[9px] font-semibold select-none ${open ? 'border-cyan-600 text-cyan-700' : 'border-stone-300 text-stone-400'}`}
      >
        i
      </span>
      {open && (
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-1/2 z-50 mb-1.5 w-60 -translate-x-1/2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left text-[11px] font-normal tracking-normal normal-case leading-snug text-stone-600 shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  )
}
