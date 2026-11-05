// Newsletters, read only through the RSS feeds their publishers offer. Post pages are never crawled:
// Substack's and beehiiv's terms ban scraping, and the feed carries each issue in full.
import { key } from '../util.ts';
import { BARE, FROM, names, phraseNames, knownId, launchNames, arxivId, githubRepo, type Reader } from './core.ts';
import { parseFeed, benchmarkMentions, stripTags } from './text.ts';
import { noteAudit } from './audits.ts';

/**
 * The benchmark a bold AINews lead names: the whole lead when it holds a benchmark-style name ("SWE-bench
 * Multimodal", "Kimi Hallu Bench"), else that name, else a cataloged name ("OfficeQA Pro v2"). A topic such as
 * "Eval-to-deployment gap" names none.
 */
function benchName(s: string): string | undefined {
  if ((names(s).length || phraseNames(s).length) && !BARE.test(s) && s.length <= 40) return s;
  return names(s)[0] ?? (knownId(s) ? s : undefined);
}

export async function ainews(r: Reader) {
  // AINews (Latent Space) names new evals in its recap, with a link to the announcement.
  const xml = await r.text('https://latent.space/feeds/news.xml');
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const date = new Date((it.match(/<pubDate>([^<]+)<\/pubDate>/) ?? [])[1] ?? '').toISOString().slice(0, 10);
    if (date < FROM) continue;
    r.read();
    const link = (it.match(/<link>([^<]+)<\/link>/) ?? [])[1] ?? 'https://latent.space/news';
    const html = (it.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/) ?? it.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ?? [])[1] ?? '';
    // each bullet runs from its <li> to the next <li> or </li>, so nested lists do not swallow bullets
    for (const li of html.matchAll(/<li[^>]*>([\s\S]*?)(?=<li[\s>]|<\/li>)/g)) {
      const body = li[1];
      // a launch bullet opens with the bold name: "<b>BallotBench</b>: Nine agents..." or "<b>HackBench (Meta).</b> ..."
      const lead = body.match(/^\s*(?:<p>)?\s*<(strong|b)>([^<]{3,60})<\/\1>/);
      // any bullet can report an audit of a cataloged benchmark ("Benchmark audits: Prime Intellect found ...")
      {
        const text = stripTags(body);
        const first = text.replace(/^[^:]{0,60}:\s*/, '').split(/(?<=[.!?])\s/)[0].slice(0, 160);
        const src = (body.match(/href="(https?:\/\/[^"]+)"/) ?? [])[1]?.replace(/[?&]utm_[^"]*$/, '').replace(/&amp;/g, '&');
        noteAudit({ key: src && !/x\.com|twitter\.com/.test(src) ? src : `${link}#${key(first)}`, title: lead ? `${lead[2].replace(/[.:\s]+$/, '')}: ${first}` : first, text, url: src && !/x\.com|twitter\.com/.test(src) ? src : link, source: 'AINews', date });
      }
      if (!lead) continue;
      const bold = lead[2].replace(/\s*\([^)]*\)\s*/g, ' ').replace(/[.:\s]+$/, '').trim();
      const plain = body.replace(/<[^>]+>/g, ' ');
      const before = html.slice(Math.max(0, (li.index ?? 0) - 2000), li.index ?? 0);
      const launch = /\b(introduc|launch|releas|new\b|announc|open-sourc|unveil|debut)/i.test(plain);
      const evalsHeading = /<(?:strong|b)>[^<]*\b(evals?|benchmarks?)\b[^<]*<\/(?:strong|b)>[^<]{0,4}(?:<\/p>)?\s*<ul/i.test(before);
      if (!launch && !evalsHeading) continue;
      const href = (body.match(/href="(https?:\/\/[^"]+)"/) ?? [])[1]?.replace(/[?&]utm_[^"]*$/, '').replace(/&amp;/g, '&') ?? link;
      // one bullet can name two benchmarks: "AutomationBench and OfficeQA Pro v2"
      const parts = bold.split(/\s+(?:and|&)\s+/);
      for (const part of parts.length > 1 && parts.every(benchName) ? parts : [bold]) {
        const nm = benchName(part);
        if (nm) r.add({ key: key(nm), name: nm, title: nm, url: href, stageA: 5, general: true }, { curated: { source: 'AINews', url: link } });
      }
    }
  }
}

