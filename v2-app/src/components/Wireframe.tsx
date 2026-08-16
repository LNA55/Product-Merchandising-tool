/** Mock e-commerce page screenshot with the merch block outlined. */
export function Wireframe({ kind, hl, fold }: { kind: string; hl: [number, number]; fold?: boolean }) {
  const grey = (x: number, y: number, w: number, h: number, key: string) => (
    <rect key={key} x={x} y={y} width={w} height={h} rx={2} fill="#ececf0" />
  )
  const grid = (y: number, prefix: string) =>
    [0, 1, 2, 3].map((i) => grey(10 + i * 78, y, 70, 34, `${prefix}${i}`))

  let body: React.ReactNode = null
  switch (kind) {
    case 'hp':
      body = <>{grey(10, 64, 300, 48, 'a')}{grid(120, 'g')}{grey(10, 162, 300, 26, 'b')}</>
      break
    case 'hp-hero':
      body = <>{grey(10, 38, 300, 44, 'a')}{grid(110, 'g')}{grey(10, 150, 140, 14, 'b')}{grey(160, 150, 150, 14, 'c')}</>
      break
    case 'category':
      body = <>{grey(10, 38, 300, 26, 'a')}{grid(96, 'g1')}{grid(136, 'g2')}</>
      break
    case 'catalog':
      body = <>{grey(10, 38, 300, 10, 'a')}{grey(10, 52, 70, 148, 'b')}{grid(88, 'g1')}{grid(128, 'g2')}{grid(168, 'g3')}</>
      break
    case 'product':
      body = <>{grey(10, 38, 150, 80, 'a')}{grey(170, 38, 140, 80, 'b')}{grey(10, 158, 300, 40, 'c')}</>
      break
    case 'cart':
      body = <>{grey(10, 38, 200, 24, 'a')}{grey(10, 66, 200, 24, 'b')}{grey(10, 94, 200, 24, 'c')}{grey(220, 38, 90, 80, 'd')}{grey(220, 156, 90, 20, 'e')}</>
      break
    case 'drawer':
      body = (
        <>
          {grey(10, 38, 190, 150, 'a')}
          <rect x={210} y={14} width={110} height={196} fill="#f6f6f8" stroke="#ddd" />
          {grey(218, 24, 94, 20, 'b')}{grey(218, 48, 94, 20, 'c')}{grey(218, 72, 94, 20, 'd')}
        </>
      )
      break
    case 'account':
      body = <>{grey(10, 38, 90, 150, 'a')}{grey(110, 38, 120, 50, 'b')}{grey(110, 92, 120, 96, 'c')}{grey(240, 38, 70, 50, 'd')}</>
      break
    default:
      body = grid(96, 'g')
  }

  const isDrawer = kind === 'drawer'
  const hx = isDrawer ? 214 : 10
  const hw = isDrawer ? 102 : 300

  return (
    <svg viewBox="0 0 320 210" className="w-full rounded-md border border-neutral-200 bg-white" role="img" aria-label="Position of the merch block in the page">
      <rect x={0} y={0} width={320} height={14} fill="#e8e8ec" />
      <circle cx={10} cy={7} r={3} fill="#c9c9cf" /><circle cx={20} cy={7} r={3} fill="#c9c9cf" /><circle cx={30} cy={7} r={3} fill="#c9c9cf" />
      <rect x={0} y={14} width={320} height={18} fill="#171717" />
      <rect x={10} y={20} width={46} height={6} rx={2} fill="#0f766e" />
      <rect x={230} y={20} width={80} height={6} rx={2} fill="#555" />
      {body}
      {fold && (
        <>
          <line x1={0} y1={120} x2={320} y2={120} stroke="#171717" strokeDasharray="6 4" strokeWidth={1} />
          <text x={314} y={116} fontSize={8} fill="#666" textAnchor="end" fontFamily="sans-serif">fold</text>
        </>
      )}
      <rect x={hx} y={hl[0]} width={hw} height={hl[1]} rx={3} fill="rgba(15,118,110,.14)" stroke="#0f766e" strokeWidth={2} strokeDasharray="7 4" />
      <text x={hx + 6} y={hl[0] + hl[1] - 6} fontSize={9} fill="#0f766e" fontFamily="sans-serif" fontWeight="bold">MERCH BLOCK</text>
    </svg>
  )
}
