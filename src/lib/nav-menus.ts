// The header's preview menus, after Hansard's site menus and Artificial Analysis's: a tab still links to its own page,
// and pointing at it (or tabbing to it) opens a panel with each page under it as a small preview plot, a name and a
// few words. The previews are sketches in the site's palette, drawn at 64 by 40, not live data.

export interface NavItem {
  href: string;
  name: string;
  line: string;
  /** The preview, as the inside of a 64 by 40 SVG. */
  art: string;
}
export interface NavMenu {
  /** The tab whose link opens this menu. */
  href: string;
  title: string;
  items: NavItem[];
  /** Pages under the tab, so it stays lit on each. */
  under: string[];
}

const C1 = 'var(--lab-openai)';
const C2 = 'var(--lab-anthropic)';
const C3 = 'var(--lab-google)';
const INK = 'var(--ink-4)';
const base = `<line x1="4" x2="60" y1="35" y2="35" stroke="${INK}" stroke-width="1"/>`;
const bars = (hs: number[], colors: string[], w = 5, gap = 2, group = 3) =>
  hs
    .map((h, i) => {
      const x = 6 + i * (w + gap) + Math.floor(i / group) * 4;
      return `<rect x="${x}" y="${35 - h}" width="${w}" height="${h}" rx="1" fill="${colors[i % colors.length]}"/>`;
    })
    .join('');

const ART = {
  compare: base + bars([22, 18, 25, 14, 12, 17, 27, 24, 20], [C1, C2, C3]),
  build:
    [9, 20, 31]
      .map((y, i) => `<line x1="8" x2="56" y1="${y}" y2="${y}" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><line x1="8" x2="${[40, 22, 48][i]}" y1="${y}" y2="${y}" stroke="${[C1, C2, C3][i]}" stroke-width="2" stroke-linecap="round"/><circle cx="${[40, 22, 48][i]}" cy="${y}" r="3.4" fill="var(--bg)" stroke="${[C1, C2, C3][i]}" stroke-width="1.6"/>`)
      .join(''),
  progress:
    base +
    `<path d="M6 28H18V22H30V19H44V12H58" fill="none" stroke="${C1}" stroke-width="1.8"/><path d="M6 33H22V29H36V24H48V20H58" fill="none" stroke="${C2}" stroke-width="1.8"/><circle cx="44" cy="12" r="2.2" fill="${C1}"/><circle cx="48" cy="20" r="2.2" fill="${C2}"/>`,
  timeMachine:
    `<line x1="6" x2="58" y1="28" y2="28" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` +
    [10, 18, 26, 34, 42, 50].map((x) => `<line x1="${x}" x2="${x}" y1="25" y2="31" stroke="${INK}" stroke-width="1"/>`).join('') +
    `<line x1="6" x2="38" y1="28" y2="28" stroke="${C1}" stroke-width="2" stroke-linecap="round"/><circle cx="38" cy="28" r="4" fill="var(--bg)" stroke="${C1}" stroke-width="1.8"/><rect x="26" y="7" width="24" height="10" rx="3" fill="${C1}" opacity="0.18"/><rect x="30" y="11" width="16" height="2" rx="1" fill="${C1}"/>`,
  sql:
    `<rect x="6" y="6" width="52" height="28" rx="3" fill="none" stroke="${INK}" stroke-width="1"/><rect x="6" y="6" width="52" height="7" rx="3" fill="${C3}" opacity="0.35"/>` +
    [17, 23, 29].map((y) => `<line x1="10" x2="54" y1="${y}" y2="${y}" stroke="${INK}" stroke-width="1"/>`).join('') +
    `<line x1="24" x2="24" y1="6" y2="34" stroke="${INK}" stroke-width="1"/><line x1="42" x2="42" y1="6" y2="34" stroke="${INK}" stroke-width="1"/>`,
  reporting: base + bars([10, 16, 21, 27, 24, 30], [C1, C1, C2, C2, C3, C3], 6, 3, 2),
  evals:
    base +
    `<path d="M6 34C16 33 22 30 30 24S46 10 58 8" fill="none" stroke="${C3}" stroke-width="1.8"/><path d="M6 34C18 34 30 32 40 28S52 22 58 21" fill="none" stroke="${C2}" stroke-width="1.8" stroke-dasharray="3 2"/>`,
  frontier:
    base +
    [
      [10, 30],
      [16, 26],
      [22, 27],
      [28, 20],
      [34, 22],
      [40, 15],
      [46, 17],
      [52, 9],
    ]
      .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${[C1, C2, C3][i % 3]}"/>`)
      .join('') +
    `<path d="M8 30H16V26H28V20H40V15H52V9H58" fill="none" stroke="var(--ink-2)" stroke-width="1.2"/>`,
  models:
    `<rect x="6" y="8" width="52" height="7" rx="2" fill="${INK}" opacity="0.5"/><rect x="6" y="8" width="34" height="7" rx="2" fill="${C1}"/><rect x="6" y="19" width="52" height="7" rx="2" fill="${INK}" opacity="0.5"/><rect x="6" y="19" width="20" height="7" rx="2" fill="${C2}"/><rect x="6" y="30" width="52" height="4" rx="2" fill="${INK}" opacity="0.5"/><rect x="6" y="30" width="42" height="4" rx="2" fill="${C3}"/>`,
};

export const PLAYGROUND: NavMenu = {
  href: '/playground/',
  title: 'Tools to explore the data',
  under: ['/playground/', '/compare/', '/build/', '/progress/', '/time-machine/', '/sql/'],
  items: [
    { href: '/compare/', name: 'Compare models', line: 'Up to four, side by side', art: ART.compare },
    { href: '/build/', name: 'Build your own index', line: 'Your benchmarks, your weights', art: ART.build },
    { href: '/progress/', name: 'Progress over time', line: 'Best scores by release date', art: ART.progress },
    { href: '/time-machine/', name: 'Time machine', line: 'Any day since 2023', art: ART.timeMachine },
    { href: '/sql/', name: 'Query with SQL', line: 'Every score, in your browser', art: ART.sql },
  ],
};

export const INSIGHTS: NavMenu = {
  href: '/insights/',
  title: 'How AI evaluation is changing',
  under: ['/insights/'],
  items: [
    { href: '/insights/reporting/', name: 'What labs report', line: 'Benchmarks in launch posts', art: ART.reporting },
    { href: '/insights/evals/', name: 'How are evals changing?', line: 'New tests and how fast they fill', art: ART.evals },
    { href: '/insights/frontier/', name: 'How fast is the frontier moving?', line: 'Best models over time', art: ART.frontier },
    { href: '/insights/models/', name: 'How do new models get tested?', line: 'Claims against independent runs', art: ART.models },
  ],
};

export const NAV_MENUS: Record<string, NavMenu> = { [PLAYGROUND.href]: PLAYGROUND, [INSIGHTS.href]: INSIGHTS };
