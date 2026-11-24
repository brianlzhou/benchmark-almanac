// Sites of the makers the almanac already catalogs: new pages on their sitemaps or feeds that launch a benchmark.
//
// A replay of November 2026 (hide every record released that month, run discovery over the month) found that the
// feeds and registries surfaced only 44 of 282 new benchmarks. 98 of the misses were launched on their makers' own
// sites: METR's Capability Index on metr.org, CursorBench 4.1 on cursor.com, Ramp's SWE-bench 2 on labs.ramp.com.
// Makers that launched one benchmark often launch the next on the same site, so this reader watches every site that
// two or more cataloged records give as their site, leaderboard or blog (about 285 on 2026-11-23).
//
// For each site it reads robots.txt, follows its rules for this reader's user agent (or for every agent), and reads the
// sitemaps robots.txt lists, else /sitemap.xml, else the RSS or Atom feed the home page links. A page is new when its
// lastmod or feed date falls in the run's window. A site with no dates, or one that stamps every page with today's
// date, is compared with the pages it listed in the last run instead (kept as short hashes in the queue's `seen`
// lists), so its first run only records a baseline. Pages whose address or title looks like a benchmark, a leaderboard
// or a post are opened, at most PAGES_PER_SITE per site, one at a time, and a launch the page names becomes a find.
//
// Left out: code, paper, dataset and social hosts (other readers cover them), news sites and giant docs sites (their
// sitemaps list hundreds of thousands of pages), and sites whose terms forbid automated reading: OpenAI, Anthropic,
// Meta, DeepSeek, Moonshot, Artificial Analysis, Scale and Kaggle.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { readJson, dataPath, key } from '../util.ts';
import { FROM, GENERAL, NICHE, KNOWN_ORGS, seen, names, phraseNames, launchNames, stageA, paperName, githubRepo, type Reader } from './core.ts';
import { decode, parseFeed, stripTags } from './text.ts';

export const SKIP_HOSTS =
  /(^|\.)(github\.com|github\.io|githubusercontent\.com|gitlab\.com|huggingface\.co|hf\.co|hf\.space|arxiv\.org|openreview\.net|aclanthology\.org|paperswithcode\.com|semanticscholar\.org|researchgate\.net|doi\.org|zenodo\.org|ieee\.org|acm\.org|springer\.com|nature\.com|science\.org|sciencedirect\.com|wiley\.com|neurips\.cc|mlr\.press|thecvf\.com|ceur-ws\.org|isca-archive\.org|ncbi\.nlm\.nih\.gov|physionet\.org|wikipedia\.org|web\.archive\.org|x\.com|twitter\.com|bsky\.app|linkedin\.com|reddit\.com|youtube\.com|youtu\.be|medium\.com|substack\.com|google\.com|googleapis\.com|notion\.site|vercel\.app|netlify\.app|pages\.dev|chatgpt\.site|streamlit\.app|gradio\.live|modelscope\.cn|codalab\.org|codabench\.org|eval\.ai|bytednsdoc\.com|washingtonpost\.com|nytimes\.com|theverge\.com|techcrunch\.com|wired\.com|reuters\.com|bloomberg\.com|ft\.com|wsj\.com|cnbc\.com|forbes\.com|venturebeat\.com|developer\.android\.com|openai\.com|anthropic\.com|claude\.com|meta\.com|deepseek\.com|moonshot\.ai|moonshot\.cn|kimi\.com|artificialanalysis\.ai|scale\.com|kaggle\.com)$/i;
