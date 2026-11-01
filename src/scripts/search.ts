// The home page search box. It loads /search.json the first time someone focuses it, then suggests
// benchmarks, models, labs, categories and pages as they type. A name match ranks first, then other
// spellings, then the words a row can also be found by (a benchmark's maker or description, a model's lab).
// The first suggestion is highlighted, so Enter opens it. The last row always offers the benchmarks table
// filtered by the text. "/" focuses the box from anywhere on the page.
//
// A query that reads like a sentence ("a benchmark where models play chess") also offers search by meaning
// (see meaning.ts). Once the reader turns it on, meaning matches join the list under any name matches.
import { Meaning, MEANING_MB } from './meaning.ts';

type Kind = 'b' | 'm' | 'l' | 'c' | 'p';
type Row = [string, string, Kind, string, string, number, string];
const KIND: Record<Kind, string> = { b: 'Benchmark', m: 'Model', l: 'Lab', c: 'Category', p: 'Page' };
const SHOW = 8;
/** A name or other-spelling match scores this or more. Below it, the match is only on other words. */
const STRONG = 36;
/** Words too common in queries to say anything about which benchmark is meant. */
const QUERY_STOP = new Set(
  'the and for with from that this into what when where which who are was can how does find want looking show benchmark benchmarks eval evals evaluation evaluations test tests model models evaluate evaluates evaluating measure measures like about any some'.split(
    ' ',
  ),
);

interface Entry {
  r: Row;
  name: string;
  compact: string;
  alts: string[];
  /** name and other spellings, with a leading space so a word start is " word" */
  names: string;
  /** everything the row can be found by */
  all: string;
}
interface Item {
  href: string;
  name: string;
  detail: string;
  kind: string;
  cls?: string;
  /** a row that does something on the page instead of opening a link */
  act?: () => void;
}

