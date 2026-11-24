// Refreshes data/epoch-reviews.json from Epoch AI's Benchmark Reviews (epoch.ai/benchmarks/search?reviewed=...),
// launched 2026-11-24: Epoch audits a benchmark and gives it one of three verdicts, Verified, Flawed or Not enough
// info. The search page's benchmark list (an Astro island) carries every review as `reviews`: Epoch's benchmark slug,
// the verdict, and the review page's path when one exists. Each review page gives the review date, the benchmark's
// creators, and a one-paragraph summary in its meta description. Epoch publishes its benchmark data under CC BY 4.0,
// and pages credit Epoch AI and link each review. robots.txt allows /benchmarks.
//
// Epoch's slugs are its own, and some name a version our catalog keeps as a separate record (Epoch's
// "agents-last-exam" review is of v1.1). Every slug maps through SLUGS below or an identical catalog id, checked by
// hand against the review's title. A slug that maps to nothing goes in `unmatched` and fails the run, so a new review
// never lands on a guessed record.
//
// usage: node scripts/sync-epoch-reviews.ts [--dry]
import { pathToFileURL } from 'node:url';
import { dataPath, fetchText, readJson, today, writeJson } from './lib/util.ts';

const SEARCH = 'https://epoch.ai/benchmarks/search?reviewed=verified&reviewed=flawed&reviewed=not-enough-info';
const SITE = 'https://epoch.ai';
const VERDICTS = ['verified', 'flawed', 'not-enough-info'] as const;
type Verdict = (typeof VERDICTS)[number];

// Epoch slug -> catalog id, where they differ. Checked 2026-11-24 against each review's title, or, for a review with no
// page, Epoch's benchmark page title.
const SLUGS: Record<string, string> = {
  // "Agents’ Last Exam v1.1 – Benchmark review"
  'agents-last-exam': 'agents-last-exam-1-1',
  // "Berkeley Function Calling Leaderboard (BFCL) v4 – Benchmark review"
  'berkeley-function-calling-leaderboard': 'bfcl-v4',
  // Epoch's benchmark page: "CursorBench 4.0" (no review page)
  cursorbench: 'cursorbench-4-0',
  // Epoch's benchmark page: "FrontierCode 1.1" (no review page)
  frontiercode: 'frontiercode-1-1',
  // no page yet; Cognition's FrontierCode 2.0
  'frontiercode-2': 'frontiercode-2-0',
  // the original exam, not HLE-Rolling or HLE-Verified, as the review's methodology says
  hle: 'humanitys-last-exam',
  'lech-mazur-writing': 'lech-mazur-creative-writing',
  // "MazeBench v1.1 – Benchmark review": our record has no version
  mazebench: 'maze-bench',
  // "PostTrainBench v1.1 – Benchmark review"
  'post-train-bench': 'posttrainbench-1-1',
  rli: 'remote-labor-index',
  'simple-qa-verified': 'simpleqa-verified',
  // "Terminal-Bench 4.0.0 – Benchmark review"
  'terminal-bench-4': 'terminal-bench-4-0',
};

export interface EpochReview {
  /** Epoch's benchmark slug. */
  epoch: string;
  verdict: Verdict;
  /** The review page, when Epoch wrote one. "Not enough info" verdicts have none. */
  url?: string;
  /** The review's date, YYYY-MM-DD. */
  reviewed?: string;
  /** The benchmark's creators, as the review names them. */
  creator?: string;
  /** The review's own one-paragraph summary, quoted. */
  summary?: string;
}
export interface EpochReviews {
  about: string;
  source: string;
  license: string;
  retrieved: string;
  reviews: Record<string, EpochReview>;
  unmatched: string[];
}

const unescape = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

/** Astro serializes island props as [type, value] pairs: 0 a plain value or object, 1 an array. */
function astro(v: unknown): unknown {
  if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number') {
    const [t, val] = v as [number, unknown];
    if (t === 0) return val && typeof val === 'object' && !Array.isArray(val) ? Object.fromEntries(Object.entries(val).map(([k, x]) => [k, astro(x)])) : val;
    if (t === 1) return (val as unknown[]).map(astro);
    return val;
  }
  // the props object itself is a plain object whose values are pairs
  if (v && typeof v === 'object' && !Array.isArray(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, astro(x)]));
  return v;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