/** Pages a site lists that are never launches: tags, authors, legal pages, files. */
const SKIP_PATH = /\/(?:tags?|categor(?:y|ies)|authors?|page\/\d+|privacy|terms|legal|careers?|jobs|pricing|login|signup|cart|shop|docs?\/api|changelog|feed|rss|wp-content|cdn-cgi)(?:\/|$)|\.(?:pdf|png|jpe?g|gif|svg|webp|mp4|zip|csv|json|xml)$/i;
/** Paths worth opening, best first: a benchmark or leaderboard page, then a post. */
const BENCH_PATH = /bench|eval|leaderboard|arena|gym|exam|index|scorecard|ranking/i;
const POST_PATH = /\/(?:blog|news|research|posts?|p|articles?|updates?|insights|writing|notes|resources|lab|labs|reports?)\//i;
// a replay of a long window raises these (SITES_PAGES_PER_SITE, SITES_PAGES_TOTAL, SITES_BUDGET_MS, SITES_SECONDS) to
// stand for the twice-daily runs it replaces
const PAGES_PER_SITE = Number(process.env.SITES_PAGES_PER_SITE ?? 4);
const PAGES_TOTAL = Number(process.env.SITES_PAGES_TOTAL ?? 160);
const CONCURRENCY = 20;
/** Larger sitemaps list a store or a docs site, not a maker's launches. */
const MAX_BYTES = 3_000_000;
/** Seconds one site may take to list its pages. */
const SITE_SECONDS = 25;
/** An undated site with more pages worth opening than this is skipped: its list would swell the queue file. */
const MAX_UNDATED = 1500;
/** A site that lists more pages than this is read by its dates only. */
const MAX_PAGES = 20_000;
const POSTS_MAP = /post|blog|news|research|page|bench|eval|leaderboard/i;
/** A name that is only a kind of page: "Benchmarks", "AI Eval", "Voice AI Benchmarks", "Arena". */
const GENERIC_NAME = /^(?:(?:the|our|ai|llm|model|agent|agentic|coding|voice|speech|medical|open|public|new|latest)\s+)*(?:benchmarks?|bench|evals?|evaluations?|arena|leaderboards?|rankings?|index|results?)$/i;
/** What a leaderboard page adds after the name: "Financial Coaching Bench Leaderboard and Methodology". */
const PAGE_SUFFIX = /\s+(?:leaderboard(?:\s+(?:and|&)\s+methodology)?|methodology|results|benchmark results)\s*$/i;
/** Titles of explainers and guides, which name benchmarks without launching one: "Inverted Index Explained". */
const EXPLAINER = /\b(?:explained|guide|tutorial|overview|cheat ?sheet|introduction to|what is|how to|vs\.?)\b|\bon\s+(?:the\s+)?[\w-]+\s+benchmark\b/i;
const benchWord = /\b(?:bench(?:mark)?|eval|arena|gym|exam|index|leaderboard)\b|bench\b/i;
/** Words a post title puts before a name: "Why Agents' Last Exam", "Introducing FrontierBreach". */
const LEAD_WORDS = /^(?:why|how|what|when|where|who|before|after|inside|introducing|announcing|meet|launching|releasing)\s+/i;
const UA_TOKEN = 'benchmark-almanac';

export interface Site {
  host: string;
  org: string;
  records: number;
}

/** Every site that two or more cataloged records link to, with the maker most of them name. */
export function catalogSites(min = 2): Site[] {
  const registry = readJson<{ org?: string; links?: Record<string, string | string[]> }[]>(dataPath('benchmarks.json'));
  const count = new Map<string, Map<string, number>>();
  for (const b of registry) {
    const hosts = new Set<string>();
    for (const [kind, v] of Object.entries(b.links ?? {}))
      for (const u of ([] as unknown[]).concat(kind === 'paper' || kind === 'repo' || kind === 'dataset' ? [] : v)) {
        if (typeof u !== 'string') continue;
        try {
          const h = new URL(u).hostname.toLowerCase().replace(/^www\./, '');
          if (!SKIP_HOSTS.test(h)) hosts.add(h);
        } catch {
          // a malformed link names no site
        }
      }
    for (const h of hosts) {
      const orgs = count.get(h) ?? new Map<string, number>();
      orgs.set(b.org ?? '', (orgs.get(b.org ?? '') ?? 0) + 1);
      count.set(h, orgs);
    }
  }
  return [...count]
    .map(([host, orgs]) => ({ host, org: [...orgs].sort((a, b) => b[1] - a[1])[0][0], records: [...orgs.values()].reduce((a, b) => a + b, 0) }))
    .filter((s) => s.records >= min)
    .sort((a, b) => b.records - a.records);
}

