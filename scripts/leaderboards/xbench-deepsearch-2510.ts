// xbench-DeepSearch-2510. The board at xbench.org/agi/aisearch reads /api/deepsearch2510 from the xbench
// Strapi API (see xbench-scienceqa.ts): one Leaderboard list of tested products (ChatGPT, Gemini, Kimi,
// agent apps) with accuracy (0 to 100), cost, time and evaluation date. The board tests consumer products
// rather than API models. Undated product names remain unlisted instead of being discarded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { XBENCH_API, XBENCH_TERMS, xbenchApi } from './xbench-scienceqa.ts';

const PATH = 'deepsearch2510?populate[Leaderboard][populate]=company';

interface Entry {
  product?: string;
  score?: number;
  evaluationDate?: string;
  cost?: string;
  timeCost?: string;
}

const board: Leaderboard = {
  benchmark: 'xbench-deepsearch-2510',
  url: 'https://xbench.org/agi/aisearch',
  feed: XBENCH_API + PATH,
  terms: XBENCH_TERMS,
  aliases: {
    // the GPT-5 Pro model in ChatGPT, run in August 2025
    'ChatGPT-5-Pro': 'gpt-5-pro',
  },
  async fetch() {
    const { data } = await xbenchApi<{ data: { Leaderboard: Entry[] } }>(PATH);
    const rows: LeaderboardRow[] = [];
    for (const e of data.Leaderboard) {
      if (!e.product || typeof e.score !== 'number') continue;
      // "Kimi K2.5(Thinking)": the mode in brackets becomes the setting
      const mode = e.product.match(/\s*\((Thinking|Deep Research|Quality Mode)\)$/i);
      // The board mixes subscriptions and estimated query prices. Preserve amounts without
      // claiming every price is per task. The time column gives minutes, sometimes a range.
      const price = e.cost?.match(/\$([\d.]+)/);
      const time = e.timeCost?.match(/^([\d.]+)(?:-([\d.]+))?min$/);
      const metrics: Record<string, number> = {};
      if (price) metrics.reportedPriceUSD = Number(price[1]);
      if (time) {
        metrics.latencyMin = Number(time[1]) * 60;
        metrics.latencyMax = Number(time[2] ?? time[1]) * 60;
      }
      rows.push({
        model: /\d/.test(e.product) ? (mode ? e.product.slice(0, mode.index).trim() : e.product.trim()) : `${e.product.trim()} (product; model unspecified)`,
        score: e.score,
        setting: mode ? mode[1].toLowerCase() : undefined,
        date: e.evaluationDate,
        metrics,
      });
    }
    return rows;
  },
};
export default board;
