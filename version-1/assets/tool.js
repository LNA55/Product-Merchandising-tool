/* ===== Merch Control Center — V1 mockup engine =====
   Static mockup: all figures are deterministic fake data.
   Anything flagged `added:true` was added by Claude beyond the brief → rendered in orange. */

'use strict';

/* ---------- helpers ---------- */
function hashStr(s){let x=7;for(let i=0;i<s.length;i++){x=(x*31+s.charCodeAt(i))>>>0;}return x;}
function rnd(seed,min,max){return min+(hashStr(seed)%10000)/10000*(max-min);}
function fmt(n){return Math.round(n).toLocaleString('en-US');}
function pct(n,d){return d? (100*n/d) : 0;}
const TODAY = new Date('2026-08-14'); // mockup reference date

/* ---------- data feeds (rows) ---------- */
const GROUPS = [
  { id:'catalogue', title:'Catalogue data',
    sub:'Signals computed from the product catalogue itself — available for every visitor.',
    sources:[
      { id:'new-products',      name:'New products' },
      { id:'almost-out-of-stock', name:'Almost out of stock' },
      { id:'back-in-stock',     name:'Back in stock' },
      { id:'on-promotion',      name:'On promotion' },
      { id:'award-winning',     name:'Award-winning products' },
      { id:'featured-press',    name:'Featured in the press' },
    ]},
  { id:'market', title:'Market data',
    sub:'Aggregated behaviour of all shoppers on the site.',
    sources:[
      { id:'trending',          name:'Trending right now' },
      { id:'best-sellers',      name:'Best sellers' },
      { id:'most-viewed',       name:'Most viewed' },
      { id:'most-added-to-cart',name:'Most added to cart' },
      { id:'top-rated',         name:'Top rated' },
    ]},
  { id:'preferences', title:'User preference data',
    sub:'Relevant for logged-in users with personal data available.',
    sources:[
      { id:'wishlist-favorites',name:'Wishlist / Favorites' },
      { id:'category-brand-affinity', name:'Preferred categories & brands (affinity profile)', added:true },
      { id:'size-fit-profile',  name:'Size & fit profile', added:true },
    ]},
  { id:'commercial', title:'Commercial activity data',
    sub:'Logged-in customers with purchase history.',
    sources:[
      { id:'recently-purchased',name:'Recently purchased' },
      { id:'buy-again',         name:'Buy again / Replenishment' },
      { id:'complementary-past-purchases', name:'Complementary to past purchases', added:true },
    ]},
  { id:'session', title:'Session browsing data',
    sub:'Browsing history of the current session — includes logged sessions of the past 48 hours.',
    sessionLink:true,
    sources:[
      { id:'recently-viewed',   name:'Recently viewed' },
      { id:'already-in-cart',   name:'Already in your cart' },
      { id:'often-with-cart',   name:'Often purchased with the products already in your cart' },
      { id:'often-with-last-viewed', name:'Often purchased with the most recently viewed product' },
      { id:'similar-last-viewed',    name:'Similar to the most recently viewed product' },
      { id:'recent-search-intent',   name:'Recent search intent' },
      { id:'price-drop-viewed', name:'Price drop on recently viewed products', added:true },
    ]},
];
GROUPS.forEach(g=>g.sources.forEach(s=>{ s.api = 'GET /api/v1/feeds/'+s.id; }));
const ALL_SOURCES = GROUPS.flatMap(g=>g.sources);

/* ---------- merch anchor points / blocks (columns) ---------- */
const NAMES = { pm:['Camille Roux','Louis Fabre','Nadia Benali','Marc Aubert'],
                tech:['Idan Lev','Sarah Kaminsky','Théo Girard','Anna Kovacs'],
                owner:['Sophie Marchand','Olivier Petit','Rachel Cohen','Hugo Lambert'] };