/** "Aug. 11, 2026", "Sept. 4, 2026", "May 2, 2026" -> "2026-08-11" */
export function reviewDate(s: string): string {
  const m = s.trim().match(/^([A-Za-z]+)\.?\s+(\d{1,2}),\s+(\d{4})$/);
  const month = m ? MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) : -1;
  if (!m || month < 0) throw new Error(`Epoch review date changed format: "${s}"`);
  return `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

/** The `reviews` map from the search page's benchmark list. */
export function reviewsMap(html: string): Record<string, { verdict: string; url?: string }> {
  for (const m of html.matchAll(/\sprops="([^"]*)"/g)) {
    if (!m[1].includes('&quot;reviews&quot;')) continue;
    const props = astro(JSON.parse(unescape(m[1]))) as { reviews?: Record<string, { verdict?: string; url?: string }> };
    if (!props.reviews || typeof props.reviews !== 'object') break;
    const out: Record<string, { verdict: string; url?: string }> = {};
    for (const [slug, r] of Object.entries(props.reviews)) {
      if (!r || typeof r.verdict !== 'string') throw new Error(`Epoch review ${slug} has no verdict`);
      out[slug] = { verdict: r.verdict, ...(r.url ? { url: r.url } : {}) };
    }
    return out;
  }
  throw new Error('No reviews map on the Epoch benchmark search page: the page changed, so read it again');
}

/** Date, creator, verdict and summary from one review page. */
export function reviewPage(html: string): { reviewed: string; creator?: string; verdict: string; summary: string } {
  const fact = (label: string) => html.match(new RegExp(`<strong[^>]*>${label}:\\s*</strong>\\s*<span[^>]*>([^<]+)</span>`))?.[1];
  const date = fact('Reviewed');
  const verdict = html.match(/<strong[^>]*>Verdict:\s*<\/strong>\s*<span class="review-badge review-badge-([a-z-]+)/)?.[1];
  const summary = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!date || !verdict || !summary) throw new Error('An Epoch review page changed: no date, verdict or summary');
  const creator = fact('Benchmark creator');
  return { reviewed: reviewDate(unescape(date)), ...(creator ? { creator: unescape(creator).trim() } : {}), verdict, summary: unescape(summary).trim() };
}

async function main() {
  const dry = process.argv.includes('--dry');
  const ids = new Set(readJson<{ id: string }[]>(dataPath('benchmarks.json')).map((b) => b.id));
  const listed = reviewsMap(await fetchText(SEARCH));
  if (Object.keys(listed).length < 10) throw new Error(`Only ${Object.keys(listed).length} Epoch reviews listed: the page changed, so read it again`);
  const reviews: Record<string, EpochReview> = {};
  const unmatched: string[] = [];
  for (const [slug, r] of Object.entries(listed).sort(([a], [b]) => a.localeCompare(b))) {
    if (!(VERDICTS as readonly string[]).includes(r.verdict)) throw new Error(`Epoch review ${slug} has a new verdict "${r.verdict}"`);
    const id = SLUGS[slug] ?? (ids.has(slug) ? slug : undefined);
    if (!id || !ids.has(id)) {
      unmatched.push(slug);
      continue;
    }
    if (reviews[id]) throw new Error(`Two Epoch reviews map to ${id}: ${reviews[id].epoch} and ${slug}`);
    const out: EpochReview = { epoch: slug, verdict: r.verdict as Verdict };
    if (r.url) {
      const url = new URL(r.url, SITE).href;
      const page = reviewPage(await fetchText(url));
      if (page.verdict !== r.verdict) throw new Error(`Epoch's ${slug} review says ${page.verdict}, the list says ${r.verdict}`);
      Object.assign(out, { url, reviewed: page.reviewed, ...(page.creator ? { creator: page.creator } : {}), summary: page.summary });
      await new Promise((ok) => setTimeout(ok, 500));
    }
    reviews[id] = out;
  }
  const counts = VERDICTS.map((v) => `${Object.values(reviews).filter((r) => r.verdict === v).length} ${v}`).join(', ');
  console.log(`Epoch AI reviews: ${Object.keys(reviews).length} matched (${counts})${unmatched.length ? `, unmatched: ${unmatched.join(', ')}` : ''}`);
  const file: EpochReviews = {
    about:
      "Epoch AI's Benchmark Reviews: audits of benchmarks, each with a verdict (verified, flawed, or not-enough-info), keyed by our benchmark id. Summaries are Epoch AI's own words, quoted from each review. Written by scripts/sync-epoch-reviews.ts.",
    source: SEARCH,
    license: 'CC BY 4.0, Epoch AI',
    retrieved: today(),
    reviews,
    unmatched,
  };
  if (!dry) writeJson(dataPath('epoch-reviews.json'), file);
  // a new review that maps to no record needs a person to place it in SLUGS or catalog the benchmark
  if (unmatched.length) {
    console.error(`Place these Epoch slugs in SLUGS in scripts/sync-epoch-reviews.ts, or catalog them: ${unmatched.join(', ')}`);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
