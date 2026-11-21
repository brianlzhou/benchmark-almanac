// Miðeind grades factual answers to questions from Icelandic Wikipedia.
// Its current leaderboard reports a fraction for each model and thinking setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const mideindFeed = 'https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/raw/main/leaderboard.json';
export const mideindPage = 'https://mideind-icelandic-llm-leaderboard.static.hf.space/';
export const mideindTerms = 'Miðeind publishes the leaderboard under CC BY 4.0. Both hosts allow the feed in robots.txt.';

type Model = {
  display_name: string; model_url: string; thinking: string; tools: string[]; license: string; params_b: number | null;
  benchmark_evaluated_at: Record<string, string>; scores: Record<string, Record<string, number>>;
};
export async function mideindRows(key: string, metric: string, extra: Record<string, string> = {}, min = 102): Promise<LeaderboardRow[]> {
  const data = await fetchJson<{ benchmarks: { id: string; primary_metric: string }[]; models: Model[] }>(mideindFeed);
  if (!data.benchmarks.some(b => b.id === key && b.primary_metric === metric)) throw new Error('Missing Miðeind metric for ' + key);
  const rows = data.models.filter(m => m.scores[key] != null).map(m => {
    const values = m.scores[key];
    if (!m.display_name || ![metric, ...Object.values(extra)].every(k => Number.isFinite(values[k]))) throw new Error('Incomplete Miðeind result');
    return { model: m.display_name, score: 100 * values[metric], setting: [m.thinking, ...m.tools].filter(Boolean).join(', '),
      date: m.benchmark_evaluated_at[key]?.slice(0, 10), params: m.params_b ?? undefined, license: m.license, link: m.model_url,
      metrics: Object.fromEntries(Object.entries(extra).map(([k, field]) => [k, 100 * values[field]])) };
  });
  if (rows.length < min) throw new Error('Missing Miðeind configurations for ' + key);
  return rows;
}
const board: Leaderboard = {
  benchmark: 'icelandic-wikiqa', url: mideindPage, feed: mideindFeed, terms: mideindTerms,
  fetch: () => mideindRows('icelandic_wikiqa@v1', 'llm_judge_score'),
};
export default board;
