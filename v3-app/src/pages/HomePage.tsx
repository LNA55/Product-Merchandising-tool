/** User home page of the app (not a marketing site). Content being built iteratively. */
export function HomePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-8">
      <div className="max-w-4xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700">Unique Value Proposition</p>
        <p className="mt-5 text-[26px] font-bold leading-snug tracking-tight text-stone-900">
          Maximize the <span className="text-cyan-700">add-to-cart rate</span><br className="hidden sm:block" />
          {' '}of e-commerce websites with a large catalog.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-stone-500">
          We do so by improving the <b className="font-semibold text-stone-700">relevance of the products displayed</b> in front of the final user's eyes.
        </p>
      </div>
    </div>
  )
}
