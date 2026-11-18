// The time machine's day view: what the page shows for one day, worked out from the payload that time-machine.ts
// builds, and the markup for it. It has no data imports, so the server render and the page script draw the same
// thing from the same payload (/time-machine.json).
import { fullDate, humanDate, longMonthYear, score as fmt } from './format.ts';

export interface Payload {
  v: 1;
  /** The first and last day the control reaches, and the day the page opens on. */
  start: string;
  end: string;
  def: string;
  /** lab id: [name, mark kind ('c' color image, 'm' mono mask, '' initial), color] */
  labs: Record<string, [string, string, string]>;
  /** [id, name, lab, released, has a model page (1 or 0)] */
  models: [string, string, string, string, number][];
  /** Models with an Epoch Capabilities Index score: [model index, today's score]. */
  eci: [number, number][];
  /** Every model's release day, in order: the count of models out by a day. */
  modelDays: string[];
  /** [the first of a month, how many benchmarks had opened by then], in order. */
  benchMonths: [string, number][];
  /** benchmark id: [name, unit] */
  benches: Record<string, [string, string]>;
  /** benchmark id: its reigns at number one, [start, model index, steps as [day, best score]]. */
  reigns: Record<string, [string, number, [string, number][]][]>;
  /** [day, the most-cited benchmarks in the year before it, one version per family, most cited first] for the first of each month. */
  cited: [string, string[]][];
  /** Launch posts: [day, model index, lab, link]. */
  posts: [string, number, string, string][];
  /** Arena's names for its top rows, each once. */
  arenaNames: string[];
  /** Arena's text leaderboard on each day it was published: [day, rows of [name index, model index or -1, lab, rating]]. */
  arena: [string, [number, number, string, number][]][];
  /** For the first of each month: [day, past 85%, with scores, featured past 85%, featured with scores]. */
  share: [string, number, number, number, number][];
  /** The benchmarks the watch column can find: [id, name, other names, models scored], most-scored first. */
  watch: [string, string, string, number][];
}

/** One benchmark's scores for the watch column (/time-machine/b/<id>.json). */
export interface WatchFile {
  v: 1;
  id: string;
  name: string;
  unit: string;
  better: 'higher' | 'lower';
  /** The source the benchmark's page leads with, as its switch names it. */
  source: string;
  labs: Record<string, [string, string, string]>;
  /** [model id, name, lab, score, the day it became known, has a model page (1 or 0)] */
  rows: [string, string, string, number, string, number][];
}

export interface DayView {
  day: string;
  benchmarks: number;
  models: number;
  share?: Payload['share'][number];
  eci: { m: number; eci: number }[];
  arena?: { date: string; rows: Payload['arena'][number][1] };
  leaders: { id: string; m?: number; value?: number; since?: string }[];
  posts: Payload['posts'];
  postsIn90: number;
}

/** The last entry whose day is on or before `day`, in a list sorted by day. */
function lastBy<T>(xs: T[], day: string, at: (x: T) => string): T | undefined {
  let lo = 0;
  let hi = xs.length - 1;
  let hit: T | undefined;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (at(xs[mid]) <= day) {
      hit = xs[mid];
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return hit;
}
/** How many days in a sorted list are on or before `day`. */
function countBy(days: string[], day: string): number {
  let lo = 0;
  let hi = days.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (days[mid] <= day) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const clampDay = (p: Pick<Payload, 'start' | 'end'>, day: string) => (day < p.start ? p.start : day > p.end ? p.end : day);
export const isDay = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d\d-\d\d$/.test(s) && !Number.isNaN(Date.parse(s));

/** Who led one benchmark on `day`: the reign that started last on or before it, and its best score by then. */
export function leaderOn(p: Payload, id: string, day: string) {
  const g = lastBy(p.reigns[id] ?? [], day, (r) => r[0]);
  if (!g) return undefined;
  const step = lastBy(g[2], day, (s) => s[0]) ?? g[2][0];
  return { m: g[1], value: step[1], since: g[0] };
}

export function dayView(p: Payload, day: string): DayView {
  const ninety = addDays(day, -90);
  const posts = p.posts.filter((x) => x[0] > ninety && x[0] <= day).sort((a, b) => b[0].localeCompare(a[0]));
  const cited = lastBy(p.cited, day, (c) => c[0]);
  const arena = lastBy(p.arena, day, (a) => a[0]);
  return {
    day,
    benchmarks: lastBy(p.benchMonths, day, (b) => b[0])?.[1] ?? 0,
    models: countBy(p.modelDays, day),
    share: lastBy(p.share, day, (s) => s[0]),
    eci: p.eci
      .filter(([m]) => p.models[m][3] && p.models[m][3] <= day)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([m, eci]) => ({ m, eci })),
    arena: arena ? { date: arena[0], rows: arena[1] } : undefined,
    leaders: (cited?.[1] ?? []).map((id) => ({ id, ...(leaderOn(p, id, day) ?? {}) })),
    posts: posts.slice(0, 12),
    postsIn90: posts.length,
  };
}

// ---- markup ---------------------------------------------------------------------------------------
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const n = (x: number) => x.toLocaleString('en-US');
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : '');

