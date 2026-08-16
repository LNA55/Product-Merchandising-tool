export function SessionPage() {
  return (
    <div className="max-w-3xl px-8 py-8">
      <h1 className="text-[26px] font-bold tracking-tight text-stone-900">How we define a session</h1>
      <p className="mt-2 text-sm text-stone-500">
        Everywhere the word “session” appears in this application — in metric definitions and in browsing-activity data sources — it refers to the analytical definition below, not to a classic web-analytics session.
      </p>

      <div className="soft-card mt-6 p-6">
        <h2 className="text-lg font-bold text-stone-900">Identified / logged-in customer</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
          For a logged-in customer, a “session” in this SaaS means <b>the rolling 48-hour aggregation of that customer’s activity, across devices, when identity resolution is available</b>. Therefore activity from desktop and mobile can belong to the same analytical session window.
        </p>
      </div>

      <div className="soft-card mt-4 p-6">
        <h2 className="text-lg font-bold text-stone-900">Anonymous customer</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
          For a visitor who is not logged in, <b>a session is limited to the browser/device activity that can be connected using the available first-party cookie identifier</b>. No cross-device identity resolution applies to anonymous visitors.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 px-5 py-4 text-sm text-stone-700">
        <b>Note</b> — Session definitions and attribution windows are configurable system parameters. Configuration is not available in this prototype.
      </div>
    </div>
  )
}
