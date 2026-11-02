// Every search box on the page: the one in the header and a page's own big box (the home hero, the 404).
// search-boot.ts imports this file when someone shows they want to search, so pages that never search
// skip it. It loads /search.json once, shares it between the boxes, and suggests benchmarks, models, labs,
// categories and pages as people type (search-rank.ts ranks them). The first suggestion is highlighted, so
// Enter opens it. Under the suggestions, one row offers the benchmarks table filtered by the text and the
// last one opens a GitHub form to suggest a benchmark we don't list.
//
// A query that reads like a sentence ("a benchmark where models play chess") also offers search by meaning
// (see meaning.ts). Once the reader turns it on, meaning matches join the list under any name matches.
import { Meaning, MEANING_MB, meaningPossible, probeGpu } from './meaning.ts';
import { type Entry, type Hit, type Kind, type Memo, type Row, QUERY_STOP, STRONG, addWords, norm, rank, toEntry } from './search-rank.ts';
import { SUBMIT_FORM } from '../lib/criteria.ts';

const KIND: Record<Kind, string> = { b: 'Benchmark', m: 'Model', l: 'Lab', c: 'Category', p: 'Page' };
const SHOW = 8;

interface Item {
  href: string;
  name: string;
  detail: string;
  kind: string;
  cls?: string;
  /** a row that does something on the page instead of opening a link */
  act?: () => void;
  /** never highlighted first, so Enter can't land on it by accident */
  skip?: boolean;
  /** opens another site, in a new tab like every outside link here */
  away?: boolean;
}
interface Box {
  form: HTMLFormElement;
  /** the description words arrived: forget kept rows and redo the current query */
  reset(): void;
  refresh(): void;
  meaningChanged(): void;
}

// ---- the index, one copy for every box ----
let entries: Entry[] | null = null;
let byUrl = new Map<string, Entry>();
let loading: Promise<void> | null = null;
const boxes: Box[] = [];

const idle = (f: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 3000 }) : setTimeout(f, 300));
// The names come first. Description words follow in a second file, so words like "chess" also find benchmarks.
const load = () =>
  (loading ??= fetch('/search.json')
    .then((r) => r.json())
    .then(({ v, rows }: { v: string; rows: Row[] }) => {
      entries = rows.map(toEntry);
      byUrl = new Map(entries.map((e) => [e.r[1], e]));
      idle(() => void loadWords(v));
    })
    .catch(() => {
      entries = [];
    }));
const loadWords = (v: string) =>
  fetch('/search-words.json')
    .then((r) => r.json())
    .then((w: { v: string; words: string[] }) => {
      if (w.v !== v || !entries || w.words.length !== entries.length) return;
      entries.forEach((e, i) => {
        if (w.words[i]) addWords(e, w.words[i]);
      });
      df = null;
      for (const b of boxes) b.reset();
    })
    .catch(() => {});

// ---- search by meaning, one model for every box ----
const meaning = new Meaning(() => {
  for (const b of boxes) b.meaningChanged();
});
// how rare each word is among benchmarks, so a rare query word found in a benchmark's own text can lift it
let df: Map<string, number> | null = null;
const docFreq = () => {
  if (df) return df;
  df = new Map();
  for (const e of entries ?? []) if (e.r[2] === 'b') for (const w of new Set(e.all.split(' '))) if (w) df.set(w, (df.get(w) ?? 0) + 1);
  return df;
};

/** Wire each search box that is not wired yet. */
export function wireAll() {
  for (const f of document.querySelectorAll<HTMLFormElement>('[data-search]')) if (!boxes.some((b) => b.form === f)) boxes.push(wire(f));
}
/** Someone is about to search: fetch the index, and ask once whether this device can search by meaning. */
export function wake() {
  wireAll();
  void load();
  probeGpu(() => boxes.forEach((b) => b.refresh()));
}
/** Fetch the index while the page is idle, before anyone asks. */
export function preload() {
  wireAll();
  void load();
}