const BLOCKS = [
  { id:'hp-above',   name:'HP Merch Block — above waterline', page:'Home',
    pos:'Home page — first merchandising slot, fully visible above the waterline on desktop and mobile.',
    prod:'2026-01-06', wire:{kind:'hp', hl:[38,20], fold:true} },
  { id:'hp-hero',    name:'HP Merch Block — right below hero banner', page:'Home',
    pos:'Home page — directly under the hero banner, partially below the waterline depending on viewport.',
    prod:'2026-01-06', wire:{kind:'hp-hero', hl:[86,20], fold:true} },
  { id:'hp-content', name:'HP Merch Block — below content section', page:'Home',
    pos:'Home page — after the editorial content section, mid-page.',
    prod:'2026-02-11', wire:{kind:'hp-hero', hl:[132,20], fold:true} },
  { id:'hp-bottom',  name:'HP Merch Block — bottom', page:'Home',
    pos:'Home page — last section before the footer.',
    prod:'2026-02-11', wire:{kind:'hp-hero', hl:[168,20], fold:true} },
  { id:'category',   name:'Category page Merch block', page:'Category',
    pos:'Category landing page — between the category header and the sub-category tiles.',
    prod:'2026-03-02', wire:{kind:'category', hl:[70,20]} },
  { id:'catalog',    name:'Catalog page Merch block — above product list', page:'Catalog',
    pos:'Catalog / product-list page — horizontal strip right above the filtered product grid.',
    prod:'2026-03-02', wire:{kind:'catalog', hl:[64,18]} },
  { id:'product',    name:'Product Page Merch block', page:'Product',
    pos:'Product detail page — below the product information, above the reviews section.',
    prod:'2026-01-20', wire:{kind:'product', hl:[128,22]} },
  { id:'cart',       name:'Cart page Merch block', page:'Cart',
    pos:'Cart page — under the line items, above the checkout call to action.',
    prod:'2026-01-20', wire:{kind:'cart', hl:[126,22]} },
  { id:'minicart',   name:'Mini-cart / Cart drawer Merch block', page:'Cart',
    pos:'Mini-cart drawer — compact vertical module under the drawer line items.',
    prod:'2026-04-14', wire:{kind:'drawer', hl:[118,40]} },
  { id:'search',     name:'Search Results Merch block', page:'Search',
    pos:'Search results page — strip above the result grid (also shown on zero-result queries).',
    prod:'2026-04-14', wire:{kind:'catalog', hl:[64,18]} },
  { id:'wishlist',   name:'Wishlist page Merch block', page:'Wishlist',
    pos:'Wishlist page — below the saved items list.',
    prod:'2026-05-05', wire:{kind:'cart', hl:[126,22]} },
  { id:'account',    name:'Account page Merch block', page:'Account',
    pos:'My-account dashboard — right column, under the order status card.',
    prod:'2026-03-18', wire:{kind:'account', hl:[96,34]} },
  { id:'confirmation', name:'Order Confirmation Merch block', page:'Checkout',
    pos:'Order confirmation page — under the order summary (“complete your purchase”).',
    prod:'2026-05-05', wire:{kind:'cart', hl:[126,22]} },
  { id:'zero-404',   name:'404 / empty-state Merch block', page:'Error', added:true,
    pos:'404 and empty-state pages (empty cart, empty wishlist) — rescue module in the page body.',
    prod:'2026-06-10', wire:{kind:'e404', hl:[100,24]} },
];
BLOCKS.forEach((b,i)=>{
  b.pm = NAMES.pm[i%4]; b.tech = NAMES.tech[(i+1)%4]; b.owner = NAMES.owner[(i+2)%4];
  b.aa = 'https://analytics.adobe.com/#/workspace/merch-'+b.id;
});

/* ---------- default weights (0–10) ---------- */
const W_OVERRIDES = {
  'already-in-cart|cart':0,'already-in-cart|minicart':0,
  'often-with-cart|cart':9,'often-with-cart|minicart':9,'often-with-cart|confirmation':7,
  'similar-last-viewed|product':9,'often-with-last-viewed|product':8,
  'recently-viewed|hp-above':8,'recently-viewed|search':6,
  'best-sellers|hp-hero':8,'trending|hp-above':7,
  'buy-again|account':9,'buy-again|confirmation':8,
  'wishlist-favorites|wishlist':0,'wishlist-favorites|hp-bottom':6,
  'recent-search-intent|search':9,'new-products|hp-hero':7,
  'on-promotion|category':7,'back-in-stock|wishlist':8,
  'best-sellers|zero-404':8,'trending|zero-404':7,
};
function defaultWeight(srcId, blockId){
  const k = srcId+'|'+blockId;
  if (k in W_OVERRIDES) return W_OVERRIDES[k];
  return hashStr(k)%7; // 0..6
}

