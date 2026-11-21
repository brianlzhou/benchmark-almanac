// Good Start Labs ranks Diplomacy players by supply centers captured plus a speed bonus.
// The board describes a 20-game evaluation against Devstral Small 1.1. Its three CSVs
// supply the overall score, the betrayal rate and the change in score with an aggressive prompt.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = (tab: string) => `https://goodstartlabs.com/data/diplomacy-${tab}.csv`;

async function scores(tab: string, minimum: number) {
  const records = parseCsv(await fetchText(feed(tab)));
  if (!['rank', 'model', 'org', 'score', 'badge'].every((key) => key in (records[0] ?? {})))
    throw new Error(`AI Diplomacy: missing columns in ${tab}`);
  const scores = new Map<string, number>();
  for (const record of records) {
    const model = record.model.trim();
    const score = Number(record.score);
    if (!model || scores.has(model) || !record.score.trim() || !Number.isFinite(score))
      throw new Error(`AI Diplomacy: invalid or repeated row for ${model} in ${tab}`);
    scores.set(model, score);
  }
  if (scores.size < minimum) throw new Error(`AI Diplomacy: ${tab} has ${scores.size} rows, expected at least ${minimum}`);
  return scores;
}

// The tabs vary capitalization, punctuation and these two Claude labels.
function modelKey(name: string) {
  if (name === 'Claude 4.5 Sonnet') name = 'Claude Sonnet 4 5';
  if (name === 'Claude 4 1M') name = 'c4 1m';
  return name.toLowerCase().replace(/[\s.-]/g, '');
}

const settings: Record<string, string> = {
  'c4 1m': '1M context',
  'GPT 5 Minimal': 'Minimal',
  'GPT 5 Minimal New': 'Minimal New',
  'GPT 5 Medium': 'Medium',
  'Grok 4 Fast Reasoning': 'Reasoning',
};

const board: Leaderboard = {
  benchmark: 'ai-diplomacy',
  url: 'https://goodstartlabs.com/benchmarks/diplomacy',
  feed: feed('overall-performance'),
  terms: 'Good Start Labs allows the public CSV paths in robots.txt. Its terms prohibit automated access without express authorization.',
  // Alex Duffy identifies C4-1M as Claude Sonnet 4 in his August 15, 2025 article for Every.
  aliases: { 'c4 1m': 'claude-sonnet-4', 'GPT 5 Minimal New': 'gpt-5' },
  parts: {
    betrayal: { name: 'Betrayal Tendency', unit: '%', better: 'lower', note: 'Percentage of 60 games in which the model betrays its ally.' },
    steerability: { name: 'Steerability', unit: 'score', note: 'Difference in score between the optimized aggressive prompt and the baseline prompt.' },
  },
  async fetch() {
    const overall = await scores('overall-performance', 23);
    const rows = new Map<string, LeaderboardRow>();
    for (const [model, score] of overall) {
      const key = modelKey(model);
      if (rows.has(key)) throw new Error(`AI Diplomacy: ambiguous model name ${model}`);
      rows.set(key, { model, score, setting: settings[model], trials: 20 });
    }
    for (const [key, tab, minimum] of [['betrayal', 'betrayal-tendency', 17], ['steerability', 'steerability', 22]] as const) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      for (const [model, value] of await scores(tab, minimum)) {
        const row = rows.get(modelKey(model));
        if (row) (row.metrics ??= {})[key] = value;
      }
    }
    return [...rows.values()];
  },
};
export default board;
