export function SessionPage() {
  return (
    <div className="max-w-3xl px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">How we define a session</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Everywhere the word “session” appears in this application — in metric definitions and in browsing-activity data sources — it refers to the analytical definition below, not to a classic web-analytics session.
      </p>

      <h2 className="mt-8 border-b border-teal-200 pb-1 text-lg font-semibold text-neutral-900">Identified / logged-in customer</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
        For a logged-in customer, a “session” in this SaaS means <b>the rolling 48-hour aggregation of that customer’s activity, across devices, when identity resolution is available</b>. Therefore activity from desktop and mobile can belong to the same analytical session window.
      </p>

      <h2 className="mt-8 border-b border-teal-200 pb-1 text-lg font-semibold text-neutral-900">Anonymous customer</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
        For a visitor who is not logged in, <b>a session is limited to the browser/device activity that can be connected using the available first-party cookie identifier</b>. No cross-device identity resolution applies to anonymous visitors.
      </p>

      <div className="mt-8 rounded-r-md border-l-4 border-teal-600 bg-teal-50 px-4 py-3 text-sm text-neutral-700">
        <b>Note</b> — Session definitions and attribution windows are configurable system parameters. Configuration is not available in this prototype.
      </div>
    </div>
  )
}