/* ---------- KPI engine (fake, deterministic) ---------- */
const PERIODS = [
  { id:'24h',  label:'past 24 hours',          factor:1/30 },
  { id:'30d',  label:'past 30 rolling days',   factor:1 },
  { id:'cmon', label:'current calendar month', factor:14/30 },
  { id:'cyear',label:'current calendar year',  factor:7.47 },
  { id:'12m',  label:'past rolling 12 months', factor:12.17 },
];
function kpis30d(b){
  const displayed = rnd(b.id+'D', 180000, 950000);
  const viewed    = displayed * rnd(b.id+'V', .45, .78);
  const clicked   = viewed    * rnd(b.id+'C', .02, .09);
  const atc       = rnd(b.id+'A', 8, 35); // %
  return { displayed, viewed, clicked, atc };
}
function kpisFor(b, periodId){
  const f = PERIODS.find(p=>p.id===periodId).factor;
  const k = kpis30d(b);
  return { displayed:k.displayed*f, viewed:k.viewed*f, clicked:k.clicked*f, atc:k.atc + rnd(b.id+periodId,-1.5,1.5) };
}
function monthsSince(dateStr){
  const d = new Date(dateStr);
  return Math.max(1,(TODAY - d)/(1000*3600*24*30.4));
}
function kpisCumulative(b){
  const m = monthsSince(b.prod), k = kpis30d(b);
  return { displayed:k.displayed*m, viewed:k.viewed*m, clicked:k.clicked*m, atc:k.atc,
           deskShare: rnd(b.id+'ds', 46, 66) };
}
function ranks(){
  const eng = BLOCKS.map(b=>{const k=kpis30d(b);return {id:b.id, v:k.clicked/k.viewed};})
                    .sort((a,b)=>b.v-a.v);
  const perf = BLOCKS.map(b=>({id:b.id, v:kpis30d(b).atc})).sort((a,b)=>b.v-a.v);
  const out = {};
  BLOCKS.forEach(b=>{ out[b.id] = { eng: eng.findIndex(x=>x.id===b.id)+1,
                                    perf: perf.findIndex(x=>x.id===b.id)+1 }; });
  return out;
}

/* ---------- versions ---------- */
const SEED_VERSIONS = [
  { id:'V0.1', status:'draft', date:'2026-05-12', author:'Camille Roux',
    desc:'Initial matrix skeleton — catalogue & market signals only.', est:null },
  { id:'V0.2', status:'draft', date:'2026-05-19', author:'Camille Roux',
    desc:'Added session signals; first weighting pass on the four HP blocks.', est:'+1.9% ATC (projected)' },
  { id:'V0.3', status:'draft', date:'2026-05-27', author:'Camille Roux',
    desc:'Rebalanced cart & mini-cart; market signals capped at 6.', est:'+3.1% ATC (projected)' },
  { id:'V1.0', status:'published', date:'2026-06-02', author:'Camille Roux',
    desc:'First published mix. Equals draft V0.3.', est:'+3.1% ATC (projected)',
    analysis:'+2.6% ATC (measured)', delta:'−0.5 pt vs estimation' },
  { id:'V1.1', status:'draft', date:'2026-06-24', author:'Louis Fabre',
    desc:'Boost Buy again / Replenishment on account & order confirmation.', est:'+0.8% ATC (projected)' },
  { id:'V1.2', status:'draft', date:'2026-07-08', author:'Louis Fabre',
    desc:'Recent search intent pushed on Search Results; wishlist boost on HP bottom.', est:'+1.8% ATC (projected)' },
  { id:'V2.0', status:'published', date:'2026-07-15', author:'Louis Fabre',
    desc:'Second published mix. Equals draft V1.2.', est:'+1.8% ATC (projected)',
    analysis:'+2.3% ATC (measured)', delta:'+0.5 pt vs estimation' },
  { id:'V2.1', status:'draft', date:'2026-08-05', author:'Camille Roux',
    desc:'Work in progress — current editing base.', est:null },
];
const LS_KEY = 'pp_mix_versions_custom';
function customVersions(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); }catch(e){ return []; } }
function allVersions(){ return SEED_VERSIONS.concat(customVersions()); }
function parseV(id){ const m=id.match(/V(\d+)\.(\d+)/); return m?[+m[1],+m[2]]:[0,0]; }
function latestVersion(){ return allVersions().map(v=>v.id).sort((a,b)=>{const A=parseV(a),B=parseV(b);return (A[0]-B[0])||(A[1]-B[1]);}).pop(); }
function nextVersion(kind){
  const [maj,min] = parseV(latestVersion());
  return kind==='publish' ? 'V'+(maj+1)+'.0' : 'V'+maj+'.'+(min+1);
}
function liveVersion(){ const pubs=allVersions().filter(v=>v.status==='published'); return pubs.length?pubs[pubs.length-1].id:'—'; }