/**
 * Reads a newsletter's feed and adds each benchmark its recent posts name, credited to the newsletter. A publisher
 * that launches its own benchmarks (`launches`, the org it names) also gets the benchmark a post introduces, and
 * `mentions: false` skips the other names, for a publisher that writes mostly about other things.
 */
async function newsletter(r: Reader, o: { source: string; feed: string; own: RegExp; evalSection?: RegExp; posts?: RegExp; launches?: string; mentions?: boolean }) {
  const items = parseFeed(await r.text(o.feed)).filter((it) => it.date >= FROM && (!o.posts || o.posts.test(it.title)));
  r.read(items.length);
  for (const it of items) {
    if (o.launches)
      // the opening of a launch post says what it launches: "GDPx is a benchmark that covers..."
      for (const nm of launchNames(stripTags(it.html).slice(0, 4000), it.title))
        r.add({ key: key(nm), name: nm, title: it.title, url: it.link, org: o.launches, introduced: true, stageA: 6, general: true }, { curated: { source: o.source, url: it.link } });
    if (o.mentions === false) continue;
    for (const m of benchmarkMentions(it.html, { own: o.own, evalSection: o.evalSection })) {
      const url = m.url ?? it.link;
      const arxiv = arxivId(url);
      r.add(
        { key: arxiv ?? key(m.name), name: m.name, title: m.name, url, arxiv, repo: githubRepo(url), stageA: 5, general: true },
        { curated: { source: o.source, url: it.link } },
      );
    }
  }
}

// Zvi's weekly "AI #N" roundup has an On Your Marks section on benchmarks. WordPress.com's terms have no
// crawling clause for readers, and its robots.txt allows the feed.
export const zvi = (r: Reader) =>
  newsletter(r, { source: "Don't Worry About the Vase", feed: 'https://thezvi.wordpress.com/tag/ai/feed/', own: /thezvi\.(?:wordpress|substack)\.com/, evalSection: /on your marks|benchmark|evals?\b/i });

// Import AI leads many issues with a named benchmark, each story ending in a "Read more" link to the paper.
export const importAi = (r: Reader) => newsletter(r, { source: 'Import AI', feed: 'https://jack-clark.net/feed/', own: /jack-clark\.net|importai\.substack\.com/ });

// The Epoch Brief announces Epoch's own benchmarks and grades others under "Reviewing benchmarks".
export const epochSubstack = (r: Reader) =>
  newsletter(r, {
    source: 'The Epoch Brief',
    feed: 'https://epochai.substack.com/feed',
    own: /epochai\.substack\.com/,
    evalSection: /reviewing benchmarks|how good is ai getting|new benchmark/i,
    launches: 'Epoch AI',
  });

// SemiAnalysis launches its own benchmarks (GDPx, InferenceMAX) in its newsletter. Most posts are about chips and
// datacenters, so only launches count. Read through the Substack feed, which carries each post in full.
export const semianalysis = (r: Reader) =>
  newsletter(r, { source: 'SemiAnalysis', feed: 'https://newsletter.semianalysis.com/feed', own: /semianalysis\.com/, launches: 'SemiAnalysis', mentions: false });

export const interconnects = (r: Reader) => newsletter(r, { source: 'Interconnects', feed: 'https://www.interconnects.ai/feed', own: /interconnects\.ai/ });

// Prime Intellect publishes audits of public evaluations on its blog (AutomationBench, OfficeQA Pro v2 and
// HLE-Diamond on 2026-11-03). The blog has no feed, so its sitemap, which robots.txt allows and which dates each
// post, gives the new posts. Its terms have no clause about automated reading. Posts go only to the audit queue.
export async function primeBlog(r: Reader) {
  const xml = await r.text('https://www.primeintellect.ai/sitemap.xml');
  const posts = [...xml.matchAll(/<url>\s*<loc>(https:\/\/www\.primeintellect\.ai\/blog\/[^<]+)<\/loc>\s*<lastmod>(\d{4}-\d\d-\d\d)/g)].map((m) => ({ url: m[1], date: m[2] })).filter((p) => p.date >= FROM);
  for (const p of posts.slice(0, 10)) {
    const html = await r.text(p.url).catch(() => '');
    if (!html) continue;
    r.read();
    const title = stripTags((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) ?? html.match(/<title>([\s\S]*?)<\/title>/i) ?? [])[1] ?? p.url);
    const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html.match(/<article\b[\s\S]*?<\/article>/i)?.[0] ?? html;
    noteAudit({ title, text: stripTags(main).slice(0, 12000), url: p.url, source: 'Prime Intellect', date: p.date });
  }
}
