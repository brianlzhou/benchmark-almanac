// Behavior for Dropdown.astro. The hidden select holds the value: choosing an option sets it and fires
// "change", so filter scripts work unchanged. A select changed from outside (a restored URL, a tile click)
// fires "change" or "sync", and the button follows.

function enhance(root: HTMLElement) {
  if (root.dataset.ready) return;
  root.dataset.ready = '1';
  const select = root.querySelector<HTMLSelectElement>('select')!;
  const button = root.querySelector<HTMLButtonElement>('.dd-b')!;
  const label = root.querySelector<HTMLElement>('.dd-v')!;
  const panel = root.querySelector<HTMLElement>('.dd-p')!;
  const list = root.querySelector<HTMLElement>('.dd-l')!;
  const search = root.querySelector<HTMLInputElement>('.dd-s');
  const none = root.querySelector<HTMLElement>('.dd-none');
  const items = [...list.querySelectorAll<HTMLLIElement>('li[role="option"]')];
  // group titles: a title hides while a search leaves none of the options under it
  const heads = [...list.querySelectorAll<HTMLLIElement>('li.dd-h')];
  const multi = select.multiple;
  // the values a multiple select holds, leaving out the "none chosen" option
  const picked = () => new Set([...select.selectedOptions].map((o) => o.value).filter(Boolean));
  let active = -1;

  const visible = () => items.filter((li) => !li.hidden);
  const sync = () => {
    if (multi) {
      const on = picked();
      for (const li of items) li.setAttribute('aria-selected', String(on.has(li.dataset.value ?? '') || (!on.size && !li.dataset.value)));
      const chosen = items.filter((li) => on.has(li.dataset.value ?? ''));
      const name = (li: HTMLLIElement) => li.querySelector('.ol')!.textContent ?? '';
      label.textContent = !chosen.length ? name(items[0]) : chosen.length === 1 ? name(chosen[0]) : `${name(chosen[0])} +${chosen.length - 1}`;
      return;
    }
    const cur = items.find((li) => li.dataset.value === select.value) ?? items[0];
    for (const li of items) li.setAttribute('aria-selected', String(li === cur));
    label.textContent = cur.querySelector('.ol')!.textContent;
  };
  const setActive = (i: number) => {
    const vis = visible();
    if (!vis.length) return;
    active = Math.max(0, Math.min(vis.length - 1, i));
    for (const li of items) li.classList.toggle('active', li === vis[active]);
    list.setAttribute('aria-activedescendant', vis[active].id);
    vis[active].scrollIntoView({ block: 'nearest' });
  };
  const open = () => {
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    // keep the panel on screen: open to the left when there is no room to the right
    panel.classList.remove('right');
    if (panel.getBoundingClientRect().right > window.innerWidth - 8) panel.classList.add('right');
    const vis = visible();
    setActive(Math.max(0, vis.findIndex((li) => (multi ? picked().has(li.dataset.value ?? '') : li.dataset.value === select.value))));
    (search ?? list).focus();
  };
  const close = (refocus = true) => {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (search) {
      search.value = '';
      filter('');
    }
    if (refocus) button.focus();
  };
  const choose = (li: HTMLLIElement) => {
    if (multi) {
      // the first option clears every pick, any other option turns itself on or off, and the panel stays open
      const v = li.dataset.value ?? '';
      for (const o of select.options) if (!v) o.selected = false;
      const opt = [...select.options].find((o) => o.value === v);
      if (v && opt) opt.selected = !opt.selected;
      sync();
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    select.value = li.dataset.value ?? '';
    sync();
    select.dispatchEvent(new Event('change', { bubbles: true }));
    close();
  };
  const filter = (q: string) => {
    const t = q.trim().toLowerCase();
    for (const li of items) li.hidden = !!t && !(li.textContent ?? '').toLowerCase().includes(t);
    for (const h of heads) {
      let n = h.nextElementSibling as HTMLLIElement | null;
      let any = false;
      while (n && !n.classList.contains('dd-h')) {
        if (!n.hidden) any = true;
        n = n.nextElementSibling as HTMLLIElement | null;
      }
      h.hidden = !any;
    }
    if (none) none.hidden = visible().length > 0;
    setActive(0);
  };

  button.addEventListener('click', () => (panel.hidden ? open() : close()));
  for (const li of items) {
    li.addEventListener('click', () => choose(li));
    li.addEventListener('pointermove', () => setActive(visible().indexOf(li)));
  }
  search?.addEventListener('input', () => filter(search.value));
  root.addEventListener('keydown', (e) => {
    if (panel.hidden) {
      if (e.target === button && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        open();
      }
      return;
    }
    const vis = visible();
    if (e.key === 'ArrowDown') setActive(active + 1);
    else if (e.key === 'ArrowUp') setActive(active - 1);
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(vis.length - 1);
    else if (e.key === 'Enter' && vis[active]) choose(vis[active]);
    else if (e.key === 'Escape') close();
    else if (e.key === 'Tab') close(false);
    else return;
    e.preventDefault();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!panel.hidden && !root.contains(e.target as Node)) close(false);
  });
  select.addEventListener('change', sync);
  select.addEventListener('sync', sync);
  sync();
}

for (const el of document.querySelectorAll<HTMLElement>('[data-dd]')) enhance(el);