/* mix history per block: [versionId, start, end, rollout] */
function mixHistory(b){
  const h = [];
  if (new Date(b.prod) < new Date('2026-06-02'))
    h.push({ mix:'Legacy static mix', start:b.prod, end:'2026-06-01', roll:'100% of traffic (pre-tool, hand-picked products)' });
  if (new Date(b.prod) <= new Date('2026-07-14'))
    h.push({ mix:'V1.0', start: (new Date(b.prod)>new Date('2026-06-02')?b.prod:'2026-06-02'), end:'2026-07-14',
             roll:'10% of traffic Jun 2 → Jun 20; 100% of traffic Jun 21 → Jul 14' });
  h.push({ mix:'V2.0', start:(new Date(b.prod)>new Date('2026-07-15')?b.prod:'2026-07-15'), end:'present',
           roll:'10% of traffic Jul 15 → Jul 27; 100% of traffic Jul 28 → present' });
  return h;
}

/* ---------- UI helpers ---------- */
function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstChild; }
function toast(msg){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const t = el('<div class="toast">'+msg+'</div>');
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 4200);
}
function modal(inner){
  const veil = el('<div class="modal-veil"><div class="modal">'+inner+'</div></div>');
  veil.addEventListener('click', e=>{ if(e.target===veil) veil.remove(); });
  document.body.appendChild(veil);
  return veil;
}
const SESSION_A = '<a class="session-link" href="/version-1/session.html" title="What “session” means in these data — click for the full definition">session</a>';

