// BioMysteryBench on Vals AI. Accuracy is the percentage of v11 bioinformatics investigations whose final
// conclusion the judge accepted, averaged over three full runs on the 90-task release updated 2026-10-29.
// Labs report human-solvable and human-difficult splits separately; Vals reports the full benchmark aggregate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = 'https://vals-ai.com/benchmarks/biomysterybench';
const board: Leaderboard = {
  benchmark: 'biomysterybench',
  host: 'Vals AI',
  url: FEED,
  feed: FEED,
  aliases: { 'Gemini 3.1 Pro Preview (02/26)': 'gemini-3-1-pro' },
  terms: 'Vals AI publishes public benchmark results and methodology. The almanac credits and links Vals AI and follows its source terms.',
  async fetch(): Promise<LeaderboardRow[]> {
    const table = tables(await fetchText(FEED)).find((t) => t[0]?.some((c) => c.text === 'Accuracy'));
    if (!table) throw new Error('BioMysteryBench Vals table missing');
    const headers = table[0].map((c) => c.text);
    const model = headers.indexOf('Model');
    const score = headers.indexOf('Accuracy');
    if (model < 0 || score < 0) throw new Error('BioMysteryBench Vals columns missing');
    const rows = table.slice(1).flatMap((r) => {
      const value = num(r[score]?.text);
      const name = r[model]?.text.trim();
      return name && value !== undefined ? [{ model: name, score: value, setting: 'Vals AI harness, v11 full set' }] : [];
    });
    if (!rows.length) throw new Error('BioMysteryBench Vals rows missing');
    return rows;
  },
};
export default board;