export const mark = (p: Pick<Payload, 'labs'>, lab: string, size = 16) => markFrom(p.labs, lab, size);
function markFrom(labs: Payload['labs'], lab: string, size = 16): string {
  const l = labs[lab];
  const name = esc(l?.[0] ?? lab ?? '');
  if (l?.[1] === 'c') return `<img class="tm-mark" src="/labs/${esc(lab)}-color.svg" width="${size}" height="${size}" alt="" title="${name}" decoding="async">`;
  if (l?.[1] === 'm') return `<span class="tm-mark tm-mask" style="--s:${size}px;--m:url(/labs/${esc(lab)}.svg)" title="${name}" aria-hidden="true"></span>`;
  return `<span class="tm-mark tm-initial" style="--s:${size}px" title="${name}" aria-hidden="true">${esc((l?.[0] ?? '?').slice(0, 1))}</span>`;
}

/** A model with its lab's mark, linked to its page when it has one. */
function model(p: Payload, m: number, extra = ''): string {
  const [id, name, lab, , page] = p.models[m];
  const label = page ? `<a href="/models/${esc(id)}/">${esc(name)}</a>` : esc(name);
  return `<span class="tm-who">${mark(p, lab)}<span class="tm-nm">${label}${extra ? ` <span class="tm-x">${esc(extra)}</span>` : ''}</span></span>`;
}

/** The sentences under the day: who led the index and Arena, in plain words. */
export function finding(p: Payload, v: DayView): string {
  const top = v.eci[0] ? p.models[v.eci[0].m][1] : '';
  const a = v.arena?.rows[0];
  const arena = a ? (a[1] >= 0 ? p.models[a[1]][1] : p.arenaNames[a[0]]) : '';
  if (top && top === arena) return `${top} led both the capabilities index and Arena’s text leaderboard, among the ${n(v.models)} models out.`;
  const parts = [top ? `${top} led the capabilities index among the ${n(v.models)} models out.` : `${n(v.models)} models were out.`];
  if (arena) parts.push(`${arena} topped Arena’s text leaderboard.`);
  return parts.join(' ');
}

