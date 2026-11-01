// The home page search box. It loads /search.json the first time someone focuses it, then suggests
// benchmarks, models and labs as they type. Enter opens the highlighted suggestion, or the benchmarks
// table filtered by the text when nothing is highlighted. "/" focuses the box from anywhere on the page.
type Row = [string, string, 'b' | 'm' | 'l', string, string];
const KIND = { b: 'Benchmark', m: 'Model', l: 'Lab' } as const;

const form = document.querySelector<HTMLFormElement>('[data-search]');
if (form) {
  const input = form.querySelector<HTMLInputElement>('input')!;
  const list = form.querySelector<HTMLUListElement>('[role="listbox"]')!;
  let rows: Row[] | null = null;
  let loading: Promise<void> | null = null;
  let hits: Row[] = [];
  let active = -1;

  const load = () =>
    (loading ??= fetch('/search.json')
      .then((r) => r.json())
      .then((j: Row[]) => {
        rows = j;
      })
      .catch(() => {
        rows = [];
      }));

  const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  function rank(q: string): Row[] {
    if (!rows || !q) return [];
    const scored: { r: Row; s: number }[] = [];
    for (const r of rows) {
      const name = norm(r[0]);
      const other = norm(r[4]);
      let s = -1;
      if (name === q) s = 100;
      else if (name.startsWith(q)) s = 80 - name.length / 10;
      else if (name.includes(` ${q}`)) s = 60 - name.length / 10;
      else if (name.includes(q)) s = 40 - name.length / 10;
      else if (other.includes(q)) s = 30 - name.length / 10;
      else if (name.replace(/ /g, '').includes(q.replace(/ /g, ''))) s = 20;
      if (s < 0) continue;
      // labs and models first on a tie: there are fewer of them, so a match is more likely the one meant
      scored.push({ r, s: s + (r[2] === 'l' ? 6 : r[2] === 'm' ? 3 : 0) });
    }
    return scored.sort((a, b) => b.s - a.s).slice(0, 8).map((x) => x.r);
  }

  function render() {
    list.replaceChildren(
      ...hits.map((r, i) => {
        const li = document.createElement('li');
        li.id = `sr-${i}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === active));
        const a = document.createElement('a');
        a.href = r[1];
        a.tabIndex = -1;
        const n = document.createElement('span');
        n.className = 'sr-n';
        n.textContent = r[0];
        const d = document.createElement('span');
        d.className = 'sr-d';
        d.textContent = r[3];
        const k = document.createElement('span');
        k.className = 'sr-k';
        k.textContent = KIND[r[2]];
        a.append(n, d, k);
        li.append(a);
        return li;
      }),
    );
    const open = hits.length > 0;
    form!.classList.toggle('open', open);
    input.setAttribute('aria-expanded', String(open));
    if (active >= 0) input.setAttribute('aria-activedescendant', `sr-${active}`);
    else input.removeAttribute('aria-activedescendant');
  }

  async function update() {
    const q = norm(input.value);
    if (!rows) await load();
    hits = rank(q);
    active = -1;
    render();
  }

  input.addEventListener('focus', () => void load());
  input.addEventListener('input', () => void update());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!hits.length) return;
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + hits.length + 1) % (hits.length + 1);
      if (active === hits.length) active = -1;
      render();
    } else if (e.key === 'Escape') {
      hits = [];
      render();
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pick = hits[active];
    if (pick) location.href = pick[1];
    else if (input.value.trim()) location.href = `/benchmarks/?q=${encodeURIComponent(input.value.trim())}`;
  });
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target as Node)) {
      hits = [];
      render();
    }
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) {
      e.preventDefault();
      input.focus();
    }
  });
}
