// Arena (formerly LMArena) text leaderboard, read only through Arena's Hugging Face dataset
// lmarena-ai/leaderboard-dataset. The page's default view is style-controlled, so this reads the
// text_style_control subset, "latest" split, category "overall". Each subset's latest split is one small Parquet
// file in the dataset (628 KB for Text, under 70 KB for most), so arenaSubset downloads it and reads it with
// hyparquet: one request an arena, where the dataset viewer's API took 100 rows a request and answered 429 to a
// burst. The other Arena importers reuse arenaRows and arenaSubset.
// Each row also keeps the score's 95% interval (rating_lower, rating_upper as metrics.ciLow, ciHigh) and its
// vote count, rank, variance and license when the subset has them. Preserve the bounds as interval fields.
//
// Arena also rates models on the votes for one kind of prompt: coding, math, a language, an industry. It tags each
// battle with every category its prompt fits, so one vote counts in several, and the categories are views of the
// same votes rather than separate arenas. arenaRowsByCategory keeps each one as a metric on the overall row
// ("cat:coding"), and the benchmark page shows them in a category switch. Factuality, Arena's ranking that also
// weighs whether a reply's claims check out, is another view of the same battles, kept the same way.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { parquetReadObjects } from 'hyparquet';
import { fetchBytes } from '../lib/util.ts';

const DATASET = 'lmarena-ai/leaderboard-dataset';
export const ARENA_TERMS = 'Hugging Face dataset lmarena-ai/leaderboard-dataset, CC BY 4.0.';
export const arenaFeed = (config: string, category = 'overall') =>
  `https://huggingface.co/datasets/${DATASET} (subset ${config}, split latest, ${category === '*' ? 'every category' : `category ${category}`})`;