const form = document.querySelector<HTMLFormElement>('[data-search]');
if (form) {
  const input = form.querySelector<HTMLInputElement>('input')!;
  const list = form.querySelector<HTMLUListElement>('[role="listbox"]')!;
  let entries: Entry[] | null = null;
  let byUrl = new Map<string, Entry>();
  let loading: Promise<void> | null = null;
  let scored: { r: Row; s: number }[] = [];
  let meaningHits: Row[] = [];
  let meaningFor = '';
  let items: Item[] = [];
  let active = -1;
  let timer = 0;

  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const load = () =>
    (loading ??= fetch('/search.json')
      .then((r) => r.json())
      .then((rows: Row[]) => {
        entries = rows.map((r) => {
          const name = norm(r[0]);
          const alts = r[4] ? r[4].split(' | ').map(norm).filter(Boolean) : [];
          const names = ` ${[name, ...alts].join(' ')}`;
          return { r, name, compact: name.replace(/ /g, ''), alts, names, all: `${names} ${norm(r[3])} ${r[6]} ` };
        });
        byUrl = new Map(entries.map((e) => [e.r[1], e]));
      })
      .catch(() => {
        entries = [];
      }));

  function score(e: Entry, q: string, toks: string[]): number {
    const { name, alts } = e;
    if (name === q) return 100;
    if (alts.includes(q)) return 92;
    if (name.startsWith(q)) return 80;
    if (name.includes(` ${q}`)) return 66;
    if (alts.some((a) => a.startsWith(q))) return 62;
    if (name.includes(q)) return 52;
    const cq = q.replace(/ /g, '');
    if (cq.length >= 3 && e.compact.includes(cq)) return 48;
    if (alts.some((a) => a.includes(q))) return 42;
    if (toks.every((t) => e.names.includes(` ${t}`))) return STRONG;
    if (toks.every((t) => e.all.includes(` ${t}`))) return 22;
    if (toks.every((t) => t.length >= 3 && e.all.includes(t))) return 10;
    return -1;
  }

  function rank(q: string): { r: Row; s: number }[] {
    if (!entries || !q) return [];
    const toks = q.split(' ');
    const out: { r: Row; s: number; k: number }[] = [];
    for (const e of entries) {
      const s = score(e, q, toks);
      if (s < 0) continue;
      // within one kind of match: the one reported most often, then the shorter name, is more likely the one meant
      out.push({ r: e.r, s, k: s + Math.min(12, e.r[5] ?? 0) / 2 - e.name.length / 40 });
    }
    return out.sort((a, b) => b.k - a.k).slice(0, 20);
  }

  // ---- search by meaning ----
  const meaning = new Meaning(() => {
    if (meaning.state === 'ready' && sentenceLike()) void runMeaning(true);
    else refresh();
  });
  // how rare each word is among benchmarks, so a rare query word found in a benchmark's own text can lift it
  let df: Map<string, number> | null = null;
  const docFreq = () => {
    if (df) return df;
    df = new Map();
    for (const e of entries ?? []) if (e.r[2] === 'b') for (const w of new Set(e.all.split(' '))) if (w) df.set(w, (df.get(w) ?? 0) + 1);
    return df;
  };
  const strong = () => scored.filter((x) => x.s >= STRONG);
  // several words, or a word that matches no name: worth reading for meaning
  const sentenceLike = () => {
    const q = norm(input.value);
    return q.split(' ').length >= 3 || (q.length >= 4 && strong().length === 0);
  };

  async function runMeaning(now = false) {
    window.clearTimeout(timer);
    const q = norm(input.value);
    if (!q || meaning.state !== 'ready' || !sentenceLike()) return;
    if (!now) {
      timer = window.setTimeout(() => void runMeaning(true), 220);
      return;
    }
    const v = await meaning.embed(input.value.trim());
    if (!v || norm(input.value) !== q) return;
    const f = docFreq();
    const n = entries?.filter((e) => e.r[2] === 'b').length ?? 1;
    const words = [...new Set(q.split(' '))].filter((w) => w.length >= 3 && !QUERY_STOP.has(w));
    const idf = (w: string) => Math.log(1 + n / (1 + (f.get(w) ?? 0)));
    const total = words.reduce((a, w) => a + idf(w), 0) || 1;
    // cosine, plus up to 0.06 when the benchmark's own text holds the query's rarer words
    const bonus = (id: string) => {
      const e = byUrl.get(`/benchmarks/${id}/`);
      return e ? (0.06 * words.reduce((a, w) => a + (e.all.includes(` ${w}`) ? idf(w) : 0), 0)) / total : 0;
    };
    meaningHits = meaning
      .rank(v, SHOW, bonus)
      .map((x) => byUrl.get(`/benchmarks/${x.id}/`)?.r)
      .filter((r): r is Row => !!r);
    meaningFor = q;
    refresh();
  }

  // ---- the list ----
  const text = () => input.value.trim();
  const tableHref = () => `/benchmarks/?q=${encodeURIComponent(text())}`;
  const mb = (b: number) => Math.round(b / 1e6).toLocaleString('en-US');

  function compose(): Item[] {
    if (!text()) return [];
    const q = norm(input.value);
    const row = (r: Row, byMeaning = false): Item => ({ href: r[1], name: r[0], detail: r[3], kind: byMeaning ? 'By meaning' : KIND[r[2]], cls: byMeaning ? 'sr-m' : undefined });
    const out: Item[] = [];
    if (meaningHits.length && meaningFor === q) {
      // name matches first, then what the query means, then any weaker word matches
      const seen = new Set<string>();
      for (const x of strong().slice(0, 4)) {
        out.push(row(x.r));
        seen.add(x.r[1]);
      }
      for (const r of meaningHits) if (out.length < SHOW && !seen.has(r[1])) (out.push(row(r, true)), seen.add(r[1]));
      for (const x of scored) if (out.length < SHOW && !seen.has(x.r[1])) (out.push(row(x.r)), seen.add(x.r[1]));
    } else {
      out.push(...scored.slice(0, SHOW).map((x) => row(x.r)));
    }
    if (sentenceLike() && meaning.state !== 'ready') {
      if (meaning.state === 'loading')
        out.push({
          href: '#',
          name: 'Loading search by meaning',
          detail: meaning.total ? `${mb(meaning.loaded)} of ${mb(meaning.total)} MB, once` : 'Starting',
          kind: 'Meaning',
          cls: 'sr-load',
          act: () => {},
        });
      else
        out.push({
          href: '#',
          name: meaning.state === 'failed' ? 'Search by meaning did not start. Try again' : 'Search by meaning',
          detail: meaning.state === 'failed' ? meaning.error : `Downloads a ${MEANING_MB} MB model once. It runs on your device`,
          kind: 'Meaning',
          cls: 'sr-offer',
          act: () => void meaning.start(),
        });
    }
    out.push({ href: tableHref(), name: out.length ? `Search the table for “${text()}”` : `No direct match. Search the table for “${text()}”`, detail: '', kind: 'Table', cls: 'sr-all' });
    return out;
  }

  function option(i: number, it: Item) {
    const li = document.createElement('li');
    li.id = `sr-${i}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', String(i === active));
    if (it.cls) li.className = it.cls;
    if (it.cls === 'sr-load' && meaning.total) li.style.setProperty('--p', `${((meaning.loaded / meaning.total) * 100).toFixed(1)}%`);
    const a = document.createElement('a');
    a.href = it.href;
    a.tabIndex = -1;
    if (it.act) {
      const act = it.act;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        act();
        input.focus();
      });
    }
    const n = document.createElement('span');
    n.className = 'sr-n';
    n.textContent = it.name;
    const d = document.createElement('span');
    d.className = 'sr-d';
    d.textContent = it.detail;
    const k = document.createElement('span');
    k.className = 'sr-k';
    k.textContent = it.kind;
    a.append(n, d, k);
    li.append(a);
    return li;
  }

  function render() {
    list.replaceChildren(...items.map((it, i) => option(i, it)));
    const open = items.length > 0;
    form!.classList.toggle('open', open);
    input.setAttribute('aria-expanded', String(open));
    if (active >= 0) input.setAttribute('aria-activedescendant', `sr-${active}`);
    else input.removeAttribute('aria-activedescendant');
  }

  /** Rebuild the rows, keeping the highlight on the same row where it still exists. */
  function refresh() {
    if (document.activeElement !== input && !form!.classList.contains('open')) return;
    const keep = items[active]?.href;
    items = compose();
    const i = keep ? items.findIndex((it) => it.href === keep && it.href !== '#') : -1;
    active = i >= 0 ? i : items.length ? 0 : -1;
    render();
  }

  async function update() {
    const q = norm(input.value);
    if (!entries) await load();
    if (norm(input.value) !== q) return; // a newer keystroke is already being handled
    scored = rank(q);
    if (meaningFor !== q) meaningHits = [];
    items = compose();
    active = items.length ? 0 : -1;
    render();
    if (sentenceLike()) {
      if (meaning.state === 'ready') void runMeaning();
      else if (meaning.state === 'off' && Meaning.remembered()) void meaning.start();
    }
  }

  const close = () => {
    items = [];
    active = -1;
    list.replaceChildren();
    form.classList.remove('open');
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };

  input.addEventListener('focus', () => {
    void load();
    if (text()) void update();
  });
  input.addEventListener('input', () => void update());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const n = items.length;
      if (!n) return;
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
      render();
      document.getElementById(`sr-${active}`)?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Escape') {
      close();
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!text()) return;
    const it = items[active];
    if (it?.act) it.act();
    else location.href = it ? it.href : tableHref();
  });
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target as Node)) close();
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) {
      e.preventDefault();
      input.focus();
    }
  });
}
