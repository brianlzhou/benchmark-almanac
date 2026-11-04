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
import { stripTags } from './text.ts';

export type Kind = 'hf-lab' | 'hf-trending' | 'ainews' | 'bluesky' | 'boards';
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
  if (!repo || isRepack(m.id) || derivedFrom(m.tags, author) || otherFamily(repo, author) || UNTRACKED.has(m.pipeline_tag ?? '')) return undefined;
  const total = m.safetensors?.total;
  const license = m.cardData?.license_name ?? m.cardData?.license;
  return {
    name: repo,
    url: `https://huggingface.co/${m.id}`,
    org: author,
    created: m.createdAt?.slice(0, 10),
    params: total ? Math.round(total / 1e8) / 10 : undefined,
    weights: 'open',
    license: typeof license === 'string' ? license : undefined,
  };
}

/** New repos from the Hugging Face accounts of the labs we catalog. */
export async function hfLabs(x: ModelReader) {
  for (const org of x.hfAccounts) {
    const list = await x.r.json<HfModel[]>(`https://huggingface.co/api/models?author=${encodeURIComponent(org)}&sort=createdAt&direction=-1&limit=20&${EXPAND}`).catch((e: Error) => {
      x.r.note(`${org}: ${e.message}`);
      return [] as HfModel[];
    });
    x.r.read();
    for (const m of list) {
      if ((m.createdAt ?? '').slice(0, 10) < x.from) break;
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
const WEIGHT: Record<Kind, number> = { 'hf-lab': 4, 'hf-trending': 2, ainews: 3, bluesky: 3, boards: 3 };

/**
 * Evidence that a find is a new model worth cataloging. A release from a lab's own account scores 4, a news or
 * maker's post 3, two boards 3, a trending repo 2. A known lab, a second kind of source and a size of 7B or more add more.
 */
export function modelScore(f: ModelFind): number {
  const kinds = new Set(f.sources.map((s) => s.kind));
  let s = [...kinds].reduce((n, k) => n + WEIGHT[k], 0);
  if (f.lab) s += 2;
  if (kinds.size >= 2) s += 2;
  if ((f.params ?? 0) >= 7) s += 1;
  return s;
}