function wire(form: HTMLFormElement): Box {
  const input = form.querySelector<HTMLInputElement>('input')!;
  const list = form.querySelector<HTMLUListElement>('[role="listbox"]')!;
  const memo: Memo = { kept: null, keptFor: [] };
  let scored: Hit[] = [];
  let meaningHits: Row[] = [];
  let meaningFor = '';
  let items: Item[] = [];
  let active = -1;
  let timer = 0;

  const text = () => input.value.trim();
  const live = () => document.activeElement === input || form.classList.contains('open');
  const strong = () => scored.filter((x) => x.s >= STRONG);
  // several words that are not simply a name ("claude opus 5"), or a word that matches no name: worth
  // reading for meaning
  const sentenceLike = () => {
    const q = norm(input.value);
    if (q.length < 4) return false;
    return strong().length === 0 || (q.split(' ').length >= 3 && scored[0].s < 66);
  };

  async function runMeaning(now = false) {
    window.clearTimeout(timer);
    const q = norm(input.value);
    if (!q || meaning.state !== 'ready' || !sentenceLike()) return;
    if (!now) {
      timer = window.setTimeout(() => void runMeaning(true), 220);
      return;
    }
    const near = await meaning.search(input.value.trim(), 100);
    if (!near || norm(input.value) !== q) return;
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
    meaningHits = near
      .map((x) => ({ id: x.id, s: x.s + bonus(x.id) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => byUrl.get(`/benchmarks/${x.id}/`)?.r)
      .filter((r): r is Row => !!r)
      .slice(0, SHOW);
    meaningFor = q;
    refresh();
  }

  // ---- the list ----
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
      const add = (r: Row, byMeaning: boolean) => {
        if (out.length >= SHOW || seen.has(r[1])) return;
        out.push(row(r, byMeaning));
        seen.add(r[1]);
      };
      for (const x of strong().slice(0, 4)) add(x.r, false);
      for (const r of meaningHits) add(r, true);
      for (const x of scored) add(x.r, false);
    } else {
      out.push(...scored.slice(0, SHOW).map((x) => row(x.r)));
    }
    if (sentenceLike() && meaning.state !== 'ready' && meaningPossible()) {
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
    // a benchmark we don't list yet: the submission form, with the text as its title
    out.push({ href: `${SUBMIT_FORM}&title=${encodeURIComponent(text())}`, name: `Not listed? Suggest “${text()}”`, detail: '', kind: 'GitHub', cls: 'sr-add', skip: true, away: true });
    return out;
  }

  function option(i: number, it: Item) {
    const li = document.createElement('li');
    li.id = `${list.id}-${i}`;
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
    form.classList.toggle('open', open);
    input.setAttribute('aria-expanded', String(open));
    if (active >= 0) input.setAttribute('aria-activedescendant', `${list.id}-${active}`);
    else input.removeAttribute('aria-activedescendant');
  }

  // Enter goes to the first real result. The offer to download search by meaning (210 MB) and the link
  // that suggests a new benchmark are never preselected, so they run only when the reader picks them.
  const firstPick = () => items.findIndex((it) => !it.act && !it.skip);

  /** Rebuild the rows, keeping the highlight on the same row where it still exists. */
  function refresh() {
    if (!live()) return;
    const keep = items[active]?.href;
    items = compose();
    const i = keep ? items.findIndex((it) => it.href === keep && it.href !== '#') : -1;
    active = i >= 0 ? i : firstPick();
    render();
  }

  async function update() {
    const q = norm(input.value);
    if (!entries) await load();
    if (norm(input.value) !== q) return; // a newer keystroke is already being handled
    scored = rank(entries!, q, memo);
    if (meaningFor !== q) meaningHits = [];
    items = compose();
    active = firstPick();
    render();
    if (sentenceLike()) {
      if (meaning.state === 'ready') void runMeaning();
      else if (meaning.state === 'off' && Meaning.remembered() && meaningPossible()) void meaning.start();
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
      document.getElementById(`${list.id}-${active}`)?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Escape') {
      close();
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!text()) return;
    const it = items[active];
    if (it?.act) it.act();
    else if (it?.away) window.open(it.href, '_blank', 'noopener');
    else location.href = it ? it.href : tableHref();
  });
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target as Node)) close();
  });
  // focus or typing may have come before this file loaded
  if (document.activeElement === input) {
    void load();
    if (text()) void update();
  }

  return {
    form,
    reset() {
      memo.kept = null;
      if (text() && live()) void update();
    },
    refresh,
    meaningChanged() {
      if (!live()) return;
      refresh();
      if (meaning.state === 'ready' && sentenceLike()) void runMeaning(true);
    },
  };
}

wireAll();
