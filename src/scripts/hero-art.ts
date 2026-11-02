// The lines behind the home page title answer the pointer: the line nearest to it lights up and names its
// benchmark, and a click opens that benchmark. The art itself takes no pointer events (the title, search and
// chips sit on top), so the hero finds the nearest line from the path data: each path is a run of points
// joined by eased steps, parsed once on the first move.
const hero = document.querySelector<HTMLElement>('.hero');
const svg = hero?.querySelector<SVGSVGElement>('.hero-art');
const pick = hero?.querySelector<HTMLElement>('.hero-pick');

interface Line {
  el: SVGPathElement;
  xs: number[];
  ys: number[];
}

if (hero && svg && pick) {
  const [, , W, H] = svg.getAttribute('viewBox')!.split(' ').map(Number);
  let lines: Line[] | null = null;
  let on: Line | null = null;
  let frame = 0;
  let last: PointerEvent | null = null;

  // "M10 300H40C55 300 55 280 70 280": the M, H and C end points, in order
  const parse = () =>
    [...svg.querySelectorAll<SVGPathElement>('path[data-b]')].map((el) => {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const m of el.getAttribute('d')!.matchAll(/([MHC])([^MHC]*)/g)) {
        const n = m[2].trim().split(/[\s,]+/).map(Number);
        if (m[1] === 'H') {
          xs.push(n[0]);
          ys.push(ys.at(-1)!);
        } else {
          xs.push(n.at(-2)!);
          ys.push(n.at(-1)!);
        }
      }
      return { el, xs, ys };
    });

  // the line's height at x: between two points it eases like the drawn curve
  const yAt = (l: Line, x: number) => {
    const { xs, ys } = l;
    if (x < xs[0] || x > xs.at(-1)!) return null;
    let i = 1;
    while (i < xs.length - 1 && xs[i] < x) i++;
    const x0 = xs[i - 1];
    const x1 = xs[i];
    const t = x1 > x0 ? Math.min(1, Math.max(0, (x - x0) / (x1 - x0))) : 1;
    return ys[i - 1] + (ys[i] - ys[i - 1]) * t * t * (3 - 2 * t);
  };

  const nearest = (cx: number, cy: number, slack: number): Line | null => {
    lines ??= parse();
    const r = svg.getBoundingClientRect();
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
    const x = ((cx - r.left) / r.width) * W;
    const y = ((cy - r.top) / r.height) * H;
    const tol = (slack / r.height) * H;
    let best: Line | null = null;
    let gap = tol;
    for (const l of lines) {
      const ly = yAt(l, x);
      if (ly === null) continue;
      const d = Math.abs(ly - y);
      if (d < gap) {
        gap = d;
        best = l;
      }
    }
    return best;
  };

  // the title, search box, chips and links keep their own pointer behavior
  const busy = (t: EventTarget | null) => !!(t as Element | null)?.closest?.('a, button, input, label, form, .chips, h1, .hero-lede, .pill, .art-key');

  const show = (l: Line | null, e?: PointerEvent) => {
    if (l !== on) {
      on?.el.classList.remove('on');
      on = l;
      if (l) {
        l.el.classList.add('on');
        l.el.parentNode!.append(l.el); // drawn last, so it sits on top
        pick.querySelector('b')!.textContent = l.el.dataset.n ?? '';
        pick.querySelector('span')!.textContent = l.el.dataset.v ? `best ${l.el.dataset.v}` : '';
      }
      hero.classList.toggle('picking', !!l);
    }
    if (l && e) {
      const hr = hero.getBoundingClientRect();
      const w = pick.offsetWidth;
      pick.style.left = `${Math.min(hr.width - w - 8, Math.max(8, e.clientX - hr.left + 14))}px`;
      pick.style.top = `${e.clientY - hr.top - 42}px`;
    }
  };

  hero.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      last = e;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const ev = last!;
        show(busy(ev.target) ? null : nearest(ev.clientX, ev.clientY, 9), ev);
      });
    },
    { passive: true },
  );
  hero.addEventListener('pointerleave', () => show(null));
  hero.addEventListener('click', (e) => {
    if (busy(e.target)) return;
    // a mouse opens the line it lit; a finger gets a wider reach, since nothing lit up first
    const l = on ?? nearest(e.clientX, e.clientY, 22);
    if (l?.el.dataset.b) location.href = `/benchmarks/${l.el.dataset.b}/`;
  });
}
