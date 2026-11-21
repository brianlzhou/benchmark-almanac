// GSM-Infinite tests arithmetic reasoning with zero noise and long context.
// Each Streamlit table reads a CSV and ranks models by its published Average column.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const root = 'https://huggingface.co/spaces/InfiniAILab/GSM-Infinite-Leaderboard/raw/main/data/';
const board: Leaderboard = {
  benchmark: 'gsm-infinite', url: 'https://infiniailab-gsm-infinite-leaderboard.hf.space',
  feed: root + 'zero_context.csv', terms: 'Public leaderboard files from the authors’ Hugging Face Space.',
  parts: { Symbolic: 'Symbolic', Medium: 'Medium', Hard: 'Hard', '8K': '8K', '16K': '16K', '32K': '32K' },
  stats: {
    '1st<50% op': { name: 'First operation below 50% accuracy', unit: 'count', better: 'lower' },
    '1st<10% op': { name: 'First operation below 10% accuracy', unit: 'count', better: 'lower' },
    'Avg. Acc op≤30': { name: 'Average accuracy through 30 operations', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const mode of ['zero', 'long']) {
      if (mode === 'long') await new Promise(resolve => setTimeout(resolve, 1000));
      const data = parseCsv(await fetchText(root + mode + '_context.csv'));
      if (data.length < (mode === 'zero' ? 19 : 10)) throw new Error('Missing GSM-Infinite model rows');
      const cols = mode === 'zero' ? ['Symbolic','Medium','Hard','1st<50% op','1st<10% op','Avg. Acc op≤30'] : ['8K','16K','32K'];
      for (const r of data) {
        const metrics: Record<string, number> = {};
        for (const col of [...cols, 'Average↑']) {
          if (!(col in r)) throw new Error(`GSM-Infinite missing ${col}`);
          if (r[col] && r[col] !== '-' && Number.isFinite(Number(r[col]))) metrics[col] = Number(r[col]);
        }
        const score = metrics['Average↑'];
        if (!r.Model || score === undefined) throw new Error('Missing GSM-Infinite score or model');
        delete metrics['Average↑'];
        rows.push({ model: r.Model, score, metrics, setting: mode === 'zero' ? 'Zero Noise' : 'Long Context' });
      }
    }
    return rows;
  },
};
export default board;
