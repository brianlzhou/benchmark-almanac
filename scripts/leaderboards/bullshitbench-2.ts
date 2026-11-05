// BullshitBench V2. petergpt.github.io/bullshit-benchmark (GitHub Pages) publishes each version's results with
// a manifest and a leaderboard.csv export (data/v2/latest/ for V2, data/latest/ for V1): per model variant
// ("anthropic/claude-opus-4.8@reasoning=xhigh") the reasoning setting and counts of clear pushback
// (score_2), partial, accepted and refusals over the question set. The viewer ranks by Clear, the clear
// pushback rate with refusals left out of the denominator ("Scores, rankings and averages always exclude
// refusals"), so the score is 100 * score_2 / (nonsense_count - refusal_count), as the viewer computes it.
// bullshitbench.ts reads V1 with the same reader. For V2, cost and output tokens are the viewer's "USD / answer"
// and "Output tok." columns: means over each variant's answers, refusals left out as the viewer does, read from
// the gzipped viewer_rows file that manifest.json lists (response_cost_usd, response_completion_tokens).
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

interface ViewerRow {
  model: string;
  response_refusal?: boolean | string | null;
  response_outcome?: string | null;
  response_completion_tokens?: number | null;
  response_cost_usd?: number | null;
}

/** Per model variant, the viewer's mean cost (US dollars) and output tokens per answer, refusals left out. */
async function bsUsage(dir: string): Promise<Map<string, { cost?: number; tokens?: number }>> {
  const manifest = JSON.parse(await fetchText(`${BS_PAGE}${dir}manifest.json`)) as {
    storage?: { assets?: Record<string, { parts: { path: string }[] }> };
  };
  const parts = manifest.storage?.assets?.['viewer_rows.json.gz']?.parts;
  if (!parts?.length) throw new Error(`no viewer_rows in ${dir}manifest.json`);
  const sums = new Map<string, { cost: number; nc: number; tokens: number; nt: number }>();
  for (const part of parts) {
    const res = await fetch(`${BS_PAGE}${dir}${part.path}`, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`${res.status} ${part.path}`);
    const rows = JSON.parse(gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8')) as ViewerRow[];
    for (const r of rows) {
      const refusal = String(r.response_refusal ?? '').toLowerCase();
      if (refusal === 'true' || (refusal !== 'false' && String(r.response_outcome ?? '').toLowerCase() === 'refusal')) continue;
      const s = sums.get(r.model) ?? { cost: 0, nc: 0, tokens: 0, nt: 0 };
      if (typeof r.response_cost_usd === 'number' && r.response_cost_usd >= 0) (s.cost += r.response_cost_usd), s.nc++;
      if (typeof r.response_completion_tokens === 'number' && r.response_completion_tokens >= 0) (s.tokens += r.response_completion_tokens), s.nt++;
      sums.set(r.model, s);
    }
  }
  return new Map(
    [...sums].map(([m, s]) => [m, { cost: s.nc && s.cost > 0 ? s.cost / s.nc : undefined, tokens: s.nt && s.tokens > 0 ? s.tokens / s.nt : undefined }]),
  );
}

/**
 * Rows from one version's leaderboard.csv (`dir` is "data/v2/latest/" or "data/latest/"). `usage` adds the
 * viewer's cost and output tokens per answer.
 */
export async function bsRows(dir: string, usage = false): Promise<LeaderboardRow[]> {
  const perAnswer = usage ? await bsUsage(dir) : undefined;
  const rows: LeaderboardRow[] = [];
  for (const r of parseCsv(await fetchText(`${BS_PAGE}${dir}leaderboard.csv`))) {
    // "nvidia/nemotron-nano-9b-v2:free@reasoning=none": drop the variant and OpenRouter's free-tier tag
    const model = r.model.split('@')[0].replace(/:free$/, '');
    const asked = Number(r.nonsense_count) - Number(r.refusal_count);
    const clear = Number(r.score_2);
    if (!model || !(asked > 0) || !Number.isFinite(clear)) continue;
    const reasoning = r.reasoning?.trim().toLowerCase();
    rows.push({
      model,
      score: Number(((100 * clear) / asked).toFixed(2)),
      setting: reasoning && reasoning !== 'default' ? reasoning : undefined,
      ...perAnswer?.get(r.model),
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
  fetch: () => bsRows('data/v2/latest/', true),
};
export default board;
