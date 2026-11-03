// Filters a table in place. Controls carry data-q (text), and any other data-<key> select matches the
// row attribute of the same name. The URL keeps the filters, so a filtered view can be shared.
//
// Only the first rows that match are laid out: a long table shows PAGE rows, and more come in as the reader
// scrolls to the end (or presses the button there). Laying out 2,800 rows on every keystroke took a third
// of a second; a page of rows takes a few milliseconds. Rows the server marked data-later stay hidden until
// this script runs (see .js [data-later] in global.css), so the first paint is light too.
//
// Rows can nest one level: a row with data-group="k" owns the rows with data-parent="k" that follow it,
// and a button with data-toggle="k" opens and closes them. The filters test only the parent rows. A child
// shows when its parent shows and is open, or when the search text matches the child itself.

import { wireSort } from './sort.ts';

const PAGE = 150;

/**
 * Column widths stay put while rows come and go. The table lays out once with its first page of rows, then
 * keeps those widths (fixed layout), so filtering, sorting or opening a row's versions never shifts a
 * column. A new window width, or the web fonts arriving, measures again.
 */
function freezeColumns(table: HTMLTableElement) {
  const ths = [...(table.tHead?.rows[0]?.cells ?? [])];
  if (!ths.length) return;
  // A cell marked nowrap cannot wrap, so its column must fit the widest one, which may sit in a row that is
  // not shown yet. A probe row holds a copy of each such column's longest cell while the widths are measured.
  // A page can render that row itself in the table's footer (tr[data-probe]): then the first paint already
  // has the final widths, and measuring them moves nothing.
  const own = table.tFoot?.querySelector('tr[data-probe]');
  const longest: (HTMLTableCellElement | undefined)[] = [];
  const len: number[] = [];
  for (const r of own ? [] : (table.tBodies[0]?.rows ?? [])) {
    for (let c = 0; c < r.cells.length && c < ths.length; c++) {
      const cell = r.cells[c];
      if (!cell.classList.contains('nowrap')) continue;
      const l = cell.textContent?.trim().length ?? 0;
      if (l > (len[c] ?? 0)) {
        len[c] = l;
        longest[c] = cell;
      }
    }
  }
  const probe = document.createElement('tr');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.visibility = 'hidden';
  ths.forEach((_, c) => probe.append(longest[c]?.cloneNode(true) ?? document.createElement('td')));
  const measure = () => {
    table.style.tableLayout = '';
    for (const th of ths) th.style.width = '';
    if (longest.length) table.tBodies[0].append(probe);
    const ws = ths.map((th) => th.getBoundingClientRect().width);
    probe.remove();
    ths.forEach((th, i) => {
      th.style.boxSizing = 'border-box';
      th.style.width = `${ws[i]}px`;
    });
    table.style.tableLayout = 'fixed';
  };
  measure();
  void document.fonts?.ready.then(measure);
  let w = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === w) return;
    w = innerWidth;
    requestAnimationFrame(measure);
  });
}