/* ---------- wireframe SVG ---------- */
function wireSvg(w){
  const H=210, W=320, hl=w.hl;
  let inner = '<rect x="0" y="0" width="320" height="14" fill="#e8e8ec"/>'+
    '<circle cx="10" cy="7" r="3" fill="#c9c9cf"/><circle cx="20" cy="7" r="3" fill="#c9c9cf"/><circle cx="30" cy="7" r="3" fill="#c9c9cf"/>'+
    '<rect x="0" y="14" width="320" height="18" fill="#111"/><rect x="10" y="20" width="46" height="6" rx="2" fill="#14b0bd"/>'+
    '<rect x="230" y="20" width="80" height="6" rx="2" fill="#555"/>';
  const grey = (x,y,wd,h)=>'<rect x="'+x+'" y="'+y+'" width="'+wd+'" height="'+h+'" rx="2" fill="#ececf0"/>';
  const grid = (y)=>{let s='';for(let i=0;i<4;i++)s+=grey(10+i*78,y,70,34);return s;};
  switch(w.kind){
    case 'hp':       inner+=grey(10,64,300,48)+grid(120)+grey(10,162,300,26); break;
    case 'hp-hero':  inner+=grey(10,38,300,44)+grid(110)+grey(10,150,140,14)+grey(160,150,150,14); break;
    case 'category': inner+=grey(10,38,300,26)+grid(96)+grid(136); break;
    case 'catalog':  inner+=grey(10,38,300,10)+grey(10,52,70,148)+grid(88)+grid(128)+grid(168); break;
    case 'product':  inner+=grey(10,38,150,80)+grey(170,38,140,80)+grey(10,158,300,40); break;
    case 'cart':     inner+=grey(10,38,200,24)+grey(10,66,200,24)+grey(10,94,200,24)+grey(220,38,90,80)+grey(220,156,90,20); break;
    case 'drawer':   inner+=grey(10,38,190,150)+'<rect x="210" y="14" width="110" height="196" fill="#f6f6f8" stroke="#ddd"/>'+grey(218,24,94,20)+grey(218,48,94,20)+grey(218,72,94,20); break;
    case 'account':  inner+=grey(10,38,90,150)+grey(110,38,120,50)+grey(110,92,120,96)+grey(240,38,70,50); break;
    case 'e404':     inner+='<text x="160" y="70" font-size="30" fill="#c9c9cf" text-anchor="middle" font-family="sans-serif">404</text>'+grey(110,80,100,10); break;
  }
  let fold='';
  if (w.fold) fold = '<line x1="0" y1="120" x2="320" y2="120" stroke="#111" stroke-dasharray="6 4" stroke-width="1"/>'+
    '<text x="314" y="116" font-size="8" fill="#666" text-anchor="end" font-family="sans-serif">waterline</text>';
  const isDrawer = w.kind==='drawer';
  const hx = isDrawer?214:10, hw = isDrawer?102:300;
  const hlRect = '<rect x="'+hx+'" y="'+hl[0]+'" width="'+hw+'" height="'+hl[1]+'" fill="rgba(20,176,189,.18)" stroke="#0e6e78" stroke-width="2" stroke-dasharray="7 4" rx="3"/>'+
    '<text x="'+(hx+6)+'" y="'+(hl[0]+hl[1]-6)+'" font-size="9" fill="#0e6e78" font-family="sans-serif" font-weight="bold">MERCH BLOCK</text>';
  return '<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Position of the merch block in the page">'+inner+fold+hlRect+'</svg>';
}

