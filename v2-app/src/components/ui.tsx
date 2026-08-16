import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Button({ children, variant = 'secondary', onClick, disabled, type = 'button' }: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const base = 'inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const styles = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800',
    secondary: 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50',
    ghost: 'text-teal-700 hover:bg-teal-50',
  }
  return (
    <button type={type} className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'teal' | 'live' | 'prev' | 'amber' }) {
  const styles = {
    neutral: 'border border-neutral-300 text-neutral-600 bg-white',
    teal: 'bg-teal-50 text-teal-800 border border-teal-200',
    live: 'bg-teal-700 text-white border border-teal-700',
    prev: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide whitespace-nowrap ${styles[tone]}`}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      {children}
    </label>
  )
}

export const inputCls = 'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600'

/** The word "session" — always a subtle link to /session-definition. */
export function SessionWord({ plural = false }: { plural?: boolean }) {
  return (
    <Link
      to="/session-definition"
      className="text-inherit underline decoration-teal-500 decoration-dotted underline-offset-2 hover:text-teal-700"
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
      className="text-sm text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-teal-700 hover:decoration-teal-500"
    >
      {children} ↗
    </a>
  )
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span
      className="ml-1 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-neutral-300 text-[9px] font-semibold text-neutral-400 select-none"
      title={text}
    >
      i
    </span>
  )
}