/** Arena's spellings the shared resolver cannot place; both Arena importers use these. */
export const ARENA_ALIASES: Record<string, string> = {
  'Beam 1.0 501B A23B': 'beam-1-0',
  'NVIDIA-Nemotron-3-Ultra-550B-A55B': 'nemotron-3-ultra',
  'NVIDIA-Nemotron-3-Super-120B-A12B': 'nemotron-3-super',
  'Qwen3-235B-A22B-Instruct (2507)': 'qwen3-235b-a22b-instruct-jul-2025',
  'Qwen3-30B-A3B-Instruct (2507)': 'qwen3-30b-a3b-instruct-jul-2025',
  'Qwen3-Coder-480B-A35B-Instruct': 'qwen3-coder-480b-a35b',
  'Kimi K2 Preview (0711)': 'kimi-k2-jul-2025',
  'Kimi K2 Preview (0905)': 'kimi-k2-sep-2025',
  'Grok 3 Preview (02-24)': 'grok-3',
  'Grok 3 Mini Beta': 'grok-3-mini',
  'Grok 4 (0709)': 'grok-4',
  'Mistral Medium 3 (2505)': 'mistral-medium-3',
  'Mistral Medium 3.1 (2508)': 'mistral-medium-3-1',
  'Mistral Small 24B Instruct (2501)': 'mistral-small-3',
  'Mistral Small 3.1 24B Instruct (2503)': 'mistral-small-3-1',
  'Mistral Small 3.2 (2506)': 'mistral-small-3-2',
  'Mistral Large (2402)': 'mistral-large',
  'Mistral Large (2411)': 'mistral-large-2-nov-2024',
  'Ministral 8B (2410)': 'ministral-8b',
  'Mistral 7B Instruct v0.2': 'mistral-7b-v0-2',
  'Mixtral 8x7B Instruct v0.1': 'mixtral-8x7b',
  'Mixtral 8x22B Instruct v0.1': 'mixtral-8x22b',
  'Gemini 2.0 Flash-Lite Preview (02-05)': 'gemini-2-0-flash-lite',
  'Gemini 1.5 Pro (001)': 'gemini-1-5-pro-may-2024',
  'Gemini 1.5 Pro (002)': 'gemini-1-5-pro-sept-2024',
  'Gemini 1.5 Flash (001)': 'gemini-1-5-flash-may-2024',
  'Gemini 1.5 Flash (002)': 'gemini-1-5-flash-sep-2024',
  'Gemini 1.5 Flash-8B (001)': 'gemini-1-5-flash-8b',
  'Gemma 3 27B IT': 'gemma-3-27b',
  'Gemma 3 12B IT': 'gemma-3-12b',
  'Gemma 3 4B IT': 'gemma-3-4b',
  'Gemma 2 27B IT': 'gemma-2-27b',
  'Gemma 2 9B IT': 'gemma-2-9b',
  'Gemma 7B IT': 'gemma-7b',
  'Gemma 2B IT': 'gemma-2b',
  'GPT-4 (0314)': 'gpt-4-mar-2023',
  'GPT-4 (0613)': 'gpt-4-jun-2023',
  'GPT-4 Turbo Preview (1106)': 'gpt-4-turbo-nov-2023',
  'GPT-3.5 Turbo (1106)': 'gpt-3-5-turbo-nov-2023',
  'GPT-3.5 Turbo (0125)': 'gpt-3-5-turbo-jan-2024',
  'Llama 4 Maverick 17B 128E Instruct': 'llama-4-maverick',
  'Llama 4 Scout 17B 16E Instruct': 'llama-4-scout',
  'Llama 3.1 405B Instruct': 'llama-3-1-405b',
  'Llama 3.1 70B Instruct': 'llama-3-1-70b',
  'Llama 3.1 8B Instruct': 'llama-3-1-8b',
  'Llama 3.1 Tulu 3 70B': 'tulu-3-tulu-3-70b',
  'Llama 3.2 3B Instruct': 'llama-3-2-3b',
  'Llama 3.2 1B Instruct': 'llama-3-2-1b',
  'Llama 3 70B Instruct': 'llama-3-70b',
  'Llama 3 8B Instruct': 'llama-3-8b',
  'Llama 2 70B Chat': 'llama-2-70b',
  'Llama 2 13B Chat': 'llama-2-13b',
  'Llama 2 7B Chat': 'llama-2-7b',
  'Amazon Nova Pro 1.0': 'amazon-nova-pro',
  'Amazon Nova Lite 1.0': 'amazon-nova-lite',
  'Amazon Nova Micro 1.0': 'amazon-nova-micro',
  'Qwen1.5-110B-Chat': 'qwen1-5-110b',
  'Qwen1.5-32B-Chat': 'qwen1-5-32b',
  'Qwen1.5-14B-Chat': 'qwen1-5-14b',
  'Qwen1.5-7B-Chat': 'qwen1-5-7b',
  'Yi 1.5 34B Chat': 'yi-1-5-34b',
  'Yi 34B Chat': 'yi-34b',
  'MPT 30B Chat': 'mpt-30b',
  'MPT 7B Chat': 'mpt-7b',
  'Falcon 180B Chat': 'falcon-180b',
  // the registry lists "DeepSeek-R1-0528" and "DeepSeek-V3-0324" as aliases of the first releases
  'DeepSeek-R1': 'deepseek-r1',
  'DeepSeek-R1 (0528)': 'deepseek-r1-may-2025',
  'DeepSeek-V3': 'deepseek-v3',
  'DeepSeek-V3 (0324)': 'deepseek-v3-mar-2025',
  'Claude 3.5 Sonnet (20241022)': 'claude-3-5-sonnet-october-2024',
  'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025',
  'Gemini 2.5 Flash Preview (09-2025)': 'gemini-2-5-flash-sep-2025',
  'Gemini 2.5 Flash-Lite Preview (Thinking, 06-17)': 'gemini-2-5-flash-lite-jun-2025',
  'Gemini 2.0 Flash (001)': 'gemini-2-0-flash-feb-2025',
  'Command R (08-2024)': 'c4ai-command-r-08-2024',
  'Command R Plus (08-2024)': 'command-r-plus',
  'Command A (03-2025)': 'cohere-command-a',
  'ChatGPT-4o Latest (20250326)': 'gpt-4o-mar-2025',
};

interface ArenaRow {
  model_name: string;
  /** the Arena score on vote boards */
  rating?: number;
  /** the Agent Arena score, built from session signals rather than votes */
  score?: number;
  rating_lower?: number | null;
  rating_upper?: number | null;
  vote_count?: number | null;
  variance?: number | null;
  rank?: number | null;
  license?: string | null;
  category: string;
  leaderboard_publish_date?: string;
}

