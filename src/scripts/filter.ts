// Filters a table in place. Controls carry data-q (text), and any other data-<key> select matches the
// row attribute of the same name. The URL keeps the filters, so a filtered view can be shared.

export function wireFilter(name: string) {
  const box = document.querySelector<HTMLElement>(`[data-filter="${name}"]`);
  const table = box?.parentElement?.querySelector<HTMLTableElement>('[data-rows]');
  if (!box || !table) return;
  const rows = [...table.tBodies[0].rows];
  const q = box.querySelector<HTMLInputElement>('[data-q]');
  const selects = [...box.querySelectorAll<HTMLSelectElement>('select')];
  const count = box.querySelector<HTMLElement>('[data-count]');
  const noun = count?.textContent?.replace(/^[\d,]+\s*/, '') ?? 'rows';
  const params = new URLSearchParams(location.search);

  const keyOf = (s: HTMLSelectElement) => Object.keys(s.dataset)[0];
  for (const s of selects) {
    const v = params.get(keyOf(s));
    if (v && [...s.options].some((o) => o.value === v)) s.value = v;
  }
  if (q && params.get('q')) q.value = params.get('q')!;

  function apply() {
    const text = (q?.value ?? '').trim().toLowerCase();
    let shown = 0;
    for (const r of rows) {
      const ok =
        (!text || (r.dataset.text ?? r.textContent ?? '').toLowerCase().includes(text)) &&
        selects.every((s) => {
          const k = keyOf(s);
          return !s.value || (r.dataset[k] ?? '').split(' ').includes(s.value);
        });
      r.hidden = !ok;
      if (ok) shown++;
    }
    if (count) count.textContent = `${shown.toLocaleString('en-US')} ${noun}`;
    const p = new URLSearchParams();
    if (text) p.set('q', text);
    for (const s of selects) if (s.value) p.set(keyOf(s), s.value);
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }
  q?.addEventListener('input', apply);
  for (const s of selects) s.addEventListener('change', apply);
  apply();
}
