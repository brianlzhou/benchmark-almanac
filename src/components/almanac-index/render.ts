// The Almanac Index page's markup, as plain strings, so the server render and the page script
// (src/scripts/almanac-index.ts) draw the same thing. No data imports: the server passes the payload in, and the
// page script fetches it from /index/data.json. Every name is escaped, and tooltips use the site's shared tip
// (data-tn, data-tv, data-ts as text, src/scripts/tips.ts).
import type { IndexPage, Version, Domain, HeadRow, ProvisionalRow, Part } from '../../lib/almanac-index-types.ts';
import { labColor } from '../../lib/palette.ts';
import { humanDate, fullDate } from '../../lib/format.ts';

/** The page's extras beside the index payload: each lab's name, mark kind and whether it has a page, and the models with a page. */
export interface Extras {
  /** lab id: [name, mark kind ('c' color image, 'm' mono mask, '' initial), 1 if the lab has a page] */
  labs: Record<string, [string, 'c' | 'm' | '', 0 | 1]>;
  linked: string[];
}
export type Payload = IndexPage & Extras;

export interface Ctx {
  all: Payload;
  v: string;
  P: Version;
  linked: Set<string>;
}
export const ctxOf = (all: Payload, v: string): Ctx => ({ all, v, P: all.versions[v], linked: new Set(all.linked) });

export interface State {
  sortKey: string;
  lbOpen: boolean;
  domain: string;
  who: string;
  rankOpen: boolean;
}

// ---- words ------------------------------------------------------------------------------------------------------
export const GROUPS = ['Code', 'Engineering', 'Science', 'Professions', 'Agents', 'Language', 'Vision'];
/** Short domain names for tight spots: the heat grid's columns and the test ranking. */
const SHORT: Record<string, string> = {
  swe: 'Software engineering',
  frontend: 'Front ends',
  competitive: 'Competitive coding',
  data: 'Data and SQL',
  'ai-rnd': 'AI research',
  cad: 'CAD',
  chips: 'Chips and electronics',
  materials: 'Chemistry',
  physics: 'Physics',
  biology: 'Biology',
  science: 'Research science',
  math: 'Math',
  finance: 'Finance',
  law: 'Law',
  medicine: 'Medicine',
  office: 'Office work',
  business: 'Business',
  'computer-use': 'Computer use',
  tools: 'Tools',
  research: 'Deep research',
  games: 'Games',
  knowledge: 'Knowledge',
  'long-context': 'Long context',
  chat: 'Instructions',
  writing: 'Writing',
  multilingual: 'Multilingual',
  forecasting: 'Forecasting',
  vision: 'Vision',
};
const short = (P: Version, id: string) => SHORT[id] ?? P.domains.find((d) => d.id === id)?.name ?? id;
/** A domain name inside a sentence: lower case, except names that start with an acronym. */
const low = (P: Version, id: string) => {
  const s = short(P, id);
  return /^(CAD|AI|SQL)/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);
};

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const f1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);
const pct = (x: number) => `${Math.round(x * 100)}%`;
const int = (n: number) => Number(n).toLocaleString('en-US');
const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')}`;
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const firstText = (x: number) => (x >= 0.995 ? 'stays first under every nearby weighting' : `stays first under ${pct(x)} of nearby weightings`);
/** A version freezes on the 1st of its month, from data through the day before. */
export const freezeDay = (v: string) => {
  const [yy, mm] = v.split('.').map(Number);
  return `20${String(yy).padStart(2, '0')}-${String(mm).padStart(2, '0')}-01`;
};
/** A tooltip's attributes: a name, a value and quieter lines (a newline starts a line). */
const tipAttr = (tn: string, tv?: string, ts?: string) => ` data-tn="${esc(tn)}"${tv ? ` data-tv="${esc(tv)}"` : ''}${ts ? ` data-ts="${esc(ts)}"` : ''}`;
const SORT_ICON = '<svg width="8" height="10" viewBox="0 0 8 10" aria-hidden="true"><path class="up" d="M1 4l3-3 3 3"></path><path class="dn" d="M1 6l3 3 3-3"></path></svg>';

// ---- models and labs --------------------------------------------------------------------------------------------
const name = (c: Ctx, m: string) => c.all.models[m]?.[0] ?? m;
const labOf = (c: Ctx, m: string) => c.all.models[m]?.[1] ?? '';
const labName = (c: Ctx, m: string) => c.all.models[m]?.[2] || 'Another lab';
const color = (c: Ctx, m: string) => labColor(labOf(c, m));

