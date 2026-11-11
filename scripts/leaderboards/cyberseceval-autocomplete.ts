// The official Space app.py defines its headline as the unweighted mean of language pass rates.
// The JSON misspells vulnerable as vunerable. Preserve the source's calculation and convert to percent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = 'https://huggingface.co/spaces/facebook/CyberSecEval/resolve/main/insecure_code.json';
const board: Leaderboard = {
  benchmark: 'cyberseceval-autocomplete', url: 'https://huggingface.co/spaces/facebook/CyberSecEval', feed: FEED,
  terms: 'Official Meta results in a public Hugging Face Space; upstream licensing applies and the Almanac credits and links the source.',
  async fetch() {
    const data = await fetchJson<Record<string, Record<string, {autocomplete_vunerable_percentage: number}>>>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const [name, categories] of Object.entries(data)) {
      const metrics: Record<string, number> = {};
      for (const [language, entry] of Object.entries(categories)) {
        const n = entry.autocomplete_vunerable_percentage;
        if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error('Invalid vulnerable fraction');
        metrics[language] = 100 * (1 - n);
      }
      const values = Object.values(metrics);
      if (!values.length) continue;
      const model = /^(gpt-4|gpt-3.5-turbo|gpt-4-turbo)$/i.test(name) ? `${name} (snapshot unspecified)` : name;
      rows.push({model, score: values.reduce((a,b)=>a+b,0)/values.length, metrics});
    }
    if (!rows.length) throw new Error('No CyberSecEval Autocomplete models');
    return rows;
  },
};
export default board;
