// Model discovery: readers that find new models for the review queue in data/discovered-models.json, and
// the helpers they share. scripts/discover-models.ts runs them.
//
// Each reader uses an official API or feed:
//   - Hugging Face: new repos from the accounts of the labs we catalog, and Hugging Face's trending list
//   - AINews: launch wording in the daily recap that names a model
//   - Bluesky: first-person launch posts ("we're releasing ...") that name a model
//   - leaderboards: a board name with no model record that newly appears on two or more boards
// OpenRouter has no reader: its terms (section 7.5) forbid automated copying of any information on its site
// or service.
import { key } from '../util.ts';
import { names, type Reader } from './core.ts';
import { stripTags, parseFeed } from './text.ts';
import { BLOGS } from './labs.ts';

export type Kind = 'hf-lab' | 'hf-trending' | 'ainews' | 'bluesky' | 'boards' | 'lab-post';
export interface ModelSource {
  source: string;
  kind: Kind;
  url: string;
}
export interface ModelFind {
  key: string;
  name: string;
  url: string;
  first: string;
  last: string;
  /** The maker as the source names it: a Hugging Face account or a poster's display name. */
  org?: string;
  /** The maker's id in data/labs.json, when it is a lab we know. */
  lab?: string;
  /** When the source first published the model. */
  created?: string;
  /** Billions of parameters, from Hugging Face's safetensors count. */
  params?: number;
  /** Hugging Face likes, a sign that people use the model. */
  likes?: number;
  weights?: 'open';
  license?: string;
  sources: ModelSource[];
  score: number;
}
export type Found = Partial<ModelFind> & { name: string; url: string };

/** The handle each model reader runs with. */
export interface ModelReader {
  r: Reader;
  from: string;
  add(f: Found, s: ModelSource): void;
  /** True when the name already belongs to a model in data/models.json. */
  known(name: string): boolean;
  /** The lab id for a maker's name or Hugging Face account. */
  labOf(org: string | undefined): string | undefined;
  /** Hugging Face accounts of the labs we catalog. */
  hfAccounts: string[];
  /** Name keys from the last run, by list. */
  seen: Record<string, string[]>;
  /** The finds so far, by name key. */
  finds: Map<string, ModelFind>;
}