export function mark(c: Ctx, lab: string, size = 16): string {
  const l = c.all.labs[lab];
  const title = esc(l?.[0] ?? (lab || 'Another lab'));
  if (l?.[1] === 'c') return `<img class="ix-mk" src="/labs/${esc(lab)}-color.svg" width="${size}" height="${size}" alt="" title="${title}" decoding="async">`;
  if (l?.[1] === 'm') return `<span class="ix-mk ix-mask" style="--s:${size}px;--m:url(/labs/${esc(lab)}.svg)" title="${title}" aria-hidden="true"></span>`;
  return `<span class="ix-mk ix-init" style="--s:${size}px" title="${title}" aria-hidden="true">${esc((l?.[0] ?? lab ?? '?').slice(0, 1))}</span>`;
}
/** A model with its lab's mark, linked to its page when it has one. */
function who(c: Ctx, m: string, link = true): string {
  const n = esc(name(c, m));
  const label = link && c.linked.has(m) ? `<a href="/models/${esc(m)}/">${n}</a>` : `<span>${n}</span>`;
  return `<span class="ix-who" title="${n}">${mark(c, labOf(c, m))}${label}</span>`;
}
function lab(c: Ctx, m: string): string {
  const id = labOf(c, m);
  const n = esc(labName(c, m));
  return c.all.labs[id]?.[2] ? `<a href="/labs/${esc(id)}/" title="${n}">${n}</a>` : `<span title="${n}">${n}</span>`;
}
const live = (P: Version) => P.domains.filter((d) => !d.thin);

// ---- the masthead -----------------------------------------------------------------------------------------------
export function title(c: Ctx): string {
  return `Almanac Index ${c.v}`;
}
export function lede(c: Ctx): string {
  const [a, b] = c.P.headline.rows;
  if (!a) return 'No model has enough scores to rank yet.';
  const gap = b ? a.v - b.v : 0;
  const top = !b
    ? `<b>${esc(name(c, a.m))}</b> leads.`
    : gap < 0.5
      ? `<b>${esc(name(c, a.m))}</b> and <b>${esc(name(c, b.m))}</b> are ${f1(gap)} points apart at the top.`
      : `<b>${esc(name(c, a.m))}</b> leads by ${f1(gap)} points over <b>${esc(name(c, b.m))}</b>.`;
  return `${top} The index picks its own tests from what labs cite in launch posts and system cards, and splits into ${live(c.P).length} domains, each with its own leader.`;
}
export function versionSeg(c: Ctx): string {
  return c.all.order
    .map((v) => {
      const x = c.all.versions[v];
      const tag = x.preview ? 'preview' : v === c.all.main ? 'current' : 'earlier';
      return `<button type="button" data-v="${esc(v)}" aria-pressed="${v === c.v}">${esc(v)}<span class="ix-tag">${tag}</span></button>`;
    })
    .join('');
}
export function versionNote(c: Ctx): string {
  const x = c.P;
  if (x.preview) return `This preview uses the tests and weights from data through ${humanDate(x.cutoff)}. Version ${c.v} freezes on ${humanDate(freezeDay(c.v))}. Until then its tests can still change.`;
  const ranks = 'It ranks every model with the latest scores, so new models join without the tests changing.';
  if (x.frozen) return `Frozen on ${humanDate(x.frozen)}, from data through ${humanDate(x.cutoff)}. Version ${c.v} pins its tests and weights. ${ranks}`;
  if (x.rebuilt)
    return `Version ${c.v} pins its tests and weights from data through ${humanDate(x.cutoff)}. ${ranks} We rebuilt it after the fact from the data as it stands today, so a few later runs may leak into it.`;
  return `Version ${c.v} froze its tests and weights on ${humanDate(freezeDay(c.v))}, from data through ${humanDate(x.cutoff)}. ${ranks}`;
}
export function facts(c: Ctx): string {
  const P = c.P;
  const total = P.pool + Object.values(P.dropped).reduce((s, n) => s + n, 0);
  return [
    `Scores as of <b>${esc(humanDate(c.all.asOf))}</b>`,
    `<b class="num">${int(P.pool)}</b> of ${int(total)} tests can count`,
    `<b class="num">${P.domains.reduce((s, d) => s + d.tests.length, 0)}</b> tests on domain boards`,
    `<b class="num">${P.headline.rows.length}</b> models ranked`,
  ]
    .map((x) => `<span>${x}</span>`)
    .join('');
}

