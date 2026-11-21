// BullshitBench V2. petergpt.github.io/bullshit-benchmark (GitHub Pages) publishes each version's results with
// a manifest and a leaderboard.csv export (data/v2/latest/ for V2, data/latest/ for V1): per model variant
// ("anthropic/claude-opus-4.8@reasoning=xhigh") the reasoning setting and counts of clear pushback
// (score_2), partial, accepted and refusals over the question set. The viewer ranks by Clear, the clear
// pushback rate with refusals left out of the denominator ("Scores, rankings and averages always exclude
// refusals"), so the score is 100 * score_2 / (nonsense_count - refusal_count), as the viewer computes it.
// bullshitbench.ts reads V1 with the same reader. For V2, cost and output tokens are the viewer's "USD / answer"
// and "Output tok." columns: means over each variant's answers, refusals left out as the viewer does, read from
// the gzipped viewer rows. These also give latency, token usage and clear pushback by question technique.
import { gunzipSync } from 'node:zlib';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

export const BS_PAGE = 'https://petergpt.github.io/bullshit-benchmark/';
export const BS_TERMS = 'Static data files on GitHub Pages (no robots.txt rules); the petergpt/bullshit-benchmark repository is MIT-licensed.';

/** OpenRouter-style ids on the board that the resolver cannot place. */
export const BS_ALIASES: Record<string, string> = {
  'mistral-large-4-0': 'mistral-large-4',
  // dated and undated OpenRouter GPT-4o ids: the resolver drops the date and picks a 2025 snapshot; in 2025
  // openai/gpt-4o served gpt-4o-2024-08-06
  'openai/gpt-4o-2024-08-06': 'gpt-4o-aug-2024',
  'openai/gpt-4o': 'gpt-4o-aug-2024',
  'grok-4.20-multi-agent-beta': 'grok-4-20-multi-agent',
  'grok-4.20-beta': 'grok-4-20',
  'nemotron-3-super-120b-a12b': 'nemotron-3-super',
  'nemotron-3-ultra-550b-a55b': 'nemotron-3-ultra',
  // gpt-5.1-chat-latest serves GPT-5.1 Instant
  'gpt-5.1-chat': 'gpt-5-1-instant',
  'llama-3.1-8b-instruct': 'llama-3-1-8b',
  'gemma-4-26b-a4b-it': 'gemma-4-26b-a4b',
  // the -001 build is the February 2025 general release
  'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
  'nemotron-nano-9b-v2': 'nvidia-nemotron-nano-9b-v2',
  'jamba-large-1.7': 'jamba-1-7-large',
  'hy3-preview': 'tencent-hy3-preview',
  // Mistral's dated API ids: 2512 is Mistral Large 3, 2603 is Mistral Small 4
  'mistral-large-2512': 'mistral-large-3',
  'mistral-small-2603': 'mistral-small-4',
};

const usageColumns = {
  response_cost_usd: 'cost', response_completion_tokens: 'tokens', response_latency_ms: 'latency',
  response_prompt_tokens: 'inputTokens', response_total_tokens: 'totalTokens', response_reasoning_tokens: 'reasoningTokens',
  response_cached_prompt_tokens: 'cachedTokens', response_cache_write_tokens: 'cacheWriteTokens',
  response_tokens_per_second: 'tokensPerSecond',
} as const;

interface ViewerRow extends Partial<Record<keyof typeof usageColumns, number | null>> {
  model: string;
  status?: string;
  technique?: string;
  is_control?: boolean;
  consensus_score?: number | null;
  response_refusal?: boolean | string | null;
  response_outcome?: string | null;
  finished_at_utc?: string;
}

