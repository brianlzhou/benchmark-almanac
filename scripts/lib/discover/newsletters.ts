// Newsletters, read only through the RSS feeds their publishers offer. Post pages are never crawled:
// Substack's and beehiiv's terms ban scraping, and the feed carries each issue in full.
import { key } from '../util.ts';
import { BARE, FROM, names, arxivId, githubRepo, type Reader } from './core.ts';
import { parseFeed, benchmarkMentions } from './text.ts';

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
      if (!lead) continue;
      const bold = lead[2].replace(/\s*\([^)]*\)\s*/g, ' ').replace(/[.:\s]+$/, '').trim();
      const nm = /(Bench|bench|Eval|Evals|Arena|Gym|Exam|Leaderboard)(?![a-z])/.test(bold) && !BARE.test(bold) && bold.length <= 40 ? bold : names(bold)[0];
      if (!nm) continue;
      const plain = body.replace(/<[^>]+>/g, ' ');
      const before = html.slice(Math.max(0, (li.index ?? 0) - 2000), li.index ?? 0);
      const launch = /\b(introduc|launch|releas|new\b|announc|open-sourc|unveil|debut)/i.test(plain);
      const evalsHeading = /<(?:strong|b)>[^<]*\b(evals?|benchmarks?)\b[^<]*<\/(?:strong|b)>[^<]{0,4}(?:<\/p>)?\s*<ul/i.test(before);
      if (!launch && !evalsHeading) continue;
      const href = (body.match(/href="(https?:\/\/[^"]+)"/) ?? [])[1]?.replace(/[?&]utm_[^"]*$/, '').replace(/&amp;/g, '&') ?? link;
      r.add({ key: key(nm), name: nm, title: nm, url: href, stageA: 5, general: true }, { curated: { source: 'AINews', url: link } });
    }
  }
}

/** Reads a newsletter's feed and adds each benchmark its recent posts name, credited to the newsletter. */
async function newsletter(r: Reader, o: { source: string; feed: string; own: RegExp; evalSection?: RegExp; posts?: RegExp }) {
  const items = parseFeed(await r.text(o.feed)).filter((it) => it.date >= FROM && (!o.posts || o.posts.test(it.title)));
  r.read(items.length);
  for (const it of items) {
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
  newsletter(r, { source: 'The Epoch Brief', feed: 'https://epochai.substack.com/feed', own: /epochai\.substack\.com/, evalSection: /reviewing benchmarks|how good is ai getting|new benchmark/i });

export const interconnects = (r: Reader) => newsletter(r, { source: 'Interconnects', feed: 'https://www.interconnects.ai/feed', own: /interconnects\.ai/ });
