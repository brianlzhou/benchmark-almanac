// Situational Awareness Dataset (SAD). situational-awareness-dataset.org shows its results as a plot and a
// table image, and links the data behind them as "Results CSV" (/assets/data.csv: type, model, variant,
// score 0 to 1, std, random_chance, upper_baseline, num_trials). The score is type "SAD", the overall score
// the page's Table 1 leads with, times 100. The CSV has two prompt variants per model, "Plain Prompt" and
// "Situating Prompt" (a system prompt telling the model it is an LLM); both are kept, with the variant as
// the setting. SAD-lite, SAD-mini and the seven category rows are not read. The CSV's std is kept as
// metrics.std (0 to 100).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const SITE = 'https://situational-awareness-dataset.org';
const FEED = `${SITE}/assets/data.csv`;

const board: Leaderboard = {
  benchmark: 'situational-awareness-dataset-sad',
  url: `${SITE}/`,
  feed: `${FEED} (type SAD)`,
  terms: 'Results CSV linked for download from the project page (robots.txt is not set); the SAD code and data are MIT-licensed.',
  aliases: {
    'gpt-4-0125-preview': 'gpt-4-turbo-jan-2024',
    'gpt-4-0613': 'gpt-4-jun-2023',
    'gpt-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023',
    // the registry's Llama 2 records are the base models (the CSV's llama-2-*), so the -chat rows stay
    // unmatched; Llama 3-70B has one record and the CSV only the chat model
    'llama-3-70b-chat': 'llama-3-70b',
    // tested in mid 2024
    'gpt-4o': 'gpt-4o-may-2024',
    'claude-instant-1.2': 'claude-instant',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const rows = parseCsv(await fetchText(FEED));
    if (!rows[0] || !('variant' in rows[0])) throw new Error('unexpected SAD CSV header');
    return rows
      .filter((r) => r.type === 'SAD' && r.model)
      .map((r) => ({
        model: r.model,
        score: Number(r.score) * 100,
        setting: r.variant.toLowerCase(),
        // the CSV's std, the error bar of the page's plot, in the score's points
        metrics: r.std && Number.isFinite(Number(r.std)) ? { std: Number(r.std) * 100 } : undefined,
      }));
  },
};
export default board;