async function bsUsage(dir: string, parts: NonNullable<Leaderboard['parts']>) {
  const manifest = JSON.parse(await fetchText(`${BS_PAGE}${dir}manifest.json`));
  const files = manifest.storage?.assets?.['viewer_rows.json.gz']?.parts;
  if (!files?.length) throw new Error(`no viewer_rows in ${dir}manifest.json`);
  const sums = new Map<string, { date?: string; values: Record<string, { sum: number; count: number }> }>();
  for (const file of files) {
    const res = await fetch(`${BS_PAGE}${dir}${file.path}`, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`${res.status} ${file.path}`);
    const rows: ViewerRow[] = JSON.parse(gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8'));
    for (const r of rows) {
      const refusal = String(r.response_refusal ?? '').toLowerCase();
      if (refusal === 'true' || (refusal !== 'false' && r.response_outcome?.toLowerCase() === 'refusal')) continue;
      const entry = sums.get(r.model) ?? { values: {} };
      const add = (key: string, value: number) => {
        const cell = entry.values[key] ??= { sum: 0, count: 0 };
        cell.sum += value;
        cell.count++;
      };
      for (const column of Object.keys(usageColumns) as (keyof typeof usageColumns)[]) {
        const value = r[column];
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
          add(usageColumns[column], column === 'response_latency_ms' ? value / 1000 : value);
        }
      }
      if (r.technique && !r.is_control) {
        add(r.technique, r.status === 'ok' && typeof r.consensus_score === 'number' && r.consensus_score >= 1.5 ? 100 : 0);
        const name = r.technique.replace(/_/g, ' ');
        parts[r.technique] = { name: name[0].toUpperCase() + name.slice(1), group: 'Technique' };
      }
      const date = r.finished_at_utc?.slice(0, 10);
      if (date && (!entry.date || date > entry.date)) entry.date = date;
      sums.set(r.model, entry);
    }
  }
  return new Map([...sums].map(([model, entry]) => {
    const means = Object.fromEntries(Object.entries(entry.values).map(([key, stat]) => [key, stat.sum / stat.count]));
    const { cost, tokens, ...metrics } = means;
    return [model, { cost, tokens, metrics, date: entry.date }] as const;
  }));
}

/**
 * Rows from one version's leaderboard.csv (`dir` is "data/v2/latest/" or "data/latest/"). `usage` adds the
 * viewer's cost and output tokens per answer.
 */
export async function bsRows(dir: string, usage = false, parts: NonNullable<Leaderboard['parts']> = {}): Promise<LeaderboardRow[]> {
  const perAnswer = usage ? await bsUsage(dir, parts) : undefined;
  const rows: LeaderboardRow[] = [];
  for (const r of parseCsv(await fetchText(`${BS_PAGE}${dir}leaderboard.csv`))) {
    // "nvidia/nemotron-nano-9b-v2:free@reasoning=none": drop the variant and OpenRouter's free-tier tag
    const model = r.model.split('@')[0].replace(/:free$/, '');
    const asked = Number(r.nonsense_count) - Number(r.refusal_count);
    const clear = Number(r.score_2);
    if (!model || !(asked > 0) || !Number.isFinite(clear)) continue;
    const reasoning = r.reasoning?.trim().toLowerCase();
    const extra = perAnswer?.get(r.model);
    const metrics = { ...extra?.metrics };
    for (const [column, key] of Object.entries({
      rank: 'publishedCsvRank', avg_score: 'meanJudgeScore', score_2: 'clear', score_1: 'partial', score_0: 'accepted',
      refusal_count: 'refusals', answered_count: 'answered', nonsense_count: 'questions', error_count: 'errors',
      green_rate: 'greenRate', red_rate: 'redRate', refusal_rate: 'refusalRate',
    })) {
      if (r[column]?.trim() && Number.isFinite(Number(r[column]))) metrics[key] = Number(r[column]);
    }
    rows.push({
      model,
      score: Number(((100 * clear) / asked).toFixed(2)),
      setting: reasoning && reasoning !== 'default' ? reasoning : undefined,
      ...extra, metrics,
    });
  }
  if (!rows.length) throw new Error(`no rows in ${dir}leaderboard.csv`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'bullshitbench-2',
  url: BS_PAGE,
  feed: `${BS_PAGE}data/v2/latest/leaderboard.csv (clear pushback, refusals excluded) and viewer_rows (cost, output tokens)`,
  terms: BS_TERMS,
  aliases: BS_ALIASES,
  async fetch() {
    const parts = {};
    const rows = await bsRows('data/v2/latest/', true, parts);
    board.parts = parts;
    return rows;
  },
};
export default board;