/**
 * Arena writes snapshots, harnesses and weight formats in a trailing parenthesis:
 * "GPT-4o (2024-05-13)", "Claude Sonnet 4 (Thinking 32K, 20250514)", "GPT-5.5 (Codex Harness)",
 * "Llama 3.1 405B Instruct (FP8)". A full snapshot date becomes the row date, so the resolver picks that
 * snapshot; it also stays in the name as a bare stamp, so an alias written with the parenthesis still matches.
 */
export function splitName(raw: string, published?: string): { model: string; date?: string; setting?: string; harness?: string } {
  // "Command R+" and "Command R" share a match key, and the registry has only the "+" model and the 08-2024
  // Command R; naming the March 2024 original keeps it from landing on Command R+
  const name = raw === 'Command R' ? 'Command R (03-2024)' : raw.replace(/\+/g, ' Plus');
  const paren = name.match(/\s*\(([^()]*)\)$/);
  if (!paren) return { model: name, date: published };
  const base = name.slice(0, paren.index).trim();
  const parts = paren[1].split(',').map((p) => p.trim());
  const at = parts.findIndex((p) => /^20\d\d-?\d\d-?\d\d$/.test(p));
  if (at >= 0) {
    const d = parts[at].replace(/-/g, '');
    const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
    const rest = parts.filter((_, i) => i !== at);
    return { model: rest.length ? `${base} (${rest.join(', ')})` : `${base} ${d}`, date };
  }
  const inner = paren[1].trim();
  const harness = inner.match(/^(.+?)\s+Harness$/i);
  if (harness) return { model: base, harness: harness[1], date: published };
  if (/^(BF16|FP8|FP16|NVFP4|INT4|INT8|Instant|(Non-)?(Reasoning|Thinking))$/i.test(inner)) {
    return { model: base, setting: inner.toLowerCase(), date: published };
  }
  return { model: name, date: published };
}

const FILES = `https://huggingface.co/datasets/${DATASET}/resolve/main`;
const rating = (r: ArenaRow) => r.rating ?? r.score;
const read = new Map<string, Promise<object[]>>();

/**
 * Every row of one subset's latest published leaderboard, every category, in the file's order. Each file is read
 * once a run and shared by the importers that use it (Code Arena and Image-to-WebDev both read webdev). Parquet
 * keeps whole numbers such as rank as BigInt, so they come back as numbers.
 */
export function arenaSubset<T extends object = ArenaRow>(config: string): Promise<T[]> {
  let rows = read.get(config);
  if (!rows) {
    rows = fetchBytes(`${FILES}/${config}/latest-00000-of-00001.parquet`).then(async (file) =>
      (await parquetReadObjects({ file })).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v]))),
    );
    rows.catch(() => read.delete(config));
    read.set(config, rows);
  }
  return rows as Promise<T[]>;
}

/** One Arena row as a leaderboard row: the score, its interval and its vote count. */
function toRow(row: ArenaRow): LeaderboardRow {
  const metrics: Record<string, number> = {};
  if (Number.isFinite(row.rating_lower) && Number.isFinite(row.rating_upper)) Object.assign(metrics, { ciLow: row.rating_lower, ciHigh: row.rating_upper });
  if (Number.isFinite(row.vote_count)) metrics.votes = row.vote_count!;
  if (typeof row.rank === 'number') metrics.rank = row.rank;
  if (typeof row.variance === 'number') metrics.variance = row.variance;
  return { ...splitName(row.model_name.trim(), row.leaderboard_publish_date), score: rating(row)!,
    low: metrics.ciLow, high: metrics.ciHigh, license: row.license?.trim() || undefined, ...(Object.keys(metrics).length ? { metrics } : {}) };
}

/**
 * The rows of one category (default "overall") of one subset's latest published leaderboard. Image-to-WebDev,
 * for one, is the "image_to_webdev" category of the webdev subset.
 */
async function arenaRaw(config: string, category = 'overall'): Promise<ArenaRow[]> {
  const rows = (await arenaSubset(config)).filter((r) => r.category === category && r.model_name && Number.isFinite(rating(r)));
  if (!rows.length) throw new Error(`no ${category} rows in ${config}`);
  return rows;
}