/* ================= MATRIX PAGE ================= */
function renderMatrix(rootId){
  const root = document.getElementById(rootId);
  let dirty = 0;
  const dirtyEl = ()=>document.getElementById('dirty-count');

  let thead = '<tr><th class="corner">Data feeds ↓ &nbsp;·&nbsp; Merch anchor points →<br>' +
    '<span style="font-weight:400">cell = weight 0–10 of the feed in the block</span></th>';
  BLOCKS.forEach(b=>{
    thead += '<th'+(b.added?' class="claude-add" title="Ajout Claude — non demandé dans le brief"':'')+'>'+
      '<a href="/version-1/blocks.html#'+b.id+'" title="Open this block in “Manage the Merch blocks”">'+b.name.replace(/ — /g,'<br>')+'</a>'+
      (b.added?'<span class="add-tag">ajout</span>':'')+'</th>';
  });
  thead += '</tr>';

  let tbody = '';
  GROUPS.forEach(g=>{
    const sub = g.sessionLink
      ? g.sub.replace('session —', SESSION_A+' —').replace('logged sessions','logged '+SESSION_A+'s')
      : g.sub;
    tbody += '<tr class="grouprow"><th>'+g.title+'<span class="gsub">'+sub+'</span></th><td colspan="'+BLOCKS.length+'"></td></tr>';
    g.sources.forEach(s=>{
      tbody += '<tr'+(s.added?' class="claude-add"':'')+'><th class="rowhead"><span class="src-name">'+s.name+
        (s.added?'<span class="add-tag">ajout</span>':'')+'</span><code class="api">'+s.api+'</code></th>';
      BLOCKS.forEach(b=>{
        const v = defaultWeight(s.id,b.id);
        tbody += '<td class="cell" data-src="'+s.id+'" data-block="'+b.id+'">'+
          '<input type="number" min="0" max="10" value="'+v+'" data-def="'+v+'" title="'+s.name+' × '+b.name+'"></td>';
      });
      tbody += '</tr>';
    });
  });

  root.innerHTML = '<div class="matrix-wrap"><table class="matrix"><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table></div>';

  function paint(inp){
    let v = Math.max(0, Math.min(10, parseInt(inp.value||'0',10)||0));
    inp.value = v;
    const a = v===0 ? 0 : .06 + v*.078;
    inp.parentElement.style.background = v===0 ? '#fff' : 'rgba(20,176,189,'+a.toFixed(3)+')';
    inp.style.color = v>=8 ? '#fff' : 'var(--tq-900)';
    inp.classList.toggle('dirty', String(v)!==inp.dataset.def);
  }
  root.querySelectorAll('td.cell input').forEach(inp=>{
    paint(inp);
    inp.addEventListener('input', ()=>{
      paint(inp);
      dirty = root.querySelectorAll('td.cell input.dirty').length;
      if (dirtyEl()) dirtyEl().textContent = dirty;
    });
  });

  /* save bar buttons */
  const base = latestVersion();
  document.getElementById('v-live').textContent = liveVersion();
  document.getElementById('v-base').textContent = base;

  function openSave(kind){
    const nv = nextVersion(kind);
    const isPub = kind==='publish';
    const lastDraft = allVersions().filter(v=>v.status==='draft').map(v=>v.id).pop();
    const autoDesc = isPub && lastDraft ? 'Equals draft '+lastDraft+'. ' : '';
    const veil = modal(
      '<h3>'+(isPub?'Publish in live':'Save for a future version')+'</h3>'+
      '<p class="msub">Versions are immutable: every save generates a new incremental version. '+
      'The version name is a unique ID, linked to the impact tests run against it.</p>'+
      '<label>Version ID (auto)</label><input type="text" readonly value="'+nv+'">'+
      '<label>Name</label><input type="text" id="sv-name" placeholder="e.g. Summer replenishment push">'+
      '<label>Description</label><textarea id="sv-desc" rows="3">'+autoDesc+'</textarea>'+
      '<div class="actions"><button class="btn btn-ghost" id="sv-cancel">Cancel</button>'+
      '<button class="btn btn-primary" id="sv-ok">'+(isPub?'Publish '+nv:'Save '+nv)+'</button></div>');
    veil.querySelector('#sv-cancel').onclick = ()=>veil.remove();
    veil.querySelector('#sv-ok').onclick = ()=>{
      const list = customVersions();
      list.push({ id:nv, status:isPub?'published':'draft', date:TODAY.toISOString().slice(0,10),
        author:'You', local:true,
        desc:((veil.querySelector('#sv-name').value||'Untitled')+' — '+veil.querySelector('#sv-desc').value).trim(),
        est:null, analysis:isPub?'pending (post-launch window open)':undefined });
      localStorage.setItem(LS_KEY, JSON.stringify(list));
      veil.remove();
      root.querySelectorAll('td.cell input.dirty').forEach(inp=>{ inp.dataset.def = inp.value; inp.classList.remove('dirty'); });
      if (dirtyEl()) dirtyEl().textContent = 0;
      document.getElementById('v-base').textContent = nv;
      if (isPub) document.getElementById('v-live').textContent = nv;
      toast((isPub?'Published as ':'Saved as ')+'<b>'+nv+'</b> — visible in <a href="/version-1/versions.html" style="color:#7fd8de">Merch mix versions</a>.');
    };
  }
  document.getElementById('btn-save').onclick = ()=>openSave('draft');
  document.getElementById('btn-publish').onclick = ()=>openSave('publish');
}

