// CADECv2 evaluates adverse drug event extraction in patient forum posts.
// Table 6 reports the CADECv2 test F1 for named language models in five-shot prompting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://arxiv.org/pdf/2405.18015';
const board: Leaderboard = {
  benchmark: 'cadec-2', static: 'paper',
  url: 'https://arxiv.org/abs/2405.18015', feed: FEED,
  terms: 'The authors publish the paper under the arXiv terms of use. https://arxiv.org/abs/2405.18015',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const start = text.indexOf('LLM with in-context learning (5-shot)', text.indexOf('Table 6'));
    const end = text.indexOf('Fine-tuned span-based models', start);
    if (start < 0 || end < 0) throw new Error('CADECv2 Table 6 LLM rows missing');
    const section = text.slice(start, end);
    const rows: LeaderboardRow[] = [];
    for (const model of ['GPT-4', 'Llama-3']) {
      const match = section.match(new RegExp(`^\\s*${model}\\s+([0-9.]+)\\s+([0-9.]+)\\s+([0-9.]+)\\s+([0-9.]+)\\s+([0-9.]+)\\s+([0-9.]+)\\s+([0-9.]+)`, 'm'));
      if (!match) throw new Error(`Missing CADECv2 row: ${model}`);
      rows.push({ model, score: Number(match[6]), setting: '5-shot', metrics: { n2c2: Number(match[1]), made: Number(match[2]), phee: Number(match[3]), psytar: Number(match[4]), cadec: Number(match[5]), average: Number(match[7]) } });
    }
    return rows;
  },
};
export default board;
