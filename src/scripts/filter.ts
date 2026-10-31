// Filters a table in place. Controls carry data-q (text), and any other data-<key> select matches the
// row attribute of the same name. The URL keeps the filters, so a filtered view can be shared.

export function wireFilter(name: string) {
  const box = document.querySelector<HTMLElement>(`[data-filter="${name}"]`);
  const table = box?.parentElement?.querySelector<HTMLTableElement>('[data-rows]');
  if (!box || !table) return;
  const rows = [...table.tBodies[0].rows];
  // what a search matches: the row's visible text plus any hidden aliases
  const haystack = new Map(rows.map((r) => [r, `${r.textContent ?? ''} ${r.dataset.text ?? ''}`.toLowerCase()]));
  const q = box.querySelector<HTMLInputElement>('[data-q]');
  const selects = [...box.querySelectorAll<HTMLSelectElement>('select')];
  // radio groups carry data-key, the row attribute they match
  const radios = [...box.querySelectorAll<HTMLInputElement>('input[type="radio"][data-key]')];
  const radioKeys = [...new Set(radios.map((r) => r.dataset.key!))];
  const radioValue = (k: string) => radios.find((r) => r.dataset.key === k && r.checked)?.value ?? '';
  const count = box.querySelector<HTMLElement>('[data-count]');
  const noun = count?.textContent?.replace(/^[\d,]+\s*/, '') ?? 'rows';
  const params = new URLSearchParams(location.search);

  const keyOf = (s: HTMLSelectElement) => Object.keys(s.dataset)[0];
  for (const s of selects) {
    const v = params.get(keyOf(s));
    if (v && [...s.options].some((o) => o.value === v)) s.value = v;
  }
  if (q && params.get('q')) q.value = params.get('q')!;
  for (const k of radioKeys) {
    const v = params.get(k);
    const hit = radios.find((r) => r.dataset.key === k && r.value === (v ?? ''));
    if (hit) hit.checked = true;
  }

  function apply() {
    const text = (q?.value ?? '').trim().toLowerCase();
    let shown = 0;
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
      r.hidden = !ok;
      if (ok) shown++;
    }
    if (count) count.textContent = `${shown.toLocaleString('en-US')} ${noun}`;
    const p = new URLSearchParams();
    if (text) p.set('q', text);
    for (const s of selects) if (s.value) p.set(keyOf(s), s.value);
    for (const k of radioKeys) if (radioValue(k)) p.set(k, radioValue(k));
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }
  q?.addEventListener('input', apply);
  for (const s of selects) s.addEventListener('change', apply);
  for (const r of radios) r.addEventListener('change', apply);
  apply();
}