export function renderDay(p: Payload, v: DayView, watch = '<section class="tm-col tm-watch" data-watch-slot></section>'): string {
  const eci = v.eci.length
    ? `<ol class="tm-list">${v.eci.map((x, i) => `<li><span class="tm-rk num">${i + 1}</span>${model(p, x.m)}<span class="tm-v num">${x.eci.toFixed(0)}</span></li>`).join('')}</ol>`
    : '<p class="tm-none">No model out by then has an index score.</p>';
  const arenaRows = v.arena?.rows.slice(0, 10) ?? [];
  const arena = arenaRows.length
    ? `<ol class="tm-list">${arenaRows
        .map(([name, m, lab, rating], i) => {
          const raw = p.arenaNames[name];
          // Arena rates a model's thinking mode apart from its plain one: say which, since both map to one model
          const mode = m >= 0 && /thinking/i.test(raw) ? (/(no|non)[-\s]?thinking/i.test(raw) ? 'no thinking' : 'thinking') : '';
          return `<li><span class="tm-rk num">${i + 1}</span>${m >= 0 ? model(p, m, mode) : `<span class="tm-who">${mark(p, lab)}<span class="tm-nm">${esc(raw)}</span></span>`}<span class="tm-v num">${Math.round(rating)}</span></li>`;
        })
        .join('')}</ol>`
    : `<p class="tm-none">Arena’s published history starts on ${humanDate(p.arena[0]?.[0])}.</p>`;
  const leaders = v.leaders.length
    ? `<table class="t tm-t"><thead><tr><th>Benchmark</th><th>Leader</th><th class="r">Best</th><th class="r since">Led since</th></tr></thead><tbody>${v.leaders
        .map((x) => {
          const [name, unit] = p.benches[x.id] ?? [x.id, '%'];
          return `<tr><td class="tm-bn"><a href="/benchmarks/${esc(x.id)}/">${esc(name)}</a></td>${
            x.m === undefined ? '<td class="tm-none" colspan="3">No scores yet</td>' : `<td>${model(p, x.m)}</td><td class="r num">${fmt(x.value!, unit)}</td><td class="r num since">${esc(longMonthYear(x.since))}</td>`
          }</tr>`;
        })
        .join('')}</tbody></table>`
    : '<p class="tm-none">No launch posts in the year before, so there was nothing to rank.</p>';
  const posts = v.posts.length
    ? `<ul class="tm-posts">${v.posts
        .map(([d, m, , url]) => `<li><span class="tm-d num">${esc(fullDate(d))}</span>${model(p, m)}${url ? `<a class="tm-src" href="${esc(url)}" rel="noopener">Launch post</a>` : ''}</li>`)
        .join('')}</ul>${v.postsIn90 > v.posts.length ? `<p class="tm-more">And ${n(v.postsIn90 - v.posts.length)} more.</p>` : ''}`
    : '<p class="tm-none">No launch posts in the 90 days before.</p>';
  const share = v.share ? `${pct(v.share[1], v.share[2])}` : '';
  return `<div class="tm-head"><h2 class="tm-date">${esc(humanDate(v.day))}</h2><p class="tm-find">${esc(finding(p, v))}</p></div>
<div class="stats tm-stats"><div class="stat"><div class="v num">${n(v.benchmarks)}</div><div class="l">benchmarks out</div></div><div class="stat"><div class="v num">${n(v.models)}</div><div class="l">models out</div></div>${
    share ? `<div class="stat"><div class="v num">${share}</div><div class="l">of ${n(v.share![2])} scored benchmarks were past 85%</div></div>` : ''
  }</div>
<div class="tm-cols">
<section class="tm-col"><div class="tm-chead"><h3>Top of the capabilities index</h3><p class="tm-sub">Epoch AI’s index as it stands today, among the models out by then.</p></div><div class="tm-cbody">${eci}</div></section>
<section class="tm-col"><div class="tm-chead"><h3>Arena’s text leaderboard</h3><p class="tm-sub">${v.arena ? `As Arena published it on ${esc(humanDate(v.arena.date))}.` : 'Before Arena’s published history.'}</p></div><div class="tm-cbody">${arena}</div></section>
${watch}
</div>
<section class="tm-block"><h3>Who led the most-cited benchmarks?</h3><p class="tm-sub">${v.leaders.length ? `The ${v.leaders.length === 1 ? 'benchmark' : `${n(v.leaders.length)} benchmarks`} that model releases cited most in the year before.` : 'The benchmarks that model releases cited most in the year before.'}</p><div class="tm-scroll">${leaders}</div></section>
<section class="tm-block"><h3>What did labs launch?</h3><p class="tm-sub">${v.postsIn90 ? `${n(v.postsIn90)} launch ${v.postsIn90 === 1 ? 'post' : 'posts'} in the 90 days before.` : 'Launch posts in the 90 days before.'}</p>${posts}</section>`;
}

// ---- the watch column ------------------------------------------------------------------------------
/** Benchmarks whose name or other names match what the reader typed, best match first, then the most-scored. */
export function watchMatches(p: Pick<Payload, 'watch'>, q: string, k = 8): Payload['watch'] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const hits: [number, number][] = [];
  p.watch.forEach(([, name, aka], i) => {
    const nm = name.toLowerCase();
    const al = aka.toLowerCase();
    const s = nm === t ? 5 : nm.startsWith(t) ? 4 : new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(nm) ? 3 : nm.includes(t) ? 2 : al.includes(t) ? 1 : 0;
    if (s) hits.push([s, i]);
  });
  return hits
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .slice(0, k)
    .map(([, i]) => p.watch[i]);
}

