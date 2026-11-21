// Galileo Agent Leaderboard v1. The v1 tab of the galileo-ai/agent-leaderboard Space is built from
// results_v1.csv in the Space repository and ranked by "Model Avg", the mean Tool Selection Quality over
// fourteen tool-use datasets (0 to 1, the board's own unit), which is the score. Read with the helpers in
// galileo-agent-leaderboard-v2.ts. Keep the scores by dataset and turn type, prices, model mode and openness.
// The file's "Dataset Avg" row is a per-dataset summary, not a model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { GALILEO_ALIASES, GALILEO_TERMS, GALILEO_URL, galileoFeed, stampDate } from './galileo-agent-leaderboard-v2.ts';

const board: Leaderboard = {
  benchmark: 'galileo-agent-leaderboard',
  url: GALILEO_URL,
  feed: `${galileoFeed('results_v1.csv')} (Model Avg)`,
  terms: GALILEO_TERMS,
  aliases: GALILEO_ALIASES,
  stats: { priceIn: { name: 'Input cost per million tokens', unit: 'usd-per-mtok', better: 'lower' }, priceOut: { name: 'Output cost per million tokens', unit: 'usd-per-mtok', better: 'lower' } },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    const parts: NonNullable<Leaderboard['parts']> = {};
    for (const r of parseCsv(await fetchText(galileoFeed('results_v1.csv')))) {
      const score = Number(r['Model Avg']);
      const prices: Record<string, number> = {};
      for (const [key, column] of [['priceIn', 'Input cost per million token'], ['priceOut', 'Output cost per million token']] as const) {
        const value = r[column]?.trim() ? Number(r[column]) : NaN;
        if (Number.isFinite(value)) prices[key] = value;
      }
      if (!r.Model || r.Model === 'Dataset Avg' || !Number.isFinite(score)) continue;
      const metrics = { ...prices };
      for (const [column, cell] of Object.entries(r)) {
        const turnType = column === 'single turn perf' || column === 'multi turn perf';
        if (!turnType && !/^(?:BFCL_v3|tau|xlam|toolace)_/.test(column)) continue;
        const key = column.toLowerCase().replace(/[_ ]+(\w)/g, (_, c: string) => c.toUpperCase());
        parts[key] = { name: column, group: turnType ? 'Turn type' : 'Dataset' };
        if (cell.trim() && Number.isFinite(Number(cell))) metrics[key] = Number(cell);
      }
      const type = r['Model Type'];
      rows.push({
        model: r.Model.trim(), score, date: stampDate(r.Model.trim()), metrics,
        setting: r['Model Output Type'] || undefined,
        open: type === 'Open source' ? true : type === 'Private' ? false : undefined,
      });
    }
    board.parts = parts;
    // A submission date alone does not identify an undated model snapshot.
    return rows.map(r => ({...r, model: /^(?:gpt[- ]?4o|gemini[- ]?[12][.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
  },
};
export default board;
