// Sortable tables. A table opts in with data-sort, and each header with text becomes a button that sorts
// by its column. The first press puts the most useful end first: the highest number, the newest date,
// A to Z for text. The second press reverses it, and the third restores the table's own order.
//
// A cell can carry data-v, the value to sort by (a score, a level's rank). Otherwise its text is read:
// "86.1%", "$1,200", "12k" and "1,105" sort as numbers, "Jul 2025" and "2025-07-14" as dates, the rest as
// text. Empty cells always go last. A header can set data-first="asc" or "desc" to choose the first press,
// or data-nosort to stay plain. Rows nested under a parent (data-parent="k" after data-group="k") move
// with their parent. The URL keeps ?sort=<column>&dir=, so a sorted view can be shared.

type Kind = 'num' | 'date' | 'text';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function num(s: string): number | null {
  const m = s
    .replace(/[−–]/g, '-')
    .replace(/[,$€£\s]/g, '')
    .match(/^(-?\d*\.?\d+)(%|k|m|b|x|×)?/i);
  if (!m) return null;
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[m[2]?.toLowerCase() as 'k' | 'm' | 'b'] ?? 1;
  return parseFloat(m[1]) * mult;
}
function date(s: string): string | null {
  const iso = s.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (iso) return `${iso[1]}-${iso[2] ?? '00'}-${iso[3] ?? '00'}`;
  const my = s.toLowerCase().match(/^(?:(\d{1,2}) )?([a-z]{3})[a-z]* (\d{4})$/);
  if (my && MONTHS.includes(my[2])) return `${my[3]}-${String(MONTHS.indexOf(my[2]) + 1).padStart(2, '0')}-${(my[1] ?? '0').padStart(2, '0')}`;
  return null;
}
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function wireSort(table: HTMLTableElement, onSort?: () => void) {
  const head = table.tHead?.rows[0];
  const body = table.tBodies[0];
  if (!head || !body || table.dataset.sortWired) return;
  table.dataset.sortWired = '1';
  const all = [...body.rows];
  const parents = all.filter((r) => !r.dataset.parent);
  const kidsOf = new Map<string, HTMLTableRowElement[]>();
  for (const r of all) if (r.dataset.parent) kidsOf.set(r.dataset.parent, [...(kidsOf.get(r.dataset.parent) ?? []), r]);
  const original = new Map(parents.map((r, i) => [r, i]));
  const cols = [...head.cells];
  const keys = cols.map((th) => slug(th.textContent ?? ''));
  const cache = new Map<number, { kind: Kind; v: Map<HTMLTableRowElement, number | string | null> }>();

  // a column's values, read once: data-v when given, else the cell's text
  function values(c: number) {
    let got = cache.get(c);
    if (got) return got;
    const raw = parents.map((r) => {
      const cell = r.cells[c];
      const s = (cell?.dataset.v ?? cell?.textContent ?? '').replace(/\s+/g, ' ').trim();
      return [r, s] as const;
    });
    const filled = raw.filter(([, s]) => s);
    const kind: Kind = filled.length && filled.filter(([, s]) => num(s) !== null && date(s) === null).length >= filled.length * 0.8 ? 'num' : filled.length && filled.every(([, s]) => date(s) !== null) ? 'date' : 'text';
    const v = new Map(raw.map(([r, s]) => [r, !s ? null : kind === 'num' ? num(s) : kind === 'date' ? date(s) : s.toLowerCase()]));
    got = { kind, v };
    cache.set(c, got);
    return got;
  }

  let col = -1;
  let dir: 'asc' | 'desc' | '' = '';

  function order() {
    let sorted = parents;
    if (col >= 0 && dir) {
      const { v } = values(col);
      const sign = dir === 'asc' ? 1 : -1;
      sorted = [...parents].sort((a, b) => {
        const x = v.get(a) ?? null;
        const y = v.get(b) ?? null;
        if (x === null || y === null) return x === null && y === null ? original.get(a)! - original.get(b)! : x === null ? 1 : -1;
        const d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
        return d * sign || original.get(a)! - original.get(b)!;
      });
    } else sorted = [...parents].sort((a, b) => original.get(a)! - original.get(b)!);
    const frag = document.createDocumentFragment();
    for (const r of sorted) {
      frag.append(r);
      for (const k of kidsOf.get(r.dataset.group ?? '') ?? []) frag.append(k);
    }
    body.append(frag);
    cols.forEach((th, i) => th.setAttribute('aria-sort', i === col && dir ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'));
    const p = new URLSearchParams(location.search);
    if (col >= 0 && dir) {
      p.set('sort', keys[col]);
      p.set('dir', dir);
    } else {
      p.delete('sort');
      p.delete('dir');
    }
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
    onSort?.();
  }

  const firstDir = (i: number): 'asc' | 'desc' => {
    const f = cols[i].dataset.first;
    if (f === 'asc' || f === 'desc') return f;
    return values(i).kind === 'text' ? 'asc' : 'desc';
  };

  cols.forEach((th, i) => {
    if (th.dataset.nosort !== undefined || !keys[i]) return;
    // a header from SortHead.astro has its button already, which keeps the column from widening on load
    let b = th.querySelector<HTMLButtonElement>(':scope > button.sort');
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.className = 'sort';
      const label = document.createElement('span');
      label.append(...th.childNodes);
      b.append(label);
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('width', '8');
      icon.setAttribute('height', '10');
      icon.setAttribute('viewBox', '0 0 8 10');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<path class="up" d="M1 4l3-3 3 3"/><path class="dn" d="M1 6l3 3 3-3"/>';
      b.append(icon);
      th.replaceChildren(b);
    }
    th.setAttribute('aria-sort', 'none');
    b.addEventListener('click', () => {
      const first = firstDir(i);
      if (col !== i) {
        col = i;
        dir = first;
      } else if (dir === first) dir = first === 'asc' ? 'desc' : 'asc';
      else {
        col = -1;
        dir = '';
      }
      order();
    });
  });

  // a shared link opens sorted
  const p = new URLSearchParams(location.search);
  const at = keys.indexOf(p.get('sort') ?? '');
  if (at >= 0 && cols[at].querySelector('button.sort')) {
    col = at;
    dir = p.get('dir') === 'asc' ? 'asc' : 'desc';
    order();
  }
}

/** Every opted-in table on the page that no filter runs (filter.ts wires its own). */
export function wireSortAll() {
  for (const t of document.querySelectorAll<HTMLTableElement>('table[data-sort]:not([data-rows])')) wireSort(t);
}