/** Every row of one category (default "overall") of one subset; the rating is the Arena score. */
export async function arenaRows(config: string, category = 'overall'): Promise<LeaderboardRow[]> {
  return (await arenaRaw(config, category)).map(toRow);
}

/**
 * The overall rows of one subset, each with the model's rating in every other category as a metric
 * ("cat:coding"). `skip` leaves out a category we track as its own arena (Image-to-WebDev). `views` adds the
 * overall ratings of another subset under a key of its own, such as text_factuality as "cat:factuality".
 */
export async function arenaRowsByCategory(config: string, opts: { skip?: string[]; views?: Record<string, string> } = {}): Promise<LeaderboardRow[]> {
  const usable = (await arenaSubset(config)).filter((r) => r.model_name && Number.isFinite(rating(r)));
  const cats = new Map<string, Record<string, number>>();
  const put = (r: ArenaRow, key: string) => {
    const name = r.model_name.trim();
    const m = cats.get(name) ?? {};
    m[`cat:${key}`] = Math.round(rating(r)! * 100) / 100;
    for (const [label, value] of Object.entries({ votes: r.vote_count, low: r.rating_lower, high: r.rating_upper, rank: r.rank, variance: r.variance })) {
      if (typeof value === 'number') m[`${label}:${key}`] = value;
    }
    cats.set(name, m);
  };
  for (const r of usable) if (r.category !== 'overall' && !opts.skip?.includes(r.category)) put(r, r.category);
  for (const [key, other] of Object.entries(opts.views ?? {})) for (const r of await arenaRaw(other)) put(r, key);
  const overall = usable.filter((r) => r.category === 'overall');
  if (!overall.length) throw new Error(`no overall rows in ${config}`);
  return overall.map((r) => {
    const row = toRow(r);
    const extra = cats.get(r.model_name.trim());
    return extra ? { ...row, metrics: { ...row.metrics, ...extra } } : row;
  });
}

const board: Leaderboard = {
  benchmark: 'lmarena-elo',
  parts: {
    'cat:chinese': { name: 'Chinese', group: 'Language' },
    'cat:coding': { name: 'Coding', group: 'Task' },
    'cat:creative_writing': { name: 'Creative writing', group: 'Task' },
    'cat:english': { name: 'English', group: 'Language' },
    'cat:expert': { name: 'Expert', group: 'Task' },
    'cat:french': { name: 'French', group: 'Language' },
    'cat:german': { name: 'German', group: 'Language' },
    'cat:hard_prompts': { name: 'Hard prompts', group: 'Task' },
    'cat:hard_prompts_english': { name: 'Hard prompts in English', group: 'Task' },
    'cat:industry_business_and_management_and_financial_operations': { name: 'Business and finance', group: 'Industry' },
    'cat:industry_entertainment_and_sports_and_media': { name: 'Entertainment, sports and media', group: 'Industry' },
    'cat:industry_legal_and_government': { name: 'Law and government', group: 'Industry' },
    'cat:industry_life_and_physical_and_social_science': { name: 'Science', group: 'Industry' },
    'cat:industry_mathematical': { name: 'Mathematics', group: 'Industry' },
    'cat:industry_medicine_and_healthcare': { name: 'Medicine and healthcare', group: 'Industry' },
    'cat:industry_software_and_it_services': { name: 'Software and IT', group: 'Industry' },
    'cat:industry_writing_and_literature_and_language': { name: 'Writing and literature', group: 'Industry' },
    'cat:instruction_following': { name: 'Instruction following', group: 'Task' },
    'cat:japanese': { name: 'Japanese', group: 'Language' },
    'cat:korean': { name: 'Korean', group: 'Language' },
    'cat:longer_query': { name: 'Longer queries', group: 'Task' },
    'cat:math': { name: 'Math', group: 'Task' },
    'cat:multi_turn': { name: 'Multi-turn', group: 'Task' },
    'cat:non_english': { name: 'Not English', group: 'Language' },
    'cat:polish': { name: 'Polish', group: 'Language' },
    'cat:russian': { name: 'Russian', group: 'Language' },
    'cat:spanish': { name: 'Spanish', group: 'Language' },
  },
  url: 'https://arena.ai/leaderboard/text',
  feed: arenaFeed('text_style_control', '*'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRowsByCategory('text_style_control', { views: { factuality: 'text_factuality' } }),
};
export default board;