// ---- the leaderboard --------------------------------------------------------------------------------------------
interface GroupValue {
  v: number;
  own: number;
  n: number;
  of: number;
}
function groupValue(P: Version, parts: Record<string, Part>, g: string): GroupValue | null {
  const ids = live(P)
    .filter((d) => d.group === g && P.headline.weights[d.id])
    .map((d) => d.id);
  let s = 0;
  let w = 0;
  let own = 0;
  let n = 0;
  for (const x of ids) {
    const p = parts[x];
    if (!p) continue;
    const wt = P.headline.weights[x];
    s += wt * p[0];
    w += wt;
    if (p[1]) {
      own += wt;
      n++;
    }
  }
  return w ? { v: s / w, own: own / w, n, of: ids.length } : null;
}
export function overallCaption(c: Ctx): string {
  const P = c.P;
  const a = P.headline.rows[0];
  const prov = P.headline.provisional;
  const lead = a ? ` ${name(c, a.m)} ${firstText(a.first)}.` : '';
  const wait = prov.length ? `, so ${list(prov.slice(0, 3).map((r) => name(c, r.m)))} wait below the table` : '';
  return `We average each model's domain scores, weighting each domain by how much labs use its tests.${lead} A model needs scores in domains holding ${pct(P.settings.domainShare)} of the weight to be ranked${wait}.`;
}
const COLS: [string | null, string, number, string?][] = [
  ['rank', 'Rank', 46, 'r'],
  [null, 'Model', 168],
  [null, 'Lab', 96],
  ['rank', 'Index', 126],
  ...GROUPS.map((g): [string, string, number, string] => [g, g, 84, 'r ix-gh']),
  ['doms', 'Domains', 66, 'r'],
  ['released', 'Released', 92],
];
export const LB_TOP = 25;
export function table(c: Ctx, s: State): string {
  const P = c.P;
  type Row = (HeadRow | ProvisionalRow) & { g: Record<string, GroupValue | null> };
  const withGroups = (r: HeadRow | ProvisionalRow): Row => ({ ...r, g: Object.fromEntries(GROUPS.map((g) => [g, groupValue(P, r.parts, g)])) });
  const rows = P.headline.rows.map(withGroups);
  const prov = P.headline.provisional.map(withGroups);
  const rel = (m: string) => c.all.models[m]?.[3] || '';
  const key = (r: Row) =>
    s.sortKey === 'rank' ? -r.v : s.sortKey === 'released' ? -Date.parse(rel(r.m) || '1970-01-01') : s.sortKey === 'doms' ? -r.doms : -(r.g[s.sortKey]?.v ?? -1);
  const sorted = [...rows].sort((x, y) => key(x) - key(y) || y.v - x.v);
  const show = s.lbOpen ? sorted : sorted.slice(0, LB_TOP);
  const pool = rows.slice(0, 40).map((r) => r.v);
  const lo = pool.length ? Math.max(0, Math.floor((Math.min(...pool) - 5) / 10) * 10) : 0;
  const hi = rows[0]?.v ?? 100;
  const groupCell = (r: Row, g: string) => {
    const x = r.g[g];
    if (!x) return '<td class="r num"></td>';
    const ts = `From ${x.n} of ${x.of} domains with enough scores${x.own < 0.5 ? '\nMostly estimated from its other domains' : ''}`;
    return `<td class="r num${x.own < 0.5 ? ' ix-est' : ''}" tabindex="0"${tipAttr(`${name(c, r.m)} in ${g}`, f1(x.v), ts)}>${f1(x.v)}</td>`;
  };
  const line = (r: Row, provisional: boolean) => {
    const w = hi > lo ? Math.max(1, ((r.v - lo) / (hi - lo)) * 100) : 100;
    const ts = provisional
      ? `Estimated. Enough scores in ${r.doms} domains holding ${pct(r.share)} of the weight. It needs ${pct(P.settings.domainShare)} to be ranked.`
      : `Enough scores in ${r.doms} domains holding ${pct(r.share)} of the weight\nFirst under ${pct((r as HeadRow).first)} of nearby weightings`;
    const rk = provisional ? '' : String((r as HeadRow).rank);
    return `<tr${provisional ? ' class="ix-prov"' : ''}><td class="r num rank">${rk}</td><td class="ix-m">${who(c, r.m)}</td><td class="ix-lab">${lab(c, r.m)}</td>
<td tabindex="0"${tipAttr(provisional ? name(c, r.m) : `${rk}. ${name(c, r.m)}`, f1(r.v), ts)}><span class="ix-ix"><span class="ix-fill" style="width:${(w * 0.6).toFixed(1)}%;background:${color(c, r.m)}"></span><span class="num${provisional ? ' ix-est' : ''}">${f1(r.v)}</span></span></td>
${GROUPS.map((g) => groupCell(r, g)).join('')}<td class="r num">${r.doms}</td><td class="num ix-rel">${esc(fullDate(rel(r.m)))}</td></tr>`;
  };
  const head = COLS.map(([k, t, , cls], i) => {
    const on = k !== null && k === s.sortKey && (k !== 'rank' || i === 0);
    if (!k) return `<th${cls ? ` class="${cls}"` : ''}>${t}</th>`;
    return `<th class="${cls ?? ''}"${on ? ' aria-sort="descending"' : ''}><button type="button" class="sort" data-k="${k}"><span>${t}</span>${SORT_ICON}</button></th>`;
  }).join('');
  const provRows = prov.length ? `<tr class="ix-div"><td colspan="${COLS.length}">Too few scores to rank yet</td></tr>${prov.slice(0, 8).map((r) => line(r, true)).join('')}` : '';
  return `<colgroup>${COLS.map((h) => `<col style="width:${h[2]}px">`).join('')}</colgroup><thead><tr>${head}</tr></thead><tbody>${show.map((r) => line(r, false)).join('')}${provRows}</tbody>`;
}
export function moreText(c: Ctx, s: State): string {
  return s.lbOpen ? `Show the top ${LB_TOP}` : `Show all ${c.P.headline.rows.length} ranked models`;
}

