// The Benchmarks and Arenas tables: a click anywhere in a row opens its page, and resting the pointer on a
// row shows a card with the benchmark's best score over time, its top five and, when the board prices
// runs, score against cost. A click anywhere on the card opens the page too.
//
// The card's data is one small file per benchmark (/peek/<id>.json), fetched when the pointer reaches the
// row, so the table carries none of it. The card opens after a short rest, and once one is open, moving
// to the next row swaps it at once. It sits beside the pointer, never under it, so moving down the table
// keeps reaching rows, and moving across the row reaches the card. Touch screens get the row click only.

import { labColor } from '../lib/palette.ts';

type Mark = '' | 'c' | 'm';
interface Peek {
  n: string;
  org: string;
  d: string;
  st: string;
  sc: string;
  lv: string;
  u: string;
  lo: 0 | 1;
  t1: number;
  /** day, value, set a new best, lab */
  p: [number, number, 0 | 1, string?][];
  top: [string, string, Mark, string, number][];
  from: string;
  c?: [number, number, 0 | 1, string?][];
  last: string;
}

const T0 = Date.UTC(2019, 0, 1);
const DAY = 86_400_000;
const cache = new Map<string, Promise<Peek | null>>();
const load = (id: string) => {
  let p = cache.get(id);
  if (!p) {
    p = fetch(`/peek/${id}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Peek>) : null))
      .catch(() => null);
    cache.set(id, p);
  }
  return p;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const yearOf = (d: number) => new Date(T0 + d * DAY).getUTCFullYear();
const dayOfYear = (y: number) => Math.round((Date.UTC(y, 0, 1) - T0) / DAY);
const pctOr = (u: string, v: number) => (u === '%' ? `${+v.toFixed(1)}%` : String(+v.toFixed(v >= 100 ? 0 : 2)));
const usd = (v: number) => (v >= 100 ? `$${Math.round(v)}` : v >= 1 ? `$${v.toFixed(2).replace(/\.00$/, '')}` : `$${+v.toPrecision(2)}`);

function mark(lab: string, kind: Mark) {
  if (kind === 'c') return `<img class="pk-mk" src="/labs/${lab}-color.svg" width="14" height="14" alt="">`;
  if (kind === 'm') return `<span class="pk-mk pk-mask" style="--m:url(/labs/${lab}.svg);background:${labColor(lab)}"></span>`;
  return `<span class="pk-mk pk-init">${esc((lab || '?').slice(0, 1).toUpperCase())}</span>`;
}

/** The value axis: 0 to 100 for percentages, else the data's range with a little room. */
function domain(u: string, vs: number[]): [number, number] {
  if (u === '%') return [0, 100];
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.08;
  return [lo - pad, hi + pad];
}

/** Every model's best score by date, with the best-so-far line through the records. */
function timeChart(d: Peek, w: number, h: number) {
  const L = 30;
  const R = 8;
  const T = 8;
  const B = 18;
  const days = d.p.map((p) => p[0]);
  const t0 = Math.min(...days, d.t1 - 30);
  const [lo, hi] = domain(d.u, d.p.map((p) => p[1]));
  const X = (t: number) => L + ((t - t0) / (d.t1 - t0 || 1)) * (w - L - R);
  const Y = (v: number) => T + (1 - (v - lo) / (hi - lo || 1)) * (h - T - B);
  let s = '';
  const ticks = d.u === '%' ? [0, 50, 100] : [lo, (lo + hi) / 2, hi];
  for (const v of ticks) s += `<line class="pk-grid" x1="${L}" x2="${w - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="pk-ax" x="${L - 6}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end">${esc(pctOr(d.u, v))}</text>`;
  // year labels, spaced so they never touch
  let lastX = -Infinity;
  for (let y = yearOf(t0) + 1; y <= yearOf(d.t1); y++) {
    const x = X(dayOfYear(y));
    if (x - lastX < 34 || x > w - R - 10) continue;
    s += `<line class="pk-yr" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${h - B}"/><text class="pk-ax" x="${x.toFixed(1)}" y="${h - 4}" text-anchor="middle">${y}</text>`;
    lastX = x;
  }
  for (const p of d.p) if (!p[2]) s += `<circle class="pk-dot" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="2.2" style="fill:${labColor(p[3])}"/>`;
  const rec = d.p.filter((p) => p[2]);
  if (rec.length) {
    let path = `M${X(rec[0][0]).toFixed(1)} ${Y(rec[0][1]).toFixed(1)}`;
    for (const p of rec.slice(1)) path += `H${X(p[0]).toFixed(1)}V${Y(p[1]).toFixed(1)}`;
    path += `H${X(d.t1).toFixed(1)}`;
    s += `<path class="pk-line" d="${path}"/>`;
    for (const p of rec) s += `<circle class="pk-rec" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="3.2" style="fill:${labColor(p[3])}"/>`;
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${s}</svg>`;
}

/** Score against cost per task, cost on a log scale, with the step line of the best score at each price. */
function costChart(d: Peek, w: number, h: number) {
  const c = d.c!;
  const L = 30;
  const R = 8;
  const T = 8;
  const B = 18;
  const lc = c.map((p) => Math.log10(p[0]));
  const c0 = Math.min(...lc);
  const c1 = Math.max(...lc);
  const [lo, hi] = domain(d.u, c.map((p) => p[1]));
  const X = (v: number) => L + ((Math.log10(v) - c0) / (c1 - c0 || 1)) * (w - L - R);
  const Y = (v: number) => T + (1 - (v - lo) / (hi - lo || 1)) * (h - T - B);
  let s = '';
  const ticks = d.u === '%' ? [0, 50, 100] : [lo, (lo + hi) / 2, hi];
  for (const v of ticks) s += `<line class="pk-grid" x1="${L}" x2="${w - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="pk-ax" x="${L - 6}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end">${esc(pctOr(d.u, v))}</text>`;
  s += `<text class="pk-ax" x="${L}" y="${h - 4}">${usd(10 ** c0)}</text><text class="pk-ax" x="${w - R}" y="${h - 4}" text-anchor="end">${usd(10 ** c1)}</text>`;
  for (const p of c) if (!p[2]) s += `<circle class="pk-dot" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="2.2" style="fill:${labColor(p[3])}"/>`;
  const f = c.filter((p) => p[2]);
  if (f.length) {
    let path = `M${X(f[0][0]).toFixed(1)} ${Y(f[0][1]).toFixed(1)}`;
    for (const p of f.slice(1)) path += `H${X(p[0]).toFixed(1)}V${Y(p[1]).toFixed(1)}`;
    s += `<path class="pk-line" d="${path}"/>`;
    for (const p of f) s += `<circle class="pk-rec" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="3.2" style="fill:${labColor(p[3])}"/>`;
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${s}</svg>`;
}

function render(d: Peek) {
  const two = !!d.c && d.p.length > 0;
  const W = 412;
  const cw = two ? (W - 16) / 2 : W;
  const facts = [d.org, d.lv].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('');
  let body = '';
  if (d.p.length) {
    body += `<div class="pk-charts${two ? ' two' : ''}"><figure><figcaption>Best score over time</figcaption>${timeChart(d, cw, 118)}</figure>`;
    if (two) body += `<figure><figcaption>Score against cost per task</figcaption>${costChart(d, cw, 118)}</figure>`;
    body += '</div>';
  } else body += '<p class="pk-none">No dated scores here yet.</p>';
  if (d.top.length) {
    // percentages fill from zero; a rating or a count fills across the board's own range, or every bar looks full
    const vals = [...d.top.map((t) => t[4]), ...d.p.map((p) => p[1])];
    const [lo, hi] = d.u === '%' ? [0, 100] : [Math.min(...vals), Math.max(...vals)];
    body += `<ol class="pk-top">${d.top
      .map((t) => {
        const w = d.lo ? 1 - (t[4] - lo) / (hi - lo || 1) : (t[4] - lo) / (hi - lo || 1);
        return `<li>${mark(t[1], t[2])}<span class="pk-nm">${esc(t[0])}</span><span class="pk-bar"><i style="width:${Math.max(2, Math.min(100, w * 100)).toFixed(1)}%;background:${labColor(t[1])}"></i></span><b>${esc(t[3])}</b></li>`;
      })
      .join('')}</ol>`;
  }
  const foot = [d.from && `Top five from ${esc(d.from)}.`, d.last && `Last model added ${esc(d.last)}.`].filter(Boolean).join(' ');
  return `<div class="pk-h"><div class="pk-t"><b>${esc(d.n)}</b><div class="pk-facts">${facts}</div></div>${d.st ? `<span class="tag ${esc(d.sc)}"><span class="dot"></span><span>${esc(d.st)}</span></span>` : ''}</div>${
    d.d ? `<p class="pk-d">${esc(d.d)}</p>` : ''
  }${body}<div class="pk-f"><span>${foot}</span><span class="pk-go">Open<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6h7M6.5 3l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>`;
}

const linkOf = (tr: Element | null) => tr?.querySelector<HTMLAnchorElement>('td a[href^="/benchmarks/"]') ?? null;
const idOf = (a: HTMLAnchorElement) => a.getAttribute('href')!.split('/')[2];

/** A click anywhere in a row opens the row's page: a modifier or the middle button opens it in a new tab. */
function wireRowClicks(body: HTMLTableSectionElement) {
  const go = (e: MouseEvent, tab: boolean) => {
    const t = e.target as Element;
    if (t.closest('a, button, input, select, label, summary')) return;
    if (getSelection()?.toString()) return;
    const a = linkOf(t.closest('tr'));
    if (!a) return;
    if (tab) window.open(a.href, '_blank', 'noopener');
    else location.assign(a.href);
  };
  body.addEventListener('click', (e) => go(e, e.metaKey || e.ctrlKey || e.shiftKey));
  body.addEventListener('auxclick', (e) => {
    if (e.button === 1) go(e, true);
  });
}

let card: HTMLDivElement | undefined;
function cardEl() {
  if (card) return card;
  card = document.createElement('div');
  card.className = 'peek';
  card.setAttribute('aria-hidden', 'true');
  document.body.append(card);
  return card;
}

export function wirePeek(table: HTMLTableElement) {
  const body = table.tBodies[0];
  if (!body || table.dataset.peekWired) return;
  table.dataset.peekWired = '1';
  table.classList.add('rows-open');
  wireRowClicks(body);
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const el = cardEl();
  let row: HTMLTableRowElement | null = null;
  let href = '';
  let showT = 0;
  let hideT = 0;
  let px = 0;
  let token = 0;
  let cur = { left: 0, side: 1 };
  let frame = 0;
  const close = () => {
    clearTimeout(showT);
    el.classList.remove('on', 'glide');
    row = null;
  };
  // The card sits beside the pointer and glides after it (CSS eases left and top). Moving toward the card
  // never pushes it away, so the pointer can still reach it and click.
  const place = (tr: HTMLTableRowElement, fresh: boolean) => {
    const r = tr.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const right = px + 24;
    const leftOf = px - 24 - w;
    let side = right + w <= innerWidth - 12 ? 1 : -1;
    let left = side > 0 ? right : Math.max(12, leftOf);
    if (!fresh && side === cur.side) {
      // heading toward the card: hold it still until the pointer arrives
      if (side > 0 && left > cur.left) left = cur.left;
      if (side < 0 && left < cur.left) left = cur.left;
    }
    // near the window's edge the card keeps the side it opened on, so it never jumps across the pointer
    if (!fresh && side !== cur.side) {
      side = cur.side;
      left = side > 0 ? Math.min(right, cur.left) : Math.max(12, leftOf, cur.left);
    }
    cur = { left, side };
    const top = Math.min(Math.max(12, r.top - 10), innerHeight - h - 12);
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(Math.max(12, top))}px`;
  };
  const open = async (tr: HTMLTableRowElement, a: HTMLAnchorElement) => {
    const mine = ++token;
    const d = await load(idOf(a));
    if (mine !== token || row !== tr || !d) return;
    const was = el.classList.contains('on');
    el.innerHTML = render(d);
    href = a.href;
    place(tr, !was);
    el.classList.add('on');
    // glide only between positions, never from wherever the last card closed
    if (!was) requestAnimationFrame(() => el.classList.add('glide'));
  };

  body.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const tr = (e.target as Element).closest('tr');
    if (!tr || tr === row) return;
    const a = linkOf(tr);
    if (!a) return;
    clearTimeout(hideT);
    clearTimeout(showT);
    row = tr;
    px = e.clientX;
    void load(idOf(a));
    showT = window.setTimeout(() => void open(tr, a), el.classList.contains('on') ? 70 : 380);
  });
  body.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !row || !el.classList.contains('on')) return;
    px = e.clientX;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => row && place(row, false));
  });
  body.addEventListener('pointerleave', () => {
    clearTimeout(showT);
    hideT = window.setTimeout(close, 180);
  });
  el.addEventListener('pointerenter', () => clearTimeout(hideT));
  el.addEventListener('pointerleave', () => {
    hideT = window.setTimeout(close, 180);
  });
  el.addEventListener('click', (e) => {
    if (!href) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) window.open(href, '_blank', 'noopener');
    else location.assign(href);
  });
  addEventListener('scroll', close, { passive: true });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}
