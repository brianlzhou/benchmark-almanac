// Search on every page. This small part loads with each page. The search code (search.ts) and its index
// load only when someone shows they want to search: a pointer over a box, a tap, focus or "/". The home
// page fetches them when it's idle too, since its big box asks for a search.
//
// It also runs the header box. Where the header has no room for a field, an icon opens one over the bar.
// While a page's own big box (the home hero, the 404) is on screen, the header box hides, so the page never
// shows two boxes at once. "/" focuses whichever box is showing.
let mod: Promise<typeof import('./search.ts')> | null = null;
const wake = () => void (mod ??= import('./search.ts')).then((m) => m.wake());

const bar = document.querySelector<HTMLElement>('[data-bar-search]');
const barInput = bar?.querySelector<HTMLInputElement>('[data-search] input');
const openBtn = bar?.querySelector<HTMLButtonElement>('[data-find-open]');
const main = document.querySelector<HTMLFormElement>('[data-search-main]');
let mainShowing = !!main;

for (const el of [...document.querySelectorAll<HTMLElement>('[data-search]'), ...(openBtn ? [openBtn] : [])])
  for (const ev of ['pointerenter', 'touchstart', 'focusin']) el.addEventListener(ev, wake, { once: true, passive: true });

const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
if (document.querySelector('[data-search-preload]') && !conn?.saveData && !/2g/.test(conn?.effectiveType ?? '')) {
  const later = () => {
    const go = () => void (mod ??= import('./search.ts')).then((m) => m.preload());
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 3000 });
    else setTimeout(go, 300);
  };
  if (document.readyState === 'complete') later();
  else addEventListener('load', later, { once: true });
}

// ---- the header box ----
/** True where the header shows an icon in place of the field. */
const iconOnly = () => !!openBtn && getComputedStyle(openBtn).display !== 'none';
function open() {
  if (!bar || !barInput) return;
  wake();
  if (iconOnly()) {
    bar.classList.add('finding');
    openBtn!.setAttribute('aria-expanded', 'true');
    document.getElementById('menu')?.hidePopover?.();
  }
  // the field sits in the sticky header, and a plain focus() would scroll the page to where the header began
  barInput.focus({ preventScroll: true });
}
function shut(refocus: boolean) {
  if (!bar?.classList.contains('finding')) return;
  bar.classList.remove('finding');
  openBtn!.setAttribute('aria-expanded', 'false');
  if (refocus) openBtn!.focus();
}
if (bar && barInput) {
  openBtn?.addEventListener('click', open);
  bar.querySelector('[data-find-close]')?.addEventListener('click', () => shut(true));
  // Escape first closes the suggestions (search.ts), then the field. Capture runs before search.ts sees it.
  barInput.form!.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape' || barInput.form!.classList.contains('open')) return;
      if (bar.classList.contains('finding')) shut(true);
      else barInput.blur();
    },
    true,
  );
  document.addEventListener('pointerdown', (e) => {
    if (!bar.contains(e.target as Node)) shut(false);
  });
  bar.addEventListener('focusout', (e) => {
    const to = e.relatedTarget as Node | null;
    if (to && !bar.contains(to)) shut(false);
    setTimeout(sync);
  });
}

// ---- one box at a time ----
/** Show the header box only while the page's own box is off screen. One in use stays until it's left. */
function sync() {
  if (!main || !bar || bar.contains(document.activeElement)) return;
  bar.classList.toggle('main-gone', !mainShowing);
  if (mainShowing) shut(false);
}
if (main && bar && 'IntersectionObserver' in window) {
  // the sticky header covers the top of the window, so a box under it counts as gone
  const top = document.querySelector<HTMLElement>('.bar')?.offsetHeight ?? 64;
  new IntersectionObserver(
    ([e]) => {
      mainShowing = e.isIntersecting;
      sync();
    },
    { rootMargin: `-${top}px 0px 0px 0px` },
  ).observe(main);
}

addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
  const t = e.target as HTMLElement;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
  e.preventDefault();
  if (main && mainShowing) {
    wake();
    main.querySelector('input')?.focus();
  } else open();
});

// a module, so these names stay out of the global scope
export {};