const CHG_TOP = 6;

// ---- the changelog ----------------------------------------------------------------------------------------------
export function changesCaption(c: Ctx): string {
  const ch = c.all.changes[c.v];
  if (!ch) return `${c.v} is the first version, so it has nothing to compare with.`;
  const ins = ch.domains.reduce((s, d) => s + d.in.length, 0);
  const outs = ch.domains.reduce((s, d) => s + d.out.length, 0);
  const moved = ch.domains.filter((d) => d.leader[0] !== d.leader[1]).length;
  return `From ${ch.from} to ${ch.to}, ${ins} tests came onto domain boards and ${outs} came off, and ${moved} ${moved === 1 ? 'domain has' : 'domains have'} a new leader. We compare both versions on today's scores, so every change here comes from the tests.`;
}
export function changes(c: Ctx): string {
  const ch = c.all.changes[c.v];
  if (!ch) return '';
  const top = (ms: string[]) => `<ol>${ms.map((m) => `<li>${who(c, m)}</li>`).join('')}</ol>`;
  const nm = (m: string | null) => (m ? esc(name(c, m)) : 'none');
  const block = (d: (typeof ch.domains)[number]) => {
    const moved = d.leader[0] !== d.leader[1];
    const ld = moved ? `New leader: ${nm(d.leader[1])}, after ${nm(d.leader[0])}` : `Same leader: ${nm(d.leader[1])}`;
    const item = (sign: string, t: { name: string; why: string }) => `<li><span class="ix-sg" aria-label="${sign === '+' ? 'In' : 'Out'}">${sign}</span><span>${esc(t.name)}<span class="ix-why">${esc(t.why)}</span></span></li>`;
    return `<div class="ix-chg-d"><span class="ix-nm">${esc(d.name)}</span><span class="ix-ld${moved ? ' ix-moved' : ''}">${ld}</span>${d.in.length || d.out.length ? `<ul>${d.in.map((t) => item('+', t)).join('')}${d.out.map((t) => item('−', t)).join('')}</ul>` : ''}</div>`;
  };
  const order = [...ch.domains].sort((x, y) => Number(y.leader[0] !== y.leader[1]) - Number(x.leader[0] !== x.leader[1]) || y.in.length + y.out.length - (x.in.length + x.out.length));
  // the domains with a new leader or the most moves first, the rest behind a disclosure
  const first = order.slice(0, CHG_TOP);
  const rest = order.slice(CHG_TOP);
  const more = rest.length ? `<details class="ix-details ix-chg-more"><summary>Show the other ${rest.length} ${rest.length === 1 ? 'domain' : 'domains'} that changed</summary><div class="ix-chg-list">${rest.map(block).join('')}</div></details>` : '';
  return `<div class="ix-chg-top"><div><span class="ix-small">Top five in ${esc(ch.from)}</span>${top(ch.top[0])}</div><div><span class="ix-small">Top five in ${esc(ch.to)}</span>${top(ch.top[1])}</div></div><div class="ix-chg-list">${first.map(block).join('')}</div>${more}`;
}