export function wireFilter(name: string) {
  const box = document.querySelector<HTMLElement>(`[data-filter="${name}"]`);
  const table = box?.parentElement?.querySelector<HTMLTableElement>('[data-rows]');
  if (!box || !table) return;
  const all = [...table.tBodies[0].rows];
  let rows = all.filter((r) => !r.dataset.parent);
  const kids = all.filter((r) => r.dataset.parent);
  const parentOf = new Map(kids.map((k) => [k, rows.find((r) => r.dataset.group === k.dataset.parent)]));
  const toggles = new Map([...table.querySelectorAll<HTMLButtonElement>('[data-toggle]')].map((b) => [b.dataset.toggle!, b]));
  // what a search matches: the row's visible text plus any hidden aliases
  const haystack = new Map(all.map((r) => [r, `${r.textContent ?? ''} ${r.dataset.text ?? ''}`.toLowerCase()]));
  const q = box.querySelector<HTMLInputElement>('[data-q]');
  const selects = [...box.querySelectorAll<HTMLSelectElement>('select')];
  // radio groups carry data-key, the row attribute they match
  const radios = [...box.querySelectorAll<HTMLInputElement>('input[type="radio"][data-key]')];
  const radioKeys = [...new Set(radios.map((r) => r.dataset.key!))];
  const radioValue = (k: string) => radios.find((r) => r.dataset.key === k && r.checked)?.value ?? '';
  const count = box.querySelector<HTMLElement>('[data-count]');
  const noun = count?.textContent?.replace(/^[\d,]+\s*/, '') ?? 'rows';
  const params = new URLSearchParams(location.search);
  let matched: HTMLTableRowElement[] = [];
  let limit = PAGE;
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'more-rows';
  more.hidden = true;
  (table.closest('.table-wrap') ?? table).after(more);

  const keyOf = (s: HTMLSelectElement) => Object.keys(s.dataset)[0];
  for (const s of selects) {
    const v = params.get(keyOf(s));
    if (v && [...s.options].some((o) => o.value === v)) s.value = v;
    s.dispatchEvent(new Event('sync'));
  }
  if (q && params.get('q')) q.value = params.get('q')!;
  for (const k of radioKeys) {
    const v = params.get(k);
    const hit = radios.find((r) => r.dataset.key === k && r.value === (v ?? ''));
    if (hit) hit.checked = true;
  }

  const setHidden = (r: HTMLElement, h: boolean) => {
    if (r.hidden !== h) r.hidden = h;
  };

  // show the first `limit` matches and the versions under them
  function reveal() {
    const text = (q?.value ?? '').trim().toLowerCase();
    const on = new Set(matched.slice(0, limit));
    for (const r of rows) setHidden(r, !on.has(r));
    for (const k of kids) {
      const p = parentOf.get(k);
      const open = toggles.get(k.dataset.parent!)?.getAttribute('aria-expanded') === 'true';
      setHidden(k, !p || !!p.hidden || !(open || (!!text && haystack.get(k)!.includes(text))));
    }
    const left = matched.length - Math.min(limit, matched.length);
    more.hidden = left <= 0;
    if (left > 0) more.textContent = `Show ${Math.min(PAGE, left).toLocaleString('en-US')} more of ${left.toLocaleString('en-US')}`;
  }

  function apply() {
    const text = (q?.value ?? '').trim().toLowerCase();
    let shown = 0;
    matched = [];
    for (const r of rows) {
      const ok =
        (!text || haystack.get(r)!.includes(text)) &&
        selects.every((s) => {
          const k = keyOf(s);
          return !s.value || (r.dataset[k] ?? '').split(' ').includes(s.value);
        }) &&
        radioKeys.every((k) => {
          const v = radioValue(k);
          return !v || (r.dataset[k] ?? '').split(' ').includes(v);
        });
      if (ok) {
        shown++;
        matched.push(r);
      }
    }
    limit = PAGE;
    reveal();
    if (count) count.textContent = `${shown.toLocaleString("en-US")} ${shown === 1 ? noun.replace(/s$/, "") : noun}`;
    const p = new URLSearchParams();
    if (text) p.set('q', text);
    for (const s of selects) if (s.value) p.set(keyOf(s), s.value);
    for (const k of radioKeys) if (radioValue(k)) p.set(k, radioValue(k));
    // the sort order lives in the URL too (see sort.ts)
    const cur = new URLSearchParams(location.search);
    for (const k of ['sort', 'dir']) if (cur.has(k)) p.set(k, cur.get(k)!);
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }
  for (const b of toggles.values())
    b.addEventListener('click', () => {
      b.setAttribute('aria-expanded', String(b.getAttribute('aria-expanded') !== 'true'));
      reveal();
    });
  const next = () => {
    if (limit >= matched.length) return;
    limit += PAGE;
    reveal();
  };
  more.addEventListener('click', next);
  // reveal the next page a little before the reader reaches the end
  new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && next(), { rootMargin: '0px 0px 900px 0px' }).observe(more);
  q?.addEventListener('input', apply);
  for (const s of selects) s.addEventListener('change', apply);
  for (const r of radios) r.addEventListener('change', apply);
  apply();
  for (const r of all) r.removeAttribute('data-later');
  freezeColumns(table);
  // a sorted table filters in its new order
  if (table.hasAttribute('data-sort'))
    wireSort(table, () => {
      rows = [...table.tBodies[0].rows].filter((r) => !r.dataset.parent);
      apply();
    });
}
