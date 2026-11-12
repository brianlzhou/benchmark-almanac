// "Download graph": saves a chart as a PNG or an SVG, after Epoch AI's button of the same name. The file is a
// standalone figure: the chart's headline, the chart as the page draws it now (the view, toggles and width the
// reader chose), and a footer with the site, the page's address and the chart's source credit.
//
// The chart is converted to true SVG, not a screenshot: SVG elements are copied with their computed styles,
// HTML text becomes <text> placed where the browser laid it out, and HTML boxes become <rect>s. Colors come
// from the light theme whatever theme the page is in, because a downloaded chart usually lands on white, and
// the fonts are embedded, so the file looks the same in a slide deck, a vector editor or a post.

const NS = 'http://www.w3.org/2000/svg';
const SITE = 'benchmarks.brianzhou.org';
const PAD = 32;

interface Out {
  /** Which items of a sideways-scrolling strip the file shows: "Ranks 1 to 10 of 41". */
  ranks?: { first: number; last: number; total: number };
  parts: string[];
  defs: string[];
  clips: number;
  fonts: Map<string, Set<string>>;
  /** Images to inline after the synchronous capture: placeholder token, URL. */
  images: { token: string; url: string }[];
}

/** Typographer's quotes and apostrophes: "it's" becomes it’s, and "x" becomes “x”. */
const curly = (s: string) =>
  s
    .replace(/(^|[\s(\[{\u2014-])"(?=\S)/g, '$1\u201c')
    .replace(/"/g, '\u201d')
    .replace(/(^|[\s(\[{\u201c\u2014-])'(?=\S)/g, '$1\u2018')
    .replace(/'/g, '\u2019');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n2 = (v: number) => String(Math.round(v * 100) / 100);
/** A color that paints nothing: none, transparent, or an rgba whose alpha is 0 (not an rgb whose blue is 0). */
function transparent(c: string) {
  if (!c || c === 'none' || c === 'transparent') return true;
  const m = c.match(/^rgba?\(([^)]+)\)$/);
  if (!m) return false;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length === 4 && parseFloat(parts[3]) === 0;
}

/** The first family in a computed font-family list, without quotes. */
const firstFamily = (f: string) => f.split(',')[0].trim().replace(/^["']|["']$/g, '');
function useFont(out: Out, cs: CSSStyleDeclaration) {
  const fam = firstFamily(cs.fontFamily);
  const key = `${cs.fontWeight}|${cs.fontStyle}`;
  if (!out.fonts.has(fam)) out.fonts.set(fam, new Set());
  out.fonts.get(fam)!.add(key);
}

// ---- SVG elements: copy each with the computed styles that matter ---------------------------------------------

const INHERITED = [
  'color',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant-numeric',
  'font-feature-settings',
  'letter-spacing',
  'word-spacing',
  'text-anchor',
  'dominant-baseline',
  'paint-order',
  'visibility',
  'shape-rendering',
  'white-space',
];
const OWN: Record<string, string> = {
  opacity: '1',
  transform: 'none',
  'transform-origin': '',
  'transform-box': '',
  'clip-path': 'none',
  mask: 'none',
  filter: 'none',
  'mix-blend-mode': 'normal',
  'alignment-baseline': 'auto',
  'vector-effect': 'none',
  'marker-start': 'none',
  'marker-mid': 'none',
  'marker-end': 'none',
};
const SVG_ROOT_DEFAULTS: Record<string, string> = {
  color: '',
  fill: 'rgb(0, 0, 0)',
  'fill-opacity': '1',
  'fill-rule': 'nonzero',
  stroke: 'none',
  'stroke-width': '1px',
  'stroke-opacity': '1',
  'stroke-dasharray': 'none',
  'stroke-dashoffset': '0px',
  'stroke-linecap': 'butt',
  'stroke-linejoin': 'miter',
  'stroke-miterlimit': '4',
  'font-variant-numeric': 'normal',
  'font-feature-settings': 'normal',
  'letter-spacing': 'normal',
  'word-spacing': '0px',
  'text-anchor': 'start',
  'dominant-baseline': 'auto',
  'paint-order': 'normal',
  visibility: 'visible',
  'shape-rendering': 'auto',
  'white-space': 'normal',
};
const TEXTY = new Set(['text', 'tspan', 'textPath']);
const SHAPES = new Set(['rect', 'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'use']);

function cloneSvg(src: Element, parentCs: CSSStyleDeclaration | null, out: Out): Element | null {
  const cs = getComputedStyle(src);
  if (cs.display === 'none') return null;
  const tag = src.localName;
  if (tag === 'foreignObject' || tag === 'script' || tag === 'style') return null;
  // hit areas and other invisible shapes add bytes and nothing else
  if (SHAPES.has(tag) && transparent(cs.fill) && transparent(cs.stroke) && tag !== 'use') return null;
  const c = document.createElementNS(NS, tag);
  for (const a of Array.from(src.attributes)) {
    if (/^(class|style|role|tabindex|data-|aria-|on)/.test(a.name)) continue;
    // presentation attributes that name a CSS variable mean nothing outside the page; the computed style replaces them
    if (a.value.includes('var(') || a.value.includes('currentColor')) continue;
    c.setAttribute(a.name, a.value);
  }
  const st: string[] = [];
  for (const p of INHERITED) {
    const v = cs.getPropertyValue(p);
    const was = parentCs ? parentCs.getPropertyValue(p) : SVG_ROOT_DEFAULTS[p];
    if (v && v !== was) st.push(`${p}:${v}`);
  }
  for (const [p, d] of Object.entries(OWN)) {
    const v = cs.getPropertyValue(p);
    if (!v || v === d) continue;
    if ((p === 'transform-origin' || p === 'transform-box') && cs.transform === 'none') continue;
    st.push(`${p}:${v}`);
  }
  if (st.length) c.setAttribute('style', st.join(';'));
  if (TEXTY.has(tag)) useFont(out, cs);
  if (tag === 'image') {
    const href = src.getAttribute('href') ?? src.getAttribute('xlink:href');
    if (href && !href.startsWith('data:')) {
      const token = `@@img${out.images.length}@@`;
      out.images.push({ token, url: new URL(href, location.href).href });
      c.setAttribute('href', token);
      c.removeAttribute('xlink:href');
    }
  }
  for (const ch of Array.from(src.childNodes)) {
    if (ch.nodeType === Node.TEXT_NODE) c.appendChild(document.createTextNode(curly(ch.textContent ?? '')));
    else if (ch.nodeType === Node.ELEMENT_NODE) {
      const k = cloneSvg(ch as Element, cs, out);
      if (k) c.appendChild(k);
    }
  }
  return c;
}

function emitSvg(svg: SVGSVGElement, ox: number, oy: number, out: Out, op: number) {
  const r = svg.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return;
  const c = cloneSvg(svg, null, out);
  if (!c) return;
  c.setAttribute('x', n2(r.left - ox));
  c.setAttribute('y', n2(r.top - oy));
  c.setAttribute('width', n2(r.width));
  c.setAttribute('height', n2(r.height));
  c.removeAttribute('xmlns');
  const s = new XMLSerializer().serializeToString(c).replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, '');
  out.parts.push(op < 0.999 ? `<g opacity="${n2(op)}">${s}</g>` : s);
}

// ---- HTML: boxes, text and images -----------------------------------------------------------------------------

const SKIP = '.seg, [role="radiogroup"], input, select, textarea, [data-dl-skip], [role="tooltip"], [popover], [popovertarget], .sr, script, style, template';

function radius(v: string, w: number) {
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return 0;
  return v.endsWith('%') ? (w * n) / 100 : n;
}

function emitBox(cs: CSSStyleDeclaration, r: DOMRect, ox: number, oy: number, out: Out, op: number) {
  const x = r.left - ox;
  const y = r.top - oy;
  const w = r.width;
  const h = r.height;
  if (w < 0.5 || h < 0.5) return;
  const rx = Math.min(radius(cs.borderTopLeftRadius, w), w / 2, h / 2);
  const o = op < 0.999 ? ` opacity="${n2(op)}"` : '';
  const maskImg = (cs.maskImage && cs.maskImage !== 'none' ? cs.maskImage : cs.getPropertyValue('-webkit-mask-image')) || '';
  const maskUrl = maskImg.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
  if (maskUrl && !transparent(cs.backgroundColor)) {
    // the mark is the mask's shape filled with the box's color; alpha masks match CSS's default for images
    const id = `dlm${out.clips++}`;
    const token = `@@img${out.images.length}@@`;
    out.images.push({ token, url: new URL(maskUrl, location.href).href });
    out.defs.push(`<mask id="${id}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}"><image href="${token}" x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" preserveAspectRatio="xMidYMid meet"/></mask>`);
    out.parts.push(`<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" fill="${cs.backgroundColor}" mask="url(#${id})"${o}/>`);
    return;
  }
  if (!transparent(cs.backgroundColor)) out.parts.push(`<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}"${rx ? ` rx="${n2(rx)}"` : ''} fill="${cs.backgroundColor}"${o}/>`);
  const sides = (['Top', 'Right', 'Bottom', 'Left'] as const).map((s) => ({
    s,
    w: parseFloat(cs.getPropertyValue(`border-${s.toLowerCase()}-width`)) || 0,
    c: cs.getPropertyValue(`border-${s.toLowerCase()}-color`),
    st: cs.getPropertyValue(`border-${s.toLowerCase()}-style`),
  }));
  const live = sides.filter((b) => b.w > 0 && b.st !== 'none' && b.st !== 'hidden' && !transparent(b.c));
  if (!live.length) return;
  const dash = (b: (typeof live)[number]) => (b.st === 'dashed' ? ` stroke-dasharray="${n2(b.w * 3)} ${n2(b.w * 3)}"` : b.st === 'dotted' ? ` stroke-dasharray="${n2(b.w)} ${n2(b.w * 2)}" stroke-linecap="round"` : '');
  if (live.length === 4 && live.every((b) => b.w === live[0].w && b.c === live[0].c && b.st === live[0].st)) {
    const b = live[0];
    out.parts.push(`<rect x="${n2(x + b.w / 2)}" y="${n2(y + b.w / 2)}" width="${n2(w - b.w)}" height="${n2(h - b.w)}"${rx ? ` rx="${n2(Math.max(0, rx - b.w / 2))}"` : ''} fill="none" stroke="${b.c}" stroke-width="${n2(b.w)}"${dash(b)}${o}/>`);
    return;
  }
  for (const b of live) {
    const [x1, y1, x2, y2] =
      b.s === 'Top' ? [x, y + b.w / 2, x + w, y + b.w / 2] : b.s === 'Bottom' ? [x, y + h - b.w / 2, x + w, y + h - b.w / 2] : b.s === 'Left' ? [x + b.w / 2, y, x + b.w / 2, y + h] : [x + w - b.w / 2, y, x + w - b.w / 2, y + h];
    out.parts.push(`<line x1="${n2(x1)}" y1="${n2(y1)}" x2="${n2(x2)}" y2="${n2(y2)}" stroke="${b.c}" stroke-width="${n2(b.w)}"${dash(b)}${o}/>`);
  }
}

let measure: CanvasRenderingContext2D | null = null;
const ascents = new Map<string, number>();
/** Distance from the top of a line box's content area to the baseline, for a computed font. */
function ascent(cs: CSSStyleDeclaration) {
  const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  let a = ascents.get(font);
  if (a === undefined) {
    measure ??= document.createElement('canvas').getContext('2d');
    measure!.font = font;
    const m = measure!.measureText('Hg');
    a = m.fontBoundingBoxAscent / (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent);
    ascents.set(font, a);
  }
  return a;
}

function textStyle(cs: CSSStyleDeclaration) {
  const st = [`font-family:${cs.fontFamily.replace(/"/g, "'")}`, `font-size:${cs.fontSize}`, `font-weight:${cs.fontWeight}`];
  if (cs.fontStyle !== 'normal') st.push(`font-style:${cs.fontStyle}`);
  if (cs.letterSpacing !== 'normal') st.push(`letter-spacing:${cs.letterSpacing}`);
  if (cs.fontVariantNumeric !== 'normal') st.push(`font-variant-numeric:${cs.fontVariantNumeric}`);
  if (cs.fontFeatureSettings !== 'normal') st.push(`font-feature-settings:${cs.fontFeatureSettings.replace(/"/g, "'")}`);
  return st.join(';');
}

function caseOf(word: string, t: string) {
  if (t === 'uppercase') return word.toUpperCase();
  if (t === 'lowercase') return word.toLowerCase();
  if (t === 'capitalize') return word.charAt(0).toUpperCase() + word.slice(1);
  return word;
}

function emitText(node: Text, cs: CSSStyleDeclaration, ox: number, oy: number, out: Out, op: number) {
  const text = node.textContent ?? '';
  if (!text.trim() || transparent(cs.color)) return;
  const range = document.createRange();
  const re = /\S+/g;
  const lines = new Map<number, { x: number; y: number; w: string }[]>();
  const a = ascent(cs);
  for (let m = re.exec(text); m; m = re.exec(text)) {
    range.setStart(node, m.index);
    range.setEnd(node, m.index + m[0].length);
    const rects = Array.from(range.getClientRects()).filter((q) => q.width > 0);
    if (!rects.length) continue;
    const q = rects[0];
    const key = Math.round(q.top);
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key)!.push({ x: q.left - ox, y: q.top - oy + q.height * a, w: curly(caseOf(m[0], cs.textTransform)) });
  }
  if (!lines.size) return;
  useFont(out, cs);
  const o = op < 0.999 ? ` opacity="${n2(op)}"` : '';
  for (const words of lines.values()) {
    const spans = words.map((w) => `<tspan x="${n2(w.x)}">${esc(w.w)}</tspan>`).join('');
    out.parts.push(`<text y="${n2(words[0].y)}" fill="${cs.color}" style="${textStyle(cs)}"${o}>${spans}</text>`);
  }
}

function walk(el: Element, ox: number, oy: number, out: Out, op: number, sx?: { l: number; r: number }) {
  if (el.matches(SKIP)) return;
  // inside a strip that scrolls sideways, an item cut by the strip's edge is left out whole
  if (sx) {
    const rr = el.getBoundingClientRect();
    if (rr.width > 0 && rr.width < sx.r - sx.l && (rr.left < sx.l - 0.5 || rr.right > sx.r + 0.5)) return;
  }
  if (el instanceof SVGSVGElement) {
    const cs = getComputedStyle(el);
    if (sx) {
      const rr = el.getBoundingClientRect();
      if (rr.width < sx.r - sx.l && (rr.left < sx.l - 0.5 || rr.right > sx.r + 0.5)) return;
    }
    if (cs.display === 'none') return;
    const o = op * parseFloat(cs.opacity || '1');
    if (o > 0.001) emitSvg(el, ox, oy, out, o);
    return;
  }
  if (!(el instanceof HTMLElement)) return;
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || el.hidden) return;
  const o = op * parseFloat(cs.opacity || '1');
  if (o <= 0.001) return;
  const r = el.getBoundingClientRect();
  const shown = cs.visibility === 'visible';
  if (el instanceof HTMLImageElement) {
    if (shown && r.width > 0 && el.currentSrc) {
      const token = `@@img${out.images.length}@@`;
      out.images.push({ token, url: el.currentSrc });
      out.parts.push(`<image href="${token}" x="${n2(r.left - ox)}" y="${n2(r.top - oy)}" width="${n2(r.width)}" height="${n2(r.height)}" preserveAspectRatio="xMidYMid meet"${o < 0.999 ? ` opacity="${n2(o)}"` : ''}/>`);
    }
    return;
  }
  if (shown) emitBox(cs, r, ox, oy, out, o);
  // a box that clips its overflow, such as a strip that scrolls sideways, clips what it holds in the file too
  let clipped = false;
  let strip = sx;
  if (/auto|scroll|hidden/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) {
    strip = { l: r.left, r: r.right };
    const list = el.querySelector('ol, ul') ?? el.firstElementChild;
    const items = list ? Array.from(list.children) : [];
    const shown = items.map((it, i) => ({ i, b: it.getBoundingClientRect() })).filter((x) => x.b.width > 0 && x.b.left >= r.left - 0.5 && x.b.right <= r.right + 0.5);
    if (shown.length && shown.length < items.length) out.ranks = { first: shown[0].i + 1, last: shown[shown.length - 1].i + 1, total: items.length };
  }
  if ((cs.overflowX !== 'visible' || cs.overflowY !== 'visible') && r.width > 0 && r.height > 0) {
    const id = `dlc${out.clips++}`;
    out.defs.push(`<clipPath id="${id}"><rect x="${n2(r.left - ox)}" y="${n2(r.top - oy)}" width="${n2(r.width)}" height="${n2(r.height)}"/></clipPath>`);
    out.parts.push(`<g clip-path="url(#${id})">`);
    clipped = true;
  }
  for (const ch of Array.from(el.childNodes)) {
    if (ch.nodeType === Node.TEXT_NODE) {
      if (shown) emitText(ch as Text, cs, ox, oy, out, o);
    } else if (ch.nodeType === Node.ELEMENT_NODE) walk(ch as Element, ox, oy, out, o, strip);
  }
  if (clipped) out.parts.push('</g>');
}

/** Symbols, gradients and other definitions the chart uses from another SVG on the page, such as a sprite of
 * shapes: copied as written, so a symbol's shapes still take their color from the <use> that draws them. */
function borrowedDefs(markup: string) {
  const want = new Set<string>();
  const have = new Set([...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const scan = (m: string) => {
    for (const r of m.matchAll(/(?:href="#|url\(["']?#)([^"')]+)/g)) if (!have.has(r[1])) want.add(r[1]);
  };
  scan(markup);
  const out: string[] = [];
  const done = new Set<string>();
  for (let i = 0; i < 200 && want.size; i++) {
    const id = [...want][0];
    want.delete(id);
    if (done.has(id)) continue;
    done.add(id);
    const el = document.getElementById(id);
    if (!el || !(el instanceof SVGElement)) continue;
    const c = el.cloneNode(true) as Element;
    for (const e of [c, ...Array.from(c.querySelectorAll('*'))])
      for (const a of Array.from(e.attributes)) if (/^(class|style|role|tabindex|data-|aria-)/.test(a.name) || a.value.includes('var(')) e.removeAttribute(a.name);
    const m = new XMLSerializer().serializeToString(c).replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
    out.push(m);
    have.add(id);
    scan(m);
  }
  return out.join('');
}

// ---- fonts and images -----------------------------------------------------------------------------------------

function fontFaces(): CSSFontFaceRule[] {
  const found: CSSFontFaceRule[] = [];
  const scan = (rules: CSSRuleList) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSFontFaceRule) found.push(r);
      else if ('cssRules' in r && (r as CSSGroupingRule).cssRules) scan((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of Array.from(document.styleSheets)) {
    try {
      scan(s.cssRules);
    } catch {
      // a stylesheet from another origin hides its rules; the site's fonts are its own
    }
  }
  return found;
}

const dataUrls = new Map<string, Promise<string>>();
function dataUrl(url: string): Promise<string> {
  let p = dataUrls.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then(
        (b) =>
          new Promise<string>((ok, no) => {
            const fr = new FileReader();
            fr.onload = () => ok(String(fr.result));
            fr.onerror = () => no(fr.error);
            fr.readAsDataURL(b);
          }),
      );
    dataUrls.set(url, p);
  }
  return p;
}

function weightFits(range: string, w: string) {
  const [lo, hi = lo] = range.split(/\s+/).map((v) => (v === 'normal' ? 400 : v === 'bold' ? 700 : Number(v)));
  const n = Number(w) || 400;
  return n >= lo && n <= hi;
}

async function embedFonts(used: Map<string, Set<string>>) {
  const css: string[] = [];
  for (const rule of fontFaces()) {
    const fam = firstFamily(rule.style.getPropertyValue('font-family'));
    const keys = used.get(fam);
    if (!keys) continue;
    const weight = rule.style.getPropertyValue('font-weight') || '400';
    const style = rule.style.getPropertyValue('font-style') || 'normal';
    if (![...keys].some((k) => weightFits(weight, k.split('|')[0]) && (k.split('|')[1] === style || (style === 'normal' && k.split('|')[1] === 'normal')))) continue;
    const src = rule.style.getPropertyValue('src');
    const m = src.match(/url\(["']?([^"')]+)["']?\)\s*(?:format\(["']?([^"')]+)["']?\))?/);
    if (!m) continue;
    const base = rule.parentStyleSheet?.href ?? location.href;
    try {
      const data = await dataUrl(new URL(m[1], base).href);
      const range = rule.style.getPropertyValue('unicode-range');
      css.push(`@font-face{font-family:'${fam}';src:url(${data})${m[2] ? ` format('${m[2]}')` : ''};font-weight:${weight};font-style:${style}${range ? `;unicode-range:${range}` : ''}}`);
    } catch {
      // the file keeps the font's name and falls back to a system face where the font is missing
    }
  }
  return css.join('');
}

// ---- the figure -----------------------------------------------------------------------------------------------

/** Whether the page shows an element now. A display: contents wrapper, such as a headline's variant for the
 * chosen view, has no box of its own, so it counts as shown when its parent is. */
function rendered(el: Element): boolean {
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  if (cs.display === 'contents') return el.parentElement ? rendered(el.parentElement) : true;
  return el.getClientRects().length > 0;
}
function visibleText(el: Element): string {
  let s = '';
  for (const ch of Array.from(el.childNodes)) {
    if (ch.nodeType === Node.TEXT_NODE) s += ch.textContent;
    else if (ch.nodeType === Node.ELEMENT_NODE && rendered(ch as Element) && !(ch as Element).matches('.sr')) s += visibleText(ch as Element);
  }
  return s.replace(/\s+/g, ' ').trim();
}

/** The chart's headline: a given title, or the closest heading above the chart that the page shows now. */
function headingFor(wrap: HTMLElement): HTMLElement | null {
  if (wrap.dataset.titleFrom) {
    const el = Array.from(document.querySelectorAll<HTMLElement>(wrap.dataset.titleFrom)).find(rendered);
    if (el) return el;
  }
  const before = (h: Element) => h.compareDocumentPosition(wrap) & Node.DOCUMENT_POSITION_FOLLOWING;
  const scope = wrap.closest('section, [data-chart-scope]');
  const pick = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>('h1, h2')).filter((h) => before(h) && rendered(h) && !wrap.contains(h)).pop() ?? null;
  return (scope && pick(scope)) || pick(document);
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-$/, '');

function fileName(wrap: HTMLElement, title: string, capture: HTMLElement) {
  const page = location.pathname.split('/').filter(Boolean).pop() ?? 'benchmark-almanac';
  const label = Array.from(capture.querySelectorAll<SVGElement>('svg[role="img"][aria-label]')).find(rendered)?.getAttribute('aria-label');
  const what = wrap.dataset.name ?? (label ? slug(label) : slug(title));
  const s = !what ? page : what.startsWith(page) ? what : `${page}-${what}`;
  return s.replace(/-+/g, '-').slice(0, 100) || 'chart';
}

function pageUrl() {
  const canon = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  const u = new URL(canon ?? location.href);
  return `${SITE}${u.pathname}`.replace(/\/$/, '');
}

/** Words wrapped to a width in a canvas font. */
function wrapLines(text: string, font: string, width: number) {
  measure ??= document.createElement('canvas').getContext('2d');
  measure!.font = font;
  const lines: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (line && measure!.measureText(next).width > width) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

interface Built {
  svg: string;
  width: number;
  height: number;
  name: string;
}

/** Runs `fn` with the page in its light theme and transitions off, then puts the page back, in one task, so
 * the reader never sees the page change. */
function inLight<T>(fn: () => T): T {
  const root = document.documentElement;
  const was = root.getAttribute('data-theme');
  root.classList.add('dl-still');
  root.setAttribute('data-theme', 'light');
  try {
    return fn();
  } finally {
    if (was === null) root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', was);
    void getComputedStyle(root).color;
    root.classList.remove('dl-still');
  }
}

interface Context {
  /** Sentences that describe the page's current state, added to the deck. */
  deck?: string;
  /** A mix of tests and their shares, printed as a list with small bars. */
  mix?: { name: string; share: string; frac: number; color: string }[];
  counts?: string;
  leaves?: string;
}

/** Page state a file has to describe, read when the reader saves. Runs in the light theme, so colors match. */
const CONTEXTS: Record<string, () => Context> = {
  // the build-your-own index: the starting mix, the weights as shares of the index, and the rules in force
  build() {
    const root = document.querySelector<HTMLElement>('[data-bm]');
    if (!root) return {};
    const preset = root.querySelector('[data-preset][aria-pressed="true"]')?.textContent?.trim();
    const mix = Array.from(root.querySelectorAll<HTMLElement>('.bm-pick'))
      .map((li) => {
        const share = li.querySelector('output')?.textContent?.trim() ?? '';
        const dot = li.querySelector<HTMLElement>('.bm-adot');
        return { name: li.querySelector('.bm-pname a')?.textContent?.trim() ?? '', share, frac: (parseFloat(share) || 0) / 100, color: dot ? getComputedStyle(dot).backgroundColor : '#a1a1aa' };
      })
      .filter((x) => x.name && x.frac > 0);
    const src = root.querySelector<HTMLInputElement>('input[name="bm-src"]:checked')?.value;
    const from = src === 'ind' ? 'independent runs only' : src === 'lab' ? 'the labs’ own numbers only' : 'independent runs, with the labs’ own numbers filling gaps';
    const all = root.querySelector<HTMLInputElement>('input[name="bm-need"]:checked')?.value === 'all';
    const n = root.querySelector<HTMLInputElement>('[data-n]')?.value;
    return {
      deck: `${preset ? `The “${preset}” starting mix` : `A custom mix of ${mix.length} ${mix.length === 1 ? 'test' : 'tests'}`}, weighted as listed below. Each test’s scores go on a 0 to 100 scale (other units are rescaled from the lowest model to the highest, and lower-is-better tests are flipped), and a model’s index is the weighted average.`,
      mix,
      counts: `Scores from ${from}. A model needs scores on ${all ? 'every test' : `at least ${n} of the tests`}, and a test it lacks gets a predicted score from its other tests.`,
      leaves: 'Models below that bar, and tests outside the mix.',
    };
  },
  // the reporting page: the year, the frontier-lab switch and the safety switch
  reporting() {
    const form = document.querySelector<HTMLFormElement>('[data-rp-top]');
    const year = form?.querySelector<HTMLInputElement>('input[name="year"]:checked')?.value ?? '';
    const safety = form?.querySelector<HTMLInputElement>('input[name="safety"]')?.checked;
    const frontier = form?.querySelector<HTMLInputElement>('input[name="frontier"]')?.checked;
    const labs = frontier ? (document.querySelector('.rp-fl')?.textContent?.trim().replace(/^The frontier labs are /, 'only the frontier labs, ').replace(/\.$/, '') ?? 'only the frontier labs') : 'every lab we track';
    return {
      counts: `Benchmarks named in launch posts and the system cards, model cards and technical reports published with them, from ${labs}${year ? `, with ${year} as the year in focus` : ''}. A benchmark counts once per release, with or without a score.`,
      leaves: `${safety ? '' : 'Safety, alignment, bio and cyber evaluations. '}Leaderboard and Epoch AI scores, since only what labs reported themselves counts.`,
    };
  },
};

/** The rendered text of the first shown element for each selector in a list ("a | b"). "@lede" is the page's own
 * paragraph right under the chart's headline. */
function textFrom(sel: string | undefined, head: HTMLElement | null) {
  if (!sel) return [];
  const lede = () => {
    for (let e = head?.nextElementSibling; e; e = e.nextElementSibling) if (e.matches('p') && rendered(e)) return e;
    return undefined;
  };
  return sel
    .split(/\s*\|\s*/)
    .map((one) => (one === '@lede' ? lede() : Array.from(document.querySelectorAll(one)).find(rendered)))
    .filter((e): e is Element => Boolean(e))
    .map((e) => visibleText(e));
}

async function build(wrap: HTMLElement): Promise<Built> {
  const capture = wrap.querySelector<HTMLElement>('[data-chart-capture]');
  if (!capture) throw new Error('No chart to save');
  const out: Out = { parts: [], defs: [], clips: 0, fonts: new Map(), images: [] };
  const head = headingFor(wrap);
  let title = wrap.dataset.title ?? (head ? visibleText(head) : '');
  // a headline that doesn't name its benchmark gets the name: "AgentHarm scores over time", or
  // "AgentHarm: Grok 4 Fast leads with 8.00%" for a finding
  const subject = wrap.dataset.subject;
  if (subject && title && !title.toLowerCase().includes(subject.toLowerCase()))
    title = /\d/.test(title) || title.length > 48 ? `${subject}: ${title}` : `${subject} ${title.charAt(0).toLowerCase()}${title.slice(1)}`;
  title = curly(title);
  const credit = curly(wrap.dataset.credit ?? '');

  const snap = inLight(() => {
    const r = capture.getBoundingClientRect();
    walk(capture, r.left, r.top, out, 1);
    const rootCs = getComputedStyle(document.documentElement);
    const v = (n: string) => rootCs.getPropertyValue(n).trim();
    const headCs = head ? getComputedStyle(head) : null;
    return {
      w: Math.ceil(r.width),
      h: Math.ceil(r.height),
      bg: v('--bg') || '#ffffff',
      ink: v('--ink') || '#0b0b0c',
      ink2: v('--ink-2') || '#45454d',
      ink3: v('--ink-3') || '#6f6f78',
      line: v('--line') || '#e7e7ea',
      serif: v('--font-serif'),
      sans: v('--font-sans'),
      mono: v('--font-mono'),
      head: headCs ? { size: parseFloat(headCs.fontSize), weight: headCs.fontWeight, family: headCs.fontFamily, ls: headCs.letterSpacing } : null,
      ctx: wrap.dataset.context && CONTEXTS[wrap.dataset.context] ? CONTEXTS[wrap.dataset.context]() : ({} as Context),
    };
  });

  const W = snap.w + PAD * 2;
  const sans = `${snap.sans}, system-ui, sans-serif`;
  const mono = `${snap.mono}, ui-monospace, monospace`;
  const q = (f: string) => f.replace(/"/g, "'");
  const useFace = (family: string, key: string) => out.fonts.set(firstFamily(family), new Set([...(out.fonts.get(firstFamily(family)) ?? []), key]));
  useFace(sans, '400|normal');
  useFace(sans, '500|normal');
  useFace(sans, '600|normal');
  useFace(mono, '400|normal');
  const text = (x: number, y: number, t: string, o: { size: number; fill: string; weight?: number; font?: string; anchor?: string }) =>
    `<text x="${n2(x)}" y="${n2(y)}" fill="${o.fill}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''} style="font-family:${q(o.font ?? sans)};font-size:${o.size}px;font-weight:${o.weight ?? 400}">${t}</text>`;
  let y = PAD;
  const top: string[] = [];

  // the headline, in the page's own heading type, at most 28px so a long one stays a title
  if (title) {
    const size = Math.min(snap.head?.size ?? 24, 28);
    const family = snap.head?.family ?? `${snap.serif}, Georgia, serif`;
    const weight = snap.head?.weight ?? '400';
    const lh = Math.round(size * 1.22);
    const lines = wrapLines(title, `${weight} ${size}px ${family}`, snap.w);
    useFace(family, `${weight}|normal`);
    lines.forEach((l, i) => top.push(`<text x="${PAD}" y="${n2(y + size * 0.86 + i * lh)}" fill="${snap.ink}" style="font-family:${q(family)};font-size:${size}px;font-weight:${weight}${snap.head?.ls && snap.head.ls !== 'normal' ? `;letter-spacing:${snap.head.ls}` : ''}">${esc(l)}</text>`));
    y += lines.length * lh + 10;
  }

  // the deck: what this is, who made it and what the number measures, then any page state it depends on
  const deck = curly([wrap.dataset.deck, ...textFrom(wrap.dataset.deckFrom, head), snap.ctx.deck].filter(Boolean).join(' '));
  if (deck) {
    for (const l of wrapLines(deck, `400 14.5px ${sans}`, snap.w)) {
      y += 21;
      top.push(text(PAD, y, esc(l), { size: 14.5, fill: snap.ink2 }));
    }
    y += 8;
  }

  // a mix: each test and its share of the index, in columns, with a small bar for the share
  const mix = snap.ctx.mix ?? [];
  if (mix.length) {
    y += 8;
    const cols = Math.max(1, Math.min(3, Math.floor(snap.w / 300)));
    const colW = snap.w / cols;
    const rows = Math.ceil(mix.length / cols);
    const barW = 56;
    measure ??= document.createElement('canvas').getContext('2d');
    mix.forEach((m, i) => {
      const cx = PAD + Math.floor(i / rows) * colW;
      const cy = y + (i % rows) * 22 + 15;
      const nameW = colW - 24 - barW - 52;
      measure!.font = `400 13px ${sans}`;
      let nm = curly(m.name);
      while (nm.length > 4 && measure!.measureText(nm).width > nameW) nm = `${nm.slice(0, -2).trimEnd()}…`;
      top.push(`<circle cx="${n2(cx + 4)}" cy="${n2(cy - 4.5)}" r="4" fill="${m.color}"/>`);
      top.push(text(cx + 14, cy, esc(nm), { size: 13, fill: snap.ink }));
      const bx = cx + colW - 24 - barW;
      top.push(text(bx - 8, cy, esc(m.share), { size: 12.5, fill: snap.ink2, font: mono, anchor: 'end' }));
      top.push(`<rect x="${n2(bx)}" y="${n2(cy - 8)}" width="${barW}" height="5" rx="2.5" fill="${snap.line}"/>`);
      top.push(`<rect x="${n2(bx)}" y="${n2(cy - 8)}" width="${n2(Math.max(2, barW * Math.min(1, m.frac)))}" height="5" rx="2.5" fill="${m.color}"/>`);
    });
    y += rows * 22 + 10;
  }

  // the value axis's title, over the chart, so the scale says what it measures
  if (wrap.dataset.yAxis) {
    y += deck || mix.length ? 32 : 22;
    top.push(text(PAD, y, esc(curly(wrap.dataset.yAxis)), { size: 12.5, fill: snap.ink3, weight: 500 }));
    y += 4;
  }
  y += 12;
  const chartY = y;
  y += snap.h;
  if (out.ranks) {
    y += 18;
    top.push(text(PAD, y, esc(`Ranks ${out.ranks.first} to ${out.ranks.last} of ${out.ranks.total}.`), { size: 12.5, fill: snap.ink3 }));
  }
  if (wrap.dataset.xAxis) {
    y += 18;
    top.push(text(PAD + snap.w, y, esc(curly(wrap.dataset.xAxis)), { size: 12.5, fill: snap.ink3, weight: 500, anchor: 'end' }));
  }
  y += 22;

  // what the chart counts and leaves out
  const notes: [string, string | undefined][] = [
    ['Counts', curly(wrap.dataset.counts ?? snap.ctx.counts ?? '') || undefined],
    ['Leaves out', curly(wrap.dataset.leaves ?? snap.ctx.leaves ?? '') || undefined],
  ];
  for (const [label, body] of notes) {
    if (!body) continue;
    measure ??= document.createElement('canvas').getContext('2d');
    measure!.font = `600 13px ${sans}`;
    const lw = measure!.measureText(label).width + 8;
    // the first line leaves room for its label; the rest use the full width
    const words = body.split(/\s+/);
    measure!.font = `400 13px ${sans}`;
    let line = '';
    const lines: string[] = [];
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      const room = lines.length === 0 ? snap.w - lw : snap.w;
      if (line && measure!.measureText(next).width > room) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => {
      y += 19;
      if (i === 0) top.push(text(PAD, y, esc(label), { size: 13, fill: snap.ink2, weight: 600 }));
      top.push(text(PAD + (i === 0 ? lw : 0), y, esc(l), { size: 13, fill: snap.ink3 }));
    });
    y += 6;
  }
  y += 14;

  // the footer: the site and the page's address, then the source credit
  const foot: string[] = [];
  const site = 'Benchmark Almanac';
  measure ??= document.createElement('canvas').getContext('2d');
  measure!.font = `600 13px ${sans}`;
  const siteW = measure!.measureText(site).width;
  foot.push(text(PAD, y + 11, esc(site), { size: 13, fill: snap.ink, weight: 600 }));
  // the page's address sits beside the site's name, or under it when the figure is too narrow for both
  measure!.font = `400 12px ${mono}`;
  const url = pageUrl();
  const beside = PAD + siteW + 12 + measure!.measureText(url).width <= W - PAD;
  if (!beside) y += 19;
  foot.push(text(beside ? PAD + siteW + 12 : PAD, y + 11, esc(url), { size: 12, fill: snap.ink3, font: mono }));
  y += 18;
  if (credit) {
    for (const l of wrapLines(credit, `400 13px ${sans}`, snap.w)) {
      y += 19;
      foot.push(text(PAD, y, esc(l), { size: 13, fill: snap.ink3 }));
    }
    y += 4;
  }
  const H = Math.ceil(y + PAD - 4);

  const [fonts, images] = await Promise.all([embedFonts(out.fonts), Promise.all(out.images.map((im) => dataUrl(im.url).catch(() => '')))]);
  let body = out.parts.join('');
  let defs = out.defs.join('') + borrowedDefs(body + out.defs.join(''));
  out.images.forEach((im, i) => {
    body = body.split(im.token).join(images[i]);
    defs = defs.split(im.token).join(images[i]);
  });
  const svg =
    `<svg xmlns="${NS}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    (title ? `<title>${esc(title)}</title>` : '') +
    (deck ? `<desc>${esc(deck)}</desc>` : '') +
    `<style>${fonts}</style>` +
    (defs ? `<defs>${defs}</defs>` : '') +
    `<rect width="${W}" height="${H}" fill="${snap.bg}"/>` +
    top.join('') +
    `<g transform="translate(${PAD} ${chartY})">${body}</g>` +
    foot.join('') +
    `</svg>`;
  return { svg, width: W, height: H, name: fileName(wrap, title, capture) };
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function png(b: Built): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([b.svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'sync';
    img.src = url;
    await img.decode();
    const k = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(b.width * k);
    canvas.height = Math.round(b.height * k);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(k, k);
    ctx.drawImage(img, 0, 0, b.width, b.height);
    return await new Promise<Blob>((ok, no) => canvas.toBlob((x) => (x ? ok(x) : no(new Error('PNG failed'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadChart(wrap: HTMLElement, fmt: 'png' | 'svg') {
  const b = await build(wrap);
  if (fmt === 'svg') save(new Blob([b.svg], { type: 'image/svg+xml' }), `${b.name}.svg`);
  else save(await png(b), `${b.name}.png`);
}

// ---- the button and its menu ----------------------------------------------------------------------------------

function close(dd: HTMLElement, focus = false) {
  const b = dd.querySelector<HTMLButtonElement>('.cdl-b');
  const m = dd.querySelector<HTMLElement>('.cdl-m');
  if (!b || !m || m.hidden) return;
  m.hidden = true;
  b.setAttribute('aria-expanded', 'false');
  if (focus) b.focus();
}
function open(dd: HTMLElement, at: 'first' | 'last' | null) {
  document.querySelectorAll<HTMLElement>('[data-chart-dl] .cdl-dd').forEach((o) => o !== dd && close(o));
  const b = dd.querySelector<HTMLButtonElement>('.cdl-b')!;
  const m = dd.querySelector<HTMLElement>('.cdl-m')!;
  m.hidden = false;
  b.setAttribute('aria-expanded', 'true');
  const items = Array.from(m.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
  if (at) (at === 'first' ? items[0] : items[items.length - 1])?.focus();
}

function updateShown(wrap: HTMLElement) {
  const sel = wrap.dataset.showWhen;
  const row = wrap.querySelector<HTMLElement>('.cdl-row');
  if (sel && row) row.hidden = !document.querySelector(sel);
}

function init() {
  const wraps = Array.from(document.querySelectorAll<HTMLElement>('[data-chart-dl]'));
  wraps.forEach(updateShown);
  if (wraps.some((w) => w.dataset.showWhen)) document.addEventListener('change', () => wraps.forEach(updateShown));
  if (document.documentElement.dataset.cdl) return;
  document.documentElement.dataset.cdl = '1';

  document.addEventListener('click', async (e) => {
    const t = e.target as Element;
    const b = t.closest<HTMLButtonElement>('[data-chart-dl] .cdl-b');
    const item = t.closest<HTMLButtonElement>('[data-chart-dl] [role="menuitem"]');
    const dd = t.closest<HTMLElement>('[data-chart-dl] .cdl-dd');
    if (b && dd) {
      if (b.getAttribute('aria-expanded') === 'true') close(dd);
      else open(dd, null);
      return;
    }
    if (item && dd) {
      const wrap = item.closest<HTMLElement>('[data-chart-dl]')!;
      const btn = dd.querySelector<HTMLButtonElement>('.cdl-b')!;
      const label = btn.querySelector<HTMLElement>('.cdl-t')!;
      close(dd, true);
      const fmt = item.dataset.fmt === 'svg' ? 'svg' : 'png';
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      label.textContent = `Saving ${fmt.toUpperCase()}`;
      try {
        await downloadChart(wrap, fmt);
        label.textContent = 'Download graph';
      } catch (err) {
        console.error(err);
        label.textContent = 'Could not save, try again';
        setTimeout(() => (label.textContent = 'Download graph'), 2600);
      } finally {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
      }
      return;
    }
    document.querySelectorAll<HTMLElement>('[data-chart-dl] .cdl-dd').forEach((o) => close(o));
  });

  document.addEventListener('keydown', (e) => {
    const t = e.target as Element;
    const dd = t.closest?.<HTMLElement>('[data-chart-dl] .cdl-dd');
    if (!dd) return;
    const m = dd.querySelector<HTMLElement>('.cdl-m')!;
    const items = Array.from(m.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    const i = items.indexOf(t as HTMLButtonElement);
    if (t.classList.contains('cdl-b')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        open(dd, e.key === 'ArrowDown' ? 'first' : 'last');
      } else if (e.key === 'Escape') close(dd, true);
      return;
    }
    if (i < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items[e.key === 'Home' ? 0 : items.length - 1].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(dd, true);
    } else if (e.key === 'Tab') close(dd);
  });
}

init();
document.addEventListener('astro:page-load', init);

// in development, tests read the built figure without a download dialog
if (import.meta.env.DEV) (window as unknown as { __cdl: unknown }).__cdl = { build, png, headingFor };