// ---- domain cards and the selected board ------------------------------------------------------------------------
export function defaultDomain(c: Ctx, want?: string): string {
  const lv = live(c.P);
  return lv.find((d) => d.id === want)?.id ?? lv[0]?.id ?? '';
}
export function domainsCaption(c: Ctx): string {
  const lv = live(c.P);
  const leaders = new Map<string, number>();
  for (const d of lv) if (d.rows[0]) leaders.set(d.rows[0].m, (leaders.get(d.rows[0].m) ?? 0) + 1);
  const most = [...leaders.entries()].sort((x, y) => y[1] - x[1])[0];
  const lead = most ? ` ${name(c, most[0])} leads the most domains, ${most[1]} of ${lv.length}.` : '';
  return `Each domain uses its ${c.P.settings.perDomain} most cited tests that current models took.${lead} Pick a domain to see its board.`;
}
function card(c: Ctx, d: Domain, current: string): string {
  if (d.thin)
    return `<div class="ix-card ix-thin"><span class="ix-nm">${esc(d.name)}</span><span class="ix-sub">Too few tests yet. ${d.pool} tests, but only ${d.ranked} current ${d.ranked === 1 ? 'model has' : 'models have'} enough scores.</span></div>`;
  const [a, b] = d.rows;
  const top5 = d.rows.slice(0, 5);
  const lo = Math.min(...top5.map((r) => r.v)) - 6;
  const sub = `${b ? `${f1(a.v - b.v)} ahead of ${esc(name(c, b.m))}. ` : ''}${a.first >= 0.995 ? 'First under every weighting.' : `First under ${pct(a.first)} of weightings.`}`;
  return `<button type="button" class="ix-card" data-d="${esc(d.id)}" aria-pressed="${d.id === current}"><span class="ix-nm">${esc(d.name)}</span>
<span class="ix-lead">${mark(c, labOf(c, a.m))}<span class="ix-n">${esc(name(c, a.m))}</span><span class="ix-v num">${f1(a.v)}</span></span>
<span class="ix-sub">${sub}</span>
<span class="ix-mini" aria-hidden="true">${top5.map((r) => `<i style="width:${Math.max(4, ((r.v - lo) / (a.v - lo || 1)) * 100).toFixed(1)}%;background:${color(c, r.m)}"></i>`).join('')}</span></button>`;
}
export function cards(c: Ctx, current: string): string {
  const groups = [...new Set(c.P.domains.map((d) => d.group))];
  return groups
    .map(
      (g) =>
        `<div class="ix-group"><h3>${esc(g)}</h3><div class="ix-cards">${c.P.domains
          .filter((d) => d.group === g)
          .map((d) => card(c, d, current))
          .join('')}</div></div>`,
    )
    .join('');
}
function bars(c: Ctx, rows: { m: string; rank: number; v: number }[], tip: (r: any) => [string, string, string]): string {
  const vals = rows.map((r) => r.v);
  const lo = Math.max(0, Math.floor((Math.min(...vals) - 8) / 10) * 10);
  const hi = Math.max(...vals);
  return rows
    .map((r) => {
      const w = hi > lo ? Math.max(0.5, Math.min(100, ((r.v - lo) / (hi - lo)) * 100)) : 100;
      const [tn, tv, ts] = tip(r);
      return `<li tabindex="0"${tipAttr(tn, tv, ts)}><span class="ix-rk num">${r.rank}</span>${who(c, r.m)}<span class="ix-track"><span class="ix-bfill" style="width:calc(${w.toFixed(1)}% - 52px);background:${color(c, r.m)}"></span><span class="ix-val num">${f1(r.v)}</span></span></li>`;
    })
    .join('');
}
const benchLink = (id: string, n: string) => `<a href="/benchmarks/${esc(id)}/">${esc(n)}</a>`;
export function board(c: Ctx, current: string): string {
  const d = c.P.domains.find((x) => x.id === current && !x.thin) ?? live(c.P)[0];
  if (!d) return '';
  const rows = d.rows.slice(0, 15);
  const [a, b] = rows;
  const k = d.tests.length;
  const tip = (r: (typeof rows)[number]): [string, string, string] => [
    `${r.rank}. ${name(c, r.m)}`,
    f1(r.v),
    `Real scores on ${r.ref} of the ${k} board tests, ${r.n} tests in this domain\n${pct(r.ev)} of its domain score comes from its own domain results\nFirst under ${pct(r.first)} of nearby weightings`,
  ];
  const testRows = d.tests
    .map(
      (t) =>
        `<tr><td>${benchLink(t.id, t.name)}</td><td class="r num"><span class="ix-wbar" style="width:${Math.round(t.weight * 120)}px"></span>${pct(t.weight)}</td><td class="r num">${t.launchLabs}</td><td class="r num">${t.cardLabs}</td><td class="r num">${t.current}</td><td class="ix-best">${esc(name(c, t.best[0]))} <span class="ix-small num">${f1(t.best[1])}${t.unit === '%' ? '%' : ''}</span></td></tr>`,
    )
    .join('');
  const grid = d.rows.slice(0, 12);
  const trunc = (s: string) => (s.length > 16 ? `${s.slice(0, 15)}…` : s);
  const scores = `<table class="t ix-grid"><thead><tr><th>Model</th>${d.tests.map((t) => `<th class="r" title="${esc(t.name)}">${esc(trunc(t.name))}</th>`).join('')}</tr></thead><tbody>${grid
    .map(
      (r) =>
        `<tr><td class="ix-m">${who(c, r.m)}</td>${r.parts.map((p, j) => (p != null ? `<td class="r num">${f1(p)}</td>` : `<td class="r num ix-pred">${r.pred[j] != null ? f1(r.pred[j]!) : ''}</td>`)).join('')}</tr>`,
    )
    .join('')}</tbody></table>`;
  const cap = `${esc(name(c, a.m))} leads with ${f1(a.v)}${b ? `, ${f1(a.v - b.v)} ahead of ${esc(name(c, b.m))}` : ''}, and ${firstText(a.first)}. We use ${k} of the ${d.pool} tests in this domain.`;
  return `<div class="ix-bhead"><h3>${esc(d.name)}</h3><p>${cap}</p></div>
<div class="ix-cols"><ol class="ix-bars">${bars(c, rows, tip)}</ol>
<div class="ix-scroll"><table class="t ix-tests"><thead><tr><th>Board test</th><th class="r">Weight</th><th class="r">Labs in launch posts</th><th class="r">Labs in system cards</th><th class="r">Current models</th><th>Best score</th></tr></thead><tbody>${testRows}</tbody></table></div></div>
<details class="ix-details"><summary>Each model's score on each test</summary><p class="ix-small">Gray italics are predicted from the model's overall ability, where it has no score.</p><div class="ix-scroll">${scores}</div></details>`;
}