/** A watched benchmark's board on `day`: each model's best score known by then, best first. */
export function watchBoard(w: WatchFile, day: string): { rows: WatchFile['rows']; models: number } {
  const best = new Map<string, WatchFile['rows'][number]>();
  const sign = w.better === 'lower' ? -1 : 1;
  for (const r of w.rows) {
    if (r[4] > day) continue;
    const cur = best.get(r[0]);
    if (!cur || sign * r[3] > sign * cur[3]) best.set(r[0], r);
  }
  const rows = [...best.values()].sort((a, b) => sign * (b[3] - a[3]) || a[1].localeCompare(b[1]));
  return { rows, models: rows.length };
}

/** A source's switch label as it reads after "from": "the official leaderboard", "Epoch AI’s runs". A board's own name stays. */
const FROM_PHRASE: Record<string, string> = {
  'Official leaderboard': 'the official leaderboard',
  'Epoch AI runs': 'Epoch AI’s runs',
  'Collected claims': 'claims Epoch AI collected',
  'Labs’ own numbers': 'the labs’ own numbers',
};
const fromPhrase = (source: string) => FROM_PHRASE[source] ?? source;

/** The column's heading and the line under it: the benchmark's name once one is watched. */
export function renderWatchHead(w: WatchFile | null, day: string, models = 0): string {
  if (!w) return '<h3>Watch a benchmark</h3><p class="tm-sub">Pick one to see its leaderboard on this day.</p>';
  const count = models ? ` ${n(models)} ${models === 1 ? 'model' : 'models'} by then.` : '';
  return `<h3><a class="tm-wname" href="/benchmarks/${esc(w.id)}/">${esc(w.name)}</a></h3><p class="tm-sub">Its leaderboard on ${esc(humanDate(day))}, from ${esc(fromPhrase(w.source))}.${count}</p>`;
}

/** Under the heading: suggestions before a pick, then the watched board. */
export function renderWatchBody(p: Payload, v: DayView, w: WatchFile | null | 'loading' | 'missing'): string {
  if (w === 'loading') return '<p class="tm-none">Loading its scores.</p>';
  if (w === 'missing') return '<p class="tm-none">We couldn’t load that benchmark’s scores. Try another.</p>';
  if (!w) {
    const known = new Set(p.watch.map((x) => x[0]));
    const names = new Map(p.watch.map((x) => [x[0], x[1]]));
    const sug = v.leaders.map((x) => x.id).filter((id) => known.has(id)).slice(0, 4);
    return sug.length
      ? `<p class="tm-wtry">Try one of that day’s most-cited benchmarks.</p><div class="tm-wsug">${sug.map((id) => `<button type="button" class="tm-chip" data-watch-id="${esc(id)}">${esc(names.get(id) ?? id)}</button>`).join('')}</div>`
      : '';
  }
  const b = watchBoard(w, v.day);
  const list = b.rows.length
    ? `<ol class="tm-list">${b.rows
        .slice(0, 10)
        .map(([id, name, lab, value, , page], i) => {
          const label = page ? `<a href="/models/${esc(id)}/">${esc(name)}</a>` : esc(name);
          return `<li><span class="tm-rk num">${i + 1}</span><span class="tm-who">${markFrom(w.labs, lab)}<span class="tm-nm">${label}</span></span><span class="tm-v num">${esc(fmt(value, w.unit))}</span></li>`;
        })
        .join('')}</ol>`
    : '<p class="tm-none">No scores were known by then.</p>';
  return `${list}<div class="tm-wsug tm-wchange"><button type="button" class="tm-chip" data-watch-change>Watch another</button><button type="button" class="tm-chip" data-watch-clear>Remove</button></div>`;
}

/** The whole column as the server draws it: no benchmark picked yet, and the search field waiting for the payload. */
export function renderWatchShell(p: Payload, v: DayView): string {
  return `<section class="tm-col tm-watch" data-watch><div class="tm-chead" data-watch-head>${renderWatchHead(null, v.day)}</div><div class="tm-cbody"><div class="tm-wfind" data-watch-find><label class="sr" for="tm-watch">Find a benchmark</label><input id="tm-watch" class="field" type="search" placeholder="Find a benchmark" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="tm-watch-list" disabled /><ul id="tm-watch-list" class="tm-wlist" role="listbox" aria-label="Benchmarks" hidden></ul></div><div data-watch-body>${renderWatchBody(p, v, null)}</div></div></section>`;
}
