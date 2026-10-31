// One tooltip for every chart. A mark opts in with data-tv (the value), data-tn (the name) and data-ts
// (a quieter line). Keyboard focus shows the same tooltip as hover. Text goes in with textContent only.

const tip = document.getElementById('tip');

function show(el: Element, x: number, y: number) {
  if (!tip) return;
  const d = (el as HTMLElement).dataset;
  tip.replaceChildren();
  for (const [cls, text] of [
    ['tv', d.tv],
    ['tn', d.tn],
    ['ts', d.ts],
  ] as const) {
    if (!text) continue;
    const line = document.createElement('div');
    line.className = cls;
    line.textContent = text;
    tip.append(line);
  }
  const r = tip.getBoundingClientRect();
  const left = Math.min(window.innerWidth - r.width - 12, Math.max(12, x + 14));
  const top = y - r.height - 14 < 8 ? y + 18 : y - r.height - 14;
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
  tip.classList.add('on');
}

function hide() {
  tip?.classList.remove('on');
}

document.addEventListener('pointermove', (e) => {
  const el = (e.target as Element).closest?.('[data-tv],[data-tn]');
  if (el) show(el, e.clientX, e.clientY);
  else hide();
});
document.addEventListener('focusin', (e) => {
  const el = (e.target as Element).closest?.('[data-tv],[data-tn]');
  if (!el) return hide();
  const r = el.getBoundingClientRect();
  show(el, r.left + r.width / 2, r.top);
});
document.addEventListener('focusout', hide);
window.addEventListener('scroll', hide, { passive: true });
