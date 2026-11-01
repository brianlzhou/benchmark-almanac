// Reading RSS and Atom feeds, and finding benchmark names in newsletter and blog HTML.
import { names, phraseNames, isoDate } from './core.ts';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
export function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

export const stripTags = (html: string) =>
  decode(
    html
      .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();

export interface FeedItem {
  title: string;
  link: string;
  date: string;
  /** The item's HTML body: full content when the feed has it, else the summary. */
  html: string;
}

function field(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!m) return '';
  const raw = m[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1] : decode(raw);
}

/** Items of an RSS 2.0 or Atom feed. */
export function parseFeed(xml: string): FeedItem[] {
  const out: FeedItem[] = [];
  for (const m of xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const b = m[2];
    const link = field(b, 'link') || (b.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/) ?? b.match(/<link[^>]*href="([^"]+)"/) ?? [])[1] || '';
    out.push({
      title: stripTags(field(b, 'title')),
      link: decode(link.trim()),
      date: isoDate(field(b, 'pubDate') || field(b, 'published') || field(b, 'updated') || field(b, 'dc:date')),
      html: field(b, 'content:encoded') || field(b, 'content') || field(b, 'description') || field(b, 'summary'),
    });
  }
  return out;
}

export interface Mention {
  name: string;
  /** The link given for it, if any. */
  url?: string;
}

// a sentence that names a benchmark as one: a launch, or the words benchmark, eval, leaderboard or test
const CUE =
  /\b(new|introduc\w*|launch\w*|releas\w*|unveil\w*|debut\w*|announc\w*|open-sourc\w*|present\w*|propos\w*|built|builds|creat\w*|benchmarks?|evals?|evaluations?|leaderboards?|test(?:s|ed)? (?:of|for|how|whether)|measures?)\b/i;
const BLOCK = /<(h[1-6]|p|li|blockquote|td|th|figcaption)\b[^>]*>([\s\S]*?)<\/\1>/gi;
const HREF = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Benchmark names in an article. A name counts when the sentence around it reads as a benchmark (a launch
 * word, or "benchmark", "eval", "leaderboard"), or when it sits under a heading about evals such as Zvi's
 * "On Your Marks". Each name takes the link whose text names it, else the first outside link near it.
 */
export function benchmarkMentions(html: string, opts: { evalSection?: RegExp; own: RegExp; all?: boolean }): Mention[] {
  const body = html.replace(/<(script|style|figure|picture|svg)\b[\s\S]*?<\/\1>/gi, ' ');
  const blocks: { heading: boolean; html: string; text: string }[] = [];
  for (const m of body.matchAll(BLOCK)) blocks.push({ heading: m[1][0].toLowerCase() === 'h', html: m[2], text: stripTags(m[2]) });
  const outside = (u: string) => /^https?:\/\//.test(u) && !opts.own.test(u) && !/substack\.com\/(?:subscribe|redirect|app-link)|substackcdn|wp\.com|gravatar|mailto:/i.test(u);
  const links = (h: string) => [...h.matchAll(HREF)].map((a) => ({ url: decode(a[1]), text: stripTags(a[2]) })).filter((a) => outside(a.url));

  const found = new Map<string, Mention>();
  let section = '';
  blocks.forEach((b, i) => {
    if (b.heading) {
      section = b.text;
      return;
    }
    const inEvals = !!opts.evalSection && opts.evalSection.test(section);
    const candidates = [...names(b.text), ...phraseNames(b.text)];
    if (!candidates.length) return;
    const sentences = b.text.split(/(?<=[.!?])\s+/);
    for (const name of candidates) {
      if (found.has(name)) continue;
      const sentence = sentences.find((s) => s.includes(name)) ?? b.text;
      if (!opts.all && !inEvals && !CUE.test(sentence.replace(name, ' '))) continue;
      const own = links(b.html);
      const near = blocks.slice(i + 1, i + 4).flatMap((x) => (x.heading ? [] : links(x.html)));
      const named = own.find((a) => a.text.includes(name)) ?? own.find((a) => sentence.includes(a.text) && a.text.length > 3);
      found.set(name, { name, url: (named ?? own[0] ?? near.find((a) => /read more|paper|arxiv|github|blog/i.test(a.text) || /arxiv\.org|github\.com/.test(a.url)))?.url });
    }
  });
  // a name inside a longer one ("Bench" phrase inside "Foo Bench Pro") is the same find
  const all = [...found.values()];
  return all.filter((m) => !all.some((o) => o !== m && o.name.length > m.name.length && o.name.includes(m.name)));
}