// ---- robots.txt ------------------------------------------------------------------------------------
export interface Robots {
  /** Allow and Disallow rules, compiled once: a sitemap can list a hundred thousand pages. */
  rules: { re: RegExp; length: number; allow: boolean }[];
  delay: number;
  sitemaps: string[];
}
/** The rules robots.txt gives this reader: its own group if it has one, else the group for every agent. */
export function parseRobots(txt: string, agent = UA_TOKEN): Robots {
  const groups: { agents: string[]; allow: string[]; disallow: string[]; delay: number }[] = [];
  const sitemaps: string[] = [];
  let cur: (typeof groups)[number] | undefined;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [field, value] = [m[1].toLowerCase(), m[2].trim()];
    if (field === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }
    if (field === 'user-agent') {
      if (!cur || !lastWasAgent) groups.push((cur = { agents: [], allow: [], disallow: [], delay: 0 }));
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!cur) continue;
    if (field === 'allow' && value) cur.allow.push(value);
    else if (field === 'disallow' && value) cur.disallow.push(value);
    else if (field === 'crawl-delay') cur.delay = Number(value) || 0;
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== '*' && agent.toLowerCase().includes(a)));
  const pick = mine.length ? mine : groups.filter((g) => g.agents.includes('*'));
  const rules = [...pick.flatMap((g) => g.disallow.map((r) => ({ r, allow: false }))), ...pick.flatMap((g) => g.allow.map((r) => ({ r, allow: true })))].map(({ r, allow }) => ({ re: ruleRe(r), length: r.length, allow }));
  return { rules, delay: Math.max(0, ...pick.map((g) => g.delay)), sitemaps };
}
const ruleRe = (rule: string) => new RegExp('^' + rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
/** Whether robots.txt lets this reader fetch a path: the longest matching rule wins, and Allow wins a tie. */
export function allowed(robots: Robots, path: string): boolean {
  let best = -1;
  let ok = true;
  for (const rule of robots.rules)
    if ((rule.length > best || (rule.length === best && rule.allow)) && rule.re.test(path)) {
      best = rule.length;
      ok = rule.allow;
    }
  return ok;
}

// ---- sitemaps --------------------------------------------------------------------------------------
export interface Entry {
  url: string;
  date?: string;
  title?: string;
}
/** The <url> or <sitemap> entries of a sitemap, with their lastmod dates. */
export function parseSitemap(xml: string): { index: boolean; entries: Entry[] } {
  const index = /<sitemapindex\b/i.test(xml);
  const entries: Entry[] = [];
  for (const m of xml.matchAll(/<(url|sitemap)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const loc = m[2].match(/<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/i)?.[1];
    if (!loc) continue;
    const date = m[2].match(/<lastmod>\s*([\d-]{10})/i)?.[1];
    entries.push({ url: decode(loc.trim()), date });
  }
  return { index, entries };
}

const short = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 7);
const pathOf = (u: string) => {
  try {
    const x = new URL(u);
    return x.pathname + x.search;
  } catch {
    return '';
  }
};
const sameSite = (u: string, host: string) => {
  try {
    const h = new URL(u).hostname.toLowerCase().replace(/^www\./, '');
    return h === host || h.endsWith(`.${host}`);
  } catch {
    return false;
  }
};
/** Ranks a page address: benchmark-like first, then posts. Zero means not worth opening. */
export function pageRank(url: string): number {
  const p = pathOf(url);
  if (!p || p === '/' || SKIP_PATH.test(p)) return 0;
  const slug = p.split('/').filter(Boolean).pop() ?? '';
  // a page under /benchmarks/ or /leaderboard/ counts like one whose own name says so (vals.ai/benchmarks/a2j)
  if (BENCH_PATH.test(p.split('?')[0])) return 2;
  if (POST_PATH.test(p) || /-/.test(slug)) return 1;
  return 0;
}

/** What one page launches, if anything: the names it introduces, or a benchmark its title names. */
export function pageFinds(html: string, url: string): { names: string[]; introduced: boolean; title: string; text: string } {
  const title = decode(
    (html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1] ?? '',
  )
    .replace(/\s+/g, ' ')
    .trim();
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html.match(/<article\b[\s\S]*?<\/article>/i)?.[0] ?? html.replace(/<(script|style|nav|footer|header)\b[\s\S]*?<\/\1>/gi, '');
  const text = stripTags(main).replace(/\s+/g, ' ').slice(0, 12_000);
  // the post's own title, without the site name after a bar or dash, and without a lead word: "Why Agents' Last Exam"
  const head = title.split(/\s+[|·–—-]\s+/)[0].trim();
  const clean = (n: string) => n.replace(LEAD_WORDS, '').replace(PAGE_SUFFIX, '').trim();
  // an explainer or a guide is not a launch, and a whole sentence is not a name
  if (EXPLAINER.test(head)) return { names: [], introduced: false, title: head, text };
  const slug = key(pathOf(url).split('/').filter(Boolean).pop() ?? '');
  // a launch counts when the page's title or address carries the name, so a "Request a demo" button does not
  const launched = launchNames(text.slice(0, 4000), head)
    .map(clean)
    .filter((n) => !GENERIC_NAME.test(n) && (key(head).includes(key(n)) || (slug && slug.includes(key(n).slice(0, 8)))));
  if (launched.length) return { names: [...new Set(launched)], introduced: true, title: head, text };
  // a short title that names the benchmark is the name, with its maker and version: "Ramp SWE-Bench v2", not "SWE-Bench"
  const lead = head.split(/:\s/)[0];
  const short = clean(lead.replace(PAGE_SUFFIX, ''));
  if (short && short.split(/\s+/).length <= 6 && !GENERIC_NAME.test(short) && (benchWord.test(short) || names(short).length || PAGE_SUFFIX.test(lead)))
    return { names: [short], introduced: false, title: head, text };
  // a benchmark page titled only with the site's name: its address names it (cursor.com/cursorbench)
  const slugWord = pathOf(url).split(/[?#]/)[0].split('/').filter(Boolean).pop() ?? '';
  if (head.split(/\s+/).length <= 2 && /bench|arena|leaderboard/i.test(slugWord) && !GENERIC_NAME.test(slugWord.replace(/[-_]+/g, ' ')))
    return { names: [slugWord], introduced: false, title: head, text };
  const titled = [...names(head), ...phraseNames(head)].map(clean).filter((n) => n && !GENERIC_NAME.test(n));
  if (titled.length) return { names: [...new Set(titled)], introduced: false, title: head, text };
  // a page about a leaderboard or a benchmark that names none in its title: "Q4 2026 capability update"
  if (stageA(head, text.slice(0, 3000), false) >= 5 || (BENCH_PATH.test(pathOf(url).split('/').pop() ?? '') && /\b(leaderboard|benchmark)\b/i.test(text.slice(0, 3000)))) {
    const n = clean(paperName(head, text.slice(0, 3000)));
    if (n && !GENERIC_NAME.test(n)) return { names: [n], introduced: false, title: head, text };
  }
  return { names: [], introduced: false, title: head, text };
}

// ---- the reader ------------------------------------------------------------------------------------
export async function sites(r: Reader) {
  const list = catalogSites();
  const started = Date.now();
  // leave time to open pages and close the reader inside its limit
  const budget = Number(process.env.SITES_BUDGET_MS ?? 200_000);
  let pagesOpened = 0;
  let unreadable = 0;
  let noSitemap = 0;
  let baselines = 0;
  const pending: { site: Site; entry: Entry; rank: number; robots: Robots }[] = [];

  const phaseOne = started + budget * 0.55;
  const late = () => Date.now() > phaseOne;
  const stats: string[] = [];
  // with SITES_DEBUG set, every page each site listed, for checking a replay
  const listed: string[] = [];
  /** A sitemap or feed, unless it is larger than MAX_BYTES (a store or docs site lists every page it has). */
  async function capped(url: string): Promise<string> {
    const res = await r.request(url, { timeout: 20_000, tries: 1 });
    if (Number(res.headers.get('content-length') ?? 0) > MAX_BYTES) {
      await res.body?.cancel();
      return '';
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const text = (url.endsWith('.gz') ? gunzipSync(buf) : buf).toString('utf8');
    return text.length > MAX_BYTES * 4 ? '' : text;
  }

  async function readSite(site: Site) {
    const t0 = Date.now();
    const base = `https://${site.host}`;
    const robotsTxt = await r.text(`${base}/robots.txt`, { timeout: 15_000, tries: 1 }).catch(() => '');
    const robots = parseRobots(/<html/i.test(robotsTxt) ? '' : robotsTxt);
    if (!allowed(robots, '/')) return void stats.push(`${site.host}\tbarred by robots.txt`);
    // sitemaps first, then the home page's feed
    let entries: Entry[] = [];
    let how = 'sitemap';
    const queue = robots.sitemaps.length ? robots.sitemaps.slice(0, 3) : [`${base}/sitemap.xml`];
    let fetched = 0;
    const siteLate = () => late() || Date.now() - t0 > SITE_SECONDS * 1000;
    while (queue.length && fetched < 4 && !siteLate()) {
      const sm = queue.shift()!;
      if (!allowed(robots, pathOf(sm))) continue;
      fetched++;
      const xml = await capped(sm).catch(() => '');
      if (!/<(urlset|sitemapindex)\b/i.test(xml)) continue;
      const { index, entries: es } = parseSitemap(xml);
      if (index) {
        // child sitemaps: the ones changed in the window, else the post and page lists
        const kids = es.filter((e) => !e.date || e.date >= FROM).sort((a, b) => Number(POSTS_MAP.test(b.url)) - Number(POSTS_MAP.test(a.url)));
        queue.push(...kids.slice(0, 3).map((e) => e.url));
      } else entries.push(...es);
    }
    if (!entries.length && !siteLate()) {
      how = 'feed';
      const home = await r.text(base, { timeout: 15_000, tries: 1 }).catch(() => '');
      const feed = home.match(/<link[^>]+type="application\/(?:rss|atom)\+xml"[^>]*>/i)?.[0].match(/href="([^"]+)"/)?.[1];
      if (feed) {
        const url = new URL(decode(feed), base).toString();
        const xml = allowed(robots, pathOf(url)) ? await capped(url).catch(() => '') : '';
        entries = parseFeed(xml).map((p) => ({ url: p.link, date: p.date, title: p.title }));
      }
      if (!entries.length) {
        if (!home) unreadable++;
        else noSitemap++;
        return void stats.push(`${site.host}\t${home ? 'no sitemap or feed' : 'unreadable'}\t${Date.now() - t0} ms`);
      }
    }
    r.read(entries.length);
    // a site that lists more pages than a maker writes is a store or a docs site: keep only its dated new pages
    const large = entries.length > MAX_PAGES;
    if (large) entries = entries.filter((e) => e.date && e.date >= FROM).slice(0, MAX_PAGES);
    entries = entries.filter((e) => sameSite(e.url, site.host) && allowed(robots, pathOf(e.url)));
    const dated = entries.filter((e) => e.date);
    const inWindow = dated.filter((e) => e.date! >= FROM);
    // a site that dates most pages in the window stamps every page with the build date: compare lists instead
    const trustDates = large || (dated.length >= entries.length * 0.8 && !(inWindow.length > 30 && inWindow.length > dated.length * 0.5));
    let fresh: Entry[] = [];
    let mode = 'dates';
    if (trustDates) fresh = inWindow;
    else {
      const worth = entries.filter((e) => pageRank(e.url) > 0);
      if (worth.length > MAX_UNDATED) mode = 'too many undated pages';
      else {
        mode = 'list';
        const ids = worth.map((e) => short(pathOf(e.url)));
        const name = `site:${site.host}`;
        const prev = seen[name];
        if (!prev) {
          baselines++;
          mode = 'list, first baseline';
        }
        const old = new Set(prev ?? ids);
        fresh = worth.filter((e) => !old.has(short(pathOf(e.url))));
        if (ids.length) r.remember(name, ids);
      }
    }
    let n = 0;
    for (const entry of fresh) {
      const rank = pageRank(entry.url);
      if (rank) (pending.push({ site, entry, rank, robots }), n++);
    }
    stats.push(`${site.host}\t${how}\t${entries.length} pages\t${mode}\t${n} new\t${Date.now() - t0} ms`);
    if (process.env.SITES_DEBUG) listed.push(...entries.map((e) => `${site.host}\t${mode}\t${e.url}`));
  }

  // read the sites, a few at a time
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < list.length && !late()) {
        const site = list[next++];
        await readSite(site).catch(() => unreadable++);
      }
    }),
  );

  if (process.env.SITES_DEBUG) {
    writeFileSync(process.env.SITES_DEBUG, stats.join('\n') + '\n');
    writeFileSync(`${process.env.SITES_DEBUG}.pages`, listed.join('\n') + '\n');
  }
  // open the best pages, one at a time per site, until the budget runs out
  const bySite = new Map<string, typeof pending>();
  for (const p of pending.sort((a, b) => b.rank - a.rank || (b.entry.date ?? '').localeCompare(a.entry.date ?? ''))) {
    const l = bySite.get(p.site.host) ?? [];
    if (l.length < PAGES_PER_SITE) l.push(p);
    bySite.set(p.site.host, l);
  }
  const queues = [...bySite.values()];
  let qi = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (qi < queues.length && pagesOpened < PAGES_TOTAL && Date.now() - started < budget) {
        const q = queues[qi++];
        for (const p of q) {
          if (pagesOpened >= PAGES_TOTAL || Date.now() - started >= budget) break;
          pagesOpened++;
          const html = await r.text(p.entry.url, { timeout: 20_000, tries: 1 }).catch(() => '');
          if (html) found(p.site, p.entry, html);
          await new Promise((res) => setTimeout(res, Math.min(10, Math.max(1, p.robots.delay)) * 1000));
        }
      }
    }),
  );

  function found(site: Site, entry: Entry, html: string) {
    const f = pageFinds(html, entry.url);
    if (!f.names.length) return;
    const all = `${f.title} ${f.text}`;
    const repo = [...html.matchAll(/href="(https:\/\/github\.com\/[^"]+)"/g)].map((m) => githubRepo(m[1])).find((x) => !!x && !/\/(?:sponsors|orgs|topics|features|about|login)\b/.test(x));
    for (const nm of f.names.filter((n) => n.length <= 60)) {
      // a launch on the site of a maker with three or more cataloged benchmarks is the maker's own word, like a lab's
      // launch post. Anything else waits on the watch list for a second source.
      const how = f.introduced && site.records >= 3 ? { curated: { source: `${site.org} site`, url: entry.url } } : { feed: `${site.org} site` };
      r.add(
        {
          key: key(nm),
          name: nm,
          title: f.title || nm,
          url: entry.url,
          org: site.org,
          repo: repo && key(repo.split('/').pop() ?? '').includes(key(nm).slice(0, 6)) ? repo : undefined,
          introduced: f.introduced,
          stageA: f.introduced ? 6 : 5,
          general: GENERAL.test(all) || KNOWN_ORGS.test(site.org),
          niche: NICHE.test(all),
        },
        how,
      );
    }
  }

  if (process.env.SITES_DEBUG) {
    writeFileSync(process.env.SITES_DEBUG, stats.join('\n') + '\n');
    writeFileSync(`${process.env.SITES_DEBUG}.pages`, listed.join('\n') + '\n');
  }
  r.note(`${list.length} sites, ${stats.length} read, ${pending.length} new pages, ${pagesOpened} opened`);
  if (baselines) r.note(`${baselines} undated sites recorded a first baseline`);
  if (noSitemap) r.note(`${noSitemap} sites have no sitemap or feed`);
  if (unreadable) r.note(`${unreadable} sites unreadable`);
  // most sites failing means the network failed, not the sites
  if (unreadable > list.length / 2) throw new Error(`${unreadable} of ${list.length} sites could not be read`);
}
