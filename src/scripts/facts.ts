// Counts in a page's facts line that set a table filter: <button data-fact="status=in-use">. The button sets the
// filter's own control (a dropdown's select or a radio), so the table, the dropdown label and the URL follow as if
// the reader had picked it there. A second click clears the filter. A count shows as pressed while its filter is on.
export function wireFacts(box: HTMLElement | null) {
  if (!box) return;
  const facts = [...document.querySelectorAll<HTMLButtonElement>('button[data-fact]')];
  const parse = (b: HTMLButtonElement) => {
    const [k, v = ''] = (b.dataset.fact ?? '').split('=');
    return { k, v };
  };
  const select = (k: string) => box.querySelector<HTMLSelectElement>(`select[data-${k}]`);
  const radios = (k: string) => [...box.querySelectorAll<HTMLInputElement>(`input[type="radio"][data-key="${k}"]`)];
  const current = (k: string) => select(k)?.value ?? radios(k).find((r) => r.checked)?.value ?? '';
  const mark = () => {
    for (const b of facts) {
      const { k, v } = parse(b);
      b.setAttribute('aria-pressed', String(current(k) === v));
    }
  };
  for (const b of facts)
    b.addEventListener('click', () => {
      const { k, v } = parse(b);
      const next = current(k) === v ? '' : v;
      const s = select(k);
      const target = s ?? radios(k).find((r) => r.value === next);
      if (!target) return;
      if (s) s.value = next;
      else (target as HTMLInputElement).checked = true;
      target.dispatchEvent(new Event('change', { bubbles: true }));
      mark();
      // the table is below the fold: bring the filters and the first rows into view
      if (box.getBoundingClientRect().top > innerHeight * 0.6) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  box.addEventListener('change', mark);
  mark();
}