/** A model's name key. Repo spellings ("Ripple-65B-Preview") and prose ("Ripple-65B Preview") share it. */
export const modelKey = (name: string) => key(name.replace(/^[\w.-]+\//, ''));

// repackaged copies: quantized files, merges, uncensored edits, adapters, and app bundles
const REPACK = /(GGUF|AWQ|GPTQ|EXL[23]|NVFP4|MXFP\d|FP8|FP4|INT[48]|W4A16|W8A8|BF16|bnb|MLX|ONNX|abliterat|obliterat|uncensor|heretic|LoRA|comfy|quantized|[-_]merge[sd]?\b|eagle|draft|DFlash|speculat|-Base$|-base$|-Base-)/i;
export const isRepack = (repo: string) => REPACK.test(repo.split('/').pop() ?? repo);
// research artifacts that labs publish beside their models: training checkpoints, stages, exports and robot task fine-tunes
const ARTIFACT = /checkpoint|[-_]stage\d|[-_]export|supplemental|[-_]s\d+$|LIBERO|RoboCasa|RoboTwin|LeRobot|ablation/i;

/** Another account's model a repo builds on, from Hugging Face's base_model tags. A lab's own base does not count. */
export function derivedFrom(tags: string[] | undefined, author: string): string | undefined {
  for (const t of tags ?? []) {
    const m = t.match(/^base_model:(?:(?:finetune|quantized|adapter|merge):)?([\w.-]+)\/([\w.-]+)$/);
    if (m && m[1].toLowerCase() !== author.toLowerCase()) return `${m[1]}/${m[2]}`;
  }
  return undefined;
}

// task types the almanac does not track: embedders, classifiers, detectors and segmenters
const UNTRACKED = new Set([
  'feature-extraction',
  'sentence-similarity',
  'text-ranking',
  'text-classification',
  'token-classification',
  'fill-mask',
  'image-classification',
  'image-feature-extraction',
  'object-detection',
  'image-segmentation',
  'mask-generation',
  'depth-estimation',
  'zero-shot-classification',
  'zero-shot-image-classification',
  'zero-shot-object-detection',
  'tabular-classification',
  'tabular-regression',
  'time-series-forecasting',
  'voice-activity-detection',
  'audio-classification',
]);

// A model name in a lab's own family, published by another account, is a fine-tune or a copy ("Qwen3.8-27B-Longbook").
const FAMILIES: [RegExp, string[]][] = [
  [/qwen/i, ['qwen']],
  [/llama/i, ['meta-llama', 'meta-models', 'facebook']],
  [/gemma/i, ['google']],
  [/mistral|ministral|magistral|devstral/i, ['mistralai']],
  [/deepseek/i, ['deepseek-ai']],
  [/kimi/i, ['moonshotai']],
  [/\bglm/i, ['zai-org', 'thudm']],
  [/minimax/i, ['minimaxai']],
  [/\bphi-?\d/i, ['microsoft']],
  [/nemotron/i, ['nvidia']],
  [/olmo/i, ['allenai']],
  [/granite/i, ['ibm-granite']],
  [/\blfm\d/i, ['liquidai']],
  [/\bflux/i, ['black-forest-labs']],
  [/gpt-oss/i, ['openai']],
];
/** True when a repo's name puts it in another lab's model family. */
export const otherFamily = (repo: string, author: string) =>
  FAMILIES.some(([re, owners]) => re.test(repo) && !owners.includes(author.toLowerCase()));

const VERB = /\b(?:introduc|releas|launch|unveil|announc|open[- ]sourc|debut|ship)\w*/i;
const MODEL_WORD = /\b(?:models?|weights|open[- ]weights?|parameters|checkpoints?|LLMs?|VLMs?)\b/i;
// a release that has not happened: rumors, leaks and teasers
const NOT_YET = /\b(?:rumou?r|unconfirmed|reportedly|leak|coming soon|upcoming|expected to|next week|teas(?:e|er|ing)|will (?:release|launch|ship)|plans to)\w*/i;
// a model name: capitalized words with a version number or a size ("SWE-2 Flash", "Ripple-65B Preview", "Beam 1.0")
const MODEL_NAME = /\b([A-Z][\w.+’'-]*(?:[ ](?:[A-Z][\w.+-]*|v?\d[\w.+-]*)){0,3})/g;
// words that start a capitalized run but never a model name, and hardware that looks like one
const NOT_NAME = /^(?:The|This|That|These|Those|Our|We|In|On|At|For|With|And|But|Today|Yesterday|A|An|It|Its|They|Their|Section|Table|Figure|Fig|Import AI|Part|Episode|Issue|Day|Week|Version|Series|Round|Season|Phase|Step|Level|Top|CVE|ISO|COVID|Python|Windows|iOS|Android|macOS)\b|^(?:NVIDIA |AMD |Google )?(?:[HB]\d{3}|GB\d{3}|MI\d{3}[A-Z]?|A100|TPU ?v?\d+\w*|Blackwell|Hopper|Rubin)\b|^(?:Q[1-4]|FY)\d*\b/;
// labels that carry a number but name no model: sizes ("A52B"), quantizations ("IQ2_XXS", "GB 4-bit") and licenses
const LABEL = /^(?:A?\d+(?:\.\d+)?[BKMT]|I?Q\d\w*)$|\d-bit\b|^(?:Apache|CC[- ]BY|GPL|LGPL|AGPL|BSD|MPL)\b/;
const LEAD_VERB = /^(?:Introducing|Releasing|Announcing|Launching|Meet|New|Open-sourcing)\s+/;

// the maker in press wording: "Google DeepMind introduced Genie 4", "MiniMaxAI released MiniMax-M3.1-Flash"
const maker = (sentence: string, name: string) =>
  sentence.match(new RegExp(String.raw`([A-Z][\w&.-]+(?:\s[A-Z][\w&.-]+){0,2})\s+(?:has\s+|have\s+|just\s+)?(?:introduc|releas|launch|unveil|announc|open[- ]sourc|debut|ship)\w*\s+(?:its\s+|their\s+|the\s+|a\s+)?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\b`))?.[1];

export interface Mention {
  name: string;
  /** The maker the sentence gives: "Reflection's Beam 1.0". */
  org?: string;
}

/**
 * Model names in prose that announces a release. A sentence counts when it has launch wording and a model word
 * and is not a rumor. A name counts when it carries a version or a size ("SWE-2 Flash"). Benchmark names, copies
 * and labels such as "BF16" are left out.
 */
export function modelMentions(text: string): Mention[] {
  const out = new Map<string, Mention>();
  for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) {
    if (!VERB.test(sentence) || !MODEL_WORD.test(sentence) || NOT_YET.test(sentence)) continue;
    for (const m of sentence.matchAll(MODEL_NAME)) {
      const raw = m[1].replace(LEAD_VERB, '');
      const org = raw.match(/^([\w.-]+(?: [A-Z][\w.-]+)?)[’']s /)?.[1];
      const n = raw
        .replace(/^(?:[\w.-]+(?: [A-Z][\w.-]+)?[’']s )+/, '')
        .replace(/[’']s$/, '')
        .replace(/[.,:;!?-]+$/, '')
        .trim();
      if (!/\d/.test(n) || /^\d/.test(n) || n.length < 3 || n.length > 40) continue;
      if (NOT_NAME.test(n) || LABEL.test(n) || isRepack(n) || names(n).length) continue;
      if (!out.has(n)) out.set(n, { name: n, org: org ?? maker(sentence, n) });
    }
  }
  return [...out.values()];
}
export const modelNames = (text: string) => modelMentions(text).map((m) => m.name);

// ---- Hugging Face ------------------------------------------------------------------------------------
interface HfModel {
  id: string;
  author?: string;
  createdAt?: string;
  pipeline_tag?: string;
  tags?: string[];
  trendingScore?: number;
  likes?: number;
  safetensors?: { total?: number };
  cardData?: { license?: string; license_name?: string };
}
const EXPAND = ['createdAt', 'pipeline_tag', 'tags', 'safetensors', 'cardData', 'trendingScore', 'likes'].map((e) => `expand[]=${e}`).join('&');

/** A Hugging Face repo as a find, or nothing when it is a copy, another account's fine-tune or an untracked task. */
function hfFind(m: HfModel): Found | undefined {
  const [author, repo] = m.id.split('/');
  if (!repo || isRepack(m.id) || ARTIFACT.test(repo) || derivedFrom(m.tags, author) || otherFamily(repo, author) || UNTRACKED.has(m.pipeline_tag ?? '')) return undefined;
  const total = m.safetensors?.total;
  const license = m.cardData?.license_name ?? m.cardData?.license;
  return {
    name: repo,
    url: `https://huggingface.co/${m.id}`,
    org: author,
    created: m.createdAt?.slice(0, 10),
    params: total ? Math.round(total / 1e8) / 10 : undefined,
    likes: m.likes,
    weights: 'open',
    license: typeof license === 'string' ? license : undefined,
  };
}

/**
 * New repos from the Hugging Face accounts of the labs we catalog, once 25 people have liked one. Big labs also
 * publish many research artifacts, and likes tell a release from those within a day or two.
 */
export async function hfLabs(x: ModelReader) {
  for (const org of x.hfAccounts) {
    const list = await x.r.json<HfModel[]>(`https://huggingface.co/api/models?author=${encodeURIComponent(org)}&sort=createdAt&direction=-1&limit=20&${EXPAND}`).catch((e: Error) => {
      x.r.note(`${org}: ${e.message}`);
      return [] as HfModel[];
    });
    x.r.read();
    for (const m of list) {
      if ((m.createdAt ?? '').slice(0, 10) < x.from) break;
      if ((m.likes ?? 0) < 25) continue;
      const f = hfFind(m);
      if (f) x.add(f, { source: `Hugging Face (${org})`, kind: 'hf-lab', url: f.url });
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}

/** Hugging Face's trending list: repos made in the last 45 days. Ripple-65B Preview ranked 61st on launch day. */
export async function hfTrending(x: ModelReader) {
  const list = await x.r.json<HfModel[]>(`https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=150&${EXPAND}`);
  x.r.read(list.length);
  const since = new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10);
  list.forEach((m, i) => {
    if ((m.createdAt ?? '').slice(0, 10) < since) return;
    const f = hfFind(m);
    if (f) x.add(f, { source: `Hugging Face trending (#${i + 1})`, kind: 'hf-trending', url: f.url });
  });
}

// ---- AINews ------------------------------------------------------------------------------------------
/** Models that AINews's daily recap says launched. Each bullet is read on its own. */
export async function ainewsModels(x: ModelReader) {
  const xml = await x.r.text('https://latent.space/feeds/news.xml');
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const date = new Date((it.match(/<pubDate>([^<]+)<\/pubDate>/) ?? [])[1] ?? '').toISOString().slice(0, 10);
    if (date < x.from) continue;
    x.r.read();
    const link = (it.match(/<link>([^<]+)<\/link>/) ?? [])[1] ?? 'https://latent.space/news';
    // the Reddit recap and the sections after it are mostly community fine-tunes, leaks and speculation
    const full = (it.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/) ?? [])[1] ?? '';
    const cut = full.search(/AI Reddit Recap/i);
    const html = cut > 0 ? full.slice(0, cut) : full;
    for (const li of html.matchAll(/<li[^>]*>([\s\S]*?)(?=<li[\s>]|<\/li>)/g)) {
      const text = stripTags(li[1]);
      if (/\(Activity: \d+\)/.test(text)) continue;
      for (const { name, org } of modelMentions(text)) {
        // the maker: "Reflection's Beam 1.0", or a family the lab names its models after ("Qwen4-Max")
        const maker = org ?? name.match(/^[A-Za-z]+/)?.[0];
        x.add({ name, url: link, created: date, org: x.labOf(maker) ? maker : undefined }, { source: 'AINews', kind: 'ainews', url: link });
      }
    }
  }
}

// ---- Bluesky -----------------------------------------------------------------------------------------
const QUERIES = ['open weights', 'open-weight model', 'releasing model', 'introducing model', 'new model release'];
// accounts that repost X posts: their text is X's, which we do not take
const MIRROR = /extwitter|twitter|xchatter|\.mir-|mir-rt|bird\.makeup|nitter|xcancel/i;
// the maker's own announcement: "we're releasing", "today we're open-sourcing", "Introducing ..."
const OWN = /\b(?:we(?:'|’)re|we are|we|today we(?:'|’)re)\s+(?:\w+\s+){0,2}?(?:releas|introduc|launch|open[- ]sourc|shipping)|^\s*introducing\b/i;
interface Post {
  uri: string;
  likeCount?: number;
  author: { handle: string; displayName?: string };
  record: { text?: string; createdAt?: string };
}

/** First-person launch posts on Bluesky that name a model. */
export async function blueskyModels(x: ModelReader) {
  const posts = new Map<string, Post>();
  for (const q of QUERIES) {
    // the search API refuses bursts (HTTP 403), so requests go one every 1.5 s
    await new Promise((r) => setTimeout(r, 1500));
    const u = new URL('https://api.bsky.app/xrpc/app.bsky.feed.searchPosts');
    u.search = new URLSearchParams({ q, limit: '100', sort: 'latest', since: `${x.from}T00:00:00Z` }).toString();
    const d = await x.r.json<{ posts?: Post[] }>(u.toString()).catch((e: Error) => {
      if (x.r.signal.aborted || !/HTTP 403/.test(e.message)) throw e;
      x.r.note(`refused: ${q}`);
      return {} as { posts?: Post[] };
    });
    for (const p of d.posts ?? []) posts.set(p.uri, p);
  }
  x.r.read(posts.size);
  for (const p of posts.values()) {
    const text = p.record.text ?? '';
    if (MIRROR.test(p.author.handle) || !OWN.test(text)) continue;
    // a lab we know, or a post that people noticed: anyone can claim a release
    if (!x.labOf(p.author.displayName) && (p.likeCount ?? 0) < 10) continue;
    const url = `https://bsky.app/profile/${p.author.handle}/post/${p.uri.split('/').pop()}`;
    for (const name of modelNames(text)) x.add({ name, url, org: p.author.displayName, created: p.record.createdAt?.slice(0, 10) }, { source: 'Bluesky', kind: 'bluesky', url });
  }
}

// ---- labs' own sites -----------------------------------------------------------------------------------
/**
 * Labs that launch models on their own sites before Hugging Face, AINews or Bluesky carry them: Thinking Machines'
 * Inkling 2 Small, Cognition's SWE-2 Flash and Ricursive's Ripple-65B Preview all did in one week of November 2026.
 * Each list is a feed, a sitemap or a news index page. Every site's robots.txt allows these paths. Thinking
 * Machines' terms allow automated reading at a human pace, Cognition's say nothing on it, Ricursive publishes none,
 * and Reflection signals use=reference. Google, Google DeepMind, Mistral and Ai2 come from the benchmark scan's
 * feed list (labs.ts).
 */
interface LabSite {
  lab: string;
  list: string;
  kind: 'feed' | 'sitemap' | 'index';
  /** Which URLs in a sitemap or index are posts. */
  path?: RegExp;
}
export const LAB_SITES: LabSite[] = [
  { lab: 'Thinking Machines', list: 'https://thinkingmachines.ai/news/', kind: 'index', path: /^\/news\/[\w-]+\/$/ },
  { lab: 'Thinking Machines', list: 'https://thinkingmachines.ai/index.xml', kind: 'feed' },
  { lab: 'Cognition', list: 'https://cognition.com/sitemap.xml', kind: 'sitemap', path: /\/blog\/[\w-]+$/ },
  { lab: 'Ricursive Intelligence', list: 'https://www.ricursive.com/sitemap.xml', kind: 'sitemap', path: /ricursive\.com\/(?!careers\b)[\w-]+(?:\/[\w-]+)?$/ },
  { lab: 'Reflection', list: 'https://reflection.ai/sitemap.xml', kind: 'sitemap', path: /\/(?:blog|newsroom)\/[\w-]+$/ },
  ...BLOGS.map((b) => ({ lab: b.lab, list: b.feed, kind: 'feed' as const })),
];

interface LabPost {
  url: string;
  title?: string;
  date?: string;
}
/** The posts a list names, with a title and a date when it gives them. */
export function postsOf(site: LabSite, text: string): LabPost[] {
  if (site.kind === 'feed') return parseFeed(text).map((p) => ({ url: p.link, title: p.title, date: p.date }));
  if (site.kind === 'sitemap')
    return [...text.matchAll(/<url>([\s\S]*?)<\/url>/g)]
      .map((m) => ({ url: m[1].match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1] ?? '', date: m[1].match(/<lastmod>(\d{4}-\d\d-\d\d)/)?.[1] }))
      .filter((p) => p.url && (!site.path || site.path.test(p.url)));
  const base = new URL(site.list);
  return [...text.matchAll(/<a\b[^>]*href="([^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .filter((m) => !site.path || site.path.test(m[1]))
    .map((m) => ({
      url: new URL(m[1], base).href,
      title: stripTags(m[2].match(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1] ?? m[2]).trim() || undefined,
      date: m[2].match(/<time\b[^>]*datetime="(\d{4}-\d\d-\d\d)/)?.[1],
    }));
}

const LAUNCH_TITLE = /^(?:introducing|announcing|meet|releasing|launching|presenting)\s+(?:the\s+|our\s+)?(.+)$/i;
/**
 * The model a launch post names: "Introducing Inkling 2 Small", "Inkling: Our Open-Weights Model", or failing that
 * the first model its opening paragraphs say they release. The page must talk about a model, and the name must
 * carry a version or size unless the title itself says model.
 */
export function launchedModel(title: string, lead: string): string | undefined {
  if (!MODEL_WORD.test(lead)) return undefined;
  const t = title.replace(/\s*[|–—]\s*[^|–—]*$/, '').trim();
  const intro = t.match(LAUNCH_TITLE)?.[1];
  const colon = t.match(/^([^:]{2,40}):\s*(.+)$/);
  let name = intro?.replace(/[:,]\s.*$/, '').trim() ?? (colon && MODEL_WORD.test(colon[2]) ? colon[1].trim() : undefined);
  if (name && !/\d/.test(name) && !MODEL_WORD.test(t)) name = undefined;
  if (name && (name.length > 40 || NOT_NAME.test(name) || LABEL.test(name) || names(name).length)) name = undefined;
  return name ?? (VERB.test(t) || intro ? modelMentions(lead.slice(0, 2000))[0]?.name : undefined);
}

/** New launch posts on labs' own sites. A post counts once its URL is new since the last run. */
export async function labSites(x: ModelReader) {
  for (const site of LAB_SITES) {
    const text = await x.r.text(site.list).catch((e: Error) => (x.r.note(`${site.lab}: ${e.message}`), ''));
    if (!text) continue;
    const posts = postsOf(site, text);
    x.r.read(posts.length);
    const k = `site:${site.list}`;
    const prev = x.seen[k] ? new Set(x.seen[k]) : null;
    // the first run takes posts dated inside the window; an undated list starts as a baseline
    const fresh = posts.filter((p) => (prev ? !prev.has(p.url) : !!p.date && p.date >= x.from)).slice(0, 6);
    for (const p of fresh) {
      await new Promise((r) => setTimeout(r, 1000));
      const html = await x.r.text(p.url).catch(() => '');
      if (!html) continue;
      const title = stripTags(html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1] ?? html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? p.title ?? '');
      const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html.match(/<article\b[\s\S]*?<\/article>/i)?.[0] ?? html;
      const name = launchedModel(title || p.title || '', stripTags(main).slice(0, 4000));
      if (name) x.add({ name, url: p.url, org: site.lab, created: p.date }, { source: `${site.lab} site`, kind: 'lab-post', url: p.url });
    }
    x.seen[k] = posts.map((p) => p.url);
  }
}

// ---- leaderboards ------------------------------------------------------------------------------------
/**
 * Board names with no model record (leaderboards.json `others`). A name new since the last run that two or more
 * boards list becomes a find. A name that matches a find from another source adds a board as evidence.
 */
export function boardNames(x: ModelReader, others: [string, string, ...unknown[]][]) {
  const groups = new Map<string, { name: string; boards: Set<string> }>();
  for (const [board, raw] of others) {
    const name = raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const k = modelKey(name);
    if (!k || /^(undisclosed|unknown|anonymous|human|baseline|random)/.test(k)) continue;
    const g = groups.get(k) ?? { name, boards: new Set<string>() };
    g.boards.add(board);
    groups.set(k, g);
  }
  x.r.read(groups.size);
  const before = x.seen.boards ? new Set(x.seen.boards) : null;
  for (const [k, g] of groups) {
    const fresh = before && !before.has(k) && g.boards.size >= 2;
    if (!fresh && !x.finds.has(k)) continue;
    const list = [...g.boards].sort();
    x.add({ name: g.name, url: `/benchmarks/${list[0]}/` }, { source: `Leaderboards (${list.length}: ${list.slice(0, 3).join(', ')}${list.length > 3 ? ', ...' : ''})`, kind: 'boards', url: `/benchmarks/${list[0]}/` });
  }
  x.seen.boards = [...groups.keys()];
  if (!before) x.r.note('first run: recorded a baseline of board names');
}

// ---- score -------------------------------------------------------------------------------------------
// a lab's own launch post is the strongest single sign: with the lab known it reaches the top list on its own
const WEIGHT: Record<Kind, number> = { 'hf-lab': 3, 'hf-trending': 2, ainews: 3, bluesky: 3, boards: 3, 'lab-post': 5 };

/**
 * Evidence that a find is a new model worth cataloging. A release from a lab's own account, a news item, a maker's
 * post and two boards score 3 each, and a trending repo 2. A known lab, a second kind of source and 500 likes add 2
 * each, and a size of 7B or more adds 1.
 */
export function modelScore(f: ModelFind): number {
  const kinds = new Set(f.sources.map((s) => s.kind));
  let s = [...kinds].reduce((n, k) => n + WEIGHT[k], 0);
  if (f.lab) s += 2;
  if (kinds.size >= 2) s += 2;
  if ((f.likes ?? 0) >= 500) s += 2;
  if ((f.params ?? 0) >= 7) s += 1;
  return s;
}
