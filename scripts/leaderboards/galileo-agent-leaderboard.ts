// Galileo Agent Leaderboard v1. The v1 tab of the galileo-ai/agent-leaderboard Space is built from
// results_v1.csv in the Space repository and ranked by "Model Avg", the mean Tool Selection Quality over
// fourteen tool-use datasets (0 to 1, the board's own unit), which is the score. Read with the helpers in
// galileo-agent-leaderboard-v2.ts. The file's "Dataset Avg" row is a per-dataset summary, not a model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { GALILEO_ALIASES, GALILEO_TERMS, GALILEO_URL, galileoFeed, stampDate } from './galileo-agent-leaderboard-v2.ts';

const board: Leaderboard = {
  benchmark: 'galileo-agent-leaderboard',
  url: GALILEO_URL,
  feed: `${galileoFeed('results_v1.csv')} (Model Avg)`,
  terms: GALILEO_TERMS,
  aliases: GALILEO_ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(galileoFeed('results_v1.csv')))) {
      const score = Number(r['Model Avg']);
      if (r.Model && r.Model !== 'Dataset Avg' && Number.isFinite(score)) rows.push({ model: r.Model.trim(), score, date: stampDate(r.Model.trim()), metrics:Object.fromEntries([...["Input cost per million token","Output cost per million token"].map(k=>[k,Number(r[k])])].filter(p=>Number.isFinite(p[1]))) });
    }
    // A submission date alone does not identify an undated model snapshot.
    return rows.map(r => ({...r, model: /^(?:gpt[- ]?4o|gemini[- ]?[12][.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
  },
};
export default board;
