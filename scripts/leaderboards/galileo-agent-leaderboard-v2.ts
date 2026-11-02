// Galileo Agent Leaderboard v2. The galileo-ai/agent-leaderboard Space opens on its v2 tab, built from
// results_v2.csv in the Space repository and sorted by "Avg AC" (Action Completion: the share of simulated
// customer-support goals an agent completes across five industries, 0 to 1). Avg AC times 100 is the score.
// "Avg Total Cost" is the mean cost in US dollars of one conversation and is kept as the cost. Model names
// are API ids, whose date stamps pick the snapshot. galileo-agent-leaderboard.ts reads the v1 tab.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

export const GALILEO_URL = 'https://huggingface.co/spaces/galileo-ai/agent-leaderboard';
export const galileoFeed = (file: string) => `https://huggingface.co/spaces/galileo-ai/agent-leaderboard/resolve/main/${file}`;
export const GALILEO_TERMS = 'CSV in the galileo-ai/agent-leaderboard Hugging Face Space, licensed Apache-2.0.';

/** A date stamp at the end of an API model id ("gpt-4.1-2025-04-14", "claude-3-7-sonnet-20250219"). */
export const stampDate = (name: string) => {
  const m = name.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
};

/** Galileo's API ids that the shared resolver cannot place, shared by both tabs. */
export const GALILEO_ALIASES: Record<string, string> = {
  'gemini-2.5-pro-preview-03-25': 'gemini-2-5-pro-mar-2025',
  'gemini-2.5-pro-preview-05-06': 'gemini-2-5-pro-may-2025',
  'gemini-2.5-flash-preview-04-17': 'gemini-2-5-flash-apr-2025',
  'gemini-2.5-flash-preview-05-20': 'gemini-2-5-flash-may-2025',
  'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
  'mistral-medium-2508': 'mistral-medium-3-1',
};

const board: Leaderboard = {
  benchmark: 'galileo-agent-leaderboard-v2',
  url: GALILEO_URL,
  feed: `${galileoFeed('results_v2.csv')} (Avg AC)`,
  terms: GALILEO_TERMS,
  aliases: GALILEO_ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(galileoFeed('results_v2.csv')))) {
      const score = Number(r['Avg AC']);
      if (!r.Model || !Number.isFinite(score)) continue;
      const cost = Number(r['Avg Total Cost']);
      rows.push({ model: r.Model.trim(), score: score * 100, cost: Number.isFinite(cost) ? cost : undefined, date: stampDate(r.Model.trim()) });
    }
    return rows;
  },
};
export default board;