// ---- strengths and weaknesses -----------------------------------------------------------------------------------
/** The model whose ranks swing most across domains, among the top eight with six or more ranked domains: the most telling profile to open on. */
export function defaultWho(c: Ctx, want?: string): string {
  const P = c.P;
  if (want && P.profile.includes(want)) return want;
  const lv = live(P);
  let best = P.profile[0] ?? '';
  let spread = -1;
  for (const m of P.profile.slice(0, 8)) {
    const places = lv.map((d) => P.place[m]?.[d.id]).filter((x): x is NonNullable<typeof x> => !!x);
    if (places.length < 6) continue;
    const r = places.map((x) => (x.rank - 1) / Math.max(1, x.of - 1));
    const s = Math.max(...r) - Math.min(...r);
    if (s > spread) {
      spread = s;
      best = m;
    }
  }
  return best;
}
export function modelsCaption(c: Ctx, m: string): string {
  const P = c.P;
  const pa = P.place[m];
  const lv = live(P);
  const ids = pa ? Object.keys(pa).filter((k) => lv.some((d) => d.id === k)) : [];
  const base = 'Here we turn the boards around and rank each model across domains, among models released in the past year.';
  if (ids.length < 4) return base;
  const best = ids.reduce((x, y) => (pa[y].rank < pa[x].rank ? y : x));
  const worst = ids.reduce((x, y) => (pa[y].rank / pa[y].of > pa[x].rank / pa[x].of ? y : x));
  return `${base} ${name(c, m)} is ${ord(pa[best].rank)} in ${low(P, best)} but ${ord(pa[worst].rank)} of ${pa[worst].of} in ${low(P, worst)}.`;
}
export function chips(c: Ctx, m: string): string {
  return c.P.profile.map((x) => `<button type="button" class="ix-chip" data-m="${esc(x)}" aria-pressed="${x === m}">${mark(c, labOf(c, x))}${esc(name(c, x))}</button>`).join('');
}
export function profile(c: Ctx, m: string): string {
  const P = c.P;
  const lv = live(P);
  const p = P.place[m] ?? {};
  const have = lv
    .filter((d) => p[d.id])
    .map((d) => ({ d, x: p[d.id] }))
    .sort((u, v) => u.x.rank - v.x.rank || u.x.gap - v.x.gap);
  const missing = lv.filter((d) => !p[d.id]);
  const firsts = have.filter((h) => h.x.rank === 1).length;
  const top3 = have.filter((h) => h.x.rank <= 3).length;
  const info = c.all.models[m];
  if (!info) return '';
  const line = (h: (typeof have)[number]) => {
    const leader = h.d.rows[0];
    const lo = Math.max(0, Math.floor((Math.min(...h.d.rows.map((r) => r.v)) - 5) / 10) * 10);
    const scale = (v: number) => Math.max(1, ((v - lo) / (leader.v - lo || 1)) * 100);
    const txt =
      h.x.rank === 1 ? (h.d.rows[1] ? `Leads by ${f1(h.d.rows[0].v - h.d.rows[1].v)} over ${esc(name(c, h.d.rows[1].m))}` : 'Leads') : `${f1(-h.x.gap)} behind ${esc(name(c, leader.m))}`;
    const ts = `${ord(h.x.rank)} of ${h.x.of} current models\n${name(c, leader.m)} leads with ${f1(leader.v)}\n${h.x.n} tests in this domain, ${pct(h.x.ev)} of the score from its own results`;
    return `<li tabindex="0"${tipAttr(`${name(c, m)} in ${h.d.name}`, f1(h.x.v), ts)}><span>${esc(h.d.name)}</span><span class="ix-rank num"><b>${ord(h.x.rank)}</b> <span class="ix-small">of ${h.x.of}</span></span><span class="ix-gap"><span class="ix-g-track"><span class="ix-g-fill" style="width:${scale(h.x.v).toFixed(1)}%;background:${color(c, m)}"></span><span class="ix-g-lead"></span></span><span class="ix-g-text">${txt}</span></span></li>`;
  };
  const near = have.filter((h) => h.x.rank <= 3);
  const far = have.filter((h) => h.x.rank > 3);
  const from = info[2] ? ` from ${esc(info[2])}` : '';
  const rel = info[3] ? `, released ${esc(humanDate(info[3]))}` : '';
  const miss = missing.length ? ` Not enough scores yet in ${list(missing.map((d) => esc(low(P, d.id))))}.` : '';
  return `<p class="ix-prof-sum"><b>${esc(info[0])}</b>${from}${rel}. First in ${firsts} ${firsts === 1 ? 'domain' : 'domains'} and in the top three of ${top3}, out of the ${have.length} where it has enough scores.${miss}</p>
<ul class="ix-plist">${near.length ? `<li class="ix-sep">Leads or close</li>${near.map(line).join('')}` : ''}${far.length ? `<li class="ix-sep">Further back</li>${far.map(line).join('')}` : ''}</ul>`;
}
const shade = (r: number) => (r === 1 ? 0.88 : r === 2 ? 0.62 : r === 3 ? 0.44 : r <= 5 ? 0.28 : r <= 10 ? 0.15 : 0.06);
const heatBg = (s: number) => `color-mix(in oklab, var(--ink) ${Math.round(s * 100)}%, var(--bg))`;
export function legend(): string {
  const steps: [number, string][] = [
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th and 5th'],
    [6, '6th to 10th'],
    [11, '11th or lower'],
  ];
  return `${steps.map(([r, t]) => `<span><span class="ix-sw" style="background:${heatBg(shade(r))}"></span>${t}</span>`).join('')}<span><span class="ix-sw ix-none"></span>Too few scores</span>`;
}
export function heat(c: Ctx): string {
  const P = c.P;
  const lv = live(P);
  const head = `<thead><tr><th></th>${lv.map((d) => `<th class="ix-col" scope="col"><span>${esc(short(P, d.id))}</span></th>`).join('')}</tr></thead>`;
  const body = P.profile
    .map((m) => {
      const cells = lv
        .map((d) => {
          const x = P.place[m]?.[d.id];
          if (!x) return `<td class="ix-none" tabindex="0"${tipAttr(`${name(c, m)} in ${d.name}`, undefined, 'Too few scores to rank')}></td>`;
          const s = shade(x.rank);
          const ts = `${ord(x.rank)} of ${x.of}${x.rank > 1 && d.rows[0] ? `\n${f1(-x.gap)} behind ${name(c, d.rows[0].m)}` : ''}`;
          return `<td tabindex="0" style="background:${heatBg(s)};color:${s > 0.5 ? 'var(--bg)' : 'var(--ink)'}"${tipAttr(`${name(c, m)} in ${d.name}`, f1(x.v), ts)}>${x.rank}</td>`;
        })
        .join('');
      return `<tr><th class="ix-row" scope="row">${who(c, m)}</th>${cells}</tr>`;
    })
    .join('');
  return `${head}<tbody>${body}</tbody>`;
}