/* ================= BLOCKS PAGE ================= */
function renderBlocks(rootId){
  const root = document.getElementById(rootId);
  const R = ranks();
  let periodId = '30d';

  const sel = document.getElementById('kpi-period');
  PERIODS.forEach(p=>{
    const o = document.createElement('option');
    o.value = p.id; o.textContent = p.label; if (p.id==='30d') o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', ()=>{ periodId = sel.value; paintKpis(); });

  root.innerHTML = '';
  BLOCKS.forEach(b=>{
    const cum = kpisCumulative(b);
    const hist = mixHistory(b).map(h=>'<tr><td><b>'+h.mix+'</b></td><td>'+h.start+'</td><td>'+h.end+'</td><td>'+h.roll+'</td></tr>').join('');
    const card = el(
    '<div class="block-card'+(b.added?' claude-add':'')+'" id="'+b.id+'">'+
      '<div class="block-head">'+
        '<span class="chev">▶</span>'+
        '<span class="block-title">'+b.name+(b.added?'<span class="add-tag">ajout</span>':'')+'</span>'+
        '<span class="block-page-tag">'+b.page+'</span>'+
        '<div class="kpi-groups">'+
          '<div class="kpi-group"><span class="glabel">Engagement</span>'+
            '<span class="kpi" title="Displayed = the page was loaded with this block in it"><b data-k="displayed"></b>displayed</span>'+
            '<span class="kpi" title="Viewed = page load above the waterline, or view tracked by heat-map-like data for anything under the waterline — specific data for mobile and desktop"><b data-k="viewed"></b>viewed</span>'+
            '<span class="kpi" title="Clicked = clicks on the block’s products"><b data-k="clicked"></b>clicked</span>'+
          '</div>'+
          '<div class="kpi-group"><span class="glabel">Performance</span>'+
            '<span class="kpi perf" title="Add to cart attributed: for a user who clicks at least one product of this block in one session, the ratio of clicked products finally added to cart in the same session"><b data-k="atc"></b>add-to-cart attributed</span>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="block-body"><div class="block-grid">'+
        '<div class="wire-box">'+wireSvg(b.wire)+'<p class="pos-text">'+b.pos+'</p></div>'+
        '<div>'+
          '<ul class="meta-list">'+
            '<li><span class="k">Analytics dashboard</span><span class="v"><a class="discreet" href="'+b.aa+'" target="_blank" rel="noopener">Open in Adobe Analytics ↗</a></span></li>'+
            '<li><span class="k">In production since</span><span class="v">'+b.prod+'</span></li>'+
            '<li><span class="k">Product manager</span><span class="v">'+b.pm+'</span></li>'+
            '<li><span class="k">Technical lead</span><span class="v">'+b.tech+'</span></li>'+
            '<li><span class="k">Business owner</span><span class="v">'+b.owner+'</span></li>'+
          '</ul>'+
          '<h4 class="bh">Cumulative KPIs — since block creation ('+b.prod+'), all merch mixes combined</h4>'+
          '<table class="mini"><tr><th>Displayed</th><th>Viewed</th><th>Clicked</th><th>Add-to-cart attributed</th></tr>'+
          '<tr><td>'+fmt(cum.displayed)+'</td>'+
          '<td>'+fmt(cum.viewed)+' <span style="color:var(--ink-faint)">(desktop '+Math.round(cum.deskShare)+'% · mobile '+Math.round(100-cum.deskShare)+'%)</span></td>'+
          '<td>'+fmt(cum.clicked)+'</td><td>'+cum.atc.toFixed(1)+'%</td></tr></table>'+
          '<h4 class="bh">Rank vs the '+BLOCKS.length+' blocks</h4>'+
          '<div class="rank-chips">'+
            '<span class="rank-chip"><b>#'+R[b.id].eng+'</b> / '+BLOCKS.length+'<small>engagement meta-KPI — clicked / viewed ratio</small></span>'+
            '<span class="rank-chip"><b>#'+R[b.id].perf+'</b> / '+BLOCKS.length+'<small>performance KPI — add-to-cart attributed</small></span>'+
          '</div>'+
          '<h4 class="bh">Merchandising mix history in this block</h4>'+
          '<table class="mini"><tr><th>Mix version</th><th>Start</th><th>End</th><th>Rollout</th></tr>'+hist+'</table>'+
        '</div>'+
      '</div></div>'+
    '</div>');
    card.querySelector('.block-head').addEventListener('click', ()=>card.classList.toggle('open'));
    root.appendChild(card);
  });

  function paintKpis(){
    BLOCKS.forEach(b=>{
      const k = kpisFor(b, periodId);
      const card = document.getElementById(b.id);
      card.querySelector('[data-k=displayed]').textContent = fmt(k.displayed);
      card.querySelector('[data-k=viewed]').textContent = fmt(k.viewed);
      card.querySelector('[data-k=clicked]').textContent = fmt(k.clicked);
      card.querySelector('[data-k=atc]').textContent = Math.max(1,k.atc).toFixed(1)+'%';
    });
  }
  paintKpis();

  if (location.hash){
    const c = document.getElementById(location.hash.slice(1));
    if (c){ c.classList.add('open'); c.scrollIntoView({block:'start'}); }
  }

  document.getElementById('btn-addblock').onclick = ()=>{
    const veil = modal(
      '<h3>Add new block</h3>'+
      '<p class="msub">Declares a new merch anchor point. It will appear as a new column in the control matrix.</p>'+
      '<label>Block name</label><input type="text" id="nb-name" placeholder="e.g. Blog article Merch block">'+
      '<label>Page</label><select id="nb-page"><option>Home</option><option>Category</option><option>Catalog</option><option>Product</option><option>Cart</option><option>Search</option><option>Account</option><option>Checkout</option><option>Other</option></select>'+
      '<label>Position description</label><textarea id="nb-pos" rows="2" placeholder="Where does it sit in the page?"></textarea>'+
      '<div class="actions"><button class="btn btn-ghost" id="nb-cancel">Cancel</button>'+
      '<button class="btn btn-primary" id="nb-ok">Create block</button></div>');
    veil.querySelector('#nb-cancel').onclick = ()=>veil.remove();
    veil.querySelector('#nb-ok').onclick = ()=>{
      const n = veil.querySelector('#nb-name').value || 'New Merch block';
      veil.remove();
      toast('<b>'+n+'</b> created as a draft anchor point (mockup — not persisted).');
    };
  };
}

/* ================= VERSIONS PAGE ================= */
function renderVersions(rootId){
  const root = document.getElementById(rootId);
  const vs = allVersions();
  let rows = '';
  vs.forEach(v=>{
    const est = v.est
      ? '<b>'+v.est+'</b> <a class="discreet ext" href="https://impact-suite.example.com/estimate?mix='+v.id+'">view run ↗</a>'
      : '<button class="btn btn-ghost btn-run" data-v="'+v.id+'" style="padding:5px 12px;font-size:13px">Run Impact Estimation ↗</button>';
    let feedback = '';
    if (v.status==='published'){
      feedback = '<div class="impact-cmp">'+
        '<div class="box">Impact Estimation (pre-launch)<b>'+(v.est||'—')+'</b></div>'+
        '<div class="box">Impact Analysis (post-launch)<b>'+(v.analysis||'—')+'</b></div>'+
        (v.delta?'<div class="box delta">Estimation accuracy<b>'+v.delta+'</b></div>':'')+
        '</div><p class="ext-note">Computed by the external impact tool (integrated) — '+
        '<a class="discreet ext" href="https://impact-suite.example.com/analysis?mix='+v.id+'">open the full feedback page ↗</a></p>';
    }
    rows += '<tr class="'+(v.status==='published'?'pub':'')+'">'+
      '<td class="vid">'+v.id+'</td>'+
      '<td><span class="chip '+(v.status==='published'?'pub':'draft')+'">'+v.status+'</span>'+(v.local?' <span class="chip local">saved in this browser</span>':'')+'</td>'+
      '<td style="white-space:nowrap">'+v.date+'</td><td>'+v.author+'</td>'+
      '<td>'+v.desc+feedback+'</td><td style="white-space:nowrap">'+est+'</td></tr>';
  });
  root.innerHTML = '<div style="overflow-x:auto"><table class="versions-tbl">'+
    '<tr><th>Version</th><th>Status</th><th>Date</th><th>Author</th><th>Description & post-launch feedback</th><th>Impact Estimation</th></tr>'+
    rows+'</table></div>';
  root.querySelectorAll('.btn-run, a.ext').forEach(x=>x.addEventListener('click', e=>{
    e.preventDefault();
    toast('Opens the external impact tool (integrated) — the analyses are not run by this tool; results are sent back here. Mockup: no live integration.');
  }));
}