// ---- the test ranking -------------------------------------------------------------------------------------------
export const RANK_TOP = 25;
export function testsCaption(c: Ctx): string {
  const t = c.P.ranking[0];
  if (!t) return '';
  return `We rank each test family by how much labs use it, and a test's weight on a board is that score squared. ${t.name} tops the list: ${t.launchLabs} labs cited it in launch posts and ${t.cardLabs} in system cards in the year before ${humanDate(c.P.cutoff)}.`;
}
export function ranking(c: Ctx, open: boolean): string {
  const P = c.P;
  const w = P.settings.signals;
  const show = open ? P.ranking : P.ranking.slice(0, RANK_TOP);
  const rows = show
    .map((r, i) => {
      const ts = [
        'Percentiles among the tests that can count, and each one\'s weight:',
        `Labs in launch posts ${pct(r.signal.launchLabs)}, weight ${pct(w.launchLabs)}`,
        `Labs in system cards ${pct(r.signal.cardLabs)}, weight ${pct(w.cardLabs)}`,
        `Releases citing ${pct(r.signal.releases)}, weight ${pct(w.releases)}`,
        `Independent runs ${pct(r.signal.independent)}, weight ${pct(w.independent)}`,
        `Current models ${pct(r.signal.current)}, weight ${pct(w.current)}`,
      ].join('\n');
      return `<tr><td class="r num rank">${i + 1}</td><td>${benchLink(r.id, r.name)}${r.versions > 1 ? ` <span class="ix-small">${r.versions} versions</span>` : ''}</td><td class="ix-small ix-doms">${esc(r.domains.map((x) => short(P, x)).join(', '))}</td><td class="r num">${r.launchLabs}</td><td class="r num">${r.cardLabs}</td><td class="r num">${r.releases}</td><td class="r num">${r.current}</td><td class="r num">${r.independent}</td><td class="num ix-relv" tabindex="0"${tipAttr(r.name, (r.relevance * 100).toFixed(1), ts)}><span class="ix-wbar" style="width:${Math.round(r.relevance * 72)}px"></span>${(r.relevance * 100).toFixed(1)}</td></tr>`;
    })
    .join('');
  return `<thead><tr><th class="r">#</th><th>Test</th><th>Domains</th><th class="r">Labs in launch posts</th><th class="r">Labs in system cards</th><th class="r">Releases citing</th><th class="r">Current models</th><th class="r">Independent runs</th><th>Relevance</th></tr></thead><tbody>${rows}</tbody>`;
}
export function rankMoreText(c: Ctx, open: boolean): string {
  return open ? `Show the top ${RANK_TOP}` : `Show all ${c.P.ranking.length}`;
}

// ---- the method -------------------------------------------------------------------------------------------------
export function how(c: Ctx): string {
  const P = c.P;
  const s = P.settings;
  const w = s.signals;
  const total = P.pool + Object.values(P.dropped).reduce((a, n) => a + n, 0);
  const rebuilt = c.all.order.filter((v) => c.all.versions[v].rebuilt);
  return [
    `<b>Versions.</b> On the 1st of each month the index freezes a version, such as ${esc(c.all.main)}, from the data through the day before. A version pins which tests count and how much each one weighs. It keeps ranking models with the latest scores, so a new model joins without the tests moving under it. Next month's tests show as a preview until they freeze.${rebuilt.length ? ` We rebuilt ${list(rebuilt.map(esc))} after the fact, from the data as it stands today.` : ''}`,
    `<b>Which tests can count.</b> A test counts when it measures what models can do, at least ${s.minModels} models have a score, and the top three models average between 5% and ${s.saturated}%. Labs' internal tests, safety tests, costs, image and video generation, robots and world models stay out. In this version that leaves ${int(P.pool)} of ${int(total)} tests.`,
    `<b>How much each test counts.</b> Each test gets a relevance score from five measures, each a percentile among the tests that can count. Labs that cited it in launch posts over the past year count ${pct(w.launchLabs)}, labs that cited it in system cards ${pct(w.cardLabs)}, model releases that cited it ${pct(w.releases)}, current models with an independent run ${pct(w.independent)} and current models with any score ${pct(w.current)}. Citations count for the whole test family, so a lab citing Terminal-Bench 2.0 counts for Terminal-Bench. A test's weight is its relevance squared.`,
    `<b>Which version of a test.</b> A board uses the newest version that at least half as many labs cited in the past six months as the most cited version, so a board moves to a new version once labs have.`,
    `<b>One scale for every model.</b> Scores go on a 0 to 100 scale, and we fit each model's ability against each test's difficulty across all ${int(P.pool)} tests, as our <a href="/build/">index builder</a> does. Where a model lacks a test, it gets its predicted score, so skipping a hard test never helps.`,
    `<b>Domains.</b> Each domain is a set of the catalog's subcategories or subject tags. Its board uses the ${s.perDomain} most relevant tests that at least five current models took. A model needs real scores on two or more board tests that hold a fifth of the board's weight, so a model that took one or two niche tests can't lead.`,
    `<b>The overall index.</b> It averages each model's domain scores, weighting each domain by its tests' total weight. A domain where a model has too few scores gets the model's usual standing from the domains where it is ranked. A model needs scores in domains holding ${pct(s.domainShare)} of the weight to be ranked. Below that it shows as provisional.`,
    `<b>How sure we are.</b> We redraw every test weight ${s.draws} times, each scaled by a random factor from 0.5 to 1.5, and count how often each leader stays first.`,
    `<b>Sources.</b> For each model and test, an independent run beats the lab's own number. Current models are those released in the past year.`,
  ]
    .map((x) => `<li>${x}</li>`)
    .join('');
}
export function limits(c: Ctx): string {
  const thin = c.P.domains.filter((d) => d.thin);
  return [
    thin.length ? `${list(thin.map((d) => esc(d.name)))} ${thin.length === 1 ? 'has' : 'have'} too few public tests that current models took, so no board yet.` : '',
    `The newest models lean on their labs' own numbers until independent boards run them, and labs pick which tests to report.`,
    `Scores in other units than percent, such as Elo, are rescaled from the lowest to the highest model on that test, so one weak old model can stretch the scale.`,
  ]
    .filter(Boolean)
    .map((x) => `<li>${x}</li>`)
    .join('');
}
